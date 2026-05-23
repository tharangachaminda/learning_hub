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

export interface QuestionVisual {
  /** Stable registry identifier for the visual asset */
  assetId: string;
  /** Rendering role for placement/use in the UI */
  role:
    | 'inline-symbol'
    | 'prompt-illustration'
    | 'answer-option'
    | 'explanation-aid';
  /** Path to a static SVG asset if file-backed */
  svgPath?: string;
  /** Template identifier if generated from parameters */
  templateId?: string;
  /** Optional layout hint for the renderer */
  placement?: 'before-question' | 'after-question' | 'inline' | 'explanation';
  /** Optional render sizing override for the image */
  render?: {
    width?: number;
    height?: number;
  };
  layout?: {
    row?: number;
    column?: number;
  };
}

export interface QuestionVisualSelection {
  assetId: string;
  role:
    | 'inline-symbol'
    | 'prompt-illustration'
    | 'answer-option'
    | 'explanation-aid';
  placement?: 'before-question' | 'after-question' | 'inline' | 'explanation';
  render?: {
    width?: number;
    height?: number;
  };
  layout?: {
    row?: number;
    column?: number;
  };
}

export interface QuestionVisualContainerLayout {
  container?: 'grid';
  rows?: number;
  columns?: number;
}

export interface QuestionAnswerOption {
  value: string;
  assetId?: string;
  svgPath?: string;
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
  /** Correct answer value */
  answer: number | string;
  /** Optional visual asset id for the correct answer when it is image-based */
  answerAssetId?: string;
  /** Age-appropriate explanation (used for hints) */
  explanation: string;
  /** Ordered visual selection sequence returned by the backend */
  visualSelections?: QuestionVisualSelection[];
  /** Optional structured visuals associated with the question */
  visuals?: QuestionVisual[];
  /** Optional shared layout metadata for the question visual container */
  visualLayout?: QuestionVisualContainerLayout;
  /** Explicit multiple-choice options, including visual answer options */
  options?: QuestionAnswerOption[];
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
