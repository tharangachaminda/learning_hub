/**
 * Student Dashboard Component
 *
 * Main landing page after student login. Provides an at-a-glance view
 * of the student's learning journey including welcome banner, daily goals,
 * AI recommendations, recent activity, and achievement showcase.
 *
 * Implements:
 * - AC2: Welcome banner with student name and time-of-day greeting
 * - AC11: Colorful, child-friendly design with emoji icons
 * - AC19: Loading states with skeleton loaders
 * - AC20: Error handling with friendly messages
 * - AC25: Screen reader compatible with ARIA labels
 *
 * @example
 * ```html
 * <app-student-dashboard></app-student-dashboard>
 * ```
 */

import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import {
  DashboardData,
  TopicRecommendation,
  SubjectProgress,
} from '../../models/dashboard.model';
import { DailyGoalWidgetComponent } from './components/daily-goal-widget/daily-goal-widget.component';
import { AiRecommendationsComponent } from './components/ai-recommendations/ai-recommendations.component';
import { RecentActivityComponent } from './components/recent-activity/recent-activity.component';
import { AchievementShowcaseComponent } from './components/achievement-showcase/achievement-showcase.component';
import { SubjectCardsComponent } from './components/subject-cards/subject-cards.component';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    DailyGoalWidgetComponent,
    AiRecommendationsComponent,
    RecentActivityComponent,
    AchievementShowcaseComponent,
    SubjectCardsComponent,
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss'],
})
export class StudentDashboardComponent implements OnInit {
  /** Student ID for API calls. Should be provided by auth context. */
  @Input() studentId = 'integration-test-student';

  /** Aggregated dashboard data from the API. Null until loaded. */
  dashboardData: DashboardData | null = null;

  /** Whether the dashboard data is currently being fetched. */
  loading = true;

  /** Error message to display when API call fails. Null when no error. */
  error: string | null = null;

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  /**
   * Initialize the component by resolving the student ID and fetching dashboard data.
   *
   * Uses the authenticated user's ID from AuthService when available,
   * falling back to the @Input() studentId for testing purposes.
   */
  ngOnInit(): void {
    const authId = this.authService.getUserId();
    if (authId) {
      this.studentId = authId;
    }
    this.loadDashboard();
  }

  /**
   * Fetch dashboard data from the API.
   *
   * Sets loading state, calls DashboardService, and handles
   * success/error responses with appropriate state updates.
   */
  loadDashboard(): void {
    this.loading = true;
    this.error = null;

    this.dashboardService.getDashboardData(this.studentId).subscribe({
      next: (data: DashboardData) => {
        this.dashboardData = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load your dashboard. Please try again later.';
        this.loading = false;
      },
    });
  }

  /**
   * Get a time-of-day greeting message.
   *
   * Returns a greeting appropriate for the current hour:
   * - 5-11: "Good morning"
   * - 12-16: "Good afternoon"
   * - 17-4: "Good evening"
   *
   * @param hour - Hour of the day (0-23). Defaults to current hour.
   * @returns Greeting string based on time of day
   *
   * @example
   * ```typescript
   * component.getGreeting(9);  // "Good morning"
   * component.getGreeting(14); // "Good afternoon"
   * component.getGreeting(20); // "Good evening"
   * ```
   */
  getGreeting(hour?: number): string {
    const h = hour ?? new Date().getHours();

    if (h >= 5 && h <= 11) {
      return 'Good morning';
    } else if (h >= 12 && h <= 16) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  }

  /**
   * Handle quick practice button click from AI recommendations.
   *
   * Navigates to the practice generator with the recommended topic.
   *
   * @param recommendation - The topic recommendation selected by the student
   */
  onStartPractice(recommendation: TopicRecommendation): void {
    this.router.navigate(['/practice/generate'], {
      queryParams: {
        topic: recommendation.topic,
        subject: recommendation.subject,
      },
    });
  }

  /**
   * Handle subject card click to navigate to question generator.
   *
   * @param subject - The subject the student wants to practise
   */
  onPracticeSubject(subject: SubjectProgress): void {
    this.router.navigate(['/practice/generate'], {
      queryParams: {
        topic: subject.subject,
        subject: 'mathematics',
      },
    });
  }

  /**
   * Log the student out and redirect to the login page.
   *
   * Clears authentication tokens and user data from storage,
   * then navigates to the login route.
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
