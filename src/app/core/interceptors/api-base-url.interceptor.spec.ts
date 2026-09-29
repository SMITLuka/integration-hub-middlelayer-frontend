import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { apiBaseUrlInterceptor } from './api-base-url.interceptor';

describe('apiBaseUrlInterceptor', () => {
  const originalBaseUrl = environment.apiBaseUrl;
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([apiBaseUrlInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    environment.apiBaseUrl = originalBaseUrl;
    httpTesting.verify();
  });

  it('prepends the base URL to root-relative requests', () => {
    environment.apiBaseUrl = 'https://api.example.com';
    http.get('/mandators').subscribe();
    const req = httpTesting.expectOne('https://api.example.com/mandators');
    expect(req.request.url).toBe('https://api.example.com/mandators');
    req.flush([]);
  });

  it('leaves absolute URLs untouched', () => {
    environment.apiBaseUrl = 'https://api.example.com';
    http.get('https://other.example.com/x').subscribe();
    const req = httpTesting.expectOne('https://other.example.com/x');
    expect(req.request.url).toBe('https://other.example.com/x');
    req.flush({});
  });

  it('leaves requests untouched when no base URL is configured', () => {
    environment.apiBaseUrl = '';
    http.get('/mandators').subscribe();
    const req = httpTesting.expectOne('/mandators');
    expect(req.request.url).toBe('/mandators');
    req.flush([]);
  });
});
