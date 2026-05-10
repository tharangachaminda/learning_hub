import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { VectorIndexService } from './vector-index.service';
import {
  MathQuestion,
  DifficultyLevel,
} from '../math-questions/entities/math-question.entity';
import { QuestionDocument } from '../questions/schemas/question.schema';
import {
  getMathematicsTopicCriteria,
  getMathematicsYearPlan,
  MATHEMATICS_CURRICULUM,
} from '../ai/mathematics-curriculum.criteria';

interface PreparedQuestionDocument {
  id: string;
  questionText: string;
  explanation: string;
  answer: number;
  embeddingSourceText: string;
  metadata: {
    grade: string;
    topic: string;
    operation: string;
    difficulty: string;
    difficulty_score: number;
    category: string;
    curriculum_strand: string;
    subject: string;
    curriculum_version?: string;
    resolved_topic_key?: string;
    resolved_topic_label?: string;
    curriculum_phase?: string;
    source_topic_key?: string;
  };
}

/**
 * Service for indexing math questions with embeddings in OpenSearch.
 * Bridges question generation and vector storage for semantic search capabilities.
 *
 * @example
 * ```typescript
 * const question = new MathQuestion('What is 5 + 3?', 8, ...);
 * await questionIndexingService.indexQuestion(question);
 * ```
 */
