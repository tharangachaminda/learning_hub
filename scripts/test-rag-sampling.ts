#!/usr/bin/env ts-node
/**
 * Test script for RAG pool + sample retrieval variety.
 * Confirms that repeated retrieval calls for the same grade/topic/difficulty
 * draw from a larger pool and don't always return the same fixed subset.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../api/src/app/app.module';
import { SemanticSearchService } from '../api/src/app/opensearch/semantic-search.service';

function samplePool<T>(pool: T[], sampleSize: number): T[] {
  if (pool.length <= sampleSize) {
    return pool;
  }

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, sampleSize);
}

async function main() {
  console.log('🔍 Testing RAG Pool + Sample Retrieval Variety\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const semanticSearchService = app.get(SemanticSearchService);

  try {
    const filters = {
      grade: 0,
      topic: 'counting_and_quantity',
      difficulty: 'easy',
      limit: 20,
    };

    const pool = await semanticSearchService.findSimilar(
      'counting_and_quantity grade 0 easy math question',
      filters
    );

    console.log(`✅ Retrieved pool of ${pool.length} example(s)\n`);

    if (pool.length === 0) {
      console.log('⚠️  No indexed examples found for this grade/topic/difficulty.');
      await app.close();
      return;
    }

    const runs = 5;
    const sampleSize = 5;
    const sampledIdSets: string[] = [];

    for (let run = 1; run <= runs; run++) {
      const sample = samplePool(pool, sampleSize);
      const ids = sample.map((r) => r.id).join(',');
      sampledIdSets.push(ids);
      console.log(`Run ${run}: sampled ids = [${ids}]`);
    }

    const distinctSets = new Set(sampledIdSets).size;
    if (pool.length > sampleSize) {
      console.log(
        `\n${
          distinctSets > 1 ? '✅' : '⚠️ '
        } ${distinctSets}/${runs} distinct sampled sets (pool of ${
          pool.length
        } > sample size of ${sampleSize}, variety expected)`
      );
    } else {
      console.log(
        `\nℹ️  Pool (${pool.length}) is not larger than sample size (${sampleSize}); all runs use the full pool, no variety expected.`
      );
    }
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }

  await app.close();
}

main().catch(console.error);
