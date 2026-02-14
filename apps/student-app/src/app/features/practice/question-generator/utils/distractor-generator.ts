/**
 * Frontend utility for generating plausible multiple-choice distractors
 * from a known correct numerical answer.
 *
 * Used when the backend does not provide answer options and the
 * frontend `answerType` is set to `'multiple-choice'`.
 */

/**
 * Generates an array of multiple-choice option strings including
 * the correct answer and plausible wrong answers (distractors).
 *
 * Distractors are generated close to the correct answer to be
 * educationally plausible. The correct answer position is randomised.
 *
 * @param correctAnswer - The correct numerical answer
 * @param totalOptions  - Total number of options to produce (default 4)
 * @returns Shuffled array of numeric string options (e.g. ['8','10','11','9'])
 *
 * @example
 * ```typescript
 * const options = generateDistractors(10);
 * // ['8', '10', '12', '11'] — 4 shuffled options including correct answer
 * ```
 */
export function generateDistractors(
  correctAnswer: number,
  totalOptions: number = 4
): string[] {
  const distractorCount = totalOptions - 1;
  const distractors = new Set<number>();

  // Determine offset range based on answer magnitude
  const maxOffset = correctAnswer <= 10 ? 5 : 10;

  let attempts = 0;
  const maxAttempts = 100;

  while (distractors.size < distractorCount && attempts < maxAttempts) {
    // Random offset between 1 and maxOffset (never 0 — that's the correct answer)
    const offset = Math.floor(Math.random() * maxOffset) + 1;
    // Randomly add or subtract
    const candidate =
      Math.random() < 0.5 ? correctAnswer + offset : correctAnswer - offset;

    // No negatives, no duplicates, not equal to correct answer
    if (candidate >= 0 && candidate !== correctAnswer) {
      distractors.add(candidate);
    }
    attempts++;
  }

  // Fallback: if we couldn't generate enough (e.g. answer=0), pad upward
  let pad = 1;
  while (distractors.size < distractorCount) {
    const candidate = correctAnswer + pad;
    if (!distractors.has(candidate)) {
      distractors.add(candidate);
    }
    pad++;
  }

  const options = [String(correctAnswer), ...[...distractors].map(String)];

  // Fisher-Yates shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return options;
}
