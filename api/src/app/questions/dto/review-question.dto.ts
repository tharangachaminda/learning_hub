import { IsString, IsOptional, IsEnum } from 'class-validator';
import { QuestionStatus } from '../schemas/question.schema';

/**
 * DTO for approving or rejecting a question.
 */
export class ReviewQuestionDto {
  @IsEnum(QuestionStatus)
  status: QuestionStatus;

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
