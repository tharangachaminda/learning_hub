#!/usr/bin/env ts-node
/**
 * reset-and-reseed-questions.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Wipes ALL documents from the MongoDB `questions` collection and the entire
 * OpenSearch `math-questions` index, then immediately reseeds from the
 * Maths Mate PDF-extracted JSON files.
 *
 * What it REMOVES
 * ───────────────
 *   • Every document in the MongoDB `questions` collection (AI-generated,
 *     old datasets, any prior Maths Mate records — everything)
 *   • The entire `math-questions` OpenSearch index
 *
 * What it ADDS BACK
 * ─────────────────
 *   • Only the questions extracted from the four Maths Mate PDFs
 *     (dev_resources/extracted_questions/all_questions.json)
 *
 * Safety
 * ──────
 *   The script prints a summary of what will be deleted and waits for
 *   confirmation before proceeding unless --force is passed.
 *
 * Usage
 * ──────
 *   npx ts-node --project scripts/tsconfig.json scripts/reset-and-reseed-questions.ts
 *   npx ts-node --project scripts/tsconfig.json scripts/reset-and-reseed-questions.ts --force
 *   npx ts-node --project scripts/tsconfig.json scripts/reset-and-reseed-questions.ts --dry-run
 *
 * Environment (defaults to dev docker-compose ports)
 * ──────────────────────────────────────────────────
 *   MONGODB_URI     mongodb://dev:dev123@localhost:27018/learning_hub_dev?authSource=admin
 *   OPENSEARCH_URL  http://localhost:9201
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as readline from 'readline';
import mongoose from 'mongoose';
import { Client as OpenSearchClient } from '@opensearch-project/opensearch';

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN  = args.includes('--dry-run');
const FORCE    = args.includes('--force');
const BATCH    = parseInt(args.find(a => a.startsWith('--batch='))?.split('=')[1] ?? '100', 10);
const INPUT_FILE = args.find(a => a.startsWith('--file='))?.split('=')[1] ?? 'all_questions.json';

// ─── Connection defaults (dev docker-compose) ────────────────────────────────

const MONGO_URI =
  process.env['MONGODB_URI'] ??
  'mongodb://dev:dev123@localhost:27018/learning_hub_dev?authSource=admin';

const OPENSEARCH_URL =
  process.env['OPENSEARCH_URL'] ??
  process.env['OPENSEARCH_HOST'] ??
  'http://localhost:9201';

const OPENSEARCH_INDEX = 'math-questions';

// ─── Strand → topic key (identical to seeder) ────────────────────────────────

const STRAND_TO_TOPIC_KEY: Record<string, string> = {
  'Whole Numbers to 10': 'ADDITION',
  'Whole Numbers to 12': 'ADDITION',
  Counting: 'ADDITION',
  'Addition / Subtraction': 'ADDITION',
  'Multiplication / Division': 'MULTIPLICATION',
  '+ Whole Numbers': 'ADDITION',
  '− Whole Numbers': 'SUBTRACTION',
  '× Whole Numbers': 'MULTIPLICATION',
  '÷ Whole Numbers': 'DIVISION',
  'Word Problems': 'ADVANCED_PROBLEM_SOLVING',
  Fractions: 'FRACTION_BASICS',
  'Place Value': 'PLACE_VALUE',
  'Word Numbers': 'PLACE_VALUE',
  Money: 'TIME_MEASUREMENT',
  'Number Patterns': 'PATTERN_RECOGNITION',
  Time: 'TIME_MEASUREMENT',
  Measuring: 'MEASUREMENT_MASTERY',
  Shapes: 'SHAPE_PROPERTIES',
  Location: 'COORDINATE_GEOMETRY',
  'Statistics / Probability': 'DATA_ANALYSIS',
  'Whole Numbers': 'ADVANCED_ARITHMETIC',
  'Fraction ,': 'FRACTION_OPERATIONS',
  'Decimal ,': 'DECIMAL_OPERATIONS',
  Decimals: 'DECIMAL_OPERATIONS',
  'Decimals / Fractions': 'FRACTION_OPERATIONS',
  Equations: 'ALGEBRAIC_EQUATIONS',
  'Rates / Ratios': 'RATIO_PROPORTION',
  'Exploring Numbers': 'PLACE_VALUE',
  'Exploring Number': 'PLACE_VALUE',
  'Location / Transformation': 'TRANSFORMATIONS_SYMMETRY',
  'Decimals / Fractions / Percentages': 'FRACTION_DECIMAL_PERCENTAGE',
  Percentages: 'FRACTION_DECIMAL_PERCENTAGE',
  Integers: 'NEGATIVE_NUMBERS',
  'Integer ,': 'NEGATIVE_NUMBERS',
  'Large Number': 'LARGE_NUMBER_OPERATIONS',
  'Large Number ,': 'LARGE_NUMBER_OPERATIONS',
  'Powers of 10 ,': 'LARGE_NUMBER_OPERATIONS',
  'Long ,': 'ADVANCED_NUMBER_OPERATIONS',
  Operations: 'ADVANCED_NUMBER_OPERATIONS',
  'Order of Operations': 'ADVANCED_NUMBER_OPERATIONS',
  'Indices / Square Roots': 'PRIME_COMPOSITE_NUMBERS',
  Indices: 'PRIME_COMPOSITE_NUMBERS',
  'Square Roots': 'PRIME_COMPOSITE_NUMBERS',
  'Multiples / Factors / Primes': 'PRIME_COMPOSITE_NUMBERS',
  Factorisation: 'ALGEBRAIC_MANIPULATION',
  Expansion: 'ALGEBRAIC_MANIPULATION',
  Substitution: 'ALGEBRAIC_FOUNDATIONS',
  Expressions: 'ALGEBRAIC_FOUNDATIONS',
  'Number Patterns / Equations': 'NUMBER_PATTERNS',
  'Linear Equations': 'LINEAR_EQUATIONS',
  'Coordinate Geometry': 'COORDINATE_GEOMETRY',
  Coordinates: 'COORDINATE_GEOMETRY',
  Probability: 'DATA_ANALYSIS_PROBABILITY',
  Statistics: 'DATA_ANALYSIS_PROBABILITY',
  'Financial Mathematics': 'FINANCIAL_LITERACY',
  'Perimeter / Area': 'PERIMETER_AREA_VOLUME',
  'Area / Volume': 'PERIMETER_AREA_VOLUME',
  Perimeter: 'PERIMETER_AREA_VOLUME',
  'Surface Area': 'PERIMETER_AREA_VOLUME',
  Volume: 'PERIMETER_AREA_VOLUME',
  Angles: 'GEOMETRY_SPATIAL_REASONING',
  'Geometric Reasoning': 'GEOMETRY_SPATIAL_REASONING',
  'Pythagoras / Trigonometry': 'GEOMETRY_SPATIAL_REASONING',
  'Units of Measurement': 'UNIT_CONVERSIONS',
  'Units of Measurement / Time': 'UNIT_CONVERSIONS',
  'Speed Calculations': 'SPEED_CALCULATIONS',
  'Ratios / Proportions': 'RATIOS_PROPORTIONS',
};

const TOPIC_TO_CATEGORY: Record<string, string> = {
  ADDITION: 'number-operations', SUBTRACTION: 'number-operations',
  MULTIPLICATION: 'number-operations', DIVISION: 'number-operations',
  DECIMAL_BASICS: 'number-operations', DECIMAL_OPERATIONS: 'number-operations',
  FRACTION_BASICS: 'number-operations', FRACTION_OPERATIONS: 'number-operations',
  FRACTION_DECIMAL_PERCENTAGE: 'number-operations',
  PLACE_VALUE: 'number-operations', ADVANCED_ARITHMETIC: 'number-operations',
  ADVANCED_NUMBER_OPERATIONS: 'number-operations',
  LARGE_NUMBER_OPERATIONS: 'number-operations', NEGATIVE_NUMBERS: 'number-operations',
  PRIME_COMPOSITE_NUMBERS: 'number-operations',
  NUMBER_PATTERNS: 'algebra-patterns', PATTERN_RECOGNITION: 'algebra-patterns',
  ALGEBRAIC_THINKING: 'algebra-patterns', ALGEBRAIC_EQUATIONS: 'algebra-patterns',
  ALGEBRAIC_FOUNDATIONS: 'algebra-patterns', ALGEBRAIC_MANIPULATION: 'algebra-patterns',
  LINEAR_EQUATIONS: 'algebra-patterns', ADVANCED_PATTERNS: 'algebra-patterns',
  RATIO_PROPORTION: 'number-operations', RATIOS_PROPORTIONS: 'number-operations',
  SHAPE_PROPERTIES: 'geometry-measurement', GEOMETRY_SPATIAL_REASONING: 'geometry-measurement',
  COORDINATE_GEOMETRY: 'geometry-measurement', TRANSFORMATIONS_SYMMETRY: 'geometry-measurement',
  PERIMETER_AREA_VOLUME: 'geometry-measurement', MEASUREMENT_MASTERY: 'geometry-measurement',
  TIME_MEASUREMENT: 'geometry-measurement', UNIT_CONVERSIONS: 'geometry-measurement',
  SPEED_CALCULATIONS: 'geometry-measurement',
  DATA_ANALYSIS: 'problem-solving-reasoning', DATA_ANALYSIS_PROBABILITY: 'problem-solving-reasoning',
  PROBABILITY_BASICS: 'problem-solving-reasoning',
  ADVANCED_PROBLEM_SOLVING: 'problem-solving-reasoning',
  FINANCIAL_LITERACY: 'problem-solving-reasoning',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveTopicKey(strand: string, year: number): string {
  const direct = STRAND_TO_TOPIC_KEY[strand];
  if (direct) return direct;
  for (const [k, v] of Object.entries(STRAND_TO_TOPIC_KEY)) {
    if (strand.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(strand.toLowerCase())) {
      return v;
    }
  }
  return year <= 4 ? 'ADDITION' : year <= 6 ? 'ADVANCED_ARITHMETIC' : 'ADVANCED_NUMBER_OPERATIONS';
}

function mapDifficulty(years: number[], page: number): 'easy' | 'medium' | 'hard' {
  const y = years[0] ?? 4;
  const base = y <= 3 ? 'easy' : y <= 5 ? 'medium' : 'hard';
  if (page >= 3 && base !== 'hard') return base === 'easy' ? 'medium' : 'hard';
  if (page >= 2 && base === 'easy') return 'medium';
  return base;
}

function buildQuestionText(desc: string, text: string): string {
  const q = text.trim();
  if (q.length > 10 && /[.=?]/.test(q)) return q.length > 300 ? q.slice(0, 300) + '…' : q;
  return `${desc}: ${q}`.slice(0, 300);
}

// ─── Confirm prompt ───────────────────────────────────────────────────────────

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${message} [yes/N]: `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'yes');
    });
  });
}

// ─── Step 1: Clear MongoDB ────────────────────────────────────────────────────

async function clearMongoDB(): Promise<number> {
  const schema = new mongoose.Schema(
    { questionText: String, grade: Number, topic: String,
      status: String, metadata: mongoose.Schema.Types.Mixed,
      sourceMathsMate: mongoose.Schema.Types.Mixed },
    { collection: 'questions', timestamps: true, strict: false }
  );
  const Model = mongoose.models['Question'] ?? mongoose.model('Question', schema);

  const total = await Model.countDocuments();
  if (total === 0) {
    console.log('  MongoDB questions collection is already empty.');
    return 0;
  }

  console.log(`  Found ${total} documents in MongoDB questions collection.`);

  if (DRY_RUN) {
    console.log('  [DRY RUN] Would delete all documents.');
    return total;
  }

  const result = await Model.deleteMany({});
  console.log(`  ✓ Deleted ${result.deletedCount} documents from MongoDB.`);
  return result.deletedCount;
}

// ─── Step 2: Clear OpenSearch index ──────────────────────────────────────────

async function clearOpenSearch(client: OpenSearchClient): Promise<void> {
  let indexExists = false;
  try {
    const resp = await client.indices.exists({ index: OPENSEARCH_INDEX });
    indexExists = resp.statusCode === 200;
  } catch {
    indexExists = false;
  }

  if (!indexExists) {
    console.log(`  OpenSearch index '${OPENSEARCH_INDEX}' does not exist — nothing to delete.`);
    return;
  }

  // Count documents
  let docCount = 0;
  try {
    const countResp = await client.count({ index: OPENSEARCH_INDEX });
    docCount = (countResp.body as any).count ?? 0;
  } catch { /* ignore */ }

  console.log(`  Found ${docCount} documents in OpenSearch index '${OPENSEARCH_INDEX}'.`);

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would delete index '${OPENSEARCH_INDEX}'.`);
    return;
  }

  await client.indices.delete({ index: OPENSEARCH_INDEX });
  console.log(`  ✓ Deleted OpenSearch index '${OPENSEARCH_INDEX}'.`);
  console.log(`    (It will be recreated automatically when the API next starts.)`);
}

// ─── Step 3: Reseed from JSON ─────────────────────────────────────────────────

interface ExtractedQuestion {
  id: string; source_file: string; color_levels: string[];
  nz_year_levels: number[]; strand: string; skill_id: string;
  skill_description: string; continuation_page: number;
  question_label: string; question_text: string; answer: string | null;
  requires_visual: boolean;
  visual_component: { type: string; description: string } | null;
  page_number: number; embedding_text: string;
}

async function reseed(Model: mongoose.Model<any>): Promise<{ inserted: number; skipped: number }> {
  const inputPath = path.join(
    __dirname, '../dev_resources/extracted_questions', INPUT_FILE
  );

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const questions: ExtractedQuestion[] = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  console.log(`\n  Source file : ${inputPath}`);
  console.log(`  Records     : ${questions.length}`);

  if (DRY_RUN) {
    console.log('  [DRY RUN] Would insert all records.');
    return { inserted: 0, skipped: 0 };
  }

  let inserted = 0;
  let skipped  = 0;

  for (let i = 0; i < questions.length; i += BATCH) {
    const batch = questions.slice(i, i + BATCH).map((q) => {
      const grade = q.nz_year_levels[0] ?? 4;
      const topicKey = resolveTopicKey(q.strand, grade);
      const difficulty = mapDifficulty(q.nz_year_levels, q.continuation_page);
      const category = TOPIC_TO_CATEGORY[topicKey] ?? 'number-operations';
      const questionText = buildQuestionText(q.skill_description, q.question_text);
      const contentHash = crypto
        .createHash('sha256')
        .update(`${questionText}|${grade}|${topicKey}`)
        .digest('hex')
        .slice(0, 16);

      const visuals: object[] = [];
      if (q.requires_visual && q.visual_component) {
        visuals.push({
          assetId: `mm_${q.id}`,
          role: 'prompt-illustration',
          templateId: q.visual_component.type,
          placement: 'before-question',
        });
      }

      return {
        questionText,
        answer: q.answer ?? '',
        explanation: q.skill_description,
        grade,
        topic: topicKey,
        category,
        format: 'open-ended',
        status: 'approved',
        options: [],
        stepByStepSolution: [],
        visuals,
        visualSelections: [],
        metadata: {
          generatedBy: 'maths_mate_skill_builder',
          generationTime: 0,
          difficulty,
          country: 'NZ',
          subject: 'mathematics',
          curriculumVersion: 'maths_mate_2019_nz',
          resolvedTopicKey: topicKey,
          resolvedTopicLabel: topicKey.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
          curriculumStrand: q.strand,
          curriculumPhase: `Year ${q.nz_year_levels.join('/')}`,
          sourceTopicKey: `${q.source_file}::${q.skill_id}::${q.question_label}`,
          fallbackUsed: false,
          validationScore: 1.0,
        },
        vectorSync: { status: 'pending', contentHash },
        refinementHistory: [],
        sourceMathsMate: {
          skillId: q.skill_id,
          questionLabel: q.question_label,
          colorLevels: q.color_levels,
          bookFile: q.source_file,
          pageNumber: q.page_number,
          embeddingText: q.embedding_text,
        },
      };
    });

    try {
      const result = await Model.insertMany(batch, { ordered: false, rawResult: true }) as any;
      inserted += result.insertedCount ?? batch.length;
    } catch (err: any) {
      const writeErrors: Array<{ code: number }> = err.writeErrors ?? [];
      inserted += batch.length - writeErrors.length;
      skipped  += writeErrors.filter((e) => e.code === 11000).length;
    }

    process.stdout.write(
      `\r  Seeding: ${Math.min(i + BATCH, questions.length)}/${questions.length} | inserted=${inserted}`
    );
  }

  console.log('\n');
  return { inserted, skipped };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log(' RESET & RESEED — Maths Mate Questions');
  console.log('═'.repeat(60));
  if (DRY_RUN) console.log(' MODE: DRY RUN (no data will be changed)\n');

  console.log('\nConnections:');
  console.log(`  MongoDB    : ${MONGO_URI.replace(/\/\/[^@]+@/, '//***@')}`);
  console.log(`  OpenSearch : ${OPENSEARCH_URL}`);
  console.log(`  OS Index   : ${OPENSEARCH_INDEX}`);
  console.log(`  Source     : dev_resources/extracted_questions/${INPUT_FILE}`);

  // ── Verify source file exists ──
  const inputPath = path.join(__dirname, '../dev_resources/extracted_questions', INPUT_FILE);
  if (!fs.existsSync(inputPath)) {
    console.error(`\n✗  Source file not found: ${inputPath}`);
    process.exit(1);
  }
  const questions: ExtractedQuestion[] = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  console.log('\n── What will happen ─────────────────────────────────────');
  console.log('  STEP 1  Delete ALL documents from MongoDB `questions`');
  console.log('  STEP 2  Delete the entire OpenSearch `math-questions` index');
  console.log(`  STEP 3  Re-import ${questions.length} Maths Mate questions (PDF-only)`);
  console.log('          status=approved | vectorSync.status=pending');
  console.log('─'.repeat(60));

  if (!DRY_RUN && !FORCE) {
    const ok = await confirm('\n⚠️  This will permanently delete ALL existing questions. Continue?');
    if (!ok) {
      console.log('\nAborted — no changes made.');
      process.exit(0);
    }
  }

  // ── Connect (skip in dry-run if unavailable) ──
  let mongoConnected = false;
  let osConnected = false;

  if (!DRY_RUN) {
    await mongoose.connect(MONGO_URI);
    mongoConnected = true;
    console.log('\n✓  MongoDB connected');
  } else {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
      mongoConnected = true;
      console.log('\n✓  MongoDB connected (live)');
    } catch {
      console.log('\n  MongoDB not reachable — dry-run will skip live counts');
    }
  }

  const osClient = new OpenSearchClient({
    node: OPENSEARCH_URL,
    ssl: { rejectUnauthorized: false },
    requestTimeout: 3000,
  });

  try {
    await osClient.cluster.health({});
    osConnected = true;
    console.log('✓  OpenSearch connected');
  } catch {
    if (!DRY_RUN) {
      throw new Error(`Cannot reach OpenSearch at ${OPENSEARCH_URL}`);
    }
    console.log('  OpenSearch not reachable — dry-run will skip live counts');
  }

  // ── Register model ONCE ──
  let Model: mongoose.Model<any> | null = null;
  if (mongoConnected) {
    const schema = new mongoose.Schema(
      {},
      { collection: 'questions', timestamps: true, strict: false }
    );
    Model = mongoose.models['Question'] ?? mongoose.model('Question', schema);
    (Model as any).collection.createIndex(
      { questionText: 1, grade: 1, topic: 1 }, { unique: true, background: true }
    ).catch(() => { /* index likely already exists */ });
  }

  // ── Step 1: MongoDB ──
  console.log('\n── Step 1: Clear MongoDB ──────────────────────────────');
  if (mongoConnected) {
    await clearMongoDB();
  } else {
    console.log('  [DRY RUN] MongoDB not reachable — skipping.');
  }

  // ── Step 2: OpenSearch ──
  console.log('\n── Step 2: Clear OpenSearch ───────────────────────────');
  if (osConnected) {
    await clearOpenSearch(osClient);
  } else {
    console.log('  [DRY RUN] OpenSearch not reachable — skipping.');
  }

  // ── Step 3: Reseed ──
  console.log('\n── Step 3: Seed Maths Mate Questions ──────────────────');
  let inserted = 0, skipped = 0;
  if (Model) {
    ({ inserted, skipped } = await reseed(Model));
  } else {
    console.log(`  [DRY RUN] Would insert ${questions.length} records (MongoDB not connected).`);
  }

  // ── Summary ──
  console.log('═'.repeat(60));
  if (DRY_RUN) {
    console.log(' DRY RUN complete — no data was changed.');
  } else {
    console.log(` ✓  Reset complete`);
    console.log(`    MongoDB  : ${inserted} questions inserted, ${skipped} skipped`);
    console.log(`    OpenSearch index deleted → will be recreated on API startup`);
    console.log('\n Next steps:');
    console.log('  1. Start the API (npx nx serve api)');
    console.log('  2. In the admin app, go to Questions → Batch Index');
    console.log('     (or POST /api/admin/questions/vector-sync/batch)');
    console.log('     to embed all pending questions into the new OpenSearch index.');
  }
  console.log('═'.repeat(60) + '\n');

  if (mongoConnected || osConnected) {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('\n✗  Fatal error:', err.message ?? err);
  process.exit(1);
});
