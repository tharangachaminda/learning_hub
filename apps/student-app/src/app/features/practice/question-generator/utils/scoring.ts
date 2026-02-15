/**
 * Client-side scoring utility for the AI Question Generator.
 *
 * Compares student answers against correct answers from generated questions
 * and produces a ScoringResult with correct/incorrect/skipped counts.
 */

import { GeneratedQuestion } from '../models/question.model';
import { StudentAnswer } from '../models/student-answer.model';
import { ScoringResult } from '../models/answer-submission.model';

/**
 * Formats a duration in seconds as a "mm:ss" string.
 *
 * @param totalSeconds - The total number of seconds to format
 * @returns Formatted time string in "mm:ss" format
 *
 * @example
 * ```typescript
 * formatTime(150); // '02:30'
 * formatTime(65);  // '01:05'
 * formatTime(0);   // '00:00'
 * ```
 */
export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}`;
}

/**
 * Scores student answers against the generated questions.
 *
 * When `questionOptions` is provided, option letters ('A','B','C','D')
 * in `selectedOption` are resolved to the actual option value at that
 * index before comparing against the correct answer. Without options,
 * `selectedOption` is compared directly as a value string.
 *
 * @param questions - The generated questions with correct answers
 * @param answers - Map of student answers keyed by question index
 * @param totalTimeSeconds - Total session time in seconds
 * @param questionOptions - Optional map of question index → option strings for letter resolution
 * @returns ScoringResult with counts, percentage, and formatted time
 *
 * @example
 * ```typescript
 * const result = scoreAnswers(questions, answersMap, 120, optionsMap);
 * // { correct: 7, incorrect: 2, skipped: 1, total: 10, percentage: 70, timeSpent: '02:00' }
 * ```
 */
export function scoreAnswers(
  questions: GeneratedQuestion[],
  answers: Map<number, StudentAnswer>,
  totalTimeSeconds: number,
  questionOptions?: Map<number, string[]>
): ScoringResult {
  const total = questions.length;
  let correct = 0;
  let incorrect = 0;
  let skipped = 0;

  /** Letter-to-index mapping for resolving option letters. */
  const letterIndex: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

  for (let i = 0; i < total; i++) {
    const answer = answers.get(i);
    if (!answer || !answer.selectedOption) {
      skipped++;
    } else {
      // Resolve selectedOption: if it's a letter and we have options, map to actual value
      let resolvedValue = answer.selectedOption;
      if (questionOptions) {
        const options = questionOptions.get(i);
        const idx = letterIndex[answer.selectedOption];
        if (options && idx !== undefined && idx < options.length) {
          resolvedValue = options[idx];
        }
      }

      if (resolvedValue === String(questions[i].answer)) {
        correct++;
      } else {
        incorrect++;
      }
    }
  }

  const percentage = total > 0 ? (correct / total) * 100 : 0;

  return {
    correct,
    incorrect,
    skipped,
    total,
    percentage,
    timeSpent: formatTime(totalTimeSeconds),
  };
}
