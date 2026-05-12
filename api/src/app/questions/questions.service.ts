import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Question,
  QuestionDocument,
  QuestionStatus,
  QuestionFormat,
  VectorSyncMetadata,
  VectorSyncStatus,
} from './schemas/question.schema';
import {
  LessonLearned,
  LessonLearnedDocument,
} from './schemas/lesson-learned.schema';
import {
  getMathematicsTopicCriteria,
  MATHEMATICS_CURRICULUM,
} from '../ai/mathematics-curriculum.criteria';

export interface GradeTopicCount {
  grade: number;
  topic: string;
  approved: number;
  pending: number;
  rejected: number;
  total: number;
  indexed: number;
}

export interface DifficultyCount {
  grade: number;
  topic: string;
  difficulty: string;
  count: number;
  indexed: number;
}

export interface FormatCount {
  grade: number;
  topic: string;
  format: string;
  count: number;
}

export interface CoverageGap {
  grade: number;
  topic: string;
  approved: number;
}

export interface RecentCreation {
  grade: number;
  topic: string;
  difficulty: string;
  count: number;
}

export interface TopicHealth {
  grade: number;
  topic: string;
  approved: number;
  pending: number;
  rejected: number;
  total: number;
  indexed: number;
  approvalRate: number;
  difficultyDepth: { easy: number; medium: number; hard: number };
  indexedDifficultyDepth: { easy: number; medium: number; hard: number };
  formatBalance: { openEnded: number; multipleChoice: number };
  weeklyCreations: { easy: number; medium: number; hard: number };
  lastCreatedAt: Date | null;
  issues: string[];
}

export interface QuestionAnalytics {
  gradeTopicMatrix: GradeTopicCount[];
  byDifficulty: DifficultyCount[];
  byFormat: FormatCount[];
  summary: {
    totalApproved: number;
    totalPending: number;
    totalRejected: number;
    totalQuestions: number;
    totalIndexed: number;
  };
  coverageGaps: CoverageGap[];
  recentCreations: RecentCreation[];
  topicHealth: TopicHealth[];
}

export interface PracticeQuestionsResult {
  questions: Array<{
    _id: string;
    questionText: string;
    answer: number | string;
    explanation: string;
    grade: number;
    topic: string;
    category: string;
    format: string;
    options: string[];
    stepByStepSolution: string[];
    difficulty: string;
  }>;
  total: number;
  requested: number;
  hasMore: boolean;
}

type MongoWriteError = {
  code?: number;
  insertedDocs?: QuestionDocument[];
};

/**
 * Filter criteria for querying persisted questions.
 */
