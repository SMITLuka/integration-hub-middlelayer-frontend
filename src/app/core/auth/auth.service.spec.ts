import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ProfileService } from './profile.service';

/** Unsigned JWT with the given payload (base64url of UTF-8 JSON, like real tokens); the service only reads claims for display. */
function fakeJwt(payload: Record<string, unknown>): string {
  const encode = (value: object) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${encode({ alg: 'RS256', typ: 'at+jwt' })}.${encode(payload)}.signature`;
}

function tokenResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function sha256Base64Url(value: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  return btoa(String.fromCharCode(...digest)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('AuthService', () => {
  let service: AuthService;
  let navigateTo: jasmine.Spy;

  function createService(): void {
    service = TestBed.inject(AuthService);
    navigateTo = spyOn(service, 'navigateTo');
  }

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  afterEach(() => sessionStorage.clear());

  it('login redirects to the provider with PKCE S256 and a state it remembers', async () => {
    createService();

    await service.login();

    const url = new URL(navigateTo.calls.mostRecent().args[0]);
    const pending = JSON.parse(sessionStorage.getItem('ih.auth.pendingLogin')!);
    expect(url.origin + url.pathname).toBe(`${environment.authIssuer}/auth`);
    expect(url.searchParams.get('client_id')).toBe(environment.authClientId);
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('redirect_uri')).toBe(`${window.location.origin}/`);
    expect(url.searchParams.get('scope')).toBe('openid integration-hub');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('state')).toBe(pending.state);
    expect(url.searchParams.get('code_challenge')).toBe(await sha256Base64Url(pending.verifier));
  });

  it('completeLogin exchanges the code with the PKCE verifier and stores the session', async () => {
    createService();
    sessionStorage.setItem('ih.auth.pendingLogin', JSON.stringify({ verifier: 'the-verifier', state: 'the-state', returnUrl: '/mandators' }));
    const accessToken = fakeJwt({ name: 'Luka Lozić' });
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo(tokenResponse({ access_token: accessToken, refresh_token: 'rt', expires_in: 3600 }));
    const replaceState = spyOn(window.history, 'replaceState');

    await service.completeLogin(new URLSearchParams({ code: 'the-code', state: 'the-state' }));

    const [url, init] = fetchSpy.calls.mostRecent().args as [string, RequestInit];
    const body = init.body as URLSearchParams;
    expect(url).toBe(`${environment.authIssuer}/token`);
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('code')).toBe('the-code');
    expect(body.get('code_verifier')).toBe('the-verifier');
    expect(body.get('client_id')).toBe(environment.authClientId);
    expect(await service.getAccessToken()).toBe(accessToken);
    expect(service.error()).toBeNull();
    expect(replaceState).toHaveBeenCalledWith(null, '', '/mandators');
    expect(Number(sessionStorage.getItem('ih.auth.lastLoginAt'))).toBeGreaterThan(0);
    expect(sessionStorage.getItem('ih.auth.pendingLogin')).toBeNull();
  });

  it('completeLogin rejects a callback whose state was not issued by this tab', async () => {
    createService();
    sessionStorage.setItem('ih.auth.pendingLogin', JSON.stringify({ verifier: 'v', state: 'expected', returnUrl: '/' }));
    const fetchSpy = spyOn(window, 'fetch');

    await service.completeLogin(new URLSearchParams({ code: 'c', state: 'forged' }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(service.error()).toContain('does not match');
    expect(await service.getAccessToken()).toBeNull();
  });

  it('completeLogin shows the provider error instead of retrying', async () => {
    createService();

    await service.completeLogin(new URLSearchParams({ error: 'access_denied', error_description: 'User cancelled' }));

    expect(service.error()).toBe('User cancelled');
    expect(navigateTo).not.toHaveBeenCalled();
  });

  it('getAccessToken refreshes a token that is about to expire and keeps the refresh token', async () => {
    sessionStorage.setItem('ih.auth.tokens', JSON.stringify({ accessToken: 'old', refreshToken: 'rt', expiresAt: Date.now() + 10_000 }));
    createService();
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo(tokenResponse({ access_token: 'new', expires_in: 3600 }));

    const [first, second] = await Promise.all([service.getAccessToken(), service.getAccessToken()]);

    expect(first).toBe('new');
    expect(second).toBe('new');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect((fetchSpy.calls.mostRecent().args[1] as RequestInit).body!.toString()).toContain('grant_type=refresh_token');
    expect(JSON.parse(sessionStorage.getItem('ih.auth.tokens')!).refreshToken).toBe('rt');
  });

  it('reloads the rights after a token refresh (workgroup membership may have changed)', async () => {
    sessionStorage.setItem('ih.auth.tokens', JSON.stringify({ accessToken: 'old', refreshToken: 'rt', expiresAt: Date.now() + 10_000 }));
    createService();
    spyOn(window, 'fetch').and.resolveTo(tokenResponse({ access_token: 'new', expires_in: 3600 }));
    const load = spyOn(TestBed.inject(ProfileService), 'load').and.resolveTo();

    await service.getAccessToken();

    expect(load).toHaveBeenCalled();
  });

  it('getAccessToken returns null and clears the session when the refresh fails', async () => {
    sessionStorage.setItem('ih.auth.tokens', JSON.stringify({ accessToken: 'old', refreshToken: 'rt', expiresAt: Date.now() - 1 }));
    createService();
    spyOn(window, 'fetch').and.resolveTo(tokenResponse({ error: 'invalid_grant' }, 400));

    expect(await service.getAccessToken()).toBeNull();
    expect(sessionStorage.getItem('ih.auth.tokens')).toBeNull();
  });

  it('logout only revokes our refresh token and never ends the provider session (shared with Claude)', async () => {
    sessionStorage.setItem('ih.auth.tokens', JSON.stringify({ accessToken: 'a', refreshToken: 'r', expiresAt: Date.now() + 3_600_000 }));
    createService();
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo(new Response(null, { status: 200 }));

    await service.logout();

    const [url, init] = fetchSpy.calls.mostRecent().args as [string, RequestInit];
    const body = init.body as URLSearchParams;
    expect(url).toBe(`${environment.authIssuer}/token/revocation`);
    expect(body.get('token')).toBe('r');
    expect(body.get('client_id')).toBe(environment.authClientId);
    expect(navigateTo).not.toHaveBeenCalled();
    expect(service.signedOut()).toBeTrue();
    expect(await service.getAccessToken()).toBeNull();
  });

  it('after logout the app stays signed out instead of logging straight back in', async () => {
    sessionStorage.setItem('ih.auth.signedOut', '1');
    createService();

    await service.init();

    expect(service.signedOut()).toBeTrue();
    expect(navigateTo).not.toHaveBeenCalled();
  });

  it('logging in again clears the signed-out state', async () => {
    sessionStorage.setItem('ih.auth.signedOut', '1');
    createService();

    await service.login();

    expect(sessionStorage.getItem('ih.auth.signedOut')).toBeNull();
    expect(navigateTo).toHaveBeenCalled();
  });

  it('starts only one login when several requests fail at once', async () => {
    createService();

    await Promise.all([service.login(), service.login(), service.login()]);

    expect(navigateTo).toHaveBeenCalledTimes(1);
  });

  it('forceReauth asks the provider to run the Bitrix login again', async () => {
    createService();

    await service.login({ forceReauth: true });

    expect(new URL(navigateTo.calls.mostRecent().args[0]).searchParams.get('prompt')).toBe('login');
  });

  it('a 401 right after a successful login stops with an error instead of looping through logins', () => {
    sessionStorage.setItem('ih.auth.lastLoginAt', String(Date.now() - 5_000));
    createService();

    service.handleUnauthorized();

    expect(service.error()).toContain('did not accept your login');
    expect(navigateTo).not.toHaveBeenCalled();
  });

  it('a 401 long after the login starts a new login', async () => {
    sessionStorage.setItem('ih.auth.lastLoginAt', String(Date.now() - 3_600_000));
    createService();

    service.handleUnauthorized();
    await new Promise((resolve) => setTimeout(resolve));

    expect(service.error()).toBeNull();
    expect(navigateTo).toHaveBeenCalled();
  });
});
