import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Question,
  QuestionDocument,
  QuestionStatus,
  QuestionFormat,
} from './schemas/question.schema';

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
    private readonly questionModel: Model<QuestionDocument>
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
}