export interface QuestionFilters {
  /** Grade/year level (0–10) */
  grade?: number;
  /** Subject key stored in metadata */
  subject?: string;
  /** Curriculum topic key (e.g. 'ADDITION', 'FRACTION_OPERATIONS') */
  topic?: string;
  /** Review workflow status */
  status?: QuestionStatus;
  /** Presentation format */
  format?: QuestionFormat;
  /** Stored difficulty metadata */
  difficulty?: string;
  /** Approved questions whose vectors are not stored yet */
  approvedNotIndexed?: boolean;
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
 *   metadata: { generatedBy: 'falcon3:latest', generationTime: 1200, difficulty: 'medium', country: 'NZ' },
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
        vectorSync: this.buildPendingVectorSync(),
      });
      return doc;
    } catch (error) {
      const mongoError = error as MongoWriteError;
      // MongoDB duplicate key error code
      if (mongoError.code === 11000) {
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
    if (filters.subject !== undefined) {
      query['metadata.subject'] = filters.subject;
    }
    if (filters.topic !== undefined) {
      Object.assign(query, this.buildTopicQuery(filters.topic, filters.grade));
    }
    if (filters.approvedNotIndexed) {
      query.status = QuestionStatus.APPROVED;
      query['vectorSync.status'] = { $ne: VectorSyncStatus.STORED };
    } else if (filters.status !== undefined) {
      query.status = filters.status;
    }
    if (filters.format !== undefined) query.format = filters.format;
    if (filters.difficulty !== undefined) {
      query['metadata.difficulty'] = filters.difficulty;
    }

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
      vectorSync: this.buildPendingVectorSync(),
    }));

    try {
      const result = await this.questionModel.insertMany(documents, {
        ordered: false,
      });
      return result as QuestionDocument[];
    } catch (error) {
      const mongoError = error as MongoWriteError;
      // With ordered: false, MongoDB throws a BulkWriteError but still
      // inserts non-duplicate documents. Extract the successful ones.
      if (mongoError.code === 11000 && mongoError.insertedDocs) {
        this.logger.warn(
          `Batch insert: some duplicates skipped. ${mongoError.insertedDocs.length} documents inserted.`
        );
        return mongoError.insertedDocs;
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

  async getAnalytics(
    threshold = 10,
    grade?: number
  ): Promise<QuestionAnalytics> {
    const gradeMatch: Record<string, unknown> = {};
    if (grade !== undefined) gradeMatch.grade = grade;

    // Aggregate counts by grade, topic, status
    const statusAgg = await this.questionModel.aggregate<{
      _id: { grade: number; topic: string; status: string };
      count: number;
    }>([
      ...(Object.keys(gradeMatch).length ? [{ $match: gradeMatch }] : []),
      {
        $group: {
          _id: { grade: '$grade', topic: '$topic', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Aggregate counts by grade, topic, difficulty (approved only)
    const difficultyAgg = await this.questionModel.aggregate<{
      _id: { grade: number; topic: string; difficulty: string };
      count: number;
    }>([
      { $match: { ...gradeMatch, status: QuestionStatus.APPROVED } },
      {
        $group: {
          _id: {
            grade: '$grade',
            topic: '$topic',
            difficulty: '$metadata.difficulty',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Aggregate counts by grade, topic, format
    const formatAgg = await this.questionModel.aggregate<{
      _id: { grade: number; topic: string; format: string };
      count: number;
    }>([
      ...(Object.keys(gradeMatch).length ? [{ $match: gradeMatch }] : []),
      {
        $group: {
          _id: { grade: '$grade', topic: '$topic', format: '$format' },
          count: { $sum: 1 },
        },
      },
    ]);

    const indexedAgg = await this.questionModel.aggregate<{
      _id: { grade: number; topic: string };
      count: number;
    }>([
      {
        $match: {
          ...gradeMatch,
          'vectorSync.status': VectorSyncStatus.STORED,
        },
      },
      {
        $group: {
          _id: { grade: '$grade', topic: '$topic' },
          count: { $sum: 1 },
        },
      },
    ]);

    const indexedDifficultyAgg = await this.questionModel.aggregate<{
      _id: { grade: number; topic: string; difficulty: string };
      count: number;
    }>([
      {
        $match: {
          ...gradeMatch,
          'vectorSync.status': VectorSyncStatus.STORED,
        },
      },
      {
        $group: {
          _id: {
            grade: '$grade',
            topic: '$topic',
            difficulty: '$metadata.difficulty',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Weekly creations: questions created in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAgg = await this.questionModel.aggregate<{
      _id: { grade: number; topic: string; difficulty: string };
      count: number;
    }>([
      {
        $match: {
          ...gradeMatch,
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            grade: '$grade',
            topic: '$topic',
            difficulty: '$metadata.difficulty',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Most recent question per grade+topic
    const lastCreatedAgg = await this.questionModel.aggregate<{
      _id: { grade: number; topic: string };
      lastCreated: Date;
    }>([
      ...(Object.keys(gradeMatch).length ? [{ $match: gradeMatch }] : []),
      {
        $group: {
          _id: { grade: '$grade', topic: '$topic' },
          lastCreated: { $max: '$createdAt' },
        },
      },
    ]);

    // Build the grade×topic matrix from the curriculum artifact so analytics
    // stays aligned with canonical topic keys and Years 0-10 coverage.
    const matrixMap = new Map<string, GradeTopicCount>();
    const targetYears =
      grade !== undefined
        ? MATHEMATICS_CURRICULUM.years.filter(
            (yearPlan) => yearPlan.year === grade
          )
        : MATHEMATICS_CURRICULUM.years;
    for (const yearPlan of targetYears) {
      for (const topic of yearPlan.topics) {
        matrixMap.set(`${yearPlan.year}:${topic.key}`, {
          grade: yearPlan.year,
          topic: topic.key,
          approved: 0,
          pending: 0,
          rejected: 0,
          total: 0,
          indexed: 0,
        });
      }
    }

    // Fill in actual counts from aggregation
    for (const row of statusAgg) {
      const normalizedTopic = this.resolveAnalyticsTopic(
        row._id.grade,
        row._id.topic
      );
      const key = `${row._id.grade}:${normalizedTopic}`;
      const entry = matrixMap.get(key);
      if (entry) {
        const status = row._id.status;
        if (status === QuestionStatus.APPROVED) entry.approved = row.count;
        else if (status === QuestionStatus.PENDING) entry.pending = row.count;
        else if (status === QuestionStatus.REJECTED) entry.rejected = row.count;
        entry.total += row.count;
      }
    }

    for (const row of indexedAgg) {
      const normalizedTopic = this.resolveAnalyticsTopic(
        row._id.grade,
        row._id.topic
      );
      const key = `${row._id.grade}:${normalizedTopic}`;
      const entry = matrixMap.get(key);
      if (entry) {
        entry.indexed = row.count;
      }
    }

    const gradeTopicMatrix = Array.from(matrixMap.values());

    // Build summary
    const summary = {
      totalApproved: 0,
      totalPending: 0,
      totalRejected: 0,
      totalQuestions: 0,
      totalIndexed: 0,
    };
    for (const entry of gradeTopicMatrix) {
      summary.totalApproved += entry.approved;
      summary.totalPending += entry.pending;
      summary.totalRejected += entry.rejected;
      summary.totalQuestions += entry.total;
      summary.totalIndexed += entry.indexed;
    }

    // Build coverage gaps
    const coverageGaps = gradeTopicMatrix
      .filter((entry) => entry.approved < threshold)
      .sort((a, b) => a.approved - b.approved);

    // Build difficulty and format arrays
    const difficultyMap = new Map<string, DifficultyCount>();
    for (const row of difficultyAgg) {
      const difficulty = row._id.difficulty || 'unknown';
      const normalizedTopic = this.resolveAnalyticsTopic(
        row._id.grade,
        row._id.topic
      );
      const key = `${row._id.grade}:${normalizedTopic}:${difficulty}`;
      const existing = difficultyMap.get(key);
      if (existing) {
        existing.count += row.count;
        continue;
      }
      difficultyMap.set(key, {
        grade: row._id.grade,
        topic: normalizedTopic,
        difficulty,
        count: row.count,
        indexed: 0,
      });
    }

    for (const row of indexedDifficultyAgg) {
      const difficulty = row._id.difficulty || 'unknown';
      const normalizedTopic = this.resolveAnalyticsTopic(
        row._id.grade,
        row._id.topic
      );
      const key = `${row._id.grade}:${normalizedTopic}:${difficulty}`;
      const existing = difficultyMap.get(key);
      if (existing) {
        existing.indexed += row.count;
      } else {
        difficultyMap.set(key, {
          grade: row._id.grade,
          topic: normalizedTopic,
          difficulty,
          count: 0,
          indexed: row.count,
        });
      }
    }

    const byDifficulty: DifficultyCount[] = Array.from(difficultyMap.values());

    const formatMap = new Map<string, FormatCount>();
    for (const row of formatAgg) {
      const normalizedTopic = this.resolveAnalyticsTopic(
        row._id.grade,
        row._id.topic
      );
      const format = row._id.format || 'open-ended';
      const key = `${row._id.grade}:${normalizedTopic}:${format}`;
      const existing = formatMap.get(key);
      if (existing) {
        existing.count += row.count;
        continue;
      }
      formatMap.set(key, {
        grade: row._id.grade,
        topic: normalizedTopic,
        format,
        count: row.count,
      });
    }

    const byFormat: FormatCount[] = Array.from(formatMap.values());

    const recentCreationMap = new Map<string, RecentCreation>();
    for (const row of recentAgg) {
      const normalizedTopic = this.resolveAnalyticsTopic(
        row._id.grade,
        row._id.topic
      );
      const difficulty = row._id.difficulty || 'unknown';
      const key = `${row._id.grade}:${normalizedTopic}:${difficulty}`;
      const existing = recentCreationMap.get(key);
      if (existing) {
        existing.count += row.count;
        continue;
      }
      recentCreationMap.set(key, {
        grade: row._id.grade,
        topic: normalizedTopic,
        difficulty,
        count: row.count,
      });
    }

    const recentCreations: RecentCreation[] = Array.from(
      recentCreationMap.values()
    );

    // Build per-topic health assessment
    const topicHealth: TopicHealth[] = [];
    for (const entry of gradeTopicMatrix) {
      // Difficulty depth (approved only)
      const depth = { easy: 0, medium: 0, hard: 0 };
      const indexedDepth = { easy: 0, medium: 0, hard: 0 };
      for (const d of difficultyAgg) {
        if (
          d._id.grade === entry.grade &&
          this.resolveAnalyticsTopic(d._id.grade, d._id.topic) === entry.topic
        ) {
          const lvl = (d._id.difficulty || '').toLowerCase();
          if (lvl === 'easy') depth.easy += d.count;
          else if (lvl === 'medium') depth.medium += d.count;
          else if (lvl === 'hard') depth.hard += d.count;
        }
      }

      for (const d of indexedDifficultyAgg) {
        if (
          d._id.grade === entry.grade &&
          this.resolveAnalyticsTopic(d._id.grade, d._id.topic) === entry.topic
        ) {
          const lvl = (d._id.difficulty || '').toLowerCase();
          if (lvl === 'easy') indexedDepth.easy += d.count;
          else if (lvl === 'medium') indexedDepth.medium += d.count;
          else if (lvl === 'hard') indexedDepth.hard += d.count;
        }
      }

      // Format balance
      const formats = { openEnded: 0, multipleChoice: 0 };
      for (const f of formatAgg) {
        if (
          f._id.grade === entry.grade &&
          this.resolveAnalyticsTopic(f._id.grade, f._id.topic) === entry.topic
        ) {
          if (f._id.format === 'multiple-choice')
            formats.multipleChoice += f.count;
          else formats.openEnded += f.count;
        }
      }

      // Weekly creations
      const weekly = { easy: 0, medium: 0, hard: 0 };
      for (const r of recentAgg) {
        if (
          r._id.grade === entry.grade &&
          this.resolveAnalyticsTopic(r._id.grade, r._id.topic) === entry.topic
        ) {
          const lvl = (r._id.difficulty || '').toLowerCase();
          if (lvl === 'easy') weekly.easy += r.count;
          else if (lvl === 'medium') weekly.medium += r.count;
          else if (lvl === 'hard') weekly.hard += r.count;
        }
      }

      // Last created
      const lastEntry = lastCreatedAgg.find(
        (l) =>
          l._id.grade === entry.grade &&
          this.resolveAnalyticsTopic(l._id.grade, l._id.topic) === entry.topic
      );

      // Compute issues
      const issues: string[] = [];
      const approvalRate =
        entry.total > 0 ? (entry.approved / entry.total) * 100 : 0;

      // Criterion 1: Difficulty depth >= 50 per difficulty
      if (depth.easy < 50) issues.push(`Easy: ${depth.easy}/50 approved`);
      if (depth.medium < 50) issues.push(`Medium: ${depth.medium}/50 approved`);
      if (depth.hard < 50) issues.push(`Hard: ${depth.hard}/50 approved`);

      // Criterion 2: Approval rate > 80%
      if (entry.total > 0 && approvalRate < 80) {
        issues.push(`Approval rate ${approvalRate.toFixed(0)}% (target >80%)`);
      }

      // Criterion 3: Weekly generation >= 10 per difficulty
      if (weekly.easy < 10) issues.push(`Weekly easy: ${weekly.easy}/10`);
      if (weekly.medium < 10) issues.push(`Weekly medium: ${weekly.medium}/10`);
      if (weekly.hard < 10) issues.push(`Weekly hard: ${weekly.hard}/10`);

      // Criterion 4: Format balance >= 30% each
      const totalFmt = formats.openEnded + formats.multipleChoice;
      if (totalFmt > 0) {
        const oePercent = (formats.openEnded / totalFmt) * 100;
        const mcPercent = (formats.multipleChoice / totalFmt) * 100;
        if (oePercent < 30)
          issues.push(`Open-ended only ${oePercent.toFixed(0)}% (target ≥30%)`);
        if (mcPercent < 30)
          issues.push(
            `Multiple-choice only ${mcPercent.toFixed(0)}% (target ≥30%)`
          );
      } else {
        issues.push('No questions yet');
      }

      // Criterion 5: Staleness — no new questions in 14 days
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      if (
        !lastEntry?.lastCreated ||
        new Date(lastEntry.lastCreated) < fourteenDaysAgo
      ) {
        issues.push('No new questions in 14+ days');
      }

      topicHealth.push({
        grade: entry.grade,
        topic: entry.topic,
        approved: entry.approved,
        pending: entry.pending,
        rejected: entry.rejected,
        total: entry.total,
        indexed: entry.indexed,
        approvalRate: Math.round(approvalRate),
        difficultyDepth: depth,
        indexedDifficultyDepth: indexedDepth,
        formatBalance: formats,
        weeklyCreations: weekly,
        lastCreatedAt: lastEntry?.lastCreated || null,
        issues,
      });
    }

    return {
      gradeTopicMatrix,
      byDifficulty,
      byFormat,
      summary,
      coverageGaps,
      recentCreations,
      topicHealth,
    };
  }

  async getPracticeQuestions(
    grade: number,
    topic: string,
    count: number,
    difficulty?: string
  ): Promise<PracticeQuestionsResult> {
    const matchStage: Record<string, unknown> = {
      status: QuestionStatus.APPROVED,
      grade,
      ...this.buildTopicQuery(topic, grade),
    };
    if (difficulty) {
      matchStage['metadata.difficulty'] = difficulty;
    }

    const total = await this.questionModel.countDocuments(matchStage).exec();
    const sampleSize = Math.min(count, total);

    let questions: QuestionDocument[] = [];
    if (sampleSize > 0) {
      questions = await this.questionModel.aggregate<QuestionDocument>([
        { $match: matchStage },
        { $sample: { size: sampleSize } },
      ]);
    }

    // Map to student-safe response (exclude internal review fields)
    const mapped = questions.map((q) => ({
      _id: (q._id || '').toString(),
      questionText: q.questionText,
      answer: q.answer,
      explanation: q.explanation || '',
      grade: q.grade,
      topic: q.topic,
      category: q.category || '',
      format: q.format || 'open-ended',
      options: q.options || [],
      stepByStepSolution: q.stepByStepSolution || [],
      difficulty: q.metadata?.difficulty || 'medium',
    }));

    return {
      questions: mapped,
      total,
      requested: count,
      hasMore: total > count,
    };
  }

  private buildTopicQuery(
    requestedTopic: string,
    grade?: number
  ): Record<string, unknown> {
    const canonicalTopicKeys = this.resolveTopicKeys(requestedTopic, grade);
    if (
      canonicalTopicKeys.length === 1 &&
      canonicalTopicKeys[0] === requestedTopic
    ) {
      return { topic: requestedTopic };
    }

    return {
      $or: [
        { topic: { $in: canonicalTopicKeys } },
        { 'metadata.resolvedTopicKey': canonicalTopicKeys[0] },
        { 'metadata.sourceTopicKey': { $in: canonicalTopicKeys } },
      ],
    };
  }

  private resolveTopicKeys(requestedTopic: string, grade?: number): string[] {
    const matchingTopics =
      grade !== undefined
        ? [getMathematicsTopicCriteria(grade, requestedTopic)].filter(
            (topic): topic is NonNullable<typeof topic> => topic !== null
          )
        : MATHEMATICS_CURRICULUM.years.flatMap((yearPlan) =>
            yearPlan.topics.filter(
              (topic) =>
                topic.key === requestedTopic ||
                topic.legacyTopicKeys?.includes(requestedTopic) === true
            )
          );

    if (matchingTopics.length === 0) {
      return [requestedTopic];
    }

    return Array.from(
      new Set(
        matchingTopics.flatMap((topic) => [
          topic.key,
          ...(topic.legacyTopicKeys ?? []),
        ])
      )
    );
  }

  private resolveAnalyticsTopic(grade: number, topic: string): string {
    return getMathematicsTopicCriteria(grade, topic)?.key ?? topic;
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

    if (status === QuestionStatus.REJECTED) {
      this.resetVectorSync(question);
    } else if (!question.vectorSync) {
      question.vectorSync = this.buildPendingVectorSync();
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

  async markVectorSyncPrepared(id: string): Promise<QuestionDocument> {
    const question = await this.questionModel.findById(id).exec();
    if (!question) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    question.vectorSync = {
      ...this.buildPendingVectorSync(),
      status: VectorSyncStatus.PREPARED,
      preparedAt: new Date(),
    } as VectorSyncMetadata;

    await question.save();
    return question;
  }

  async markVectorSyncStored(
    id: string,
    storedBy: string,
    documentId: string,
    options?: { contentHash?: string; embeddingModelVersion?: string }
  ): Promise<QuestionDocument> {
    const question = await this.questionModel.findById(id).exec();
    if (!question) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    question.vectorSync = {
      ...(question.vectorSync || this.buildPendingVectorSync()),
      status: VectorSyncStatus.STORED,
      preparedAt: question.vectorSync?.preparedAt || new Date(),
      storedAt: new Date(),
      storedBy,
      documentId,
      syncError: undefined,
      contentHash: options?.contentHash,
      embeddingModelVersion: options?.embeddingModelVersion,
    } as VectorSyncMetadata;

    await question.save();
    return question;
  }

  async markVectorSyncFailed(
    id: string,
    syncError: string
  ): Promise<QuestionDocument> {
    const question = await this.questionModel.findById(id).exec();
    if (!question) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    question.vectorSync = {
      ...(question.vectorSync || this.buildPendingVectorSync()),
      status: VectorSyncStatus.FAILED,
      syncError,
      storedAt: undefined,
      storedBy: undefined,
    } as VectorSyncMetadata;

    await question.save();
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
    this.resetVectorSync(question);

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
   * Directly updates a question's editable content fields.
   * Resets status to pending so the question goes through review again.
   * Records the edit in refinement history for auditability.
   */
  async updateQuestionContent(
    id: string,
    updates: {
      questionText?: string;
      explanation?: string;
      stepByStepSolution?: string[];
    },
    editedBy: string
  ): Promise<QuestionDocument> {
    const question = await this.questionModel.findById(id).exec();
    if (!question) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    // Record edit in refinement history for auditability
    const entry = {
      instruction: 'Manual edit',
      previousQuestionText: question.questionText,
      previousAnswer: question.answer,
      refinedQuestionText: updates.questionText ?? question.questionText,
      refinedAnswer: question.answer,
      refinedBy: editedBy,
      refinedAt: new Date(),
    };
    question.refinementHistory = question.refinementHistory || [];
    question.refinementHistory.push(entry);

    // Apply updates
    if (updates.questionText !== undefined) {
      question.questionText = updates.questionText;
    }
    if (updates.explanation !== undefined) {
      question.explanation = updates.explanation;
    }
    if (updates.stepByStepSolution !== undefined) {
      question.stepByStepSolution = updates.stepByStepSolution;
    }

    // Reset to pending for re-review
    question.status = QuestionStatus.PENDING;
    question.reviewedBy = undefined;
    question.reviewedAt = undefined;
    this.resetVectorSync(question);

    await question.save();
    this.logger.log(`Question ${id} manually edited by ${editedBy}`);
    return question;
  }

  private buildPendingVectorSync() {
    return {
      status: VectorSyncStatus.PENDING,
      preparedAt: undefined,
      storedAt: undefined,
      storedBy: undefined,
      documentId: undefined,
      syncError: undefined,
      contentHash: undefined,
      embeddingModelVersion: undefined,
    };
  }

  private resetVectorSync(question: QuestionDocument): void {
    question.vectorSync = this.buildPendingVectorSync() as VectorSyncMetadata;
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
