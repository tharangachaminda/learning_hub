/**
 * Authentication Service for Student Login
 *
 * Handles student authentication via the backend API,
 * JWT token storage, and session management.
 *
 * Token storage strategy:
 * - "Remember me" checked → localStorage (persists across sessions)
 * - "Remember me" unchecked → sessionStorage (cleared on tab close)
 *
 * @example
 * ```typescript
 * this.authService.login({
 *   email: 'student@example.com',
 *   password: 'password123',
 *   rememberMe: true
 * }).subscribe({
 *   next: (response) => console.log('Logged in:', response.user.name),
 *   error: (err) => console.error('Login failed:', err)
 * });
 * ```
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Request payload for student login.
 *
 * @property email - Student's email address
 * @property password - Student's password
 * @property rememberMe - Whether to persist session across browser restarts
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

/**
 * Response payload from successful authentication.
 *
 * @property token - JWT authentication token
 * @property user - Authenticated user details
 */
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/** Key used for storing the auth token in web storage. */
const AUTH_TOKEN_KEY = 'auth_token';

/** Key used for storing the authenticated user info in web storage. */
const AUTH_USER_KEY = 'auth_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = '/api/auth/student';

  constructor(private http: HttpClient) {}

  /**
   * Authenticate a student with email and password.
   *
   * Sends credentials to the authentication API and stores
   * the JWT token in the appropriate storage based on rememberMe flag.
   *
   * @param request - Login credentials and session preference
   * @returns Observable of the login response containing token and user data
   * @throws HttpErrorResponse with status 401 for invalid credentials
   *
   * @example
   * ```typescript
   * authService.login({ email: 'test@test.com', password: 'pass', rememberMe: false })
   *   .subscribe(response => console.log(response.user));
   * ```
   */
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        this.storeToken(response.token, request.rememberMe);
        this.storeUser(response.user, request.rememberMe);
      })
    );
  }

  /**
   * Clear all authentication data and end the user session.
   *
   * Removes JWT tokens and user data from both localStorage and sessionStorage
   * to ensure complete session cleanup.
   */
  logout(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
  }

  /**
   * Retrieve the currently stored authentication token.
   *
   * Checks localStorage first (persistent sessions), then sessionStorage.
   *
   * @returns The JWT token string, or null if no token is stored
   */
  getToken(): string | null {
    return (
      localStorage.getItem(AUTH_TOKEN_KEY) ??
      sessionStorage.getItem(AUTH_TOKEN_KEY)
    );
  }

  /**
   * Check whether the user currently has a valid authentication token.
   *
   * @returns True if a token exists in either storage, false otherwise
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Store JWT token in the appropriate web storage.
   *
   * @param token - JWT token to store
   * @param rememberMe - If true, store in localStorage; otherwise sessionStorage
   */
  private storeToken(token: string, rememberMe: boolean): void {
    if (rememberMe) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  }

  /**
   * Store authenticated user info in the appropriate web storage.
   *
   * @param user - User object from the login response
   * @param rememberMe - If true, store in localStorage; otherwise sessionStorage
   */
  private storeUser(user: LoginResponse['user'], rememberMe: boolean): void {
    const json = JSON.stringify(user);
    if (rememberMe) {
      localStorage.setItem(AUTH_USER_KEY, json);
    } else {
      sessionStorage.setItem(AUTH_USER_KEY, json);
    }
  }

  /**
   * Retrieve the currently stored authenticated user.
   *
   * Checks localStorage first (persistent sessions), then sessionStorage.
   *
   * @returns The user object, or null if no user is stored
   */
  getUser(): LoginResponse['user'] | null {
    const raw =
      localStorage.getItem(AUTH_USER_KEY) ??
      sessionStorage.getItem(AUTH_USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Get the authenticated user's ID.
   *
   * @returns The user ID string, or null if not authenticated
   */
  getUserId(): string | null {
    return this.getUser()?.id ?? null;
  }
}
