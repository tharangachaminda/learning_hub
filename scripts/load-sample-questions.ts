#!/usr/bin/env ts-node
/**
 * Script to load sample questions from ai_education_questions_dataset.json
 * into OpenSearch with embeddings for semantic search testing
 *
 * Usage:
 *   npx ts-node scripts/load-sample-questions.ts [--limit=100]
 *
 * Options:
 *   --limit=N    Only load first N questions (default: all)
 *   --batch=N    Batch size for indexing (default: 50)
 *   --dry-run    Don't actually index, just show what would be indexed
 */

import * as fs from 'fs';
import * as path from 'path';

interface DatasetQuestion {
  question_id: string;
  difficulty: string;
  prompt: string;
  answer: string;
  explanation: string;
  source: string;
  tone: string;
}

interface DatasetItem {
  grade: number;
  subject: string;
  topic: string;
  category: string;
  questions: DatasetQuestion[];
}

interface Dataset {
  generated_at: string;
  curriculum: string;
  items: DatasetItem[];
}

interface QuestionToIndex {
  questionText: string;
  answer: number;
  metadata: {
    grade: number;
    topic: string;
    operation: string;
    difficulty: string;
    difficulty_score: number;
    category: string;
    curriculum_strand: string;
    source: string;
    tone: string;
    original_id: string;
  };
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    limit: Infinity,
    batch: 50,
    dryRun: false,
  };

  args.forEach((arg) => {
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--batch=')) {
      options.batch = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  });

  return options;
}

// Convert difficulty string to score
function getDifficultyScore(difficulty: string): number {
  const scores: Record<string, number> = {
    easy: 1,
    medium: 2,
    hard: 3,
  };
  return scores[difficulty.toLowerCase()] || 1;
}