@Injectable()
export class QuestionIndexingService {
  private readonly logger = new Logger(QuestionIndexingService.name);

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorIndexService: VectorIndexService
  ) {}

  /**
   * Indexes a single math question with its embedding in OpenSearch.
   * Generates embedding for the question text and stores with metadata.
   *
   * @param question - The MathQuestion entity to index
   * @returns Promise that resolves when indexing is complete
   * @throws Error if embedding generation or indexing fails
   *
   * @example
   * ```typescript
   * const question = new MathQuestion('Calculate 7 + 5', 12, ...);
   * question.id = 'q-001';
   * await questionIndexingService.indexQuestion(question);
   * ```
   */
  async indexQuestion(question: MathQuestion): Promise<void> {
    try {
      const prepared = this.prepareGeneratedQuestion(question);

      // Ensure index exists before indexing
      await this.vectorIndexService.createIndexIfNotExists();

      // Generate embedding for the retrieval text
      const embedding = await this.embeddingService.generateEmbedding(
        prepared.embeddingSourceText
      );

      // Index in OpenSearch
      await this.vectorIndexService.indexQuestion(
        prepared.id,
        prepared.questionText,
        prepared.explanation,
        prepared.answer,
        embedding,
        prepared.metadata
      );

      this.logger.log(
        `Successfully indexed question: ${question.id || 'generated-id'}`
      );
    } catch (error) {
      this.logIndexingFailure(
        `Failed to index question: ${question.question}`,
        error
      );
      throw new Error(`Failed to index question: ${error.message}`);
    }
  }

  /**
   * Indexes multiple math questions in batch using bulk operations.
   * More efficient than indexing questions individually for large datasets.
   *
   * @param questions - Array of MathQuestion entities to index
   * @returns Promise that resolves when all questions are indexed
   * @throws Error if batch embedding generation or indexing fails
   *
   * @example
   * ```typescript
   * const questions = [question1, question2, question3];
   * await questionIndexingService.indexQuestions(questions);
   * console.log('All questions indexed successfully');
   * ```
   */
  async indexQuestions(questions: MathQuestion[]): Promise<void> {
    if (questions.length === 0) {
      this.logger.debug('No questions to index');
      return;
    }

    try {
      const preparedQuestions = questions.map((question) =>
        this.prepareGeneratedQuestion(question)
      );

      // Ensure index exists before bulk indexing
      await this.vectorIndexService.createIndexIfNotExists();

      // Generate embeddings for all questions
      const questionTexts = preparedQuestions.map(
        (question) => question.embeddingSourceText
      );
      const embeddings = await this.embeddingService.generateBatchEmbeddings(
        questionTexts
      );

      // Prepare documents for bulk indexing
      const documents = preparedQuestions.map((question, index) => ({
        id: question.id,
        questionText: question.questionText,
        explanation: question.explanation,
        answer: question.answer,
        embedding: embeddings[index],
        metadata: question.metadata,
      }));

      // Bulk index in OpenSearch
      await this.vectorIndexService.bulkIndexQuestions(documents);

      this.logger.log(
        `Successfully indexed ${questions.length} questions in batch`
      );
    } catch (error) {
      this.logIndexingFailure(
        `Failed to index ${questions.length} questions in batch`,
        error
      );
      throw new Error(`Failed to index questions: ${error.message}`);
    }
  }

  /**
   * Ensures the math-questions index exists in OpenSearch.
   * Creates the index with proper mapping if it doesn't exist.
   *
   * @returns Promise that resolves when index is confirmed to exist
   * @throws Error if index creation fails
   *
   * @example
   * ```typescript
   * await questionIndexingService.ensureIndexExists();
   * console.log('Index ready for use');
   * ```
   */
  async ensureIndexExists(): Promise<void> {
    await this.vectorIndexService.createIndexIfNotExists();
  }

  /**
   * Indexes a persisted question document using the richer stored structure.
   */
  async indexStoredQuestion(question: QuestionDocument): Promise<void> {
    try {
      const prepared = this.prepareStoredQuestion(question);

      await this.vectorIndexService.createIndexIfNotExists();

      const embedding = await this.embeddingService.generateEmbedding(
        prepared.embeddingSourceText
      );

      await this.vectorIndexService.indexQuestion(
        prepared.id,
        prepared.questionText,
        prepared.explanation,
        prepared.answer,
        embedding,
        prepared.metadata
      );

      this.logger.log(`Successfully indexed stored question: ${prepared.id}`);
    } catch (error) {
      this.logIndexingFailure(
        `Failed to index stored question: ${
          question._id?.toString?.() ?? 'unknown'
        }`,
        error
      );
      throw new Error(`Failed to index question: ${error.message}`);
    }
  }

  /**
   * Indexes multiple persisted question documents in batch.
   */
  async indexStoredQuestions(questions: QuestionDocument[]): Promise<void> {
    if (questions.length === 0) {
      this.logger.debug('No stored questions to index');
      return;
    }

    try {
      const preparedQuestions = questions.map((question) =>
        this.prepareStoredQuestion(question)
      );

      await this.vectorIndexService.createIndexIfNotExists();

      const embeddings = await this.embeddingService.generateBatchEmbeddings(
        preparedQuestions.map((question) => question.embeddingSourceText)
      );

      await this.vectorIndexService.bulkIndexQuestions(
        preparedQuestions.map((question, index) => ({
          id: question.id,
          questionText: question.questionText,
          explanation: question.explanation,
          answer: question.answer,
          embedding: embeddings[index],
          metadata: question.metadata,
        }))
      );

      this.logger.log(
        `Successfully indexed ${questions.length} stored questions in batch`
      );
    } catch (error) {
      this.logIndexingFailure(
        `Failed to index ${questions.length} stored questions in batch`,
        error
      );
      throw new Error(`Failed to index questions: ${error.message}`);
    }
  }

  private logIndexingFailure(context: string, error: unknown): void {
    if (this.isOpenSearchUnavailableError(error)) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`${context} (OpenSearch unavailable): ${message}`);
      return;
    }

    if (error instanceof Error) {
      this.logger.error(context, error.stack);
      return;
    }

    this.logger.error(`${context}: ${String(error)}`);
  }

  private isOpenSearchUnavailableError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const message = error.message.toLowerCase();
    return (
      message.includes('connection error') ||
      message.includes('connection failed') ||
      message.includes('connect econnrefused') ||
      message.includes('index_not_found_exception') ||
      message.includes('no living connections')
    );
  }

  prepareStoredQuestion(question: QuestionDocument): PreparedQuestionDocument {
    const explanation = question.explanation?.trim() || '';
    const difficulty = question.metadata?.difficulty || 'medium';
    const category = question.category || 'math';
    const sourceTopicKey = question.metadata?.sourceTopicKey || question.topic;
    const topicCriteria = getMathematicsTopicCriteria(
      question.grade,
      sourceTopicKey
    );
    const yearPlan = getMathematicsYearPlan(question.grade);

    return {
      id: question._id.toString(),
      questionText: question.questionText,
      explanation,
      answer: this.normalizeAnswer(question.answer),
      embeddingSourceText: this.buildEmbeddingSourceText(
        question.questionText,
        explanation
      ),
      metadata: {
        grade: question.grade.toString(),
        topic: question.topic,
        operation: question.topic,
        difficulty,
        difficulty_score: this.calculateQuestionDifficultyScore(difficulty),
        category,
        curriculum_strand:
          question.metadata?.curriculumStrand?.toLowerCase() ||
          topicCriteria?.strand.toLowerCase() ||
          category,
        subject: question.metadata?.subject || MATHEMATICS_CURRICULUM.subject,
        curriculum_version:
          question.metadata?.curriculumVersion ||
          MATHEMATICS_CURRICULUM.version,
        resolved_topic_key:
          question.metadata?.resolvedTopicKey || topicCriteria?.key,
        resolved_topic_label:
          question.metadata?.resolvedTopicLabel || topicCriteria?.label,
        curriculum_phase: question.metadata?.curriculumPhase || yearPlan?.phase,
        source_topic_key: sourceTopicKey,
      },
    };
  }

  /**
   * Extracts metadata from a MathQuestion for indexing.
   * Converts question properties to OpenSearch metadata format.
   *
   * @param question - The MathQuestion to extract metadata from
   * @returns Metadata object for OpenSearch indexing
   *
   * @private
   */
  private extractMetadata(question: MathQuestion): {
    grade: number;
    topic: string;
    operation: string;
    difficulty: string;
    difficulty_score: number;
    generation_timestamp: Date;
    category: string;
    curriculum_strand: string;
    subject: string;
    curriculum_version?: string;
    resolved_topic_key?: string;
    resolved_topic_label?: string;
    curriculum_phase?: string;
    source_topic_key?: string;
  } {
    const grade = this.extractGrade(question.difficulty);
    const topicCriteria = getMathematicsTopicCriteria(
      grade,
      question.operation
    );
    const yearPlan = getMathematicsYearPlan(grade);

    return {
      grade,
      topic: question.operation,
      operation: question.operation,
      difficulty: question.difficulty,
      difficulty_score: this.calculateDifficultyScore(question.difficulty),
      generation_timestamp: question.createdAt,
      category: 'math',
      curriculum_strand: topicCriteria?.strand.toLowerCase() || 'number',
      subject: MATHEMATICS_CURRICULUM.subject,
      curriculum_version: MATHEMATICS_CURRICULUM.version,
      resolved_topic_key: topicCriteria?.key,
      resolved_topic_label: topicCriteria?.label,
      curriculum_phase: yearPlan?.phase,
      source_topic_key: question.operation,
    };
  }

  private prepareGeneratedQuestion(
    question: MathQuestion
  ): PreparedQuestionDocument {
    const metadata = this.extractMetadata(question);
    const explanation = question.stepByStepSolution?.join('\n').trim() || '';

    return {
      id: question.id || this.generateQuestionId(question),
      questionText: question.question,
      explanation,
      answer: question.answer,
      embeddingSourceText: this.buildEmbeddingSourceText(
        question.question,
        explanation
      ),
      metadata: {
        grade: metadata.grade.toString(),
        topic: metadata.topic,
        operation: metadata.operation,
        difficulty: metadata.difficulty,
        difficulty_score: metadata.difficulty_score,
        category: metadata.category,
        curriculum_strand: metadata.curriculum_strand,
        subject: metadata.subject,
        curriculum_version: metadata.curriculum_version,
        resolved_topic_key: metadata.resolved_topic_key,
        resolved_topic_label: metadata.resolved_topic_label,
        curriculum_phase: metadata.curriculum_phase,
        source_topic_key: metadata.source_topic_key,
      },
    };
  }

  private buildEmbeddingSourceText(
    questionText: string,
    explanation: string
  ): string {
    return explanation
      ? `${questionText}\n\nExplanation: ${explanation}`
      : questionText;
  }

  private normalizeAnswer(answer: number | string): number {
    if (typeof answer === 'number') {
      return answer;
    }

    const numericAnswer = Number(answer);
    return Number.isFinite(numericAnswer) ? numericAnswer : 0;
  }

  private calculateQuestionDifficultyScore(difficulty: string): number {
    const normalizedDifficulty = difficulty.toLowerCase();
    const scoreMap: Record<string, number> = {
      easy: 0.33,
      medium: 0.66,
      hard: 1,
    };

    return scoreMap[normalizedDifficulty] ?? 0.66;
  }

  /**
   * Extracts grade number from difficulty level enum.
   *
   * @param difficulty - The DifficultyLevel enum value
   * @returns Grade number (e.g., 3 for GRADE_3)
   *
   * @private
   */
  private extractGrade(difficulty: DifficultyLevel): number {
    // Extract numeric grade from difficulty enum (e.g., 'grade_3' -> 3)
    const match = difficulty.match(/grade_(\d+)/i);
    return match ? parseInt(match[1], 10) : 3; // Default to grade 3
  }

  /**
   * Calculates a normalized difficulty score (0-1) from difficulty level.
   * Used for filtering and sorting questions by difficulty.
   *
   * @param difficulty - The DifficultyLevel enum value
   * @returns Normalized difficulty score between 0 and 1
   *
   * @private
   */
  private calculateDifficultyScore(difficulty: DifficultyLevel): number {
    // Map difficulty levels to normalized scores
    const scoreMap: Record<DifficultyLevel, number> = {
      [DifficultyLevel.GRADE_3]: 0.3,
      [DifficultyLevel.GRADE_4]: 0.4,
      [DifficultyLevel.GRADE_5]: 0.5,
      [DifficultyLevel.GRADE_6]: 0.6,
      [DifficultyLevel.GRADE_7]: 0.7,
      [DifficultyLevel.GRADE_8]: 0.8,
    };

    return scoreMap[difficulty] || 0.3;
  }

  /**
   * Generates a unique ID for a question if none exists.
   * Uses timestamp and question hash for uniqueness.
   *
   * @param question - The MathQuestion to generate ID for
   * @returns Generated unique identifier
   *
   * @private
   */
  private generateQuestionId(question: MathQuestion): string {
    const timestamp = Date.now();
    const hash = this.simpleHash(question.question);
    return `q-${timestamp}-${hash}`;
  }

  /**
   * Generates a simple hash from a string for ID generation.
   *
   * @param str - The string to hash
   * @returns Simple numeric hash
   *
   * @private
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
