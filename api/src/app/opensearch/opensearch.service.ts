import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@opensearch-project/opensearch';

/**
 * OpenSearch Service for vector storage and semantic search
 * 
 * Provides connection management and health checking for OpenSearch cluster.
 * Used for storing question embeddings and performing similarity searches.
 * 
 * @class OpenSearchService
 */
@Injectable()
export class OpenSearchService implements OnModuleInit {
  private readonly logger = new Logger(OpenSearchService.name);
  private client: Client;
  private readonly host: string;

  constructor(private configService: ConfigService) {
    this.host = this.configService.get<string>(
      'OPENSEARCH_HOST',
      'http://localhost:9200'
    );
  }

  /**
   * Initialize OpenSearch client on module initialization
   * 
   * Creates client connection and verifies cluster health.
   */
  async onModuleInit() {
    try {
      this.client = new Client({
        node: this.host,
        ssl: {
          rejectUnauthorized: false, // Development only
        },
      });

      // Verify connection
      const health = await this.checkHealth();
      if (health.status === 'healthy') {
        this.logger.log(
          `OpenSearch connected successfully to ${this.host}`
        );
      } else {
        this.logger.warn(
          `OpenSearch connection established but cluster unhealthy: ${health.clusterStatus}`
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to connect to OpenSearch at ${this.host}`,
        error
      );
      throw error;
    }
  }

  /**
   * Get OpenSearch client instance
   * 
   * @returns OpenSearch client for direct operations
   */
  getClient(): Client {
    if (!this.client) {
      throw new Error('OpenSearch client not initialized');
    }
    return this.client;
  }

  /**
   * Check OpenSearch cluster health
   * 
   * @returns Health status information
   * 
   * @example
   * const health = await opensearchService.checkHealth();
   * if (health.status === 'healthy') {
   *   console.log('OpenSearch is ready');
   * }
   */
  async checkHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    clusterStatus?: string;
    numberOfNodes?: number;
    error?: string;
  }> {
    try {
      const response = await this.client.cluster.health();
      
      return {
        status: response.body.status === 'red' ? 'unhealthy' : 'healthy',
        clusterStatus: response.body.status,
        numberOfNodes: response.body.number_of_nodes,
      };
    } catch (error) {
      this.logger.error('OpenSearch health check failed', error);
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  /**
   * Check if an index exists
   * 
   * @param indexName - Name of the index to check
   * @returns True if index exists, false otherwise
   */
  async indexExists(indexName: string): Promise<boolean> {
    try {
      const response = await this.client.indices.exists({
        index: indexName,
      });
      return response.body === true;
    } catch (error) {
      this.logger.error(`Error checking index existence: ${indexName}`, error);
      return false;
    }
  }

  /**
   * Create an index with specified mapping
   * 
   * @param indexName - Name of the index to create
   * @param mapping - Index mapping configuration
   * 
   * @example
   * await opensearchService.createIndex('math-questions', {
   *   properties: {
   *     embedding: { type: 'dense_vector', dims: 384 }
   *   }
   * });
   */
  async createIndex(indexName: string, mapping: any): Promise<void> {
    try {
      const exists = await this.indexExists(indexName);
      if (exists) {
        this.logger.log(`Index ${indexName} already exists`);
        return;
      }

      await this.client.indices.create({
        index: indexName,
        body: {
          mappings: mapping,
        },
      });

      this.logger.log(`Index ${indexName} created successfully`);
    } catch (error) {
      this.logger.error(`Error creating index: ${indexName}`, error);
      throw error;
    }
  }

  /**
   * Delete an index (primarily for testing)
   * 
   * @param indexName - Name of the index to delete
   */
  async deleteIndex(indexName: string): Promise<void> {
    try {
      const exists = await this.indexExists(indexName);
      if (!exists) {
        this.logger.log(`Index ${indexName} does not exist, skipping deletion`);
        return;
      }

      await this.client.indices.delete({
        index: indexName,
      });

      this.logger.log(`Index ${indexName} deleted successfully`);
    } catch (error) {
      this.logger.error(`Error deleting index: ${indexName}`, error);
      throw error;
    }
  }

  /**
   * Index a document
   * 
   * @param indexName - Name of the index
   * @param id - Document ID
   * @param document - Document to index
   */
  async indexDocument(
    indexName: string,
    id: string,
    document: any
  ): Promise<void> {
    try {
      await this.client.index({
        index: indexName,
        id,
        body: document,
        refresh: true, // Make immediately searchable
      });

      this.logger.debug(`Document ${id} indexed in ${indexName}`);
    } catch (error) {
      this.logger.error(`Error indexing document ${id}`, error);
      throw error;
    }
  }

  /**
   * Bulk index multiple documents
   * 
   * @param indexName - Name of the index
   * @param documents - Array of documents with IDs
   */
  async bulkIndex(
    indexName: string,
    documents: Array<{ id: string; document: any }>
  ): Promise<void> {
    try {
      const body = documents.flatMap((doc) => [
        { index: { _index: indexName, _id: doc.id } },
        doc.document,
      ]);

      const response = await this.client.bulk({
        body,
        refresh: true,
      });

      if (response.body.errors) {
        this.logger.error('Bulk indexing encountered errors', response.body);
        throw new Error('Bulk indexing failed');
      }

      this.logger.log(`Bulk indexed ${documents.length} documents`);
    } catch (error) {
      this.logger.error('Error in bulk indexing', error);
      throw error;
    }
  }

  /**
   * Search documents using query
   * 
   * @param indexName - Name of the index
   * @param query - OpenSearch query DSL
   * @param size - Number of results to return
   * @returns Search results
   */
  async search(indexName: string, query: any, size: number = 10): Promise<any> {
    try {
      const response = await this.client.search({
        index: indexName,
        body: {
          query,
          size,
        },
      });

      return response.body;
    } catch (error) {
      this.logger.error('Error searching documents', error);
      throw error;
    }
  }
}
