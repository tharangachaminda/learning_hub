import { Injectable, Logger } from '@nestjs/common';
import {
  SemanticSearchService,
  SearchFilters,
  SearchResult,
} from './semantic-search.service';

/**
 * Information about a detected duplicate question
 */
export interface DuplicateInfo {
  isDuplicate: true;
  existingQuestion: SearchResult;
  similarityScore: number;
}

/**
 * Service for detecting duplicate questions using semantic similarity
 *
 * Uses vector embeddings and kNN search to identify questions that are
 * semantically similar to existing questions in the index. Helps prevent
 * generation of near-identical questions and improves content variety.
 *
 * @example
 * ```typescript
 * const duplicate = await duplicateDetection.checkDuplicate(
 *   'What is 5 + 3?',
 *   { grade: 3, topic: 'addition' }
 * );
 *
 * if (duplicate) {
 *   console.log(`Found duplicate: ${duplicate.existingQuestion.questionText}`);
 *   console.log(`Similarity: ${duplicate.similarityScore}`);
 * }
 * ```
 */
@Injectable()
export class DuplicateDetectionService {
  private readonly logger = new Logger(DuplicateDetectionService.name);
  private readonly DEFAULT_THRESHOLD = 0.9;
  private readonly SEARCH_LIMIT = 20;

  constructor(private readonly semanticSearchService: SemanticSearchService) {}

  /**
   * Check if a question is a duplicate of an existing question
   *
   * Performs semantic similarity search and returns information about the
   * most similar existing question if similarity exceeds the threshold.
   *
   * @param questionText - The question text to check for duplicates
   * @param filters - Optional filters to narrow the search scope (grade, topic, operation, excludeIds)
   * @param threshold - Similarity threshold (0-1). Default is 0.9. Questions with similarity >= threshold are considered duplicates
   * @returns DuplicateInfo if duplicate found (similarity >= threshold), null otherwise
   * @throws Error if semantic search fails
   *
   * @example
   * ```typescript
   * // Check for duplicates with default threshold (0.9)
   * const result = await service.checkDuplicate('What is 5 + 3?');
   *
   * // Check with filters
   * const result = await service.checkDuplicate(
   *   'What is 5 + 3?',
   *   { grade: 3, topic: 'addition' }
   * );
   *
   * // Check with custom threshold
   * const result = await service.checkDuplicate(
   *   'What is 5 + 3?',
   *   {},
   *   0.95
   * );
   * ```
   */
  async checkDuplicate(
    questionText: string,
    filters?: SearchFilters,
    threshold: number = this.DEFAULT_THRESHOLD
  ): Promise<DuplicateInfo | null> {
    try {
      // Search for similar questions with higher limit to catch potential duplicates
      const similarQuestions = await this.semanticSearchService.findSimilar(
        questionText,
        {
          ...filters,
          limit: this.SEARCH_LIMIT,
        }
      );

      // Filter by threshold and find highest similarity
      const duplicates = similarQuestions.filter(
        (q) => q.similarityScore >= threshold
      );

      if (duplicates.length === 0) {
        return null;
      }

      // Return the highest similarity match
      const highestMatch = duplicates.reduce((prev, current) =>
        current.similarityScore > prev.similarityScore ? current : prev
      );

      this.logger.log(
        `Duplicate detected: "${questionText}" similar to "${highestMatch.questionText}" (score: ${highestMatch.similarityScore})`
      );

      return {
        isDuplicate: true,
        existingQuestion: highestMatch,
        similarityScore: highestMatch.similarityScore,
      };
    } catch (error) {
      this.logger.error(
        `Failed to check for duplicate: ${questionText}`,
        error instanceof Error ? error.stack : String(error)
      );
      throw new Error('Failed to check for duplicate questions');
    }
  }
}
