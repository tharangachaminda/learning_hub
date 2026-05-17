import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type {
  LLMSelectedVisual,
  QuestionVisual as GeneratedQuestionVisual,
  VisualAssetPlacement,
  VisualAssetRole,
} from '../../ai/schemas';

/**
 * Status values for a stored question in the review workflow.
 * Questions default to `pending` on creation and must be approved
 * before being visible to students.
 *
 * @example
 * ```typescript
 * const status = QuestionStatus.PENDING; // 'pending'
 * ```
 */
export enum QuestionStatus {
  /** Question awaiting review — not yet visible to students */
  PENDING = 'pending',
  /** Question approved by a reviewer — visible to students */
  APPROVED = 'approved',
  /** Question rejected by a reviewer — hidden from students */
  REJECTED = 'rejected',
}

/**
 * Supported question presentation formats.
 *
 * @example
 * ```typescript
 * const format = QuestionFormat.MULTIPLE_CHOICE; // 'multiple-choice'
 * ```
 */
export enum QuestionFormat {
  /** Free-form answer input */
  OPEN_ENDED = 'open-ended',
  /** Multiple-choice with predefined options */
  MULTIPLE_CHOICE = 'multiple-choice',
}

/** Supported roles for structured visual content attached to a question. */
export enum QuestionVisualRole {
  INLINE_SYMBOL = 'inline-symbol',
  PROMPT_ILLUSTRATION = 'prompt-illustration',
  ANSWER_OPTION = 'answer-option',
  EXPLANATION_AID = 'explanation-aid',
}

/** Placement hints for question visuals in the UI. */
export enum QuestionVisualPlacement {
  BEFORE_QUESTION = 'before-question',
  AFTER_QUESTION = 'after-question',
  INLINE = 'inline',
  EXPLANATION = 'explanation',
}

/**
 * Synchronization lifecycle for publishing a stored question to the vector index.
 */
export enum VectorSyncStatus {
  /** Question has not yet been prepared or stored in OpenSearch */
  PENDING = 'pending',
  /** A prepared index payload exists and is ready to be stored */
  PREPARED = 'prepared',
  /** Question has been successfully stored in OpenSearch */
  STORED = 'stored',
  /** The last sync attempt failed and needs attention */
  FAILED = 'failed',
}

/**
 * Embedded metadata sub-document capturing AI generation context.
 * Stored alongside each question to support auditing and analytics.
 */
@Schema({ _id: false })
export class QuestionMetadata {
  /** LLM model identifier used for generation (e.g. 'falcon3:latest') */
  @Prop({ type: String })
  generatedBy: string;

  /** Time taken to generate the question in milliseconds */
  @Prop({ type: Number })
  generationTime: number;

  /** Difficulty descriptor passed to the LLM (e.g. 'easy', 'medium', 'hard') */
  @Prop({ type: String })
  difficulty: string;

  /** Country code for cultural/curriculum context (e.g. 'NZ', 'AU') */
  @Prop({ type: String })
  country: string;

  /** Subject key used for curriculum lookup and filtering */
  @Prop({ type: String })
  subject?: string;

  /** Version of the curriculum criteria artifact used during generation */
  @Prop({ type: String })
  curriculumVersion?: string;

  /** Canonical resolved curriculum topic key used by the prompt engine */
  @Prop({ type: String })
  resolvedTopicKey?: string;

  /** Canonical resolved curriculum topic label used by the prompt engine */
  @Prop({ type: String })
  resolvedTopicLabel?: string;

  /** Curriculum strand resolved for the generated question */
  @Prop({ type: String })
  curriculumStrand?: string;

  /** Phase or year-band grouping from the curriculum artifact */
  @Prop({ type: String })
  curriculumPhase?: string;

  /** Raw requested topic key before canonical curriculum resolution */
  @Prop({ type: String })
  sourceTopicKey?: string;

  /** Whether a deterministic fallback was used instead of AI */
  @Prop({ type: Boolean })
  fallbackUsed?: boolean;

  /** AI validation score between 0 and 1, if available */
  @Prop({ type: Number })
  validationScore?: number;
}

/**
 * Records a single refinement step in the question's review lifecycle.
 */
