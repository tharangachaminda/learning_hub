import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

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
   * Optional operation/topic filter (e.g., 'ADDITION', 'FRACTION_BASICS')
   */
  @IsOptional()
  @IsString()
  operation?: string;

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
