import { Injectable } from '@angular/core';

/**
 * Mock student profile service for MVP.
 *
 * Returns hardcoded grade and country until the auth story
 * (`US-AUTH-*`) provides a real profile service. Replace this
 * service with an authenticated profile lookup when available.
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
  /** Default fallback country code. */
  private readonly DEFAULT_COUNTRY = 'NZ';

  /** Default student grade for MVP. */
  private readonly DEFAULT_GRADE = 3;

  /**
   * Returns the student's grade level.
   *
   * @returns Grade number (3–8)
   */
  getGrade(): number {
    return this.DEFAULT_GRADE;
  }

  /**
   * Returns the student's country code.
   * Falls back to 'NZ' if no country is available.
   *
   * @returns ISO country code string
   */
  getCountry(): string {
    return this.DEFAULT_COUNTRY;
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
}
