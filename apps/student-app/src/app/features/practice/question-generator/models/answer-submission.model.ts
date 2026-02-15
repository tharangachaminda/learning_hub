/**
 * Answer submission and scoring models for the AI Question Generator.
 *
 * These interfaces define the shape of data assembled when a student
 * submits answers and the scoring result computed client-side.
 */

import { StudentAnswer } from './student-answer.model';

/**
 * Data assembled when the student submits all answers at the end
 * of a question session. Prepared for future server-side persistence.
 *
 * @example
 * ```typescript
 * const submission: AnswerSubmission = {
 *   generationParams: { grade: 3, topic: 'ADDITION', category: 'number-operations', difficulty: 'easy', country: 'NZ' },
 *   answers: [{ questionIndex: 0, selectedOption: 'B', hintUsed: false, timeSpent: 30 }],
 *   totalTimeSpent: 120,
 *   submittedAt: '2026-02-14T10:00:00.000Z',
 * };
 * ```
 */
export interface AnswerSubmission {
  /** Generation parameters used to create the question set. */
  generationParams: {
    grade: number;
    topic: string;
    category: string;
    difficulty: string;
    country: string;
  };
  /** Array of student answers, one per question attempted. */
  answers: StudentAnswer[];
  /** Total session time in seconds. */
  totalTimeSpent: number;
  /** ISO 8601 timestamp when submission occurred. */
  submittedAt: string;
}

/**
 * Result of client-side scoring after answer submission.
 *
 * @example
 * ```typescript
 * const result: ScoringResult = {
 *   correct: 7,
 *   incorrect: 2,
 *   skipped: 1,
 *   total: 10,
 *   percentage: 70,
 *   timeSpent: '02:30',
 * };
 * ```
 */
export interface ScoringResult {
  /** Number of correctly answered questions. */
  correct: number;
  /** Number of incorrectly answered questions. */
  incorrect: number;
  /** Number of unanswered (skipped) questions. */
  skipped: number;
  /** Total number of questions in the set. */
  total: number;
  /** Percentage score (0–100). */
  percentage: number;
  /** Total time spent formatted as "mm:ss". */
  timeSpent: string;
}
