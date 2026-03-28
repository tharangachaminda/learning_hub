import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  AuthService,
  QuestionItem,
  RefinementPreview,
} from '../../services/auth.service';
import { KatexRenderComponent } from '../../shared/katex-render/katex-render';

@Component({
  selector: 'app-question-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, KatexRenderComponent],
  templateUrl: './question-detail.html',
  styleUrl: './question-detail.scss',
})
export class QuestionDetailComponent implements OnInit {
  question: QuestionItem | null = null;
  isLoading = true;
  error: string | null = null;
  success: string | null = null;
  questionId = '';

  // Refine
  refineInstruction = '';
  isRefining = false;
  refinementPreview: RefinementPreview | null = null;
  isApplyingRefinement = false;

  // Review
  reviewNotes = '';
  isReviewing = false;

  // Lesson learned
  showLessonForm = false;
  lessonCategory = 'calculation-error';
  lessonMistake = '';
  lessonCorrection = '';
  lessonIncorrectExample = '';
  lessonCorrectedExample = '';
  isSavingLesson = false;

  readonly lessonCategories = [
    'calculation-error',
    'conceptual-error',
    'formatting-issue',
    'difficulty-mismatch',
    'curriculum-mismatch',
    'ambiguous-wording',
    'incorrect-options',
    'missing-steps',
    'other',
  ];

  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.questionId = this.route.snapshot.params['id'] ?? '';
    this.loadQuestion();
  }

  loadQuestion(): void {
    this.isLoading = true;
    this.error = null;
    this.authService.getQuestion(this.questionId).subscribe({
      next: (q) => {
        this.question = q;
        this.isLoading = false;
        // Pre-fill review notes if question already has them
        if (q.reviewNotes) {
          this.reviewNotes = q.reviewNotes;
        }
      },
      error: () => {
        this.error = 'Failed to load question.';
        this.isLoading = false;
      },
    });
  }

  // ── Review ─────────────────────────────

  approve(): void {
    if (!confirm('Are you sure you want to approve this question?')) return;
    this.isReviewing = true;
    this.error = null;
    this.authService
      .reviewQuestion(
        this.questionId,
        'approved',
        this.reviewNotes || undefined
      )
      .subscribe({
        next: () => {
          this.success = 'Question approved!';
          this.isReviewing = false;
          this.loadQuestion();
        },
        error: () => {
          this.error = 'Failed to approve.';
          this.isReviewing = false;
        },
      });
  }

  reject(): void {
    if (!this.reviewNotes.trim()) {
      this.error = 'Please provide a reason for rejection.';
      return;
    }
    if (!confirm('Are you sure you want to reject this question?')) return;
    this.isReviewing = true;
    this.error = null;
    this.authService
      .reviewQuestion(
        this.questionId,
        'rejected',
        this.reviewNotes || undefined
      )
      .subscribe({
        next: () => {
          this.success = 'Question rejected.';
          this.isReviewing = false;
          this.loadQuestion();
          // Open lesson-learned form pre-filled with rejection reason
          this.showLessonForm = true;
          this.lessonMistake = this.reviewNotes;
          if (this.question) {
            this.lessonIncorrectExample = this.question.questionText;
          }
        },
        error: () => {
          this.error = 'Failed to reject.';
          this.isReviewing = false;
        },
      });
  }

  resetToPending(): void {
    if (!confirm('Reset this question back to pending?')) return;
    this.isReviewing = true;
    this.error = null;
    this.authService
      .reviewQuestion(this.questionId, 'pending', this.reviewNotes || undefined)
      .subscribe({
        next: () => {
          this.success = 'Question reset to pending.';
          this.isReviewing = false;
          this.loadQuestion();
        },
        error: () => {
          this.error = 'Failed to reset status.';
          this.isReviewing = false;
        },
      });
  }

  // ── Refine ─────────────────────────────

  requestRefinement(): void {
    if (!this.refineInstruction.trim()) return;
    this.isRefining = true;
    this.error = null;
    this.refinementPreview = null;
    this.authService
      .refineQuestion(this.questionId, this.refineInstruction)
      .subscribe({
        next: (preview) => {
          this.refinementPreview = preview;
          this.isRefining = false;
        },
        error: () => {
          this.error = 'Refinement request failed. The LLM may be unavailable.';
          this.isRefining = false;
        },
      });
  }

  applyRefinement(): void {
    if (!this.refinementPreview) return;
    this.isApplyingRefinement = true;
    this.error = null;
    this.authService
      .applyRefinement(this.questionId, {
        ...this.refinementPreview.refined,
        instruction: this.refineInstruction,
      })
      .subscribe({
        next: () => {
          this.success =
            'Refinement applied. Question reset to pending review.';
          this.isApplyingRefinement = false;
          this.refinementPreview = null;
          this.refineInstruction = '';
          this.loadQuestion();
        },
        error: () => {
          this.error = 'Failed to apply refinement.';
          this.isApplyingRefinement = false;
        },
      });
  }

  discardRefinement(): void {
    this.refinementPreview = null;
  }

  // ── Lesson Learned ─────────────────────

  openLessonForm(): void {
    this.showLessonForm = true;
    if (this.question && this.refinementPreview) {
      this.lessonIncorrectExample =
        this.refinementPreview.original.questionText;
      this.lessonCorrectedExample = this.refinementPreview.refined.questionText;
    }
  }

  saveLesson(): void {
    if (
      !this.question ||
      !this.lessonMistake.trim() ||
      !this.lessonCorrection.trim()
    )
      return;
    this.isSavingLesson = true;
    this.error = null;
    this.authService
      .createLessonLearned({
        grade: this.question.grade,
        topic: this.question.topic,
        category: this.lessonCategory,
        mistakeDescription: this.lessonMistake,
        correctionInstruction: this.lessonCorrection,
        incorrectExample: this.lessonIncorrectExample || undefined,
        correctedExample: this.lessonCorrectedExample || undefined,
        questionId: this.question._id,
      })
      .subscribe({
        next: () => {
          this.success = 'Lesson learned recorded!';
          this.isSavingLesson = false;
          this.showLessonForm = false;
          this.lessonMistake = '';
          this.lessonCorrection = '';
          this.lessonIncorrectExample = '';
          this.lessonCorrectedExample = '';
        },
        error: () => {
          this.error = 'Failed to save lesson learned.';
          this.isSavingLesson = false;
        },
      });
  }

  cancelLesson(): void {
    this.showLessonForm = false;
  }

  backToQueue(): void {
    this.router.navigate(['/review']);
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
