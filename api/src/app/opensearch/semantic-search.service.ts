import { Injectable, Logger } from '@nestjs/common';
import { OpenSearchService } from './opensearch.service';
import { EmbeddingService } from './embedding.service';

/**
 * Filters for semantic search queries
 */
export interface SearchFilters {
  grade?: number;
  topic?: string;
  operation?: string;
  excludeIds?: string[];
  limit?: number;
}

/**
 * Search result with similarity score
 */
export interface SearchResult {
  id: string;
  questionText: string;
  answer: number;
  similarityScore: number;
  metadata: {
    grade: string;
    topic: string;
    operation: string;
    difficulty: string;
    [key: string]: any;
  };
}

/**
 * Service for semantic similarity search using kNN vector search.
 * Finds similar math questions based on embedding vectors.
 *
 * @example
 * ```typescript
 * const results = await semanticSearchService.findSimilar(
 *   'What is 5 + 3?',
 *   { grade: 3, limit: 5 }
 * );
 * console.log(`Found ${results.length} similar questions`);
 * ```
 */
@Injectable()
export class SemanticSearchService {
  private readonly logger = new Logger(SemanticSearchService.name);
  private readonly indexName = 'math-questions';

  constructor(
    private readonly openSearchService: OpenSearchService,
    private readonly embeddingService: EmbeddingService
  ) {}

  /**
   * Finds similar questions based on question text using semantic search.
   * Generates embedding for the input text and performs kNN search.
   *
   * @param questionText - The question text to find similar questions for
   * @param filters - Optional filters for grade, topic, operation, etc.
   * @returns Promise resolving to array of similar questions with scores
   * @throws Error if embedding generation or search fails
   *
   * @example
   * ```typescript
   * const similar = await semanticSearchService.findSimilar(
   *   'Calculate 7 + 5',
   *   { grade: 3, topic: 'addition', limit: 10 }
   * );
   * similar.forEach(q => console.log(q.questionText, q.similarityScore));
   * ```
   */
  async findSimilar(
    questionText: string,
    filters: SearchFilters = {}
  ): Promise<SearchResult[]> {
    try {
      // Generate embedding for the question text
      const embedding = await this.embeddingService.generateEmbedding(
        questionText
      );

      // Perform kNN search with the embedding
      return await this.findSimilarByEmbedding(embedding, filters);
    } catch (error) {
      this.logger.error(
        `Failed to find similar questions for: ${questionText}`,
        error.stack
      );
      throw new Error(`Failed to find similar questions: ${error.message}`);
    }
  }

  /**
   * Finds similar questions using a pre-computed embedding vector.
   * Useful when embedding is already available.
   *
   * @param embedding - 384-dimensional embedding vector
   * @param filters - Optional filters for grade, topic, operation, etc.
   * @returns Promise resolving to array of similar questions with scores
   * @throws Error if search fails
   *
   * @example
   * ```typescript
   * const embedding = [0.1, 0.2, ...]; // 384 dimensions
   * const similar = await semanticSearchService.findSimilarByEmbedding(
   *   embedding,
   *   { grade: 3 }
   * );
   * ```
   */
  async findSimilarByEmbedding(
    embedding: number[],
    filters: SearchFilters = {}
  ): Promise<SearchResult[]> {
    try {
      const k = filters.limit || 10;

      // Build the kNN query
      const query = this.buildKnnQuery(embedding, k, filters);

      // Execute search
      const searchResults = await this.openSearchService.search(
        this.indexName,
        query,
        k
      );

      // Transform results
      return this.transformSearchResults(searchResults);
    } catch (error) {
      this.logger.error('Failed to execute kNN search', error.stack);
      throw new Error(`Failed to find similar questions: ${error.message}`);
    }
  }

  /**
   * Builds OpenSearch kNN query with filters.
   *
   * @param embedding - 384-dimensional embedding vector
   * @param k - Number of nearest neighbors to retrieve
   * @param filters - Filters to apply to the search
   * @returns OpenSearch query object
   *
   * @private
   */
  private buildKnnQuery(
    embedding: number[],
    k: number,
    filters: SearchFilters
  ): any {
    const knnQuery: any = {
      knn: {
        embedding: {
          vector: embedding,
          k,
        },
      },
    };

    // Build filter query if filters are provided
    const filterClauses = this.buildFilterClauses(filters);

    if (filterClauses.must.length > 0 || filterClauses.must_not.length > 0) {
      knnQuery.knn.embedding.filter = {
        bool: {},
      };

      if (filterClauses.must.length > 0) {
        if (filterClauses.must.length === 1) {
          knnQuery.knn.embedding.filter = filterClauses.must[0];
        } else {
          knnQuery.knn.embedding.filter.bool.must = filterClauses.must;
        }
      }

      if (filterClauses.must_not.length > 0) {
        knnQuery.knn.embedding.filter.bool.must_not = filterClauses.must_not;
      }
    }

    return knnQuery;
  }

  /**
   * Builds filter clauses from search filters.
   *
   * @param filters - Search filters to convert to OpenSearch clauses
   * @returns Object with must and must_not filter arrays
   *
   * @private
   */
  private buildFilterClauses(filters: SearchFilters): {
    must: any[];
    must_not: any[];
  } {
    const must: any[] = [];
    const must_not: any[] = [];

    // Grade filter
    if (filters.grade !== undefined) {
      must.push({
        term: { 'metadata.grade': filters.grade },
      });
    }

    // Topic filter
    if (filters.topic) {
      must.push({
        term: { 'metadata.topic': filters.topic },
      });
    }

    // Operation filter
    if (filters.operation) {
      must.push({
        term: { 'metadata.operation': filters.operation },
      });
    }

    // Exclude IDs filter
    if (filters.excludeIds && filters.excludeIds.length > 0) {
      must_not.push({
        ids: { values: filters.excludeIds },
      });
    }

    return { must, must_not };
  }

  /**
   * Transforms OpenSearch results to SearchResult format.
   *
   * @param searchResults - Raw OpenSearch search results
   * @returns Array of transformed search results
   *
   * @private
   */
  private transformSearchResults(searchResults: any): SearchResult[] {
    if (!searchResults.hits || !searchResults.hits.hits) {
      return [];
    }

    return searchResults.hits.hits.map((hit: any) => ({
      id: hit._id,
      questionText: hit._source.questionText,
      answer: hit._source.answer,
      similarityScore: hit._score,
      metadata: hit._source.metadata,
    }));
  }
}
