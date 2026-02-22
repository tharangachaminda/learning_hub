/**
 * Dashboard Service
 *
 * Handles API communication for the student dashboard screen.
 * Provides methods to fetch aggregated dashboard data, AI recommendations,
 * subject progress summaries, and recent achievements.
 *
 * Implements AC18 (student progress API integration).
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DashboardData,
  TopicRecommendation,
  SubjectProgress,
} from '../models/dashboard.model';
import { Achievement } from '../models/achievement.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  /** Base API path for student endpoints. Proxied to backend via proxy.conf.json. */
  private readonly apiUrl = '/api/students';

  constructor(private readonly http: HttpClient) {}

  /**
   * Fetch aggregated dashboard data for a student.
   *
   * Returns the complete dashboard payload including profile, daily goal,
   * streak, recommendations, recent activity, achievements, and subject progress.
   *
   * @param studentId - The unique identifier of the student
   * @returns Observable emitting the full DashboardData object
   * @throws HttpErrorResponse when the API returns an error status
   *
   * @example
   * ```typescript
   * this.dashboardService.getDashboardData('student-123')
   *   .subscribe(data => {
   *     this.profile = data.student;
   *     this.dailyGoal = data.dailyGoal;
   *   });
   * ```
   */
  getDashboardData(studentId: string): Observable<DashboardData> {
    return this.http.get<DashboardData>(
      `${this.apiUrl}/${studentId}/dashboard`
    );
  }

  /**
   * Fetch AI-powered topic recommendations for a student.
   *
   * Returns personalized topic suggestions based on the student's
   * performance history and learning patterns (AC5, AC22).
   *
   * @param studentId - The unique identifier of the student
   * @returns Observable emitting an array of TopicRecommendation objects
   * @throws HttpErrorResponse when the API returns an error status
   *
   * @example
   * ```typescript
   * this.dashboardService.getRecommendations('student-123')
   *   .subscribe(recs => {
   *     this.recommendations = recs;
   *   });
   * ```
   */
  getRecommendations(studentId: string): Observable<TopicRecommendation[]> {
    return this.http.get<TopicRecommendation[]>(
      `${this.apiUrl}/${studentId}/recommendations`
    );
  }

  /**
   * Fetch progress summary across all subjects for a student.
   *
   * Returns per-subject mastery percentages, question counts, and
   * last-practiced timestamps (AC8, AC18).
   *
   * @param studentId - The unique identifier of the student
   * @returns Observable emitting an array of SubjectProgress objects
   * @throws HttpErrorResponse when the API returns an error status
   *
   * @example
   * ```typescript
   * this.dashboardService.getProgressSummary('student-123')
   *   .subscribe(subjects => {
   *     this.subjectCards = subjects;
   *   });
   * ```
   */
  getProgressSummary(studentId: string): Observable<SubjectProgress[]> {
    return this.http.get<SubjectProgress[]>(
      `${this.apiUrl}/${studentId}/progress/summary`
    );
  }

  /**
   * Fetch recently unlocked achievements for a student.
   *
   * Returns the latest achievements to display in the dashboard
   * achievement showcase section (AC9).
   *
   * @param studentId - The unique identifier of the student
   * @returns Observable emitting an array of Achievement objects
   * @throws HttpErrorResponse when the API returns an error status
   *
   * @example
   * ```typescript
   * this.dashboardService.getRecentAchievements('student-123')
   *   .subscribe(badges => {
   *     this.recentBadges = badges;
   *   });
   * ```
   */
  getRecentAchievements(studentId: string): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(
      `${this.apiUrl}/${studentId}/achievements/recent`
    );
  }
}
