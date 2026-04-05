import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  AuthService,
  QuestionStats,
  QuestionAnalytics,
  CoverageGap,
} from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  stats: QuestionStats | null = null;
  analytics: QuestionAnalytics | null = null;
  isLoading = true;
  error: string | null = null;
  userName = '';
  userRole = '';
  isAdmin = false;

  /** Number of grade×topic combos with adequate coverage */
  adequateCoverage = 0;
  /** Total number of grade×topic combos in the curriculum */
  totalCombos = 0;
  /** Top 5 coverage gaps sorted by lowest approved count */
  topGaps: CoverageGap[] = [];

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.userName = user?.name ?? 'Admin';
    this.userRole = user?.role ?? '';
    this.isAdmin = this.authService.isAdmin();

    this.loadStats();
    this.loadAnalytics();
  }

  loadStats(): void {
    this.isLoading = true;
    this.error = null;

    this.authService.getQuestionStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load question statistics.';
        this.isLoading = false;
      },
    });
  }

  loadAnalytics(): void {
    this.authService.getAnalytics().subscribe({
      next: (analytics) => {
        this.analytics = analytics;
        this.totalCombos = analytics.gradeTopicMatrix.length;
        this.adequateCoverage = analytics.gradeTopicMatrix.filter(
          (entry) => entry.approved >= 10
        ).length;
        this.topGaps = analytics.coverageGaps.slice(0, 5);
      },
      error: () => {
        // Non-blocking — dashboard still works without analytics
      },
    });
  }

  formatTopic(topic: string): string {
    return topic
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
