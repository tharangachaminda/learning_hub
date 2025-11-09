import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { OpenSearchService } from './opensearch.service';
import { VectorIndexService } from './vector-index.service';
import { EmbeddingService } from './embedding.service';
import { QuestionIndexingService } from './question-indexing.service';
import { SemanticSearchService } from './semantic-search.service';

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
  imports: [ConfigModule, HttpModule],
  providers: [
    OpenSearchService,
    VectorIndexService,
    EmbeddingService,
    QuestionIndexingService,
    SemanticSearchService,
  ],
  exports: [
    OpenSearchService,
    VectorIndexService,
    EmbeddingService,
    QuestionIndexingService,
    SemanticSearchService,
  ],
})
export class OpenSearchModule {}
