import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';

/**
 * Presentation component for question navigation and progress tracking.
 *
 * Renders Previous/Next buttons, compact question jump buttons, and a progress bar.
 * Navigation events are emitted to the parent container.
 *
 * @example
 * ```html
 * <app-question-pagination
 *   [currentIndex]="currentIndex()"
 *   [totalQuestions]="questions().length"
 *   [progressPercent]="progressPercent()"
 *   [totalAnswered]="totalAnswered()"
 *   (previous)="goToPrevious()"
 *   (next)="goToNext()"
 * />
 * ```
 */
@Component({
  selector: 'app-question-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './question-pagination.html',
  styleUrl: './question-pagination.css',
})
export class QuestionPaginationComponent {
  /** 0-based index of the current question. */
  readonly currentIndex = input.required<number>();

  /** Total number of questions in the set. */
  readonly totalQuestions = input.required<number>();

  /** Current progress percentage (0–100). */
  readonly progressPercent = input.required<number>();

  /** Number of questions answered so far. */
  readonly totalAnswered = input<number>(0);

  /** Question indexes that have meaningful input. */
  readonly answeredIndexes = input<number[]>([]);

  /** Emitted when the student clicks Previous. */
  readonly previous = output<void>();

  /** Emitted when the student clicks Next. */
  readonly next = output<void>();

  /** Emitted when the student jumps directly to a question. */
  readonly questionSelected = output<number>();

  /**
   * Emits the previous navigation event.
   */
  onPrevious(): void {
    this.previous.emit();
  }

  /**
   * Emits the next navigation event.
   */
  onNext(): void {
    this.next.emit();
  }

  onSelectQuestion(index: number): void {
    this.questionSelected.emit(index);
  }

  questionIndexes(): number[] {
    return Array.from({ length: this.totalQuestions() }, (_, index) => index);
  }

  isAnswered(index: number): boolean {
    return this.answeredIndexes().includes(index);
  }
}
