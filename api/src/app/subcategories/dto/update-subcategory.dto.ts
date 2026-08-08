import { IsString, MinLength } from 'class-validator';

/**
 * DTO for updating a sub-category's description. `category`, `difficulty`,
 * `name`, and `slug` are immutable after creation — only `description` can
 * be revised or backfilled.
 *
 * @example
 * ```json
 * { "description": "Counting up or down in equal steps, e.g. 2s, 5s, 10s" }
 * ```
 */
export class UpdateSubCategoryDto {
  /** Short explanation of what this sub-category covers, used to guide LLM question generation */
  @IsString()
  @MinLength(1)
  description: string;
}
