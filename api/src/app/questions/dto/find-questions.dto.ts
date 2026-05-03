import {
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionStatus, QuestionFormat } from '../schemas/question.schema';

export enum PersistedQuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

/**
 * DTO for querying persisted questions with optional filters and pagination.
 * All fields are optional — omitting a field means no filter on that dimension.
 *
 * @example
 * ```
 * GET /api/questions?grade=5&topic=FRACTION_OPERATIONS&status=approved&page=1&limit=20
 * ```
 */
export class FindQuestionsDto {
  /**
   * Filter by grade level (3–8).
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(3)
  @Max(8)
  grade?: number;

  /**
   * Filter by curriculum topic key (e.g. 'ADDITION', 'FRACTION_OPERATIONS').
   */
  @IsOptional()
  @IsString()
  topic?: string;

  /**
   * Filter by review status (pending, approved, rejected).
   */
  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;

  /**
   * Filter by question format (open-ended, multiple-choice).
   */
  @IsOptional()
  @IsEnum(QuestionFormat)
  format?: QuestionFormat;

  /**
   * Filter by stored difficulty metadata (easy, medium, hard).
   */
  @IsOptional()
  @IsEnum(PersistedQuestionDifficulty)
  difficulty?: PersistedQuestionDifficulty;

  /**
   * Page number for pagination (1-based, default: 1).
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  /**
   * Maximum results per page (default: 20, max: 100).
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
