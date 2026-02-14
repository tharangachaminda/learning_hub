/**
 * Generation parameters model for AI Question Generator controls.
 *
 * Defines the shape of the parameters collected from the
 * generation controls form (Phase 1) and sent to the API.
 */

/**
 * Parameters collected from the generation controls form.
 *
 * @example
 * ```typescript
 * const params: GenerationParams = {
 *   grade: 3,
 *   topic: 'ADDITION',
 *   difficulty: 'easy',
 *   count: 10,
 *   country: 'NZ',
 * };
 * ```
 */
export interface GenerationParams {
  /** Student grade level (3–8) */
  grade: number;
  /** Topic key from GRADE_TOPICS (e.g. 'ADDITION') */
  topic: string;
  /** Difficulty level: easy, medium, or hard */
  difficulty: 'easy' | 'medium' | 'hard';
  /** Number of questions to generate (5–25, step 5) */
  count: number;
  /** Country code for curriculum context (hidden from student) */
  country: string;
}
