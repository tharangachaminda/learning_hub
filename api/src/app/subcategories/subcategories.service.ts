import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubCategory, SubCategoryDocument } from './schemas/subcategory.schema';
import { Question, QuestionDocument } from '../questions/schemas/question.schema';
import { QUESTION_CATEGORIES } from '../ai/curriculum.types';

type MongoWriteError = { code?: number };

/**
 * Service for managing sub-category taxonomy scoped to a (category, difficulty)
 * pair, and for enumerating available sub-categories for RAG retrieval.
 *
 * @example
 * ```typescript
 * const subCategory = await subCategoriesService.create(
 *   { category: 'number-operations', difficulty: 'medium', name: 'Skip Counting' },
 *   'teacher@example.com'
 * );
 * ```
 */
@Injectable()
export class SubCategoriesService {
  constructor(
    @InjectModel(SubCategory.name)
    private readonly subCategoryModel: Model<SubCategoryDocument>,
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>
  ) {}

  /**
   * Creates a new sub-category scoped to a category + difficulty pair.
   * Slug is derived server-side from `name`.
   *
   * @throws {BadRequestException} When `category` is not a known question category
   * @throws {ConflictException} When a sub-category with the same slug already
   * exists for the same category + difficulty pair
   */
  async create(
    dto: { category: string; difficulty: 'easy' | 'medium' | 'hard'; name: string },
    createdBy: string
  ): Promise<SubCategoryDocument> {
    if (!QUESTION_CATEGORIES[dto.category]) {
      throw new BadRequestException(`Unknown question category '${dto.category}'`);
    }

    const slug = this.toSlug(dto.name);

    try {
      return await this.subCategoryModel.create({
        category: dto.category,
        difficulty: dto.difficulty,
        name: dto.name.trim(),
        slug,
        createdBy,
      });
    } catch (error) {
      const mongoError = error as MongoWriteError;
      if (mongoError.code === 11000) {
        throw new ConflictException(
          `Sub-category '${dto.name}' already exists for category '${dto.category}' difficulty '${dto.difficulty}'`
        );
      }
      throw error;
    }
  }

  /**
   * Lists sub-categories defined for a category + difficulty pair.
   * Returns an empty array when none are defined yet (cold start).
   */
  async list(
    category: string,
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<SubCategoryDocument[]> {
    return this.subCategoryModel
      .find({ category, difficulty })
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Deletes a sub-category. Rejected while any question still references it
   * for the same category + difficulty, so admins must untag first.
   */
  async delete(id: string): Promise<void> {
    const subCategory = await this.subCategoryModel.findById(id).exec();
    if (!subCategory) {
      throw new NotFoundException(`Sub-category ${id} not found`);
    }

    const inUse = await this.questionModel
      .exists({
        category: subCategory.category,
        'metadata.difficulty': subCategory.difficulty,
        subCategories: subCategory.slug,
      })
      .exec();

    if (inUse) {
      throw new ConflictException(
        `Sub-category '${subCategory.name}' is still tagged on one or more questions. Untag it before deleting.`
      );
    }

    await this.subCategoryModel.findByIdAndDelete(id).exec();
  }

  private toSlug(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
