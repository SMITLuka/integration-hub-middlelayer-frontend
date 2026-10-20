import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

interface StoredToken {
  accessToken: string;
  expiresAt: number;
}

const TOKEN_KEY = 'ih.auth.token';
const RETURN_URL_KEY = 'ih.auth.returnUrl';
const LAST_LOGIN_KEY = 'ih.auth.lastLoginAt';
const LOGIN_STARTED_KEY = 'ih.auth.loginStartedAt';
/** Treat the token as expired a little early, so a request never leaves with one that dies on the way. */
const EXPIRY_MARGIN_MS = 30_000;
/**
 * A 401 this soon after a login means the backend rejects our tokens, not that they expired; coming back
 * from the portal this soon without a token means the portal did not issue one. Both would otherwise
 * bounce between the portal and the app forever.
 */
const FRESH_LOGIN_WINDOW_MS = 30_000;

/**
 * Login through the SMIT SSO portal. Integration Hub is opened from the portal, which redirects
 * here with `?token=<JWT>` issued for this app; the backend verifies that token (signature, expiry,
 * app) and decides from the user's SSO roles what they may do, so this service only takes the
 * token over and keeps it.
 *
 * The token cannot be refreshed: when it expires (after an hour) the user is sent back to the portal
 * with `auto=1`, which launches Integration Hub again right away if the SSO session is still valid,
 * otherwise after the SSO login. It is kept in localStorage and shared with the other tabs, so they
 * reuse it instead of each going through the portal, and a logout ends them all.
 *
 * Logout only forgets the token and returns to the portal; the SSO session belongs to the portal.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly token = signal<StoredToken | null>(readToken());
  private loginStarted = false;

  /** Set when a fresh login fails; the app shows it instead of retrying in a redirect loop. */
  readonly error = signal<string | null>(null);

  constructor() {
    // Picks up a token another tab received, and drops ours when another tab logged out.
    window.addEventListener('storage', (event) => {
      if (event.key === TOKEN_KEY || event.key === null) {
        this.token.set(readToken());
      }
    });
  }

  /**
   * Runs before the app renders: takes over a token the portal just handed us, reuses a stored one,
   * or sends the user to the portal. The returned promise stays pending while the browser navigates
   * away, so no page flashes up unauthenticated.
   */
  async init(): Promise<void> {
    const url = new URL(window.location.href);
    const tokenFromPortal = url.searchParams.get('token');
    if (tokenFromPortal) {
      this.store(tokenFromPortal);
      sessionStorage.setItem(LAST_LOGIN_KEY, String(Date.now()));
      sessionStorage.removeItem(LOGIN_STARTED_KEY);
      // The token must not stay in the address bar or history; also restores the page the user started on.
      url.searchParams.delete('token');
      const returnUrl = sessionStorage.getItem(RETURN_URL_KEY);
      sessionStorage.removeItem(RETURN_URL_KEY);
      window.history.replaceState(null, '', returnUrl || url.pathname + url.search + url.hash);
      return;
    }
    if (this.getAccessToken()) {
      return;
    }
    if (isRecent(sessionStorage.getItem(LOGIN_STARTED_KEY))) {
      sessionStorage.removeItem(LOGIN_STARTED_KEY);
      this.error.set('The SSO portal did not log you in to Integration Hub. Please open it from the portal again.');
      return;
    }
    this.login();
    return new Promise<void>(() => undefined);
  }

  /** Sends the browser to the SSO portal for a new token, remembering the current page to return to. */
  login(): void {
    // Several parallel 401s must not start several navigations.
    if (this.loginStarted) {
      return;
    }
    this.loginStarted = true;
    sessionStorage.setItem(RETURN_URL_KEY, window.location.pathname + window.location.search + window.location.hash);
    sessionStorage.setItem(LOGIN_STARTED_KEY, String(Date.now()));
    const url = new URL(`${environment.ssoUrl}/`);
    url.searchParams.set('launch', environment.ssoAppKey);
    url.searchParams.set('auto', '1');
    // Replace, not assign: the portal hop would otherwise stay in the history, and going Back to it
    // would launch Integration Hub again instead of leaving it.
    this.navigateTo(url.toString(), { replace: true });
  }

  /** The access token while it is still valid; `null` when the user has to go through the portal again. */
  getAccessToken(): string | null {
    const token = this.token();
    if (!token || token.expiresAt - Date.now() <= EXPIRY_MARGIN_MS) {
      return null;
    }
    return token.accessToken;
  }

  /**
   * Called on a 401 from the backend. Normally the token expired, so the user gets a new one from the
   * portal. Right after a login, though, a 401 means the backend rejects the portal's tokens
   * (misconfiguration): fetching another would succeed and loop forever, so stop and say so.
   */
  handleUnauthorized(): void {
    this.clear();
    if (isRecent(sessionStorage.getItem(LAST_LOGIN_KEY))) {
      this.error.set('The Integration Hub server did not accept your SSO login. Please contact the administrator.');
      return;
    }
    this.login();
  }

  /** Forgets the token (in every tab) and returns to the SSO portal. */
  logout(): void {
    this.clear();
    this.navigateTo(`${environment.ssoUrl}/`);
  }

  /** Separate so tests can observe navigation without leaving the test page. */
  navigateTo(url: string, options: { replace?: boolean } = {}): void {
    if (options.replace) {
      window.location.replace(url);
    } else {
      window.location.assign(url);
    }
  }

  private store(accessToken: string): void {
    const token: StoredToken = { accessToken, expiresAt: Date.now() + lifetimeMs(accessToken) };
    localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
    this.token.set(token);
  }

  private clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
  }
}

function isRecent(timestamp: string | null): boolean {
  return Date.now() - Number(timestamp ?? 0) < FRESH_LOGIN_WINDOW_MS;
}

function readToken(): StoredToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as StoredToken) : null;
  } catch {
    return null;
  }
}

/**
 * How long the token lives, from its own iat/exp claims and counted from now, so a browser clock that
 * is off does not make every token look expired. Not verified here: that is the backend's job.
 * An unreadable token counts as already expired; the backend's 401 then shows the login error.
 */
function lifetimeMs(accessToken: string): number {
  try {
    const base64 = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as { iat?: unknown; exp?: unknown };
    if (typeof payload.iat === 'number' && typeof payload.exp === 'number') {
      return Math.max(0, (payload.exp - payload.iat) * 1000);
    }
  } catch {
    // Falls through to "expired".
  }
  return 0;
}
