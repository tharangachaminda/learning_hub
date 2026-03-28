import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
  };
}

export interface QuestionStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface InviteRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher';
}

export interface InviteResponse {
  id: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
  };
}

export interface StaffUser {
  id: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
  };
  isActive: boolean;
  createdAt: string;
}

export interface StaffStats {
  total: number;
  active: number;
  disabled: number;
  admins: number;
  teachers: number;
}

const AUTH_TOKEN_KEY = 'admin_auth_token';
const AUTH_USER_KEY = 'admin_auth_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authApiUrl = '/api/auth';
  private readonly questionsApiUrl = '/api/questions';
  private readonly http = inject(HttpClient);

  login(request: AdminLoginRequest): Observable<AdminLoginResponse> {
    return this.http
      .post<AdminLoginResponse>(`${this.authApiUrl}/admin/login`, request)
      .pipe(
        tap((response) => {
          this.storeToken(response.token);
          this.storeUser(response.user);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  getUser(): AdminLoginResponse['user'] | null {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  getRole(): string | null {
    return this.getUser()?.role ?? null;
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.authApiUrl}/me`);
  }

  getQuestionStats(): Observable<QuestionStats> {
    return this.http.get<QuestionStats>(`${this.questionsApiUrl}/stats`);
  }

  inviteUser(request: InviteRequest): Observable<InviteResponse> {
    return this.http.post<InviteResponse>(
      `${this.authApiUrl}/admin/register`,
      request
    );
  }

  isAdmin(): boolean {
    return this.getRole() === 'admin';
  }

  getStaffUsers(): Observable<StaffUser[]> {
    return this.http.get<StaffUser[]>(`${this.authApiUrl}/admin/users`);
  }

  getStaffStats(): Observable<StaffStats> {
    return this.http.get<StaffStats>(`${this.authApiUrl}/admin/users/stats`);
  }

  toggleUserStatus(
    userId: string,
    isActive: boolean
  ): Observable<{
    id: string;
    email: string;
    role: string;
    isActive: boolean;
  }> {
    return this.http.patch<{
      id: string;
      email: string;
      role: string;
      isActive: boolean;
    }>(`${this.authApiUrl}/admin/users/${userId}/status`, { isActive });
  }

  private storeToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  private storeUser(user: AdminLoginResponse['user']): void {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}
