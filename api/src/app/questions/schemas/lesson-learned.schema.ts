import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Mongoose document type for the LessonLearned schema.
 */
export type LessonLearnedDocument = HydratedDocument<LessonLearned>;

/**
 * Captures a correction pattern from the question review process.
 *
 * When a reviewer refines/corrects a question and then approves it,
 * the correction is stored as a lesson learned. These lessons are
 * later injected into LLM prompts so the model avoids repeating
 * the same type of mistakes.
 */
@Schema({ collection: 'lessons_learned', timestamps: true })
export class LessonLearned {
  /** Grade level the lesson applies to (3-8), or 0 for all grades */
  @Prop({ required: true, type: Number })
  grade: number;

  /** Topic the lesson applies to, or 'ALL' for cross-topic lessons */
  @Prop({ required: true, type: String })
  topic: string;

  /** Human-readable category of the mistake (e.g. 'mathematical-accuracy', 'formatting', 'curriculum-alignment') */
  @Prop({ required: true, type: String })
  category: string;

  /** Description of the mistake the LLM made */
  @Prop({ required: true, type: String })
  mistakeDescription: string;

  /** The correction instruction that was given */
  @Prop({ required: true, type: String })
  correctionInstruction: string;

  /** Example of the incorrect output */
  @Prop({ type: String })
  incorrectExample: string;

  /** Example of the corrected output */
  @Prop({ type: String })
  correctedExample: string;

  /** Reference to the question ID this lesson was derived from */
  @Prop({ type: String })
  questionId: string;

  /** Who recorded this lesson */
  @Prop({ type: String })
  recordedBy: string;

  /** Whether this lesson is active and should be included in prompts */
  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const LessonLearnedSchema = SchemaFactory.createForClass(LessonLearned);

LessonLearnedSchema.index({ grade: 1, topic: 1 });
LessonLearnedSchema.index({ category: 1 });
LessonLearnedSchema.index({ isActive: 1 });
