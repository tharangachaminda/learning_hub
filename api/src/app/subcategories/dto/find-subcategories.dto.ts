import { IsIn, IsString } from 'class-validator';

/**
 * DTO for listing sub-categories scoped to a question category + difficulty.
 *
 * @example
 * ```
 * GET /api/subcategories?category=number-operations&difficulty=medium
 * ```
 */
export class FindSubCategoriesDto {
  /** Question category key to list sub-categories for */
  @IsString()
  category: string;

  /** Difficulty tier to list sub-categories for */
  @IsIn(['easy', 'medium', 'hard'])
  difficulty: 'easy' | 'medium' | 'hard';
}
