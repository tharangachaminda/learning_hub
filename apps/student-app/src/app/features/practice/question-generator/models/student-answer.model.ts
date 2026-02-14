/**
 * Student answer model for tracking responses to AI-generated questions.
 *
 * Captures the student's selected option, notes, hint usage,
 * and time spent per question during Phase 2 of the AI Question Generator.
 *
 * @example
 * ```typescript
 * const answer: StudentAnswer = {
 *   questionIndex: 0,
 *   selectedOption: 'B',
 *   additionalNotes: 'I used estimation to narrow down.',
 *   hintUsed: false,
 *   timeSpent: 45,
 * };
 * ```
 */
export interface StudentAnswer {
  /** 0-based index of the question in the generated question list. */
  questionIndex: number;

  /** Selected multiple-choice option: 'A' | 'B' | 'C' | 'D'. */
  selectedOption?: string;

  /** Free-text notes entered by the student (max 500 characters). */
  additionalNotes?: string;

  /** Whether the student revealed the hint for this question. */
  hintUsed: boolean;

  /** Cumulative seconds the student spent viewing this question. */
  timeSpent: number;
}
