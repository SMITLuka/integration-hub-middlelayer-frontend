import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/** Unsigned JWT with the given payload (base64url of UTF-8 JSON, like real tokens); the service only reads iat/exp. */
function fakeJwt(payload: Record<string, unknown>): string {
  const encode = (value: object) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

/** A token as the SSO gateway issues it: valid for an hour from iat. */
function ssoToken(iat = 1_700_000_000): string {
  return fakeJwt({ sub: 'user-1', display_name: 'Luka Lozić', iat, exp: iat + 3600 });
}

describe('AuthService', () => {
  const originalUrl = window.location.pathname + window.location.search + window.location.hash;
  let service: AuthService;
  let navigateTo: jasmine.Spy;

  function createService(): void {
    service = TestBed.inject(AuthService);
    navigateTo = spyOn(service, 'navigateTo');
  }

  function storeToken(accessToken: string, expiresAt: number): void {
    localStorage.setItem('ih.auth.token', JSON.stringify({ accessToken, expiresAt }));
  }

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState(null, '', originalUrl);
  });

  it('login sends the user to the SSO portal, asking it to launch Integration Hub right away', () => {
    createService();

    service.login();

    const url = new URL(navigateTo.calls.mostRecent().args[0]);
    expect(url.origin + url.pathname).toBe(`${environment.ssoUrl}/`);
    expect(url.searchParams.get('launch')).toBe(environment.ssoAppKey);
    expect(url.searchParams.get('auto')).toBe('1');
    expect(sessionStorage.getItem('ih.auth.returnUrl')).toBe(originalUrl);
    // Replaces the history entry, so Back from Integration Hub does not land on the auto-launching portal.
    expect(navigateTo.calls.mostRecent().args[1]).toEqual({ replace: true });
  });

  it('coming back from the portal without a token right after a login shows an error instead of looping', async () => {
    createService();
    sessionStorage.setItem('ih.auth.loginStartedAt', String(Date.now()));

    await service.init();

    expect(navigateTo).not.toHaveBeenCalled();
    expect(service.error()).toContain('did not log you in');
  });

  it('a login started long ago does not block a new one', () => {
    createService();
    sessionStorage.setItem('ih.auth.loginStartedAt', String(Date.now() - 600_000));

    void service.init();

    expect(navigateTo).toHaveBeenCalledTimes(1);
    expect(service.error()).toBeNull();
  });

  it('follows the token other tabs receive or drop', () => {
    createService();

    storeToken('from-other-tab', Date.now() + 600_000);
    window.dispatchEvent(new StorageEvent('storage', { key: 'ih.auth.token' }));
    expect(service.getAccessToken()).toBe('from-other-tab');

    localStorage.removeItem('ih.auth.token');
    window.dispatchEvent(new StorageEvent('storage', { key: 'ih.auth.token' }));
    expect(service.getAccessToken()).toBeNull();
  });

  it('starts only one login when several requests fail at once', () => {
    createService();

    service.login();
    service.login();

    expect(navigateTo).toHaveBeenCalledTimes(1);
  });

  it('init takes over the token from the portal, removes it from the URL and returns to the original page', async () => {
    createService();
    const token = ssoToken();
    sessionStorage.setItem('ih.auth.returnUrl', '/mandators?search=abc');
    sessionStorage.setItem('ih.auth.loginStartedAt', String(Date.now()));
    window.history.replaceState(null, '', `/?token=${token}`);

    await service.init();

    expect(service.getAccessToken()).toBe(token);
    expect(window.location.pathname + window.location.search).toBe('/mandators?search=abc');
    expect(sessionStorage.getItem('ih.auth.returnUrl')).toBeNull();
    expect(JSON.parse(localStorage.getItem('ih.auth.token')!).accessToken).toBe(token);
    expect(sessionStorage.getItem('ih.auth.loginStartedAt')).toBeNull();
    expect(navigateTo).not.toHaveBeenCalled();
  });

  it('init keeps the rest of the URL when there is no page to return to', async () => {
    createService();
    window.history.replaceState(null, '', `/interfaces?token=${ssoToken()}&tab=2`);

    await service.init();

    expect(window.location.pathname + window.location.search).toBe('/interfaces?tab=2');
  });

  it('counts the token lifetime from now, so a wrong browser clock does not expire it', async () => {
    createService();
    // iat/exp far in the past by the browser clock: lifetime is still one hour from receipt.
    window.history.replaceState(null, '', `/?token=${ssoToken(1_000_000_000)}`);

    await service.init();

    const stored = JSON.parse(localStorage.getItem('ih.auth.token')!);
    expect(stored.expiresAt - Date.now()).toBeGreaterThan(3_500_000);
    expect(service.getAccessToken()).not.toBeNull();
  });

  it('treats an unreadable token from the portal as expired', async () => {
    createService();
    window.history.replaceState(null, '', '/?token=not-a-jwt');

    await service.init();

    expect(service.getAccessToken()).toBeNull();
  });

  it('init reuses a stored token that is still valid (e.g. from another tab)', async () => {
    storeToken('stored-token', Date.now() + 600_000);
    createService();

    await service.init();

    expect(service.getAccessToken()).toBe('stored-token');
    expect(navigateTo).not.toHaveBeenCalled();
  });

  it('init sends the user to the portal when the stored token has (almost) expired', () => {
    storeToken('old-token', Date.now() + 10_000);
    createService();

    void service.init();

    expect(service.getAccessToken()).toBeNull();
    expect(navigateTo).toHaveBeenCalledTimes(1);
  });

  it('a 401 right after a login stops with an error instead of looping through the portal', () => {
    storeToken('rejected-token', Date.now() + 600_000);
    sessionStorage.setItem('ih.auth.lastLoginAt', String(Date.now()));
    createService();

    service.handleUnauthorized();

    expect(service.error()).toContain('did not accept');
    expect(service.getAccessToken()).toBeNull();
    expect(navigateTo).not.toHaveBeenCalled();
  });

  it('a 401 long after the login fetches a new token from the portal', () => {
    storeToken('expired-token', Date.now() + 600_000);
    sessionStorage.setItem('ih.auth.lastLoginAt', String(Date.now() - 3_600_000));
    createService();

    service.handleUnauthorized();

    expect(service.error()).toBeNull();
    expect(service.getAccessToken()).toBeNull();
    expect(navigateTo).toHaveBeenCalledTimes(1);
  });

  it('logout forgets the token and returns to the portal without asking it to launch the app again', () => {
    storeToken('the-token', Date.now() + 600_000);
    createService();

    service.logout();

    expect(service.getAccessToken()).toBeNull();
    expect(localStorage.getItem('ih.auth.token')).toBeNull();
    expect(navigateTo).toHaveBeenCalledWith(`${environment.ssoUrl}/`);
  });
});
