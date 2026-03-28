import { IsString, MinLength } from 'class-validator';

/**
 * DTO for requesting an LLM refinement of a question.
 */
export class RefineQuestionDto {
  /** The instruction describing what needs to be corrected/refined */
  @IsString()
  @MinLength(5)
  instruction: string;
}
