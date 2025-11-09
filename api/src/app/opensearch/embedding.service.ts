import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/**
 * Service for generating text embeddings using Ollama's nomic-embed-text model.
 * Provides 768-dimensional embeddings suitable for semantic search and similarity comparison.
 * Includes caching mechanism to avoid redundant embedding generation.
 *
 * @example
 * ```typescript
 * const embedding = await embeddingService.generateEmbedding('What is 5 + 3?');
 * console.log(embedding.length); // 768
 * ```
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly ollamaUrl: string;
  private readonly embeddingModel = 'nomic-embed-text';
  private readonly expectedDimensions = 768;
  private readonly embeddingCache: Map<string, number[]> = new Map();
  private readonly maxCacheSize = 1000;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.ollamaUrl = this.configService.get<string>(
      'OLLAMA_URL',
      'http://localhost:11434'
    );
  }

  /**
   * Generates a 768-dimensional embedding vector for the given text.
   * Uses Ollama's nomic-embed-text model which produces embeddings compatible
   * with semantic search and similarity comparison.
   *
   * Results are cached to improve performance for repeated queries.
   *
   * @param text - The text to generate an embedding for
   * @returns Promise resolving to a 384-dimensional number array
   * @throws Error if Ollama is unreachable or returns invalid embedding
   *
   * @example
   * ```typescript
   * const embedding = await embeddingService.generateEmbedding('Calculate 10 + 5');
   * console.log(embedding.length); // 384
   * ```
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cached = this.embeddingCache.get(text);
    if (cached) {
      this.logger.debug(`Cache hit for text: ${text.substring(0, 50)}...`);
      return cached;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.ollamaUrl}/api/embeddings`, {
          model: this.embeddingModel,
          prompt: text,
        })
      );

      if (!response.data.embedding) {
        throw new Error('No embedding returned from Ollama');
      }

      const embedding: number[] = response.data.embedding;

      // Validate dimensions
      if (embedding.length !== this.expectedDimensions) {
        throw new Error(
          `Invalid embedding dimensions: expected ${this.expectedDimensions}, got ${embedding.length}`
        );
      }

      // Cache the result (with size limit)
      if (this.embeddingCache.size < this.maxCacheSize) {
        this.embeddingCache.set(text, embedding);
      } else {
        // Simple cache eviction: remove first entry
        const firstKey = this.embeddingCache.keys().next().value;
        this.embeddingCache.delete(firstKey);
        this.embeddingCache.set(text, embedding);
      }

      this.logger.debug(
        `Generated ${
          embedding.length
        }-dimensional embedding for text: ${text.substring(0, 50)}...`
      );

      return embedding;
    } catch (error) {
      this.logger.error(`Failed to generate embedding for text: ${text}`);
      throw new Error(
        `Failed to generate embedding: ${error.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Generates embeddings for multiple texts in batch.
   * Processes each text sequentially to avoid overwhelming the Ollama server.
   *
   * @param texts - Array of texts to generate embeddings for
   * @returns Promise resolving to array of 384-dimensional embeddings
   * @throws Error if any embedding generation fails
   *
   * @example
   * ```typescript
   * const texts = ['What is 5 + 3?', 'Calculate 10 - 4', 'Solve 7 × 2'];
   * const embeddings = await embeddingService.generateBatchEmbeddings(texts);
   * console.log(embeddings.length); // 3
   * console.log(embeddings[0].length); // 384
   * ```
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const embeddings: number[][] = [];

    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }

    this.logger.log(`Generated ${embeddings.length} embeddings in batch`);

    return embeddings;
  }

  /**
   * Clears the embedding cache.
   * Useful for testing or when memory management is needed.
   *
   * @example
   * ```typescript
   * embeddingService.clearCache();
   * console.log(embeddingService.getCacheStats().size); // 0
   * ```
   */
  clearCache(): void {
    this.embeddingCache.clear();
    this.logger.debug('Embedding cache cleared');
  }

  /**
   * Returns statistics about the embedding cache.
   *
   * @returns Object containing cache size and maximum size
   *
   * @example
   * ```typescript
   * const stats = embeddingService.getCacheStats();
   * console.log(`Cache: ${stats.size}/${stats.maxSize}`);
   * ```
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.embeddingCache.size,
      maxSize: this.maxCacheSize,
    };
  }
}
