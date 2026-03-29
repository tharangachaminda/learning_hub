import {
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { QuestionFormat } from '../schemas/question.schema';

/**
 * DTO for batch question generation and persistence.
 * Triggers AI generation for the specified grade/topic and stores all results.
 *
 * @example
 * ```json
 * {
 *   "grade": 4,
 *   "topic": "MULTIPLICATION",
 *   "count": 10,
 *   "format": "open-ended"
 * }
 * ```
 */
export class BatchGenerateQuestionsDto {
  /** Grade level for generation (3–8) */
  @IsNumber()
  @Min(3)
  @Max(8)
  grade: number;

  /** Curriculum topic key (e.g. 'MULTIPLICATION') */
  @IsString()
  topic: string;

  /** Number of questions to generate (1–50, default: 10) */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  count?: number;

  /** Desired question format */
  @IsOptional()
  @IsEnum(QuestionFormat)
  format?: QuestionFormat;

  /** Within-grade difficulty: easy, medium, or hard (default: medium) */
  @IsOptional()
  @IsString()
  difficulty?: 'easy' | 'medium' | 'hard';
}
