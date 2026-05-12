import { Injectable, inject, signal } from '@angular/core';
import {
  AuthService,
  AuthUserProfile,
} from '../../../../services/auth.service';

/**
 * Student profile service backed by authenticated user data.
 *
 * @example
 * ```typescript
 * const profileService = inject(StudentProfileService);
 * const grade = profileService.getGrade(); // 3
 * const country = profileService.getCountry(); // 'NZ'
 * ```
 */
@Injectable({ providedIn: 'root' })
export class StudentProfileService {
  private readonly authService = inject(AuthService);

  /** Default fallback country code. */
  private readonly DEFAULT_COUNTRY = 'NZ';

  /** Default student grade when no profile has been loaded yet. */
  private readonly DEFAULT_GRADE = 3;

  private readonly profileState = signal<{ grade: number; country: string }>(
    this.resolveStoredProfile()
  );

  private hasAttemptedRemoteLoad = false;

  loadProfile(): void {
    if (this.hasAttemptedRemoteLoad || !this.authService.isAuthenticated()) {
      return;
    }

    this.hasAttemptedRemoteLoad = true;
    this.authService.getProfile().subscribe({
      next: (response) => {
        this.profileState.set(this.normalizeProfile(response.profile));
      },
      error: () => {
        this.hasAttemptedRemoteLoad = false;
      },
    });
  }

  /**
   * Returns the student's grade level.
   *
   * @returns Year number (0–10)
   */
  getGrade(): number {
    return this.profileState().grade;
  }

  /**
   * Returns the student's country code.
   * Falls back to 'NZ' if no country is available.
   *
   * @returns ISO country code string
   */
  getCountry(): string {
    return this.profileState().country;
  }

  /**
   * Returns the full student profile.
   *
   * @returns Object with `grade` and `country` properties
   */
  getProfile(): { grade: number; country: string } {
    return {
      grade: this.getGrade(),
      country: this.getCountry(),
    };
  }

  private resolveStoredProfile(): { grade: number; country: string } {
    return this.normalizeProfile(this.authService.getUser()?.profile);
  }

  private normalizeProfile(profile?: AuthUserProfile): {
    grade: number;
    country: string;
  } {
    return {
      grade: profile?.grade ?? this.DEFAULT_GRADE,
      country: profile?.country ?? this.DEFAULT_COUNTRY,
    };
  }
}
