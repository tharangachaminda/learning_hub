/**
 * Achievement Service
 *
 * Handles API communication for student achievements.
 * Implements AC-003, AC-004, AC-005, AC-006 frontend requirements.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  Achievement,
  StudentAchievements,
  NextMilestone,
} from '../models/achievement.model';

@Injectable({
  providedIn: 'root',
})
export class AchievementService {
  private readonly apiUrl = '/api/progress'; // Proxy configured in proxy.conf.json

  // Observable for newly unlocked achievements (for celebration notifications)
  private newlyUnlockedSubject = new BehaviorSubject<Achievement[]>([]);
  public newlyUnlocked$ = this.newlyUnlockedSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all achievements for a student
   *
   * Retrieves complete achievement state for display in badge gallery (AC-004).
   *
   * @param studentId - Student identifier
   * @returns Observable of student achievements
   *
   * @example
   * ```typescript
   * this.achievementService.getStudentAchievements('student-123')
   *   .subscribe(data => {
   *     this.achievements = data.achievements;
   *     this.totalPoints = data.totalPoints;
   *   });
   * ```
   */
  getStudentAchievements(studentId: string): Observable<StudentAchievements> {
    return this.http.get<StudentAchievements>(
      `${this.apiUrl}/achievements/${studentId}`
    );
  }

  /**
   * Get next milestone achievement
   *
   * Shows progress towards next unlockable achievement (AC-003).
   *
   * @param studentId - Student identifier
   * @returns Observable of next milestone data
   */
  getNextMilestone(studentId: string): Observable<NextMilestone> {
    return this.http.get<NextMilestone>(
      `${this.apiUrl}/achievements/${studentId}/next`
    );
  }

  /**
   * Check for newly unlocked achievements
   *
   * Call this after recording question attempts to detect new achievements.
   * Triggers celebration animations (AC-003).
   *
   * @param studentId - Student identifier
   * @returns Observable of student achievements
   */
  checkForNewAchievements(studentId: string): Observable<StudentAchievements> {
    return this.getStudentAchievements(studentId).pipe(
      tap((data) => {
        // Emit newly unlocked achievements for celebration
        if (data.recentlyUnlocked && data.recentlyUnlocked.length > 0) {
          this.newlyUnlockedSubject.next(data.recentlyUnlocked);
        }
      })
    );
  }

  /**
   * Get achievements by category
   *
   * Filter achievements for display organization.
   *
   * @param achievements - All achievements
   * @param category - Category to filter by
   * @returns Filtered achievements
   */
  getAchievementsByCategory(
    achievements: Achievement[],
    category: Achievement['category']
  ): Achievement[] {
    return achievements.filter((a) => a.category === category);
  }

  /**
   * Calculate completion percentage
   *
   * Shows overall achievement progress.
   *
   * @param achievements - All achievements
   * @returns Percentage of unlocked achievements (0-100)
   */
  getCompletionPercentage(achievements: Achievement[]): number {
    if (achievements.length === 0) return 0;
    const unlocked = achievements.filter((a) => a.unlocked).length;
    return Math.round((unlocked / achievements.length) * 100);
  }
}
