#!/usr/bin/env ts-node
/**
 * Test script for semantic search
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../api/src/app/app.module';
import { SemanticSearchService } from '../api/src/app/opensearch/semantic-search.service';

async function main() {
  console.log('🔍 Testing Semantic Search\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const semanticSearchService = app.get(SemanticSearchService);

  try {
    console.log('🔎 Searching for: "What is 5 + 3?"\n');

    const results = await semanticSearchService.findSimilar('What is 5 + 3?', {
      limit: 5,
    });

    console.log(`✅ Found ${results.length} results:\n`);

    results.forEach((result, i) => {
      console.log(`${i + 1}. ${result.questionText}`);
      console.log(`   Answer: ${result.answer}`);
      console.log(
        `   Similarity: ${(result.similarityScore * 100).toFixed(1)}%`
      );
      console.log(`   Grade: ${result.metadata?.grade || 'N/A'}`);
      console.log();
    });
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }

  await app.close();
}

main().catch(console.error);
