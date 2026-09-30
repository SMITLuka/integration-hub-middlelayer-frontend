import { Injectable, Injector, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ProfileService } from './profile.service';

interface StoredTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
}

interface PendingLogin {
  verifier: string;
  state: string;
  returnUrl: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

const TOKENS_KEY = 'ih.auth.tokens';
const PENDING_LOGIN_KEY = 'ih.auth.pendingLogin';
const SIGNED_OUT_KEY = 'ih.auth.signedOut';
const LAST_LOGIN_KEY = 'ih.auth.lastLoginAt';
const REFRESH_MARGIN_MS = 60_000;
/** A 401 this soon after a successful login means the backend rejects our tokens, not that they expired. */
const FRESH_LOGIN_WINDOW_MS = 30_000;

/**
 * Bitrix24 login via the Bitrix MCP server, which acts as OpenID Connect provider:
 * Authorization Code flow with PKCE (S256) and a `state` check, as required for a public
 * browser client without a secret. The resulting access token is a JWT for our backend;
 * the backend verifies it (signature, issuer, audience, expiry) and enforces intranet-only
 * access, so this service only runs the protocol and keeps the tokens.
 *
 * Tokens live in sessionStorage (per tab, gone when the tab closes); a new tab signs in
 * again silently through the provider's own session.
 *
 * Logout is deliberately local (revoke our own refresh token, forget the tokens): the provider's
 * session is shared with the employee's Claude Bitrix connector, and ending it there would
 * disconnect Claude as well.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly injector = inject(Injector);
  private readonly tokens = signal<StoredTokens | null>(readJson<StoredTokens>(TOKENS_KEY));
  private refreshing: Promise<string | null> | null = null;
  private loginStarted = false;

  /** Set when a login attempt failed; the app shows it instead of retrying in a redirect loop. */
  readonly error = signal<string | null>(null);

  /** True after logout: the app shows a "signed out" page instead of logging straight back in. */
  readonly signedOut = signal(sessionStorage.getItem(SIGNED_OUT_KEY) !== null);

  private get redirectUri(): string {
    return `${window.location.origin}/`;
  }

  /**
   * Runs before the app renders: finishes a login coming back from the provider, reuses a
   * stored session, or starts a login. The returned promise stays pending while the browser
   * navigates to the provider, so no page flashes up unauthenticated.
   */
  async init(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    // The provider only ever redirects to the app root, always with our state.
    if (window.location.pathname === '/' && params.has('state') && (params.has('code') || params.has('error'))) {
      await this.completeLogin(params);
      return;
    }
    if (this.signedOut()) {
      return;
    }
    if (await this.getAccessToken()) {
      return;
    }
    await this.login();
    return new Promise<void>(() => undefined);
  }

