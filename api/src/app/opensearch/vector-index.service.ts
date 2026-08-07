import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OpenSearchService } from '../opensearch/opensearch.service';

/**
 * Vector Index Service for Math Questions
 *
 * Manages the OpenSearch vector index for storing and searching
 * math question embeddings with metadata.
 *
 * @class VectorIndexService
 */
@Injectable()
export class VectorIndexService implements OnModuleInit {
  private readonly logger = new Logger(VectorIndexService.name);
  private readonly INDEX_NAME = 'math-questions';

  constructor(private readonly openSearchService: OpenSearchService) {}

  /**
   * Initialize vector index on module startup
   * Creates the index if it doesn't exist
   */
  async onModuleInit() {
    try {
      await this.createIndexIfNotExists();
      this.logger.log(`Vector index '${this.INDEX_NAME}' ready`);
    } catch (error) {
      this.logger.error('Failed to initialize vector index', error);
    }
  }

  /**
   * Get the index name
   *
   * @returns Index name for math questions
   */
  getIndexName(): string {
    return this.INDEX_NAME;
  }

  /**
   * Get the index mapping configuration for math questions
   *
   * Defines a 768-dimensional dense vector for embeddings (compatible with
   * nomic-embed-text model) with cosine similarity.
   *
   * @returns OpenSearch index mapping
   */
  getIndexMapping() {
    return {
      properties: {
        questionText: {
          type: 'text',
          analyzer: 'standard',
        },
        explanation: {
          type: 'text',
          analyzer: 'standard',
        },
        embedding: {
          type: 'knn_vector',
          dimension: 768,
          method: {
            name: 'hnsw',
            space_type: 'cosinesimil',
            engine: 'lucene',
            parameters: {
              ef_construction: 128,
              m: 24,
            },
          },
        },
        answer: {
          type: 'integer',
        },
        answerText: {
          type: 'keyword',
          ignore_above: 256,
        },
        metadata: {
          properties: {
            grade: {
              type: 'keyword',
            },
            topic: {
              type: 'keyword',
            },
            operation: {
              type: 'keyword',
            },
            difficulty: {
              type: 'keyword',
            },
            difficulty_score: {
              type: 'float',
            },
            generation_timestamp: {
              type: 'date',
            },
            category: {
              type: 'keyword',
            },
            curriculum_strand: {
              type: 'keyword',
            },
            subject: {
              type: 'keyword',
            },
            curriculum_version: {
              type: 'keyword',
            },
            resolved_topic_key: {
              type: 'keyword',
            },
            resolved_topic_label: {
              type: 'keyword',
            },
            curriculum_phase: {
              type: 'keyword',
            },
            source_topic_key: {
              type: 'keyword',
            },
          },
        },
      },
    };
  }

  /**
   * Get index settings for optimization
   *
   * @returns OpenSearch index settings
   */
  getIndexSettings() {
    return {
      index: {
        knn: true,
        'knn.algo_param.ef_search': 100,
        number_of_shards: 1,
        number_of_replicas: 0, // Single node development
      },
    };
  }

  /**
   * Create the vector index if it doesn't exist
   *
   * @returns Promise that resolves when index is created or already exists
   */
  async createIndexIfNotExists(): Promise<void> {
    const exists = await this.openSearchService.indexExists(this.INDEX_NAME);

    if (exists) {
      this.logger.log(`Index '${this.INDEX_NAME}' already exists`);
      return;
    }

    try {
      const client = this.openSearchService.getClient();
      await client.indices.create({
        index: this.INDEX_NAME,
        body: {
          settings: this.getIndexSettings(),
          mappings: this.getIndexMapping() as any, // OpenSearch types don't fully support knn_vector
        },
      });

      this.logger.log(`Vector index '${this.INDEX_NAME}' created successfully`);
    } catch (error) {
      if (this.isIndexAlreadyExistsError(error)) {
        this.logger.log(
          `Index '${this.INDEX_NAME}' already exists (race with existence check) — continuing`
        );
        return;
      }

      this.logger.error(`Failed to create index '${this.INDEX_NAME}'`, error);
      throw error;
    }
  }

  private isIndexAlreadyExistsError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    return error.message.includes('resource_already_exists_exception');
  }

  /**
   * Delete the vector index (primarily for testing)
   *
   * @returns Promise that resolves when index is deleted
   */
  async deleteIndex(): Promise<void> {
    try {
      await this.openSearchService.deleteIndex(this.INDEX_NAME);
      this.logger.log(`Index '${this.INDEX_NAME}' deleted successfully`);
    } catch (error) {
      this.logger.error(`Failed to delete index '${this.INDEX_NAME}'`, error);
      throw error;
    }
  }

  /**
   * Recreate the index (delete and create)
   * Useful for testing and schema updates
   *
   * @returns Promise that resolves when index is recreated
   */
  async recreateIndex(): Promise<void> {
    await this.deleteIndex();
    await this.createIndexIfNotExists();
    this.logger.log(`Index '${this.INDEX_NAME}' recreated successfully`);
  }

  /**
   * Get index statistics
   *
   * @returns Index stats including document count
   */
  async getIndexStats(): Promise<{
    documentCount: number;
    indexSize: string;
  }> {
    try {
      const client = this.openSearchService.getClient();
      const response = await client.cat.indices({
        index: this.INDEX_NAME,
        format: 'json',
      });

      const indexInfo = response.body[0];
      return {
        documentCount: parseInt(indexInfo['docs.count'], 10),
        indexSize: indexInfo['store.size'],
      };
    } catch (error) {
      this.logger.error('Failed to get index stats', error);
      throw error;
    }
  }

  /**
   * Index a question document with embedding
   *
   * @param questionId - Unique identifier for the question
   * @param questionText - The question text
   * @param explanation - Supporting explanation text
   * @param answer - The correct answer
   * @param embedding - 768-dimensional embedding vector
   * @param metadata - Additional metadata for filtering
   */
  async indexQuestion(
    questionId: string,
    questionText: string,
    explanation: string,
    answer: number,
    answerText: string | undefined,
    embedding: number[],
    metadata: {
      grade?: string;
      topic?: string;
      operation?: string;
      difficulty?: string;
      difficulty_score?: number;
      category?: string;
      curriculum_strand?: string;
      subject?: string;
      curriculum_version?: string;
      resolved_topic_key?: string;
      resolved_topic_label?: string;
      curriculum_phase?: string;
      source_topic_key?: string;
    }
  ): Promise<void> {
    const document = {
      questionText,
      explanation,
      answer,
      answerText,
      embedding,
      metadata: {
        ...metadata,
        generation_timestamp: new Date().toISOString(),
      },
    };

    await this.openSearchService.indexDocument(
      this.INDEX_NAME,
      questionId,
      document
    );

    this.logger.debug(`Question ${questionId} indexed successfully`);
  }

  /**
   * Bulk index multiple questions
   *
   * @param questions - Array of questions with embeddings
   */
  async bulkIndexQuestions(
    questions: Array<{
      id: string;
      questionText: string;
      explanation: string;
      answer: number;
      answerText?: string;
      embedding: number[];
      metadata: any;
    }>
  ): Promise<void> {
    const documents = questions.map((q) => ({
      id: q.id,
      document: {
        questionText: q.questionText,
        explanation: q.explanation,
        answer: q.answer,
        answerText: q.answerText,
        embedding: q.embedding,
        metadata: {
          ...q.metadata,
          generation_timestamp: new Date().toISOString(),
        },
      },
    }));

    await this.openSearchService.bulkIndex(this.INDEX_NAME, documents);
    this.logger.log(`Bulk indexed ${questions.length} questions`);
  }
}
