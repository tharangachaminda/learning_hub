/**
 * Presentation component for the submit confirmation modal
 * and results summary display in the AI Question Generator.
 *
 * Operates in two modes:
 * - `'confirm'`: Shows a confirmation dialog before submission
 * - `'results'`: Shows the scoring results after submission
 *
 * @example
 * ```html
 * <app-submit-summary
 *   [mode]="'confirm'"
 *   [totalAnswered]="7"
 *   [totalQuestions]="10"
 *   (cancel)="onCancel()"
 *   (confirmSubmit)="onConfirmSubmit()"
 * />
 * ```
 */
import { Component, input, output, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ScoringResult } from '../../models/answer-submission.model';

@Component({
  selector: 'app-submit-summary',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './submit-summary.html',
  styleUrl: './submit-summary.css',
})
export class SubmitSummaryComponent {
  /** Display mode: 'confirm' for pre-submit dialog, 'results' for post-submit display. */
  mode = input<'confirm' | 'results'>('confirm');

  /** Number of questions the student answered. */
  totalAnswered = input<number>(0);

  /** Total number of questions in the set. */
  totalQuestions = input<number>(0);

  /** Scoring result — only used in 'results' mode. */
  scoringResult = input<ScoringResult | null>(null);

  /** Emits when the student cancels the confirmation dialog. */
  cancel = output<void>();

  /** Emits when the student confirms submission. */
  confirmSubmit = output<void>();

  /** Emits when the student clicks "Try Again". */
  tryAgain = output<void>();

  /** Emits when the student clicks "Back to Dashboard". */
  backToDashboard = output<void>();

  /**
   * Encouraging text computed from the score percentage.
   * Child-friendly messaging with no shame/blame at any level.
   */
  encouragingText = computed(() => {
    const result = this.scoringResult();
    if (!result) return '';
    if (result.percentage >= 80) {
      return '🎉 Amazing work! You\'re a maths superstar!';
    } else if (result.percentage >= 50) {
      return '👍 Great effort! Keep practising!';
    } else {
      return '💪 Good try! Let\'s practise some more!';
    }
  });

  /**
   * Whether to show celebratory animation (score ≥ 80%).
   */
  showCelebration = computed(() => {
    const result = this.scoringResult();
    return result != null && result.percentage >= 80;
  });

  /**
   * Handles keyboard events on the modal overlay.
   * Closes modal on Escape key.
   *
   * @param event - The keyboard event
   */
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.cancel.emit();
    }
  }
}
