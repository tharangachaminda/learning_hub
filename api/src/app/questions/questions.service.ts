import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Question,
  QuestionDocument,
  QuestionStatus,
  QuestionFormat,
} from './schemas/question.schema';
import {
  LessonLearned,
  LessonLearnedDocument,
} from './schemas/lesson-learned.schema';

/**
 * Filter criteria for querying persisted questions.
 */
export interface QuestionFilters {
  /** Grade level (3–8) */
  grade?: number;
  /** Curriculum topic key (e.g. 'ADDITION', 'FRACTION_OPERATIONS') */
  topic?: string;
  /** Review workflow status */
  status?: QuestionStatus;
  /** Presentation format */
  format?: QuestionFormat;
}

/**
 * Paginated result set returned by {@link QuestionsService.findAll}.
 */
export interface PaginatedQuestions {
  /** Array of question documents for the current page */
  data: QuestionDocument[];
  /** Total number of matching documents */
  total: number;
  /** Current page number (1-based) */
  page: number;
  /** Maximum documents per page */
  limit: number;
}

/**
 * Service responsible for CRUD operations on persisted questions.
 *
 * Handles creation (with duplicate detection), filtered querying,
 * single-document lookup, and batch insertion. All newly created
 * questions default to `pending` status per AC-003.
 *
 * @example
 * ```typescript
 * const question = await questionsService.create({
 *   questionText: 'What is $5 + 3$?',
 *   answer: 8,
 *   grade: 3,
 *   topic: 'ADDITION',
 *   metadata: { generatedBy: 'llama3.1:latest', generationTime: 1200, difficulty: 'medium', country: 'NZ' },
 * });
 * ```
 */
