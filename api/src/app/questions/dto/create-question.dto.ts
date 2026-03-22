import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionFormat } from '../schemas/question.schema';

/**
 * Nested metadata DTO for question creation requests.
 */
export class CreateQuestionMetadataDto {
  /** LLM model identifier (e.g. 'llama3.1:latest') */
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
  @IsNumber()
  answer: number;

  /** Detailed explanation of the solution */
  @IsOptional()
  @IsString()
  explanation?: string;

  /** Grade level (3–8) */
  @IsNumber()
  @Min(3)
  @Max(8)
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
  @IsString({ each: true })
  options?: string[];

  /** Step-by-step solution explanation strings */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stepByStepSolution?: string[];

  /** AI generation metadata */
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateQuestionMetadataDto)
  metadata?: CreateQuestionMetadataDto;
}
