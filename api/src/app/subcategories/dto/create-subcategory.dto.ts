import { IsIn, IsString, MinLength } from 'class-validator';

/**
 * DTO for creating a sub-category scoped to a question category + difficulty.
 *
 * @example
 * ```json
 * {
 *   "category": "number-operations",
 *   "difficulty": "medium",
 *   "name": "Skip Counting",
 *   "description": "Counting up or down in equal steps, e.g. 2s, 5s, 10s"
 * }
 * ```
 */
export class CreateSubCategoryDto {
  /** Question category key this sub-category belongs to (must be a known category) */
  @IsString()
  category: string;

  /** Difficulty tier this sub-category is scoped to */
  @IsIn(['easy', 'medium', 'hard'])
  difficulty: 'easy' | 'medium' | 'hard';

  /** Human-readable sub-category name */
  @IsString()
  @MinLength(1)
  name: string;

  /** Short explanation of what this sub-category covers, used to guide LLM question generation */
  @IsString()
  @MinLength(1)
  description: string;
}