@Schema({ _id: false })
export class RefinementEntry {
  /** The instruction sent to the LLM for refinement */
  @Prop({ type: String, required: true })
  instruction: string;

  /** The previous version of the question text before refinement */
  @Prop({ type: String })
  previousQuestionText: string;

  /** The previous answer before refinement */
  @Prop({ type: Object })
  previousAnswer: number | string;

  /** The refined question text returned by the LLM */
  @Prop({ type: String })
  refinedQuestionText: string;

  /** The refined answer returned by the LLM */
  @Prop({ type: Object })
  refinedAnswer: number | string;

  /** Who requested the refinement */
  @Prop({ type: String })
  refinedBy: string;

  /** When the refinement occurred */
  @Prop({ type: Date, default: Date.now })
  refinedAt: Date;
}

/**
 * Tracks the vector index sync lifecycle for a stored question.
 */
@Schema({ _id: false })
export class VectorSyncMetadata {
  /** Current lifecycle status for vector index synchronization */
  @Prop({
    type: String,
    enum: Object.values(VectorSyncStatus),
    default: VectorSyncStatus.PENDING,
  })
  status: VectorSyncStatus;

  /** Timestamp when an index payload was prepared */
  @Prop({ type: Date })
  preparedAt?: Date;

  /** Timestamp when the question was successfully stored in OpenSearch */
  @Prop({ type: Date })
  storedAt?: Date;

  /** Identifier of the reviewer who last stored the question in OpenSearch */
  @Prop({ type: String })
  storedBy?: string;

  /** OpenSearch document identifier used for the stored vector record */
  @Prop({ type: String })
  documentId?: string;

  /** Last sync error message, if any */
  @Prop({ type: String })
  syncError?: string;

  /** Content hash used to detect stale vector payloads after edits */
  @Prop({ type: String })
  contentHash?: string;

  /** Embedding model version used for the stored vector payload */
  @Prop({ type: String })
  embeddingModelVersion?: string;
}

/** Structured visual content associated with a question. */
@Schema({ _id: false })
export class QuestionVisual implements GeneratedQuestionVisual {
  /** Stable registry identifier for the visual asset */
  @Prop({ type: String, required: true })
  assetId: string;

  /** How the frontend should use the visual */
  @Prop({
    type: String,
    enum: Object.values(QuestionVisualRole),
    required: true,
  })
  role: VisualAssetRole;

  /** Path to a static SVG asset when the visual is file-backed */
  @Prop({ type: String })
  svgPath?: string;

  /** Template identifier when the visual is generated from parameters */
  @Prop({ type: String })
  templateId?: string;

  /** Optional placement hint for the frontend */
  @Prop({
    type: String,
    enum: Object.values(QuestionVisualPlacement),
  })
  placement?: VisualAssetPlacement;
}

@Schema({ _id: false })
export class QuestionVisualSelection implements LLMSelectedVisual {
  @Prop({ type: String, required: true })
  assetId: string;

  @Prop({
    type: String,
    enum: Object.values(QuestionVisualRole),
    required: true,
  })
  role: VisualAssetRole;

  @Prop({
    type: String,
    enum: Object.values(QuestionVisualPlacement),
  })
  placement?: VisualAssetPlacement;
}

/** Mongoose hydrated document type for the Question schema */
export type QuestionDocument = HydratedDocument<Question>;

/**
 * Mongoose schema for the `questions` collection.
 *
 * Stores AI-generated mathematical questions with full metadata,
 * review status, and curriculum alignment data. Supports duplicate
 * detection via a compound unique index on (questionText, grade, topic)
 * and fast filtered queries via individual indexes on grade, topic,
 * status, format, and metadata.difficulty (REQ-QG-022).
 *
 * @example
 * ```typescript
 * import { MongooseModule } from '@nestjs/mongoose';
 * import { Question, QuestionSchema } from './question.schema';
 *
 * MongooseModule.forFeature([{ name: Question.name, schema: QuestionSchema }]);
 * ```
 */
@Schema({ collection: 'questions', timestamps: true })
export class Question {
  /**
   * The question text presented to the student.
   * May contain LaTeX markup wrapped in `$...$` delimiters.
   */
  @Prop({ required: true, type: String })
  questionText: string;

