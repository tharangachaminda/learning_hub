import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { VectorIndexService } from './vector-index.service';
import {
  MathQuestion,
  DifficultyLevel,
} from '../math-questions/entities/math-question.entity';

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
      // Ensure index exists before indexing
      await this.vectorIndexService.createIndexIfNotExists();

      // Generate embedding for question text
      const embedding = await this.embeddingService.generateEmbedding(
        question.question
      );

      // Extract metadata from question
      const metadata = this.extractMetadata(question);

      // Index in OpenSearch
      await this.vectorIndexService.indexQuestion(
        question.id || this.generateQuestionId(question),
        question.question,
        question.answer,
        embedding,
        {
          grade: metadata.grade.toString(),
          topic: metadata.topic,
          operation: metadata.operation,
          difficulty: metadata.difficulty,
          difficulty_score: metadata.difficulty_score,
          category: metadata.category,
          curriculum_strand: metadata.curriculum_strand,
        }
      );

      this.logger.log(
        `Successfully indexed question: ${question.id || 'generated-id'}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to index question: ${question.question}`,
        error.stack
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
      // Ensure index exists before bulk indexing
      await this.vectorIndexService.createIndexIfNotExists();

      // Generate embeddings for all questions
      const questionTexts = questions.map((q) => q.question);
      const embeddings = await this.embeddingService.generateBatchEmbeddings(
        questionTexts
      );

      // Prepare documents for bulk indexing
      const documents = questions.map((question, index) => ({
        id: question.id || this.generateQuestionId(question),
        questionText: question.question,
        answer: question.answer,
        embedding: embeddings[index],
        metadata: this.extractMetadata(question),
      }));

      // Bulk index in OpenSearch
      await this.vectorIndexService.bulkIndexQuestions(documents);

      this.logger.log(
        `Successfully indexed ${questions.length} questions in batch`
      );
    } catch (error) {
      this.logger.error(
        `Failed to index ${questions.length} questions in batch`,
        error.stack
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
  } {
    return {
      grade: this.extractGrade(question.difficulty),
      topic: question.operation,
      operation: question.operation,
      difficulty: question.difficulty,
      difficulty_score: this.calculateDifficultyScore(question.difficulty),
      generation_timestamp: question.createdAt,
      category: 'math',
      curriculum_strand: 'number',
    };
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
