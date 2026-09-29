import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['getAccessToken', 'handleUnauthorized']);
    auth.getAccessToken.and.resolveTo('the-token');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('adds the bearer token to backend calls', fakeAsync(() => {
    http.get('/mandators').subscribe();
    tick();

    const req = httpTesting.expectOne('/mandators');
    expect(req.request.headers.get('Authorization')).toBe('Bearer the-token');
    req.flush([]);
  }));

  it('never sends the token to other hosts', fakeAsync(() => {
    http.get('https://other.example.test/data').subscribe();
    tick();

    const req = httpTesting.expectOne('https://other.example.test/data');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    expect(auth.getAccessToken).not.toHaveBeenCalled();
    req.flush({});
  }));

  it('sends the request without a token when there is no session', fakeAsync(() => {
    auth.getAccessToken.and.resolveTo(null);
    http.get('/mandators').subscribe();
    tick();

    const req = httpTesting.expectOne('/mandators');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  }));

  it('never sends the token to protocol-relative URLs', fakeAsync(() => {
    http.get('//other.example.test/data').subscribe();
    tick();

    const req = httpTesting.expectOne('//other.example.test/data');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  }));

  it('hands a 401 to the auth service', fakeAsync(() => {
    http.get('/mandators').subscribe({ error: () => undefined });
    tick();

    httpTesting.expectOne('/mandators').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.handleUnauthorized).toHaveBeenCalled();
  }));

  it('does not treat 403 (logged in, but not an intranet employee) as a lost session', fakeAsync(() => {
    http.get('/mandators').subscribe({ error: () => undefined });
    tick();

    httpTesting.expectOne('/mandators').flush(null, { status: 403, statusText: 'Forbidden' });

    expect(auth.handleUnauthorized).not.toHaveBeenCalled();
  }));
});