  /**
   * Sends the browser to the Bitrix login, remembering the current page to return to.
   * `forceReauth` makes the provider run the Bitrix login again even if its own session is still
   * valid; used for "Log in again" after a failure, because the failure may be a stale Bitrix token
   * that only a fresh Bitrix login replaces.
   */
  async login(options: { forceReauth?: boolean } = {}): Promise<void> {
    // Several parallel 401s must not start several logins, each overwriting the pending state.
    if (this.loginStarted) {
      return;
    }
    this.loginStarted = true;
    sessionStorage.removeItem(SIGNED_OUT_KEY);
    const verifier = randomString();
    const state = randomString();
    const pending: PendingLogin = {
      verifier,
      state,
      returnUrl: window.location.pathname + window.location.search + window.location.hash,
    };
    sessionStorage.setItem(PENDING_LOGIN_KEY, JSON.stringify(pending));

    const url = new URL(`${environment.authIssuer}/auth`);
    url.searchParams.set('client_id', environment.authClientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', this.redirectUri);
    url.searchParams.set('scope', 'openid integration-hub');
    url.searchParams.set('code_challenge', await sha256Base64Url(verifier));
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('state', state);
    if (options.forceReauth) {
      url.searchParams.set('prompt', 'login');
    }
    this.navigateTo(url.toString());
  }

  /** Handles the provider's redirect back to the app (`?code=...&state=...` or `?error=...`). */
  async completeLogin(params: URLSearchParams): Promise<void> {
    const pending = readJson<PendingLogin>(PENDING_LOGIN_KEY);
    sessionStorage.removeItem(PENDING_LOGIN_KEY);
    try {
      if (params.has('error')) {
        throw new Error(params.get('error_description') ?? params.get('error') ?? 'Login failed');
      }
      // The state must match the one this tab generated; otherwise the callback was not started by us (CSRF).
      if (!pending || params.get('state') !== pending.state) {
        throw new Error('Login response does not match the login that was started. Please log in again.');
      }
      this.store(
        await this.requestToken({
          grant_type: 'authorization_code',
          code: params.get('code') ?? '',
          redirect_uri: this.redirectUri,
          client_id: environment.authClientId,
          code_verifier: pending.verifier,
        }),
      );
      sessionStorage.setItem(LAST_LOGIN_KEY, String(Date.now()));
      // Removes code and state from the address bar and restores the page the user started on.
      window.history.replaceState(null, '', pending.returnUrl || '/');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Login failed');
    }
  }

  /** A valid access token, refreshed shortly before it expires; `null` when the user has to log in again. */
  async getAccessToken(): Promise<string | null> {
    const tokens = this.tokens();
    if (!tokens) {
      return null;
    }
    if (tokens.expiresAt - Date.now() > REFRESH_MARGIN_MS) {
      return tokens.accessToken;
    }
    if (!tokens.refreshToken) {
      this.clear();
      return null;
    }
    // Parallel API calls share one refresh request.
    this.refreshing ??= this.refresh(tokens.refreshToken).finally(() => (this.refreshing = null));
    return this.refreshing;
  }

  /**
   * Called on a 401 from the backend. Normally the session expired or was revoked, so the user logs
   * in again. Right after a successful login, though, a 401 means the backend rejects our tokens
   * (misconfiguration): logging in again would succeed silently and loop forever, so stop and say so.
   */
  handleUnauthorized(): void {
    const lastLoginAt = Number(sessionStorage.getItem(LAST_LOGIN_KEY) ?? 0);
    if (Date.now() - lastLoginAt < FRESH_LOGIN_WINDOW_MS) {
      this.clear();
      this.error.set('The Integration Hub server did not accept your login. Please contact the administrator.');
      return;
    }
    void this.login();
  }

  /**
   * Logs out of Integration Hub only: revokes our refresh token at the provider and forgets the
   * tokens. The provider session is not ended because the employee's Claude connector shares it.
   */
  async logout(): Promise<void> {
    const refreshToken = this.tokens()?.refreshToken;
    this.clear();
    sessionStorage.setItem(SIGNED_OUT_KEY, '1');
    this.signedOut.set(true);
    if (refreshToken) {
      try {
        await fetch(`${environment.authIssuer}/token/revocation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ token: refreshToken, token_type_hint: 'refresh_token', client_id: environment.authClientId }),
        });
      } catch {
        // Best effort: the token is forgotten locally either way and expires on its own.
      }
    }
  }

  /** Separate so tests can observe navigation without leaving the test page. */
  navigateTo(url: string): void {
    window.location.assign(url);
  }

  private async refresh(refreshToken: string): Promise<string | null> {
    let response: TokenResponse;
    try {
      response = await this.requestToken({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: environment.authClientId,
      });
    } catch {
      this.clear();
      return null;
    }
    // The provider does not always rotate refresh tokens; keep the current one if none is returned.
    this.store({ ...response, refresh_token: response.refresh_token ?? refreshToken });
    // The new token re-evaluates the Bitrix workgroups, so the rights shown in the UI may have changed.
    // Looked up lazily: ProfileService depends on HttpClient, whose interceptors depend on this service.
    // Deliberately outside the token handling above: a failed profile reload must never cost the session.
    void this.injector.get(ProfileService).load().catch(() => undefined);
    return response.access_token;
  }

  // Plain fetch instead of HttpClient: token calls must not pass through the API interceptors.
  private async requestToken(body: Record<string, string>): Promise<TokenResponse> {
    const response = await fetch(`${environment.authIssuer}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json.error_description ?? json.error ?? `Token request failed (${response.status})`);
    }
    return json as TokenResponse;
  }

  private store(response: TokenResponse): void {
    const tokens: StoredTokens = {
      accessToken: response.access_token,
      refreshToken: response.refresh_token ?? null,
      expiresAt: Date.now() + response.expires_in * 1000,
    };
    sessionStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    this.tokens.set(tokens);
  }

  private clear(): void {
    sessionStorage.removeItem(TOKENS_KEY);
    this.tokens.set(null);
  }
}

function readJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function randomString(): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)));
}

async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return base64Url(new Uint8Array(digest));
}
