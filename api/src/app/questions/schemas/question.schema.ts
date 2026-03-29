import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

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

/**
 * Embedded metadata sub-document capturing AI generation context.
 * Stored alongside each question to support auditing and analytics.
 */
@Schema({ _id: false })
export class QuestionMetadata {
  /** LLM model identifier used for generation (e.g. 'llama3.1:latest') */
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

/** Mongoose hydrated document type for the Question schema */
export type QuestionDocument = HydratedDocument<Question>;

/**
 * Mongoose schema for the `questions` collection.
 *
 * Stores AI-generated mathematical questions with full metadata,
 * review status, and curriculum alignment data. Supports duplicate
 * detection via a compound unique index on (questionText, grade, topic)
 * and fast filtered queries via individual indexes on grade, topic,
 * status, and format (REQ-QG-022).
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

  /**
   * AI generation metadata including model, timing, and quality info.
   */
  @Prop({ type: QuestionMetadata })
  metadata: QuestionMetadata;

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
QuestionSchema.index({ format: 1 });
