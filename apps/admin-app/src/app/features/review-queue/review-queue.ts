import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  AuthService,
  QuestionItem,
  GradeInfo,
  QuestionStats,
} from '../../services/auth.service';
import { KatexRenderComponent } from '../../shared/katex-render/katex-render';

@Component({
  selector: 'app-review-queue',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, KatexRenderComponent],
  templateUrl: './review-queue.html',
  styleUrl: './review-queue.scss',
})
export class ReviewQueueComponent implements OnInit {
  questions: QuestionItem[] = [];
  stats: QuestionStats | null = null;
  grades: GradeInfo[] = [];
  isLoading = true;
  error: string | null = null;
  userName = '';
  userRole = '';

  // Filters
  filterGrade: number | null = null;
  filterTopic = '';
  filterStatus = 'pending';

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

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.userName = user?.name ?? 'Admin';
    this.userRole = user?.role ?? '';

    // Read query params to initialize filters
    const params = this.route.snapshot.queryParams;
    if (params['status'] !== undefined) {
      this.filterStatus = params['status'] || '';
    }
    if (params['grade']) {
      this.filterGrade = +params['grade'];
    }
    if (params['topic']) {
      this.filterTopic = params['topic'];
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

  loadQuestions(): void {
    this.isLoading = true;
    this.error = null;
    this.selectedIds.clear();
    this.selectAll = false;

    const filters: Record<string, string | number> = {
      page: this.currentPage,
      limit: this.pageSize,
    };
    if (this.filterGrade) filters['grade'] = this.filterGrade;
    if (this.filterTopic) filters['topic'] = this.filterTopic;
    if (this.filterStatus) filters['status'] = this.filterStatus;

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
    this.currentPage = 1;
    this.loadQuestions();
  }

  onGradeFilterChange(): void {
    this.filterTopic = '';
    this.onFilterChange();
  }

  get filteredTopics() {
    if (!this.filterGrade) return [];
    const grade = this.grades.find((g) => g.grade === this.filterGrade);
    return grade?.topics ?? [];
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
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

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
