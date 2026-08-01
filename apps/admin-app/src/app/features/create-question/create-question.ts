import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  AuthService,
  CreateQuestionRequest,
  GradeInfo,
  GradeTopic,
  QuestionAnswerOption,
  QuestionItem,
} from '../../services/auth.service';
import { KatexRenderComponent } from '../../shared/katex-render/katex-render';
import { LatexEditorComponent } from '../../shared/latex-editor/latex-editor';
import {
  PickedVisualSelection,
  VisualPickerComponent,
} from '../../shared/visual-picker/visual-picker';

/**
 * Manual "Question Creator" for admins/teachers: authors a single question
 * (no LLM involved), optionally attaches visuals from the existing image
 * library, and submits it as `pending` into the same review/approval and
 * vector-indexing pipeline used by AI-generated questions.
 */
@Component({
  selector: 'app-create-question',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    KatexRenderComponent,
    LatexEditorComponent,
    VisualPickerComponent,
  ],
  templateUrl: './create-question.html',
  styleUrl: './create-question.scss',
})
export class CreateQuestionComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  grades: GradeInfo[] = [];
  availableTopics: GradeTopic[] = [];
  isLoadingCurriculum = true;
  isSubmitting = false;
  error: string | null = null;
  created: QuestionItem | null = null;

  selectedGrade: number | null = null;
  selectedTopic = '';
  format: 'open-ended' | 'multiple-choice' = 'open-ended';
  difficulty: 'easy' | 'medium' | 'hard' = 'medium';

  questionText = '';
  answer = '';
  answerAssetId = '';
  explanation = '';
  steps: string[] = [];
  options: QuestionAnswerOption[] = [];
  visualSelections: PickedVisualSelection[] = [];

  get canSubmit(): boolean {
    return (
      this.selectedGrade !== null &&
      this.selectedTopic !== '' &&
      this.questionText.trim() !== '' &&
      this.answer.trim() !== '' &&
      !this.isSubmitting
    );
  }

  ngOnInit(): void {
    this.authService.getCurriculum().subscribe({
      next: (data) => {
        this.grades = data.grades;
        this.isLoadingCurriculum = false;
      },
      error: () => {
        this.error = 'Failed to load curriculum data.';
        this.isLoadingCurriculum = false;
      },
    });
  }

  onGradeChange(): void {
    const grade = this.grades.find((g) => g.grade === this.selectedGrade);
    this.availableTopics = grade?.topics ?? [];
    this.selectedTopic = '';
  }

  onVisualSelectionChange(selections: PickedVisualSelection[]): void {
    this.visualSelections = selections;
  }

  addStep(): void {
    this.steps.push('');
  }

  removeStep(index: number): void {
    this.steps.splice(index, 1);
  }

  moveStep(index: number, direction: 'up' | 'down'): void {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= this.steps.length) return;
    const temp = this.steps[index];
    this.steps[index] = this.steps[newIndex];
    this.steps[newIndex] = temp;
  }

  addOption(): void {
    this.options.push({ value: '' });
  }

  removeOption(index: number): void {
    this.options.splice(index, 1);
  }

  submit(): void {
    if (!this.canSubmit || this.selectedGrade === null) return;

    this.isSubmitting = true;
    this.error = null;
    this.created = null;

    const request: CreateQuestionRequest = {
      questionText: this.questionText.trim(),
      answer: this.toAnswerValue(this.answer),
      answerAssetId: this.answerAssetId.trim() || undefined,
      explanation: this.explanation.trim() || undefined,
      grade: this.selectedGrade,
      topic: this.selectedTopic,
      format: this.format,
      options:
        this.format === 'multiple-choice'
          ? this.options.filter((o) => o.value.trim() !== '')
          : [],
      stepByStepSolution: this.steps.filter((s) => s.trim() !== ''),
      visualSelections: this.visualSelections,
      metadata: {
        difficulty: this.difficulty,
        country: 'NZ',
      },
    };

    this.authService.createQuestion(request).subscribe({
      next: (question) => {
        this.created = question;
        this.isSubmitting = false;
      },
      error: (err) => {
        this.error =
          err?.status === 409
            ? 'A question with the same text, grade, and topic already exists.'
            : err?.error?.message ||
              err?.error?.error ||
              'Failed to create the question.';
        this.isSubmitting = false;
      },
    });
  }

  createAnother(): void {
    this.created = null;
    this.questionText = '';
    this.answer = '';
    this.answerAssetId = '';
    this.explanation = '';
    this.steps = [];
    this.options = [];
    this.visualSelections = [];
    this.error = null;
  }

  goToReview(): void {
    if (this.created) {
      this.router.navigate(['/review', this.created._id]);
    }
  }

  private toAnswerValue(value: string): number | string {
    const trimmed = value.trim();
    const asNumber = Number(trimmed);
    return trimmed !== '' && !Number.isNaN(asNumber) ? asNumber : trimmed;
  }
}
