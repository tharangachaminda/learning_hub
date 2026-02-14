/**
 * Question model for AI-generated questions.
 *
 * Mirrors the backend `GeneratedQuestionSchema` from `api/src/app/ai/schemas.ts`
 * for frontend type safety.
 */

/**
 * Metadata attached to each AI-generated question.
 *
 * @example
 * ```typescript
 * const meta: QuestionMetadata = {
 *   grade: 3,
 *   topic: 'ADDITION',
 *   difficulty: 'easy',
 *   country: 'NZ',
 *   generated_by: 'ollama',
 *   generation_time: 450,
 * };
 * ```
 */
export interface QuestionMetadata {
  /** Grade level (1–12) */
  grade: number;
  /** Topic key (e.g. 'ADDITION') */
  topic: string;
  /** Difficulty level */
  difficulty: string;
  /** Country code */
  country: string;
  /** Generation source: 'ollama' or 'deterministic' */
  generated_by: string;
  /** Time taken to generate in milliseconds */
  generation_time: number;
  /** Whether deterministic fallback was used */
  fallback_used?: boolean;
  /** Accuracy confidence score (0–1) */
  validation_score?: number;
}

/**
 * A single AI-generated question returned from the API.
 *
 * @example
 * ```typescript
 * const question: GeneratedQuestion = {
 *   question: 'What is 5 + 3?',
 *   answer: 8,
 *   explanation: 'Add 5 and 3 together to get 8.',
 *   metadata: { grade: 3, topic: 'ADDITION', difficulty: 'easy', country: 'NZ', generated_by: 'ollama', generation_time: 400 },
 * };
 * ```
 */
export interface GeneratedQuestion {
  /** Question text — may contain LaTeX */
  question: string;
  /** Correct numerical answer */
  answer: number;
  /** Age-appropriate explanation (used for hints) */
  explanation: string;
  /** Generation metadata */
  metadata: QuestionMetadata;
}

/**
 * API health check response shape.
 *
 * @example
 * ```typescript
 * const health: HealthCheckResponse = { status: 'ok', capabilities: { ollama: true } };
 * ```
 */
export interface HealthCheckResponse {
  /** Overall status */
  status: string;
  /** Backend capabilities */
  capabilities?: Record<string, boolean>;
}
