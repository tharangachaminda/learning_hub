import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowTrendUp,
  faBookOpen,
  faChartColumn,
  faCircleCheck,
  faClipboardCheck,
  faClock,
  faFileCirclePlus,
  faLayerGroup,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import {
  AuthService,
  CurriculumData,
  QuestionStats,
  QuestionAnalytics,
  CoverageGap,
} from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  stats: QuestionStats | null = null;
  analytics: QuestionAnalytics | null = null;
  isLoading = true;
  error: string | null = null;
  isAdmin = false;
  protected readonly pendingIcon = faClock;
  protected readonly approvedIcon = faCircleCheck;
  protected readonly rejectedIcon = faTriangleExclamation;
  protected readonly totalIcon = faChartColumn;
  protected readonly analyticsIcon = faArrowTrendUp;
  protected readonly generateIcon = faFileCirclePlus;
  protected readonly reviewIcon = faClipboardCheck;
  protected readonly exportIcon = faBookOpen;
  protected readonly visualCatalogIcon = faLayerGroup;

  /** Number of grade×topic combos with adequate coverage */
  adequateCoverage = 0;
  /** Total number of grade×topic combos in the curriculum */
  totalCombos = 0;
  /** Top 5 coverage gaps sorted by lowest approved count */
  topGaps: CoverageGap[] = [];

  private readonly topicLabels = new Map<string, string>();

  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();

    this.loadCurriculum();
    this.loadStats();
    this.loadAnalytics();
  }

  loadCurriculum(): void {
    this.authService.getCurriculum().subscribe({
      next: (data: CurriculumData) => {
        const years = data.subjects?.[0]?.years ?? data.grades;
        this.topicLabels.clear();
        for (const year of years) {
          for (const topic of year.topics) {
            this.topicLabels.set(topic.key, topic.label);
            for (const legacyKey of topic.legacyTopicKeys ?? []) {
              this.topicLabels.set(legacyKey, topic.label);
            }
          }
        }
      },
      error: () => {
        // Non-blocking — dashboard still renders with fallback formatting.
      },
    });
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
    const label = this.topicLabels.get(topic);
    if (label) {
      return label;
    }

    return topic
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
