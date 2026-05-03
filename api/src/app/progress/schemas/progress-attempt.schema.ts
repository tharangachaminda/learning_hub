import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProgressAttemptDocument = HydratedDocument<ProgressAttempt>;

@Schema({ collection: 'progress_attempts', versionKey: false })
export class ProgressAttempt {
  @Prop({ required: true, index: true })
  studentId: string;

  @Prop({ required: true })
  questionId: string;

  @Prop({ required: true, index: true })
  topic: string;

  @Prop({ required: true, enum: ['easy', 'medium', 'hard'] })
  difficulty: 'easy' | 'medium' | 'hard';

  @Prop({ required: true })
  isCorrect: boolean;

  @Prop({ required: true, min: 0 })
  timeSpentSeconds: number;

  @Prop()
  sessionId?: string;

  @Prop({ required: true, index: true })
  attemptedAt: Date;
}

export const ProgressAttemptSchema =
  SchemaFactory.createForClass(ProgressAttempt);
