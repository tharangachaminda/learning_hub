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
import { switchMap } from 'rxjs/operators';
import {
  AuthService,
  QuestionItem,
  QuestionVisual,
  QuestionVisualSelection,
  RefinementPreview,
} from '../../services/auth.service';
import { KatexRenderComponent } from '../../shared/katex-render/katex-render';
import { LatexEditorComponent } from '../../shared/latex-editor/latex-editor';
import {
  PickedVisualSelection,
  VisualPickerComponent,
} from '../../shared/visual-picker/visual-picker';
import { SubCategoryPickerComponent } from '../../shared/subcategory-picker/subcategory-picker';
import { AdminHeaderActionsService } from '../../shared/admin-shell/admin-header-actions.service';

@Component({
  selector: 'app-question-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    KatexRenderComponent,
    LatexEditorComponent,
    VisualPickerComponent,
    SubCategoryPickerComponent,
  ],
  templateUrl: './question-detail.html',
  styleUrl: './question-detail.scss',
})
export class QuestionDetailComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('headerActions')
  protected headerActionsTemplate?: TemplateRef<unknown>;

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

  // Edit mode
  isEditing = false;
  isSaving = false;
  editQuestionText = '';
  editAnswer = '';
  editAnswerAssetId = '';
  editExplanation = '';
  editSteps: string[] = [];
  editSubCategories: string[] = [];
  editDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  editInitialVisualSelections: PickedVisualSelection[] = [];
  editVisualSelections: PickedVisualSelection[] = [];

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
  private readonly adminHeader = inject(AdminHeaderActionsService);

  ngOnInit(): void {
    this.questionId = this.route.snapshot.params['id'] ?? '';
    this.loadQuestion();
  }

  ngAfterViewInit(): void {
    this.adminHeader.setHeaderActions(this.headerActionsTemplate ?? null);
  }

  ngOnDestroy(): void {
    this.adminHeader.clearHeaderActions(this.headerActionsTemplate);
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

  deleteQuestion(): void {
    if (
      !confirm(
        'Are you sure you want to permanently delete this question? This cannot be undone.'
      )
    )
      return;
    this.isReviewing = true;
    this.error = null;
    this.authService.deleteQuestion(this.questionId).subscribe({
      next: () => {
        this.router.navigate(['/review']);
      },
      error: () => {
        this.error = 'Failed to delete question.';
        this.isReviewing = false;
      },
    });
  }

  // ── Edit Mode ──────────────────────────────────

  startEditing(): void {
    if (!this.question) return;
    this.editQuestionText = this.question.questionText;
    this.editAnswer = `${this.question.answer ?? ''}`;
    this.editAnswerAssetId = this.question.answerAssetId ?? '';
    this.editExplanation = this.question.explanation || '';
    this.editSteps = this.question.stepByStepSolution
      ? [...this.question.stepByStepSolution]
      : [];
    this.editSubCategories = this.question.subCategories
      ? [...this.question.subCategories]
      : [];
    this.editDifficulty = this.normalizeDifficulty(
      this.question.metadata.difficulty
    );
    this.editInitialVisualSelections = this.toEditableVisualSelections(
      this.question
    );
    this.editVisualSelections = [...this.editInitialVisualSelections];
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.editQuestionText = '';
    this.editAnswer = '';
    this.editAnswerAssetId = '';
    this.editExplanation = '';
    this.editSteps = [];
    this.editSubCategories = [];
    this.editDifficulty = 'medium';
    this.editInitialVisualSelections = [];
    this.editVisualSelections = [];
  }

  saveEdits(): void {
    if (!this.question) return;
    this.isSaving = true;
    this.error = null;
    this.authService.updateQuestion(this.questionId, this.buildUpdatePayload()).subscribe({
      next: () => {
        this.success = 'Question updated. Status reset to pending for re-review.';
        this.isSaving = false;
        this.isEditing = false;
        this.loadQuestion();
      },
      error: () => {
        this.error = 'Failed to save changes.';
        this.isSaving = false;
      },
    });
  }

  /** Saves the current edits, then approves and re-indexes the question in one step. */
  saveAndApprove(): void {
    if (!this.question) return;
    if (!confirm('Save changes and approve this question?')) return;
    this.isSaving = true;
    this.error = null;
    this.authService
      .updateQuestion(this.questionId, this.buildUpdatePayload())
      .pipe(switchMap(() => this.authService.reviewQuestion(this.questionId, 'approved')))
      .subscribe({
        next: () => {
          this.success =
            'Question updated, approved, and indexed successfully.';
          this.isSaving = false;
          this.isEditing = false;
          this.loadQuestion();
        },
        error: (err) => {
          this.error =
            err?.error?.message ||
            err?.error?.error ||
            'Question was saved, but approval and indexing failed.';
          this.isSaving = false;
        },
      });
  }

  addStep(): void {
    this.editSteps.push('');
  }

  removeStep(index: number): void {
    this.editSteps.splice(index, 1);
  }

  moveStep(index: number, direction: 'up' | 'down'): void {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= this.editSteps.length) return;
    const temp = this.editSteps[index];
    this.editSteps[index] = this.editSteps[newIndex];
    this.editSteps[newIndex] = temp;
  }

  updateStep(index: number, value: string): void {
    this.editSteps[index] = value;
  }

  onEditVisualSelectionChange(selections: PickedVisualSelection[]): void {
    this.editVisualSelections = selections;
  }

  onEditSubCategoriesChange(slugs: string[]): void {
    this.editSubCategories = slugs;
  }

  /**
   * Sub-categories are scoped to (category, difficulty), so a difficulty
   * change invalidates the current selection — clear it rather than risk
   * submitting slugs that don't exist for the newly selected difficulty.
   */
  onEditDifficultyChange(): void {
    this.editSubCategories = [];
  }

  private normalizeDifficulty(
    difficulty: string | undefined
  ): 'easy' | 'medium' | 'hard' {
    return difficulty === 'easy' || difficulty === 'hard'
      ? difficulty
      : 'medium';
  }

  private buildUpdatePayload() {
    if (!this.question) {
      throw new Error('No question loaded');
    }
    return {
      questionText: this.editQuestionText,
      answer: this.toAnswerValue(this.editAnswer),
      answerAssetId: this.editAnswerAssetId.trim() || undefined,
      explanation: this.editExplanation,
      stepByStepSolution: this.editSteps,
      subCategories: this.editSubCategories,
      difficulty: this.editDifficulty,
      visualSelections: this.editVisualSelections.map((selection) => ({
        assetId: selection.assetId,
        role: selection.role,
        placement: selection.placement,
        render: selection.render,
        layout: selection.layout,
      })),
      visualLayout: this.question.visualLayout,
    };
  }

  backToQueue(): void {
    this.router.navigate(['/review']);
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  trackByIndex(index: number): number {
    return index;
  }

  visualPreviewItems(
    question: QuestionItem
  ): Array<QuestionVisual | PickedVisualSelection> {
    if (this.isEditing) {
      return this.editVisualSelections;
    }
    return question.visuals ?? [];
  }

  trackVisualPreview(
    index: number,
    visual: QuestionVisual | PickedVisualSelection
  ): string {
    if ('selectionId' in visual) {
      return visual.selectionId;
    }
    return `${visual.assetId}-${index}`;
  }

  isGridVisualLayout(question: QuestionItem): boolean {
    return question.visualLayout?.container === 'grid';
  }

  visualGridTemplateColumns(question: QuestionItem): string | null {
    if (!this.isGridVisualLayout(question)) {
      return null;
    }

    const columns = question.visualLayout?.columns ?? 1;
    return `repeat(${columns}, minmax(88px, 1fr))`;
  }

  visualWidthStyle(visual: QuestionVisual): string | null {
    if (visual.render?.width != null) {
      return `${visual.render.width}px`;
    }
    if (visual.render?.height != null) {
      return 'auto';
    }
    return null;
  }

  visualHeightStyle(visual: QuestionVisual): string | null {
    if (visual.render?.height != null) {
      return `${visual.render.height}px`;
    }
    if (visual.render?.width != null) {
      return 'auto';
    }
    return null;
  }

  private toEditableVisualSelections(
    question: QuestionItem
  ): PickedVisualSelection[] {
    const selections =
      question.visualSelections && question.visualSelections.length > 0
        ? question.visualSelections
        : (question.visuals ?? []).map((visual) => ({
            assetId: visual.assetId,
            role: visual.role,
            placement: visual.placement,
            render: visual.render,
            layout: visual.layout,
          }));

    const visualByAssetId = new Map(
      (question.visuals ?? []).map((visual) => [visual.assetId, visual])
    );

    return selections.map((selection, index) => {
      const visual = visualByAssetId.get(selection.assetId);
      return {
        selectionId: `${selection.assetId}-${index}`,
        assetId: selection.assetId,
        role: selection.role,
        placement: selection.placement,
        render: selection.render,
        layout: selection.layout,
        svgPath: visual?.svgPath,
        displayName: selection.assetId,
      };
    });
  }

  private toAnswerValue(value: string): number | string {
    const trimmed = value.trim();
    const asNumber = Number(trimmed);
    return trimmed !== '' && !Number.isNaN(asNumber) ? asNumber : trimmed;
  }
}
