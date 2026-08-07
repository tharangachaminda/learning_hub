import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  QuestionVisualPlacement,
  QuestionVisualRole,
} from '../schemas/question.schema';
import { PersistedQuestionDifficulty } from './find-questions.dto';

export class UpdateQuestionVisualRenderDto {
  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;
}

export class UpdateQuestionVisualLayoutPositionDto {
  @IsOptional()
  @IsNumber()
  row?: number;

  @IsOptional()
  @IsNumber()
  column?: number;
}

export class UpdateQuestionVisualSelectionDto {
  @IsString()
  assetId: string;

  @IsEnum(QuestionVisualRole)
  role: QuestionVisualRole;

  @IsOptional()
  @IsEnum(QuestionVisualPlacement)
  placement?: QuestionVisualPlacement;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateQuestionVisualRenderDto)
  render?: UpdateQuestionVisualRenderDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateQuestionVisualLayoutPositionDto)
  layout?: UpdateQuestionVisualLayoutPositionDto;
}

export class UpdateQuestionVisualLayoutDto {
  @IsOptional()
  @IsString()
  container?: 'grid';

  @IsOptional()
  @IsNumber()
  rows?: number;

  @IsOptional()
  @IsNumber()
  columns?: number;
}

/**
 * DTO for directly updating a question's editable content fields.
 * All fields are optional — only supplied fields are updated.
 */
export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  questionText?: string;

  @IsOptional()
  @ValidateIf((_obj, value) => typeof value === 'number')
  @IsNumber()
  @ValidateIf((_obj, value) => typeof value === 'string')
  @IsString()
  answer?: number | string;

  @IsOptional()
  @IsString()
  answerAssetId?: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stepByStepSolution?: string[];

  /** Sub-category tags scoped to this question's category + difficulty */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subCategories?: string[];

  /** Stored difficulty metadata (easy, medium, hard) */
  @IsOptional()
  @IsEnum(PersistedQuestionDifficulty)
  difficulty?: PersistedQuestionDifficulty;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateQuestionVisualSelectionDto)
  visualSelections?: UpdateQuestionVisualSelectionDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateQuestionVisualLayoutDto)
  visualLayout?: UpdateQuestionVisualLayoutDto;
}
