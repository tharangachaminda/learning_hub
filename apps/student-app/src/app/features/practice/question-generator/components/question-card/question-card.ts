import {
  Component,
  input,
  output,
  signal,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { GeneratedQuestion } from '../../models/question.model';
import { KatexRenderComponent } from '../katex-render/katex-render';

/**
 * Presentation component that renders a single AI-generated question card.
 *
 * Displays the question counter, difficulty badge, question text with
 * LaTeX rendering, multiple-choice options in a 2×2 grid, and serves
 * as the container for notes and hints.
 *
 * @example
 * ```html
 * <app-question-card
 *   [question]="currentQuestion()"
 *   [questionNumber]="currentIndex() + 1"
 *   [totalQuestions]="questions().length"
 *   [options]="['$\\frac{5}{4}$', '$\\frac{7}{4}$', '$\\frac{1}{4}$', '$\\frac{3}{2}$']"
 *   [selectedOption]="'A'"
 *   (optionSelected)="onOptionSelected($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-question-card',
  standalone: true,
  imports: [KatexRenderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './question-card.html',
  styleUrl: './question-card.css',
})
export class QuestionCardComponent {
  /** The generated question to display. */
  readonly question = input.required<GeneratedQuestion>();

  /** 1-based question number (e.g. 3 for "Question 3 of 10"). */
  readonly questionNumber = input.required<number>();

  /** Total number of questions in the set. */
  readonly totalQuestions = input.required<number>();

  /** Multiple-choice option texts (4 options: A, B, C, D). */
  readonly options = input<string[]>([]);

  /** Currently selected option letter ('A'|'B'|'C'|'D'). */
  readonly selectedOption = input<string | undefined>(undefined);

  /** Emitted when the student selects a multiple-choice option. */
  readonly optionSelected = output<string>();

  /** Emitted when the student changes the additional notes text. */
  readonly notesChanged = output<string>();

  /** Emitted when the hint toggle state changes. */
  readonly hintToggled = output<boolean>();

  /** Current character count in the notes textarea. */
  readonly notesLength = signal<number>(0);

  /** Whether the hint panel is currently expanded. */
  readonly showHint = signal<boolean>(false);

  /** Letter labels for options. */
  readonly optionLetters = ['A', 'B', 'C', 'D'];

  /** Maximum character limit for notes textarea. */
  readonly maxNotesLength = 500;

  /** Current notes text (for pre-filling on navigation return). */
  readonly notes = input<string>('');

  /** Whether the hint is pre-expanded (for persistence on navigation return). */
  readonly hintExpanded = input<boolean>(false);

  constructor() {
    // Sync hintExpanded input to showHint signal when it changes
    effect(() => {
      this.showHint.set(this.hintExpanded());
    });
  }
  /**
   * Handles option selection and emits the selected letter.
   *
   * @param letter - The option letter ('A'|'B'|'C'|'D')
   */
  onSelectOption(letter: string): void {
    this.optionSelected.emit(letter);
  }

  /**
   * Handles notes textarea input and emits the changed text.
   *
   * @param event - The input event from the textarea
   */
  onNotesInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.notesLength.set(textarea.value.length);
    this.notesChanged.emit(textarea.value);
  }

  /**
   * Toggles the hint panel expanded/collapsed state.
   * Emits the new state to the parent for persistence.
   */
  onToggleHint(): void {
    const newState = !this.showHint();
    this.showHint.set(newState);
    this.hintToggled.emit(newState);
  }
}
