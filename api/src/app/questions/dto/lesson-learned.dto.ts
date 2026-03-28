import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

/**
 * DTO for creating a lesson learned entry.
 */
export class CreateLessonLearnedDto {
  @IsNumber()
  @Min(0)
  @Max(8)
  grade: number;

  @IsString()
  topic: string;

  @IsString()
  category: string;

  @IsString()
  mistakeDescription: string;

  @IsString()
  correctionInstruction: string;

  @IsOptional()
  @IsString()
  incorrectExample?: string;

  @IsOptional()
  @IsString()
  correctedExample?: string;

  @IsOptional()
  @IsString()
  questionId?: string;
}

/**
 * DTO for toggling a lesson learned active/inactive.
 */
export class ToggleLessonLearnedDto {
  @IsBoolean()
  isActive: boolean;
}