// Parse answer to number (handles various formats)
function parseAnswer(answer: string): number {
  // Remove non-numeric characters except decimal point and negative sign
  const cleaned = answer.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Transform dataset questions to our format
function transformQuestions(
  dataset: Dataset,
  limit: number
): QuestionToIndex[] {
  const questions: QuestionToIndex[] = [];
  let count = 0;

  for (const item of dataset.items) {
    if (count >= limit) break;

    for (const q of item.questions) {
      if (count >= limit) break;

      questions.push({
        questionText: q.prompt,
        answer: parseAnswer(q.answer),
        metadata: {
          grade: item.grade,
          topic: item.topic.toLowerCase(),
          operation: item.topic.toLowerCase(), // Use lowercase topic as operation
          difficulty: q.difficulty.toLowerCase(), // Keep original difficulty: easy/medium/hard
          difficulty_score: getDifficultyScore(q.difficulty),
          category: item.category,
          curriculum_strand: 'number-operations',
          source: q.source,
          tone: q.tone,
          original_id: q.question_id,
        },
      });

      count++;
    }
  }

  return questions;
}

// Main execution
async function main() {
  const options = parseArgs();

  console.log('🚀 OpenSearch Data Loader');
  console.log('========================\n');

  // Read dataset
  const datasetPath = path.join(
    __dirname,
    '..',
    'ai_education_questions_dataset.json'
  );
  console.log(`📖 Reading dataset: ${datasetPath}`);

  if (!fs.existsSync(datasetPath)) {
    console.error('❌ Dataset file not found!');
    console.error(`   Expected: ${datasetPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(datasetPath, 'utf-8');
  const dataset: Dataset = JSON.parse(rawData);

  console.log(`✅ Dataset loaded: ${dataset.items.length} topics`);
  console.log(`   Generated at: ${dataset.generated_at}`);
  console.log(`   Curriculum: ${dataset.curriculum}\n`);

  // Transform questions
  console.log(
    `🔄 Transforming questions (limit: ${
      options.limit === Infinity ? 'all' : options.limit
    })...`
  );
  const questions = transformQuestions(dataset, options.limit);
  console.log(`✅ Transformed ${questions.length} questions\n`);

  if (options.dryRun) {
    console.log('🔍 DRY RUN - Sample questions:');
    questions.slice(0, 5).forEach((q, i) => {
      console.log(`\n${i + 1}. ${q.questionText}`);
      console.log(`   Answer: ${q.answer}`);
      console.log(
        `   Grade: ${q.metadata.grade}, Topic: ${q.metadata.topic}, Difficulty: ${q.metadata.difficulty}`
      );
    });
    console.log(`\n... and ${questions.length - 5} more questions\n`);
    console.log(
      '✅ Dry run complete. Use without --dry-run to actually index.'
    );
    return;
  }

  // Bootstrap NestJS app to access services
  console.log('🏗️  Bootstrapping NestJS application...');

  // Dynamic import to avoid issues with decorators
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('../api/src/app/app.module');
  const { QuestionIndexingService } = await import(
    '../api/src/app/opensearch/question-indexing.service'
  );
  const { VectorIndexService } = await import(
    '../api/src/app/opensearch/vector-index.service'
  );
  const { MathQuestion, OperationType, DifficultyLevel } = await import(
    '../api/src/app/math-questions/entities/math-question.entity'
  );

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const questionIndexingService = app.get(QuestionIndexingService);
  const vectorIndexService = app.get(VectorIndexService);

  console.log('✅ Application context created\n');

  // Ensure index exists
  console.log('📊 Checking vector index...');
  await vectorIndexService.createIndexIfNotExists();
  console.log('✅ Vector index ready\n');

  // Index questions in batches
  console.log(
    `📝 Indexing ${questions.length} questions (batch size: ${options.batch})...`
  );

  let indexed = 0;
  let errors = 0;
  const startTime = Date.now();

  // Import EmbeddingService for generating embeddings
  const { EmbeddingService } = await import(
    '../api/src/app/opensearch/embedding.service'
  );
  const embeddingService = app.get(EmbeddingService);

  for (let i = 0; i < questions.length; i += options.batch) {
    const batch = questions.slice(i, i + options.batch);
    const batchNum = Math.floor(i / options.batch) + 1;
    const totalBatches = Math.ceil(questions.length / options.batch);

    console.log(
      `\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} questions)...`
    );

    try {
      // Generate embeddings for batch
      const questionTexts = batch.map((q) => q.questionText);
      const embeddings = await embeddingService.generateBatchEmbeddings(
        questionTexts
      );

      // Prepare documents with correct metadata (bypass MathQuestion entity)
      const documents = batch.map((q, idx) => ({
        id: `imported-${q.metadata.original_id}`,
        questionText: q.questionText,
        answer: q.answer,
        embedding: embeddings[idx],
        metadata: {
          grade: q.metadata.grade,
          topic: q.metadata.topic,
          operation: q.metadata.operation,
          difficulty: q.metadata.difficulty, // Use original difficulty from dataset
          difficulty_score: q.metadata.difficulty_score,
          generation_timestamp: new Date(),
          category: q.metadata.category,
          curriculum_strand: q.metadata.curriculum_strand,
          source: q.metadata.source,
          tone: q.metadata.tone,
          original_id: q.metadata.original_id,
        },
      }));

      // Index directly using vectorIndexService to preserve metadata
      await vectorIndexService.bulkIndexQuestions(documents);
      indexed += batch.length;

      console.log(`   ✅ Success: ${batch.length} questions indexed`);

      // Progress indicator
      const progress = Math.round(
        ((i + batch.length) / questions.length) * 100
      );
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const rate = elapsed > 0 ? Math.round((i + batch.length) / elapsed) : 0;
      console.log(
        `   📊 Progress: ${progress}% | ${i + batch.length}/${
          questions.length
        } | ${rate} q/s`
      );
    } catch (error) {
      console.error(
        `   ❌ Batch failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      errors += batch.length;
    }

    // Small delay between batches to avoid overwhelming services
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000);
  const avgRate = Math.round(indexed / totalTime);

  console.log('\n🎉 Indexing Complete!');
  console.log('===================');
  console.log(`✅ Successfully indexed: ${indexed} questions`);
  if (errors > 0) {
    console.log(`❌ Failed: ${errors} questions`);
  }
  console.log(`⏱️  Total time: ${totalTime}s (avg: ${avgRate} q/s)`);
  console.log(`\n💡 You can now test semantic search with:`);
  console.log(
    `   curl -X POST http://localhost:3000/api/math-questions/similar \\`
  );
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"questionText": "What is 5 + 3?", "grade": 3}'\n`);

  await app.close();
}

// Run script
main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
