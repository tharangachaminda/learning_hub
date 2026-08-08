import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/** Mongoose document type for the SubCategory schema. */
export type SubCategoryDocument = HydratedDocument<SubCategory>;

/**
 * A sub-category tag scoped to a (category, difficulty) pair, used to
 * broaden RAG retrieval coverage within a question category/difficulty by
 * letting Admin/Teacher users tag questions with finer-grained taxonomy
 * (e.g. "Skip Counting" within number-operations/medium).
 */
@Schema({ collection: 'subcategories', timestamps: true })
export class SubCategory {
  /** Question category key this sub-category belongs to (e.g. 'number-operations') */
  @Prop({ required: true, type: String })
  category: string;

  /** Difficulty tier this sub-category is scoped to */
  @Prop({ required: true, type: String, enum: ['easy', 'medium', 'hard'] })
  difficulty: 'easy' | 'medium' | 'hard';

  /** Human-readable sub-category name (e.g. 'Skip Counting') */
  @Prop({ required: true, type: String })
  name: string;

  /** URL/index-safe slug derived from `name` (unique within category+difficulty) */
  @Prop({ required: true, type: String })
  slug: string;

  /**
   * Short free-text explanation of what this sub-category covers, used to
   * guide LLM question generation. Required at creation, but optional at
   * the schema level so sub-categories created before this field existed
   * remain valid until backfilled via update.
   */
  @Prop({ type: String })
  description?: string;

  /** Identifier of the admin/teacher who created this sub-category */
  @Prop({ type: String })
  createdBy: string;
}

export const SubCategorySchema = SchemaFactory.createForClass(SubCategory);

SubCategorySchema.index(
  { category: 1, difficulty: 1, slug: 1 },
  { unique: true }
);
