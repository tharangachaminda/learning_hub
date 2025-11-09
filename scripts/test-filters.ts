#!/usr/bin/env ts-node
/**
 * Test script for semantic search filters
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../api/src/app/app.module';
import { SemanticSearchService } from '../api/src/app/opensearch/semantic-search.service';

async function main() {
  console.log('🔍 Testing Semantic Search Filters\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const semanticSearchService = app.get(SemanticSearchService);

  try {
    // Test 1: No filters
    console.log('Test 1: No filters');
    const results1 = await semanticSearchService.findSimilar(
      'division problem',
      {
        limit: 3,
      }
    );
    console.log(`✅ Found ${results1.length} results\n`);

    // Test 2: Grade filter
    console.log('Test 2: With grade filter (grade=3)');
    const results2 = await semanticSearchService.findSimilar(
      'division problem',
      {
        grade: 3,
        limit: 3,
      }
    );
    console.log(`✅ Found ${results2.length} results`);
    results2.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.questionText} (Grade: ${r.metadata.grade})`);
    });
    console.log();

    // Test 3: Topic filter
    console.log('Test 3: With topic filter (topic=addition)');
    const results3 = await semanticSearchService.findSimilar('solve math', {
      topic: 'addition',
      limit: 3,
    });
    console.log(`✅ Found ${results3.length} results`);
    results3.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.questionText} (Topic: ${r.metadata.topic})`);
    });
    console.log();

    // Test 4: Grade + Topic filter
    console.log('Test 4: With grade + topic filter (grade=3, topic=addition)');
    const results4 = await semanticSearchService.findSimilar('calculate sum', {
      grade: 3,
      topic: 'addition',
      limit: 3,
    });
    console.log(`✅ Found ${results4.length} results`);
    results4.forEach((r, i) => {
      console.log(
        `  ${i + 1}. ${r.questionText} (Grade: ${r.metadata.grade}, Topic: ${
          r.metadata.topic
        })`
      );
    });
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }

  await app.close();
}

main().catch(console.error);
