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
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowRotateRight,
  faArrowsRotate,
  faCheck,
  faCircleExclamation,
  faFilter,
  faLayerGroup,
  faMagnifyingGlass,
  faWandMagicSparkles,
  faPenToSquare,
  faTrash,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import {
  AuthService,
  QuestionItem,
  GradeInfo,
  QuestionStats,
} from '../../services/auth.service';
import { KatexRenderComponent } from '../../shared/katex-render/katex-render';
import { AdminHeaderActionsService } from '../../shared/admin-shell/admin-header-actions.service';

@Component({
  selector: 'app-review-queue',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    KatexRenderComponent,
    FontAwesomeModule,
  ],
  templateUrl: './review-queue.html',
  styleUrl: './review-queue.scss',
})
export class ReviewQueueComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('headerActions')
  protected headerActionsTemplate?: TemplateRef<unknown>;

  questions: QuestionItem[] = [];
  stats: QuestionStats | null = null;
  grades: GradeInfo[] = [];
  isLoading = true;
  error: string | null = null;
  success: string | null = null;
  protected readonly filterIcon = faFilter;
  protected readonly resultsIcon = faLayerGroup;
  protected readonly searchIcon = faMagnifyingGlass;
  protected readonly generateIcon = faWandMagicSparkles;
  protected readonly approveIcon = faCheck;
  protected readonly rejectIcon = faXmark;
  protected readonly retryIcon = faArrowRotateRight;
  protected readonly reopenIcon = faArrowsRotate;
  protected readonly refineIcon = faPenToSquare;
  protected readonly deleteIcon = faTrash;
  protected readonly warningIcon = faCircleExclamation;

  // Filters
  filterGrade: number | null = null;
  filterTopic = '';
  filterStatus = 'pending';
  filterApprovedNotIndexed = false;
  private lastExplicitStatus = 'pending';

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;

  // Bulk selection
  selectedIds = new Set<string>();
  selectAll = false;

  // Inline action state
  actionInProgress: string | null = null;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly adminHeader = inject(AdminHeaderActionsService);

  ngOnInit(): void {
    // Read query params to initialize filters
    const params = this.route.snapshot.queryParams;
    if (params['status'] !== undefined) {
      this.filterStatus = params['status'] || '';
      this.lastExplicitStatus = this.filterStatus;
    }
    if (params['grade'] !== undefined) {
      this.filterGrade = +params['grade'];
    }
    if (params['topic']) {
      this.filterTopic = params['topic'];
    }
    if (params['approvedNotIndexed'] !== undefined) {
      this.filterApprovedNotIndexed = params['approvedNotIndexed'] === 'true';
    }

    this.authService.getCurriculum().subscribe({
      next: (data) => (this.grades = data.grades),
      error: () => {
        /* ignored */
      },
    });

    this.loadQuestions();
    this.loadStats();
  }

  ngAfterViewInit(): void {
    this.adminHeader.setHeaderActions(this.headerActionsTemplate ?? null);
  }

  ngOnDestroy(): void {
    this.adminHeader.clearHeaderActions(this.headerActionsTemplate);
  }

  loadQuestions(): void {
    this.isLoading = true;
    this.error = null;
    this.success = null;
    this.selectedIds.clear();
    this.selectAll = false;

    const filters: Record<string, string | number | boolean> = {
      page: this.currentPage,
      limit: this.pageSize,
    };
    if (this.filterGrade !== null) filters['grade'] = this.filterGrade;
    if (this.filterTopic) filters['topic'] = this.filterTopic;
    if (this.filterStatus) filters['status'] = this.filterStatus;
    if (this.filterApprovedNotIndexed) {
      filters['approvedNotIndexed'] = true;
    }

    this.authService.getQuestions(filters).subscribe({
      next: (result) => {
        this.questions = result.data;
        this.totalItems = result.total;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load questions.';
        this.isLoading = false;
      },
    });
  }

  loadStats(): void {
    this.authService.getQuestionStats().subscribe({
      next: (s) => (this.stats = s),
      error: () => {
        /* ignored */
      },
    });
  }

  onFilterChange(): void {
    if (this.filterApprovedNotIndexed) {
      this.filterStatus = 'approved';
    } else {
      this.lastExplicitStatus = this.filterStatus;
    }
    this.currentPage = 1;
    this.updateFilterQueryParams();
    this.loadQuestions();
  }

  onGradeFilterChange(): void {
    this.filterTopic = '';
    this.onFilterChange();
  }

  get filteredTopics() {
    if (this.filterGrade === null) return [];
    const grade = this.grades.find((g) => g.grade === this.filterGrade);
    return grade?.topics ?? [];
  }

  get activeFilterCount(): number {
    return [
      this.filterStatus !== '' && this.filterStatus !== 'pending',
      this.filterGrade !== null,
      this.filterTopic !== '',
      this.filterApprovedNotIndexed,
    ].filter(Boolean).length;
  }

  onApprovedNotIndexedChange(): void {
    if (this.filterApprovedNotIndexed) {
      this.lastExplicitStatus = this.filterStatus;
      this.filterStatus = 'approved';
    } else {
      this.filterStatus = this.lastExplicitStatus;
    }
    this.onFilterChange();
  }

  getIndexStateClass(question: QuestionItem): string {
    const status = question.vectorSync?.status;
    if (status === 'stored') return 'index-stored';
    if (status === 'failed') return 'index-failed';
    if (status === 'prepared') return 'index-prepared';
    return 'index-pending';
  }

  getIndexStateLabel(question: QuestionItem): string {
    const status = question.vectorSync?.status;
    if (status === 'stored') return 'Indexed';
    if (status === 'failed') return 'Index failed';
    if (status === 'prepared') return 'Indexing';
    return 'Not indexed';
  }

  getIndexStateTitle(question: QuestionItem): string {
    const status = question.vectorSync?.status;
    if (status === 'stored') {
      return question.vectorSync?.storedAt
        ? `Indexed on ${new Date(
            question.vectorSync.storedAt
          ).toLocaleString()}`
        : 'Indexed in OpenSearch';
    }
    if (status === 'failed') {
      return question.vectorSync?.syncError || 'OpenSearch indexing failed';
    }
    if (status === 'prepared') {
      return 'Index payload prepared and waiting to be stored';
    }
    return 'Question is approved but not yet indexed';
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  resetFilters(): void {
    this.filterGrade = null;
    this.filterTopic = '';
    this.filterStatus = 'pending';
    this.filterApprovedNotIndexed = false;
    this.lastExplicitStatus = 'pending';
    this.currentPage = 1;
    this.updateFilterQueryParams();
    this.loadQuestions();
  }

  private updateFilterQueryParams(): void {
    const queryParams: Record<string, string | number | boolean> = {};

    if (this.filterStatus && this.filterStatus !== 'pending') {
      queryParams['status'] = this.filterStatus;
    }

    if (this.filterGrade !== null) {
      queryParams['grade'] = this.filterGrade;
    }

    if (this.filterTopic) {
      queryParams['topic'] = this.filterTopic;
    }

    if (this.filterApprovedNotIndexed) {
      queryParams['approvedNotIndexed'] = true;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true,
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadQuestions();
    }
  }

  // ── Selection ──────────────────────────

  toggleSelectAll(): void {
    if (this.selectAll) {
      this.questions.forEach((q) => this.selectedIds.add(q._id));
    } else {
      this.selectedIds.clear();
    }
  }

  toggleSelect(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    this.selectAll = this.selectedIds.size === this.questions.length;
  }

  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  // ── Actions ────────────────────────────

  approveQuestion(id: string): void {
    if (!confirm('Are you sure you want to approve this question?')) return;
    this.actionInProgress = id;
    this.authService.reviewQuestion(id, 'approved').subscribe({
      next: () => {
        this.actionInProgress = null;
        this.loadQuestions();
        this.loadStats();
      },
      error: () => {
        this.actionInProgress = null;
        this.error = 'Failed to approve question.';
      },
    });
  }

  retryIndex(id: string): void {
    this.actionInProgress = id;
    this.authService.retryQuestionIndex(id).subscribe({
      next: () => {
        this.actionInProgress = null;
        this.success = 'Question indexing retried.';
        this.loadQuestions();
      },
      error: () => {
        this.actionInProgress = null;
        this.error = 'Failed to retry indexing.';
      },
    });
  }

  canRetryIndex(question: QuestionItem): boolean {
    return (
      question.status === 'approved' && question.vectorSync?.status !== 'stored'
    );
  }

  rejectQuestion(id: string): void {
    const reason = prompt('Rejection reason (required):');
    if (!reason?.trim()) return;
    this.actionInProgress = id;
    this.authService.reviewQuestion(id, 'rejected', reason.trim()).subscribe({
      next: () => {
        this.actionInProgress = null;
        this.loadQuestions();
        this.loadStats();
      },
      error: () => {
        this.actionInProgress = null;
        this.error = 'Failed to reject question.';
      },
    });
  }

  openDetail(id: string): void {
    this.router.navigate(['/review', id]);
  }

  bulkApprove(): void {
    if (this.selectedIds.size === 0) return;
    if (!confirm(`Approve ${this.selectedIds.size} selected question(s)?`))
      return;
    this.actionInProgress = 'bulk';
    this.authService
      .bulkReview(Array.from(this.selectedIds), 'approved')
      .subscribe({
        next: () => {
          this.actionInProgress = null;
          this.loadQuestions();
          this.loadStats();
        },
        error: () => {
          this.actionInProgress = null;
          this.error = 'Bulk approve failed.';
        },
      });
  }

  bulkReject(): void {
    if (this.selectedIds.size === 0) return;
    const reason = prompt(
      `Rejection reason for ${this.selectedIds.size} question(s) (required):`
    );
    if (!reason?.trim()) return;
    this.actionInProgress = 'bulk';
    this.authService
      .bulkReview(Array.from(this.selectedIds), 'rejected', reason.trim())
      .subscribe({
        next: () => {
          this.actionInProgress = null;
          this.loadQuestions();
          this.loadStats();
        },
        error: () => {
          this.actionInProgress = null;
          this.error = 'Bulk reject failed.';
        },
      });
  }

  deleteQuestion(id: string): void {
    if (
      !confirm(
        'Are you sure you want to permanently delete this question? This cannot be undone.'
      )
    )
      return;
    this.actionInProgress = id;
    this.authService.deleteQuestion(id).subscribe({
      next: () => {
        this.actionInProgress = null;
        this.success = 'Question deleted.';
        this.loadQuestions();
        this.loadStats();
      },
      error: () => {
        this.actionInProgress = null;
        this.error = 'Failed to delete question.';
      },
    });
  }

  bulkDelete(): void {
    if (this.selectedIds.size === 0) return;
    if (
      !confirm(
        `Permanently delete ${this.selectedIds.size} selected question(s)? This cannot be undone.`
      )
    )
      return;
    this.actionInProgress = 'bulk';
    const ids = Array.from(this.selectedIds);
    let completed = 0;
    let failed = 0;
    ids.forEach((id) => {
      this.authService.deleteQuestion(id).subscribe({
        next: () => {
          completed++;
          if (completed + failed === ids.length) {
            this.actionInProgress = null;
            this.loadQuestions();
            this.loadStats();
            if (failed > 0) {
              this.error = `Deleted ${completed} question(s), ${failed} failed.`;
            } else {
              this.success = `${completed} question(s) deleted.`;
            }
          }
        },
        error: () => {
          failed++;
          if (completed + failed === ids.length) {
            this.actionInProgress = null;
            this.loadQuestions();
            this.loadStats();
            this.error = `Deleted ${completed} question(s), ${failed} failed.`;
          }
        },
      });
    });
  }

  topicLabel(question: QuestionItem): string {
    if (question.metadata?.resolvedTopicLabel) {
      return question.metadata.resolvedTopicLabel;
    }

    const topic = question.metadata?.resolvedTopicKey || question.topic;
    for (const g of this.grades) {
      const found = g.topics.find((t) => t.key === topic);
      if (found) return found.label;
    }
    return topic.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }
}
