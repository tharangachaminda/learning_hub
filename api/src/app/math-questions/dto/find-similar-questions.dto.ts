import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
} from 'class-validator';
import { OperationType } from '../entities/math-question.entity';

/**
 * DTO for finding similar questions
 *
 * @example
 * ```typescript
 * {
 *   questionText: "What is 5 + 3?",
 *   grade: 3,
 *   topic: "addition",
 *   excludeIds: ["q-001", "q-002"],
 *   limit: 10
 * }
 * ```
 */
export class FindSimilarQuestionsDto {
  /**
   * The question text to find similar questions for
   */
  @IsString()
  questionText: string;

  /**
   * Optional grade level filter
   */
  @IsOptional()
  @IsNumber()
  grade?: number;

  /**
   * Optional topic filter (e.g., "addition", "subtraction")
   */
  @IsOptional()
  @IsString()
  topic?: string;

  /**
   * Optional operation filter
   */
  @IsOptional()
  @IsEnum(OperationType)
  operation?: OperationType;

  /**
   * Optional list of question IDs to exclude from results
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeIds?: string[];

  /**
   * Optional limit for number of results (default: 10, max: 50)
   */
  @IsOptional()
  @IsNumber()
  limit?: number;
}
