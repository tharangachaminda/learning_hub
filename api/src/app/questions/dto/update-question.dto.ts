import { IsString, IsOptional, IsArray, ArrayMinSize } from 'class-validator';

/**
 * DTO for directly updating a question's editable content fields.
 * All fields are optional — only supplied fields are updated.
 */
export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  questionText?: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stepByStepSolution?: string[];
}
