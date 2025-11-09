import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenSearchService } from './opensearch.service';
import { VectorIndexService } from './vector-index.service';

/**
 * OpenSearch Module
 *
 * Provides OpenSearch client and services for vector storage and semantic search.
 * Marked as @Global to make it available throughout the application.
 *
 * @module OpenSearchModule
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [OpenSearchService, VectorIndexService],
  exports: [OpenSearchService, VectorIndexService],
})
export class OpenSearchModule {}