@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  /**
   * Creates a new QuestionsService instance.
   *
   * @param questionModel - Mongoose model for the Question collection
   */
  constructor(
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
    @InjectModel(LessonLearned.name)
    private readonly lessonLearnedModel: Model<LessonLearnedDocument>
  ) {}

  /**
   * Persists a single question to MongoDB with `pending` status.
   *
   * Duplicate questions (same questionText + grade + topic) are detected
   * via the compound unique index and silently skipped, returning `null`.
   *
   * @param dto - Partial Question data to persist
   * @returns The saved QuestionDocument, or `null` if a duplicate was detected
   * @throws {Error} When a non-duplicate database error occurs
   *
   * @example
   * ```typescript
   * const saved = await service.create({
   *   questionText: 'What is $7 + 5$?',
   *   answer: 12,
   *   grade: 3,
   *   topic: 'ADDITION',
   * });
   * if (!saved) console.log('Duplicate detected');
   * ```
   */
  async create(dto: Partial<Question>): Promise<QuestionDocument | null> {
    try {
      const doc = await this.questionModel.create({
        ...dto,
        status: QuestionStatus.PENDING,
      });
      return doc;
    } catch (error) {
      // MongoDB duplicate key error code
      if ((error as any).code === 11000) {
        this.logger.warn(
          `Duplicate question detected: "${dto.questionText}" grade=${dto.grade} topic=${dto.topic}`
        );
        return null;
      }
      throw error;
    }
  }

  /**
   * Queries persisted questions with optional filters and pagination.
   *
   * Only non-undefined filter values are included in the MongoDB query,
   * allowing callers to combine any subset of filters.
   *
   * @param filters - Optional filter criteria (grade, topic, status, format)
   * @param page - Page number, 1-based (default: 1)
   * @param limit - Maximum results per page (default: 20)
   * @returns Paginated result with data array, total count, page, and limit
   *
   * @example
   * ```typescript
   * const result = await service.findAll(
   *   { grade: 5, topic: 'FRACTION_OPERATIONS', status: QuestionStatus.APPROVED },
   *   1,
   *   10
   * );
   * console.log(`Found ${result.total} questions, showing page ${result.page}`);
   * ```
   */
  async findAll(
    filters: QuestionFilters,
    page = 1,
    limit = 20
  ): Promise<PaginatedQuestions> {
    const query: Record<string, unknown> = {};

    if (filters.grade !== undefined) query.grade = filters.grade;
    if (filters.topic !== undefined) query.topic = filters.topic;
    if (filters.status !== undefined) query.status = filters.status;
    if (filters.format !== undefined) query.format = filters.format;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.questionModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.questionModel.countDocuments(query).exec(),
    ]);

    return { data, total, page, limit };
  }

  /**
   * Retrieves a single question by its MongoDB ObjectId.
   *
   * @param id - The document's `_id` as a string
   * @returns The matching QuestionDocument, or `null` if not found
   *
   * @example
   * ```typescript
   * const question = await service.findOne('507f1f77bcf86cd799439011');
   * if (question) console.log(question.questionText);
   * ```
   */
  async findOne(id: string): Promise<QuestionDocument | null> {
    return this.questionModel.findById(id).exec();
  }

  /**
   * Batch-inserts multiple questions into MongoDB.
   *
   * Uses `ordered: false` so that duplicate-key errors on individual
   * documents do not abort the entire batch — non-duplicate documents
   * are still inserted successfully.
   *
   * @param dtos - Array of partial Question data to persist
   * @returns Array of successfully inserted QuestionDocuments
   *
   * @example
   * ```typescript
   * const questions = await service.createMany([
   *   { questionText: 'Q1?', answer: 5, grade: 3, topic: 'ADDITION' },
   *   { questionText: 'Q2?', answer: 10, grade: 3, topic: 'ADDITION' },
   * ]);
   * console.log(`Inserted ${questions.length} questions`);
   * ```
   */
  async createMany(dtos: Partial<Question>[]): Promise<QuestionDocument[]> {
    const documents = dtos.map((dto) => ({
      ...dto,
      status: QuestionStatus.PENDING,
    }));

    try {
      const result = await this.questionModel.insertMany(documents, {
        ordered: false,
      });
      return result as QuestionDocument[];
    } catch (error) {
      // With ordered: false, MongoDB throws a BulkWriteError but still
      // inserts non-duplicate documents. Extract the successful ones.
      if ((error as any).code === 11000 && (error as any).insertedDocs) {
        this.logger.warn(
          `Batch insert: some duplicates skipped. ${
            (error as any).insertedDocs.length
          } documents inserted.`
        );
        return (error as any).insertedDocs as QuestionDocument[];
      }
      throw error;
    }
  }

  async getStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  }> {
    const [pending, approved, rejected, total] = await Promise.all([
      this.questionModel
        .countDocuments({ status: QuestionStatus.PENDING })
        .exec(),
      this.questionModel
        .countDocuments({ status: QuestionStatus.APPROVED })
        .exec(),
      this.questionModel
        .countDocuments({ status: QuestionStatus.REJECTED })
        .exec(),
      this.questionModel.countDocuments().exec(),
    ]);

    return { pending, approved, rejected, total };
  }

  /**
   * Reviews a question — approve or reject with optional notes.
   * When rejecting with reviewNotes, automatically creates a lesson learned entry.
   */
  async reviewQuestion(
    id: string,
    status: QuestionStatus,
    reviewedBy: string,
    reviewNotes?: string
  ): Promise<QuestionDocument> {
    const question = await this.questionModel.findById(id).exec();
    if (!question) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    question.status = status;
    question.reviewedBy = reviewedBy;
    question.reviewedAt = new Date();
    if (reviewNotes) {
      question.reviewNotes = reviewNotes;
    }

    await question.save();
    this.logger.log(`Question ${id} ${status} by ${reviewedBy}`);

    // Auto-create a lesson learned entry on rejection with notes
    if (status === QuestionStatus.REJECTED && reviewNotes) {
      try {
        await this.lessonLearnedModel.create({
          grade: question.grade,
          topic: question.topic,
          category: 'other',
          mistakeDescription: reviewNotes,
          correctionInstruction: reviewNotes,
          incorrectExample: question.questionText,
          questionId: id,
          recordedBy: reviewedBy,
          isActive: true,
        });
        this.logger.log(
          `Auto-created lesson learned for rejected question ${id}`
        );
      } catch (err) {
        this.logger.warn(
          `Failed to auto-create lesson learned for question ${id}: ${err.message}`
        );
      }
    }

    return question;
  }

  /**
   * Updates a question's content after refinement.
   */
  async applyRefinement(
    id: string,
    refinedData: {
      questionText: string;
      answer: number | string;
      explanation?: string;
      stepByStepSolution?: string[];
      options?: string[];
    },
    instruction: string,
    refinedBy: string
  ): Promise<QuestionDocument> {
    const question = await this.questionModel.findById(id).exec();
    if (!question) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    // Record refinement history
    const entry = {
      instruction,
      previousQuestionText: question.questionText,
      previousAnswer: question.answer,
      refinedQuestionText: refinedData.questionText,
      refinedAnswer: refinedData.answer,
      refinedBy,
      refinedAt: new Date(),
    };

    question.refinementHistory = question.refinementHistory || [];
    question.refinementHistory.push(entry);

    // Apply refinement
    question.questionText = refinedData.questionText;
    question.answer = refinedData.answer;
    if (refinedData.explanation !== undefined) {
      question.explanation = refinedData.explanation;
    }
    if (refinedData.stepByStepSolution !== undefined) {
      question.stepByStepSolution = refinedData.stepByStepSolution;
    }
    if (refinedData.options !== undefined) {
      question.options = refinedData.options;
    }

    // Reset to pending so it can be re-reviewed after refinement
    question.status = QuestionStatus.PENDING;

    await question.save();
    this.logger.log(`Question ${id} refined by ${refinedBy}`);
    return question;
  }

  // ── Lessons Learned ──────────────────────────────────────────

  /**
   * Creates a new lesson learned entry.
   */
  async createLessonLearned(
    dto: Partial<LessonLearned>,
    recordedBy: string
  ): Promise<LessonLearnedDocument> {
    return this.lessonLearnedModel.create({ ...dto, recordedBy });
  }

  /**
   * Returns all lesson learned entries, optionally filtered.
   */
  async getLessonsLearned(filters?: {
    grade?: number;
    topic?: string;
    category?: string;
    isActive?: boolean;
  }): Promise<LessonLearnedDocument[]> {
    const query: Record<string, unknown> = {};
    if (filters?.grade !== undefined) query.grade = filters.grade;
    if (filters?.topic) query.topic = filters.topic;
    if (filters?.category) query.category = filters.category;
    if (filters?.isActive !== undefined) query.isActive = filters.isActive;

    return this.lessonLearnedModel.find(query).sort({ createdAt: -1 }).exec();
  }

  /**
   * Returns active lessons learned for a specific grade/topic,
   * formatted for injection into LLM prompts.
   */
  async getLessonsForPrompt(grade: number, topic: string): Promise<string> {
    const lessons = await this.lessonLearnedModel
      .find({
        isActive: true,
        $or: [
          { grade, topic },
          { grade, topic: 'ALL' },
          { grade: 0, topic },
          { grade: 0, topic: 'ALL' },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();

    if (lessons.length === 0) return '';

    const lines = lessons.map(
      (l, i) =>
        `${i + 1}. [${l.category}] ${l.mistakeDescription} → ${
          l.correctionInstruction
        }`
    );

    return (
      'IMPORTANT — LESSONS FROM PAST REVIEWS (avoid these mistakes):\n' +
      lines.join('\n')
    );
  }

  /**
   * Toggles a lesson learned active/inactive.
   */
  async toggleLessonLearned(
    id: string,
    isActive: boolean
  ): Promise<LessonLearnedDocument> {
    const lesson = await this.lessonLearnedModel.findById(id).exec();
    if (!lesson) {
      throw new NotFoundException(`Lesson ${id} not found`);
    }
    lesson.isActive = isActive;
    await lesson.save();
    return lesson;
  }

  /**
   * Permanently deletes a question by ID.
   */
  async deleteQuestion(id: string): Promise<void> {
    const result = await this.questionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Question ${id} not found`);
    }
    this.logger.log(`Question ${id} deleted`);
  }

  /**
   * Deletes a lesson learned entry.
   */
  async deleteLessonLearned(id: string): Promise<void> {
    const result = await this.lessonLearnedModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Lesson ${id} not found`);
    }
  }
}
