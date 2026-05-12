import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('adds the bearer token to API requests', () => {
    sessionStorage.setItem('auth_token', 'student-token');

    http.get('/api/auth/me').subscribe();

    const req = httpMock.expectOne('/api/auth/me');
    expect(req.request.headers.get('Authorization')).toBe(
      'Bearer student-token'
    );
    req.flush({});
  });

  it('does not add the bearer token to non-API requests', () => {
    sessionStorage.setItem('auth_token', 'student-token');

    http.get('/assets/logo.svg').subscribe();

    const req = httpMock.expectOne('/assets/logo.svg');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
