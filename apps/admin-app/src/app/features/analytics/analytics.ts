import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowTrendUp,
  faCalendar,
  faChartSimple,
  faCheck,
  faScaleBalanced,
  faTableCellsLarge,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import {
  AuthService,
  QuestionAnalytics,
  GradeTopicCount,
  CoverageGap,
  TopicHealth,
} from '../../services/auth.service';
import { AdminHeaderActionsService } from '../../shared/admin-shell/admin-header-actions.service';

interface HeatmapRow {
  grade: number;
  cells: HeatmapCell[];
}

interface HeatmapCell {
  topic: string;
  approved: number;
  indexed: number;
  pending: number;
  rejected: number;
  total: number;
  colorClass: string;
}

interface DifficultyRow {
  grade: number;
  easy: number;
  indexedEasy: number;
  medium: number;
  indexedMedium: number;
  hard: number;
  indexedHard: number;
  unknown: number;
  indexedUnknown: number;
  total: number;
  indexedTotal: number;
}

interface FormatRow {
  grade: number;
  openEnded: number;
  multipleChoice: number;
  total: number;
}

/** Health criteria thresholds */
const HEALTH_THRESHOLDS = {
  minPerDifficulty: 50,
  minApprovalRate: 80,
  weeklyTarget: 10,
  minFormatPercent: 30,
  stalenessDays: 14,
};

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('headerActions')
  protected headerActionsTemplate?: TemplateRef<unknown>;

  analytics: QuestionAnalytics | null = null;
  isLoading = true;
  error: string | null = null;

  /** Grade filter: null = all grades */
  selectedGrade: number | null = null;
  readonly grades = [3, 4, 5, 6, 7, 8];

  /** All unique topics across all grades for heatmap columns */
  allTopics: string[] = [];

  /** Topics available per grade (for N/A detection) */
  gradeTopicsMap = new Map<number, Set<string>>();

  /** Heatmap rows */
  heatmapRows: HeatmapRow[] = [];

  /** Difficulty distribution per grade */
  difficultyRows: DifficultyRow[] = [];

  /** Format distribution per grade */
  formatRows: FormatRow[] = [];

  /** Coverage gaps sorted by severity */
  coverageGaps: CoverageGap[] = [];

  /** Per-topic health data */
  topicHealthRows: TopicHealth[] = [];

  /** Health thresholds for display */
  readonly thresholds = HEALTH_THRESHOLDS;
  protected readonly depthIcon = faChartSimple;
  protected readonly approvalIcon = faCheck;
  protected readonly weeklyIcon = faCalendar;
  protected readonly balanceIcon = faScaleBalanced;
  protected readonly freshnessIcon = faArrowTrendUp;
  protected readonly heatmapIcon = faTableCellsLarge;
  protected readonly gapIcon = faTriangleExclamation;

  private readonly authService = inject(AuthService);
  private readonly adminHeader = inject(AdminHeaderActionsService);

  ngOnInit(): void {
    this.loadAnalytics();
  }

  ngAfterViewInit(): void {
    this.adminHeader.setHeaderActions(this.headerActionsTemplate ?? null);
  }

  ngOnDestroy(): void {
    this.adminHeader.clearHeaderActions(this.headerActionsTemplate);
  }

  onGradeChange(grade: number | null): void {
    this.selectedGrade = grade;
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.isLoading = true;
    this.error = null;

    this.authService
      .getAnalytics(undefined, this.selectedGrade ?? undefined)
      .subscribe({
        next: (data) => {
          this.analytics = data;
          this.buildHeatmap(data);
          this.buildDifficultyRows(data);
          this.buildFormatRows(data);
          this.coverageGaps = data.coverageGaps;
          this.topicHealthRows = data.topicHealth;
          this.isLoading = false;
        },
        error: () => {
          this.error = 'Failed to load analytics data.';
          this.isLoading = false;
        },
      });
  }

  formatTopic(topic: string): string {
    return topic
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  getCoveragePercent(): number {
    if (!this.analytics) return 0;
    const { gradeTopicMatrix } = this.analytics;
    const adequate = gradeTopicMatrix.filter(
      (e) => e.approved >= HEALTH_THRESHOLDS.minPerDifficulty
    ).length;
    return gradeTopicMatrix.length > 0
      ? Math.round((adequate / gradeTopicMatrix.length) * 100)
      : 0;
  }

  getHealthyTopicCount(): number {
    return this.topicHealthRows.filter((t) => t.issues.length === 0).length;
  }

  getIndexedCoveragePercent(): number {
    if (!this.analytics || this.analytics.summary.totalApproved === 0) return 0;
    return Math.round(
      (this.analytics.summary.totalIndexed /
        this.analytics.summary.totalApproved) *
        100
    );
  }

  getIndexedCoverageClass(indexed: number, approved: number): string {
    if (approved === 0) return 'indexed-na';
    const coverage = (indexed / approved) * 100;
    if (coverage >= 90) return 'indexed-good';
    if (coverage >= 50) return 'indexed-warning';
    return 'indexed-critical';
  }

  getAvgApprovalRate(): number {
    const rows = this.topicHealthRows.filter((t) => t.total > 0);
    if (rows.length === 0) return 0;
    return Math.round(
      rows.reduce((sum, r) => sum + r.approvalRate, 0) / rows.length
    );
  }

  getGradeHealthPercent(grade: number): number {
    const rows = this.topicHealthRows.filter((t) => t.grade === grade);
    if (rows.length === 0) return 0;
    const healthy = rows.filter((t) => t.issues.length === 0).length;
    return Math.round((healthy / rows.length) * 100);
  }

  getBarWidth(value: number, total: number): string {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  }

  getHealthClass(health: TopicHealth): string {
    if (health.issues.length === 0) return 'health-good';
    if (health.issues.length <= 3) return 'health-warning';
    return 'health-critical';
  }

  getDepthPercent(count: number): number {
    return Math.min(
      Math.round((count / HEALTH_THRESHOLDS.minPerDifficulty) * 100),
      100
    );
  }

  getDepthClass(count: number): string {
    if (count >= HEALTH_THRESHOLDS.minPerDifficulty) return 'depth-good';
    if (count >= HEALTH_THRESHOLDS.minPerDifficulty / 2) return 'depth-warning';
    return 'depth-critical';
  }

  getIndexedDepthClass(indexed: number, approved: number): string {
    if (approved === 0) return 'indexed-na';
    const coverage = (indexed / approved) * 100;
    if (coverage >= 90) return 'indexed-good';
    if (coverage >= 50) return 'indexed-warning';
    return 'indexed-critical';
  }

  private buildHeatmap(data: QuestionAnalytics): void {
    // Collect topics per grade and build unique topic set
    const topicSet = new Set<string>();
    const gradeMap = new Map<number, Map<string, GradeTopicCount>>();

    for (const entry of data.gradeTopicMatrix) {
      topicSet.add(entry.topic);
      this.gradeTopicsMap.set(
        entry.grade,
        (this.gradeTopicsMap.get(entry.grade) || new Set()).add(entry.topic)
      );
      if (!gradeMap.has(entry.grade)) {
        gradeMap.set(entry.grade, new Map());
      }
      const gradeEntries = gradeMap.get(entry.grade);
      if (gradeEntries) {
        gradeEntries.set(entry.topic, entry);
      }
    }

    this.allTopics = Array.from(topicSet).sort();

    // Build rows for grades 3–8
    this.heatmapRows = [];
    for (let grade = 3; grade <= 8; grade++) {
      const gradeData = gradeMap.get(grade);
      const gradeTopics = this.gradeTopicsMap.get(grade) || new Set();

      const cells: HeatmapCell[] = this.allTopics.map((topic) => {
        if (!gradeTopics.has(topic)) {
          return {
            topic,
            approved: -1,
            indexed: 0,
            pending: 0,
            rejected: 0,
            total: 0,
            colorClass: 'cell-na',
          };
        }
        const entry = gradeData?.get(topic);
        const approved = entry?.approved ?? 0;
        return {
          topic,
          approved,
          indexed: entry?.indexed ?? 0,
          pending: entry?.pending ?? 0,
          rejected: entry?.rejected ?? 0,
          total: entry?.total ?? 0,
          colorClass: this.getColorClass(approved),
        };
      });

      this.heatmapRows.push({ grade, cells });
    }
  }

  private getColorClass(approved: number): string {
    if (approved === 0) return 'cell-red';
    if (approved < 50) return 'cell-amber';
    if (approved < 150) return 'cell-light-green';
    return 'cell-green';
  }

  private buildDifficultyRows(data: QuestionAnalytics): void {
    const gradeMap = new Map<
      number,
      {
        easy: number;
        indexedEasy: number;
        medium: number;
        indexedMedium: number;
        hard: number;
        indexedHard: number;
        unknown: number;
        indexedUnknown: number;
      }
    >();

    for (let g = 3; g <= 8; g++) {
      gradeMap.set(g, {
        easy: 0,
        indexedEasy: 0,
        medium: 0,
        indexedMedium: 0,
        hard: 0,
        indexedHard: 0,
        unknown: 0,
        indexedUnknown: 0,
      });
    }

    for (const entry of data.byDifficulty) {
      const row = gradeMap.get(entry.grade);
      if (!row) continue;
      const d = entry.difficulty?.toLowerCase();
      if (d === 'easy') {
        row.easy += entry.count;
        row.indexedEasy += entry.indexed;
      } else if (d === 'medium') {
        row.medium += entry.count;
        row.indexedMedium += entry.indexed;
      } else if (d === 'hard') {
        row.hard += entry.count;
        row.indexedHard += entry.indexed;
      } else {
        row.unknown += entry.count;
        row.indexedUnknown += entry.indexed;
      }
    }

    this.difficultyRows = [];
    for (const [grade, counts] of gradeMap) {
      const total = counts.easy + counts.medium + counts.hard + counts.unknown;
      const indexedTotal =
        counts.indexedEasy +
        counts.indexedMedium +
        counts.indexedHard +
        counts.indexedUnknown;
      this.difficultyRows.push({ grade, ...counts, total, indexedTotal });
    }
  }

  private buildFormatRows(data: QuestionAnalytics): void {
    const gradeMap = new Map<
      number,
      { openEnded: number; multipleChoice: number }
    >();

    for (let g = 3; g <= 8; g++) {
      gradeMap.set(g, { openEnded: 0, multipleChoice: 0 });
    }

    for (const entry of data.byFormat) {
      const row = gradeMap.get(entry.grade);
      if (!row) continue;
      if (entry.format === 'multiple-choice') row.multipleChoice += entry.count;
      else row.openEnded += entry.count;
    }

    this.formatRows = [];
    for (const [grade, counts] of gradeMap) {
      const total = counts.openEnded + counts.multipleChoice;
      this.formatRows.push({ grade, ...counts, total });
    }
  }
}
