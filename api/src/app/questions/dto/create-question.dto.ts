import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
  ValidateIf,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  QuestionFormat,
  QuestionVisualPlacement,
  QuestionVisualRole,
} from '../schemas/question.schema';

/**
 * Nested metadata DTO for question creation requests.
 */
export class CreateQuestionMetadataDto {
  /** LLM model identifier (e.g. 'falcon3:latest'); omitted for manually authored questions */
  @IsOptional()
  @IsString()
  generatedBy?: string;

  /** Generation time in milliseconds */
  @IsOptional()
  @IsNumber()
  generationTime?: number;

  /** Difficulty descriptor (e.g. 'easy', 'medium', 'hard') */
  @IsOptional()
  @IsString()
  difficulty?: string;

  /** Country code for curriculum context (e.g. 'NZ') */
  @IsOptional()
  @IsString()
  country?: string;
}

/** Optional render dimensions for a requested visual selection. */
export class CreateQuestionVisualRenderDto {
  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;
}

/** Optional grid position for a requested visual selection. */
export class CreateQuestionVisualLayoutPositionDto {
  @IsOptional()
  @IsNumber()
  row?: number;

  @IsOptional()
  @IsNumber()
  column?: number;
}

/**
 * A visual asset picked from the registry to attach to a manually created
 * question. Resolved server-side against the approved catalog for the
 * question's grade/topic before being persisted as a `QuestionVisual`.
 */
export class CreateQuestionVisualSelectionDto {
  /** Stable registry identifier for the visual asset (e.g. 'pattern.circle.full') */
  @IsString()
  assetId: string;

  @IsEnum(QuestionVisualRole)
  role: QuestionVisualRole;

  @IsOptional()
  @IsEnum(QuestionVisualPlacement)
  placement?: QuestionVisualPlacement;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateQuestionVisualRenderDto)
  render?: CreateQuestionVisualRenderDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateQuestionVisualLayoutPositionDto)
  layout?: CreateQuestionVisualLayoutPositionDto;
}

/** Shared grid container layout hint for a question's attached visuals. */
export class CreateQuestionVisualLayoutDto {
  @IsOptional()
  @IsString()
  container?: 'grid';

  @IsOptional()
  @IsNumber()
  rows?: number;

  @IsOptional()
  @IsNumber()
  columns?: number;
}

export class CreateQuestionOptionDto {
  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsString()
  svgPath?: string;
}

/**
 * DTO for creating a single question via the REST API.
 * Status is always set to `pending` server-side and cannot be overridden.
 *
 * @example
 * ```json
 * {
 *   "questionText": "What is $5 + 3$?",
 *   "answer": 8,
 *   "explanation": "Add five and three.",
 *   "grade": 3,
 *   "topic": "ADDITION",
 *   "format": "open-ended",
 *   "stepByStepSolution": ["Start with 5", "Add 3", "Answer is 8"]
 * }
 * ```
 */
export class CreateQuestionDto {
  /** The question text presented to the student */
  @IsString()
  questionText: string;

  /** The correct answer value */
  @ValidateIf((_obj, value) => typeof value === 'number')
  @IsNumber()
  @ValidateIf((_obj, value) => typeof value === 'string')
  @IsString()
  answer: number | string;

  /** Optional visual asset id for the correct answer when it is image-based */
  @IsOptional()
  @IsString()
  answerAssetId?: string;

  /** Detailed explanation of the solution */
  @IsOptional()
  @IsString()
  explanation?: string;

  /** Grade level (0–10), aligned to the NZ Curriculum */
  @IsNumber()
  @Min(0)
  @Max(10)
  grade: number;

  /** Curriculum topic key (e.g. 'ADDITION') */
  @IsString()
  topic: string;

  /** Curriculum category grouping */
  @IsOptional()
  @IsString()
  category?: string;

  /** Question presentation format */
  @IsOptional()
  @IsEnum(QuestionFormat)
  format?: QuestionFormat;

  /** Answer options for multiple-choice questions */
  @IsOptional()
  @IsArray()
  options?: Array<string | CreateQuestionOptionDto>;

  /** Step-by-step solution explanation strings */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stepByStepSolution?: string[];

  /** Visual assets picked from the registry to attach to this question */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionVisualSelectionDto)
  visualSelections?: CreateQuestionVisualSelectionDto[];

  /** Grid container layout hint for the attached visuals */
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateQuestionVisualLayoutDto)
  visualLayout?: CreateQuestionVisualLayoutDto;

  /** AI generation metadata */
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateQuestionMetadataDto)
  metadata?: CreateQuestionMetadataDto;
}
