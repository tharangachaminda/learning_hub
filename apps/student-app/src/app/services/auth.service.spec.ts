/**
 * Auth Service - Unit Tests
 *
 * Test Strategy: Validate authentication API integration and token management
 * - AC3: Successful authentication (API call, token storage, session persistence)
 * - AC4: Failed authentication (error handling)
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService, LoginRequest, LoginResponse } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockLoginRequest: LoginRequest = {
    email: 'student@example.com',
    password: 'SecurePass123!',
    rememberMe: false,
  };

  const mockLoginResponse: LoginResponse = {
    token: 'mock-jwt-token-abc123',
    user: {
      id: 'student-001',
      email: 'student@example.com',
      name: 'Test Student',
      role: 'student',
    },
  };

  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    /**
     * Test: Send login credentials to authentication API (AC3)
     * Why Essential: Core authentication flow — must call correct endpoint with correct payload
     * Impact: Login feature entirely non-functional without correct API call
     */
    it('should POST credentials to /api/auth/student/login', () => {
      service.login(mockLoginRequest).subscribe();

      const req = httpMock.expectOne('/api/auth/student/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'student@example.com',
        password: 'SecurePass123!',
        rememberMe: false,
      });
      req.flush(mockLoginResponse);
    });

    /**
     * Test: Return user data on successful login (AC3)
     * Why Essential: Component needs user data to redirect and personalize dashboard
     * Impact: Cannot proceed after login without user context
     */
    it('should return login response with token and user data on success', () => {
      service.login(mockLoginRequest).subscribe((response) => {
        expect(response.token).toBe('mock-jwt-token-abc123');
        expect(response.user.id).toBe('student-001');
        expect(response.user.email).toBe('student@example.com');
        expect(response.user.role).toBe('student');
      });

      const req = httpMock.expectOne('/api/auth/student/login');
      req.flush(mockLoginResponse);
    });

    /**
     * Test: Store JWT in sessionStorage when rememberMe is false (AC3)
     * Why Essential: Session persistence strategy per acceptance criteria
     * Impact: User session lost on tab close without proper storage
     */
    it('should store token in sessionStorage when rememberMe is false', () => {
      service.login({ ...mockLoginRequest, rememberMe: false }).subscribe();

      const req = httpMock.expectOne('/api/auth/student/login');
      req.flush(mockLoginResponse);

      expect(sessionStorage.getItem('auth_token')).toBe(
        'mock-jwt-token-abc123'
      );
      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    /**
     * Test: Store JWT in localStorage when rememberMe is true (AC3)
     * Why Essential: "Remember me" must persist across browser sessions
     * Impact: Users must re-login every session despite checking remember me
     */
    it('should store token in localStorage when rememberMe is true', () => {
      service.login({ ...mockLoginRequest, rememberMe: true }).subscribe();

      const req = httpMock.expectOne('/api/auth/student/login');
      req.flush(mockLoginResponse);

      expect(localStorage.getItem('auth_token')).toBe('mock-jwt-token-abc123');
      expect(sessionStorage.getItem('auth_token')).toBeNull();
    });

    /**
     * Test: Handle authentication failure (AC4)
     * Why Essential: Failed login must propagate error for UI error display
     * Impact: Silent failures with no user feedback on wrong credentials
     */
    it('should propagate error on failed authentication', () => {
      let errorResponse: any;

      service.login(mockLoginRequest).subscribe({
        error: (error) => {
          errorResponse = error;
        },
      });

      const req = httpMock.expectOne('/api/auth/student/login');
      req.flush(
        { message: 'Invalid email or password' },
        { status: 401, statusText: 'Unauthorized' }
      );

      expect(errorResponse.status).toBe(401);
    });
  });

  describe('logout', () => {
    /**
     * Test: Clear stored tokens on logout
     * Why Essential: Security — stale tokens must not persist
     * Impact: Token leakage and unauthorized access after logout
     */
    it('should clear auth tokens from both storages', () => {
      localStorage.setItem('auth_token', 'old-token');
      sessionStorage.setItem('auth_token', 'old-token');

      service.logout();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(sessionStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('getToken', () => {
    /**
     * Test: Retrieve token from correct storage
     * Why Essential: Token retrieval needed for authenticated API calls
     * Impact: Authenticated requests fail without correct token retrieval
     */
    it('should return token from localStorage if present', () => {
      localStorage.setItem('auth_token', 'local-token');

      expect(service.getToken()).toBe('local-token');
    });

    it('should return token from sessionStorage if not in localStorage', () => {
      sessionStorage.setItem('auth_token', 'session-token');

      expect(service.getToken()).toBe('session-token');
    });

    it('should return null if no token is stored', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    /**
     * Test: Authentication state check
     * Why Essential: Route guards and UI state depend on knowing if user is logged in
     * Impact: Cannot protect routes or show correct UI state
     */
    it('should return true when token exists', () => {
      sessionStorage.setItem('auth_token', 'valid-token');

      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when no token exists', () => {
      expect(service.isAuthenticated()).toBe(false);
    });
  });
});
