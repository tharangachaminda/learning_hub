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
  difficulty?: string;
  excludeIds?: string[];
  limit?: number;
}

/**
 * Search result with similarity score
 */
export interface SearchResult {
  id: string;
  questionText: string;
  answer: number | string;
  similarityScore: number;
  metadata: {
    grade: string;
    topic: string;
    operation: string;
    difficulty: string;
    [key: string]: unknown;
  };
}

type KeywordTermClause = {
  term: Record<string, string>;
};

type IdsClause = {
  ids: { values: string[] };
};

type BoolClause = {
  bool: {
    must?: FilterClause[];
    must_not?: IdsClause[];
    should?: KeywordTermClause[];
    minimum_should_match?: 1;
  };
};

type FilterClause = KeywordTermClause | BoolClause;

type KnnQuery = Record<string, unknown> & {
  knn: {
    embedding: {
      vector: number[];
      k: number;
      filter?: FilterClause;
    };
  };
};

interface RawSearchHit {
  _id: string;
  _score: number;
  _source: {
    questionText: string;
    answer: number;
    answerText?: string;
    metadata: SearchResult['metadata'];
  };
}

interface RawSearchResponse {
  hits?: {
    hits?: RawSearchHit[];
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
      if (this.isOpenSearchUnavailableError(error)) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `OpenSearch unavailable for kNN search, continuing without RAG context: ${message}`
        );
        return [];
      }

      this.logger.error('Failed to execute kNN search', error.stack);
      throw new Error(`Failed to find similar questions: ${error.message}`);
    }
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
  ): KnnQuery {
    const knnQuery: KnnQuery = {
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
      if (
        filterClauses.must.length === 1 &&
        filterClauses.must_not.length === 0
      ) {
        knnQuery.knn.embedding.filter = filterClauses.must[0];
      } else {
        knnQuery.knn.embedding.filter = {
          bool: {},
        };

        if (filterClauses.must.length > 0) {
          knnQuery.knn.embedding.filter.bool.must = filterClauses.must;
        }

        if (filterClauses.must_not.length > 0) {
          knnQuery.knn.embedding.filter.bool.must_not = filterClauses.must_not;
        }
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
    must: FilterClause[];
    must_not: IdsClause[];
  } {
    const must: FilterClause[] = [];
    const must_not: IdsClause[] = [];

    // Grade filter
    if (filters.grade !== undefined) {
      must.push({
        term: { 'metadata.grade': filters.grade.toString() },
      });
    }

    // Topic filter
    if (filters.topic) {
      must.push(this.buildTopicFilter(filters.topic));
    }

    // Operation filter
    if (filters.operation) {
      must.push(this.buildOperationFilter(filters.operation));
    }

    // Difficulty filter
    if (filters.difficulty) {
      must.push({
        term: { 'metadata.difficulty': filters.difficulty },
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

  private buildTopicFilter(topic: string): BoolClause {
    return this.buildKeywordShouldFilter(topic, [
      'metadata.topic',
      'metadata.source_topic_key',
      'metadata.resolved_topic_key',
    ]);
  }

  private buildOperationFilter(operation: string): BoolClause {
    return this.buildKeywordShouldFilter(operation, [
      'metadata.operation',
      'metadata.topic',
      'metadata.source_topic_key',
    ]);
  }

  private buildKeywordShouldFilter(
    value: string,
    fields: string[]
  ): BoolClause {
    const normalizedValues = Array.from(
      new Set([value, value.toUpperCase(), value.toLowerCase()])
    );

    return {
      bool: {
        should: fields.flatMap((field) =>
          normalizedValues.map((normalizedValue) => ({
            term: { [field]: normalizedValue },
          }))
        ),
        minimum_should_match: 1,
      },
    };
  }

  /**
   * Transforms OpenSearch results to SearchResult format.
   *
   * @param searchResults - Raw OpenSearch search results
   * @returns Array of transformed search results
   *
   * @private
   */
  private transformSearchResults(
    searchResults: RawSearchResponse
  ): SearchResult[] {
    if (!searchResults.hits || !searchResults.hits.hits) {
      return [];
    }

    return searchResults.hits.hits.map((hit) => ({
      id: hit._id,
      questionText: hit._source.questionText,
      answer: hit._source.answerText ?? hit._source.answer,
      similarityScore: hit._score,
      metadata: hit._source.metadata,
    }));
  }
}