  /**
   * The correct answer value.
   * Stored as `Mixed` to support numeric and string answers.
   */
  @Prop({ required: true, type: Object })
  answer: number | string;

  /** Detailed explanation of the solution approach */
  @Prop({ type: String })
  explanation: string;

  /**
   * Grade level (3–8) aligned to the NZ Curriculum.
   */
  @Prop({ required: true, type: Number })
  grade: number;

  /**
   * Curriculum topic key from GRADE_TOPICS
   * (e.g. 'ADDITION', 'FRACTION_OPERATIONS', 'ALGEBRAIC_EQUATIONS').
   */
  @Prop({ required: true, type: String })
  topic: string;

  /**
   * Curriculum category grouping
   * (e.g. 'number-operations', 'algebra-patterns').
   */
  @Prop({ type: String })
  category: string;

  /**
   * Presentation format of the question.
   * Defaults to `open-ended`.
   */
  @Prop({
    type: String,
    enum: Object.values(QuestionFormat),
    default: QuestionFormat.OPEN_ENDED,
  })
  format: QuestionFormat;

  /**
   * Answer options for multiple-choice questions.
   * Empty array for open-ended questions.
   */
  @Prop({ type: [String], default: [] })
  options: string[];

  /**
   * Review workflow status. Defaults to `pending`.
   * Students only see `approved` questions.
   */
  @Prop({
    type: String,
    enum: Object.values(QuestionStatus),
    default: QuestionStatus.PENDING,
  })
  status: QuestionStatus;

  /**
   * Ordered array of step-by-step solution explanation strings.
   */
  @Prop({ type: [String], default: [] })
  stepByStepSolution: string[];

  /** Ordered visual selection sequence supplied by the LLM. */
  @Prop({ type: [QuestionVisualSelection], default: [] })
  visualSelections: QuestionVisualSelection[];

  /** Structured SVG-backed visuals associated with the question. */
  @Prop({ type: [QuestionVisual], default: [] })
  visuals: QuestionVisual[];

  /**
   * AI generation metadata including model, timing, and quality info.
   */
  @Prop({ type: QuestionMetadata })
  metadata: QuestionMetadata;

  /** Identifier of the staff user who generated the question */
  @Prop({ type: String })
  generatedByUser: string;

  /** Identifier of the reviewer who approved/rejected the question */
  @Prop({ type: String })
  reviewedBy: string;

  /** Timestamp when the question was reviewed */
  @Prop({ type: Date })
  reviewedAt: Date;

  /** Optional notes from the reviewer explaining the decision */
  @Prop({ type: String })
  reviewNotes: string;

  /** History of LLM refinement steps applied to this question */
  @Prop({ type: [RefinementEntry], default: [] })
  refinementHistory: RefinementEntry[];

  /** Vector index synchronization metadata for OpenSearch storage */
  @Prop({
    type: VectorSyncMetadata,
    default: () => ({ status: VectorSyncStatus.PENDING }),
  })
  vectorSync: VectorSyncMetadata;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

/*
 * ── Indexes (REQ-QG-022) ──────────────────────────────────────────────
 *
 * Compound unique index for duplicate detection (AC-004):
 *   Same questionText + grade + topic → duplicate.
 *
 * Individual indexes for fast filtered queries (AC-005):
 *   GET /questions?grade=5&topic=FRACTION_OPERATIONS&status=approved&format=open-ended
 */
QuestionSchema.index({ questionText: 1, grade: 1, topic: 1 }, { unique: true });
QuestionSchema.index({ grade: 1 });
QuestionSchema.index({ topic: 1 });
QuestionSchema.index({ status: 1 });
QuestionSchema.index({ generatedByUser: 1 });
QuestionSchema.index({ reviewedBy: 1 });
QuestionSchema.index({ format: 1 });
QuestionSchema.index({ 'metadata.difficulty': 1 });
QuestionSchema.index({ 'metadata.subject': 1 });
QuestionSchema.index({ 'metadata.curriculumVersion': 1 });
QuestionSchema.index({ 'metadata.resolvedTopicKey': 1 });
QuestionSchema.index({ 'metadata.curriculumStrand': 1 });
QuestionSchema.index({ 'vectorSync.status': 1 });
QuestionSchema.index({ 'vectorSync.documentId': 1 }, { sparse: true });
