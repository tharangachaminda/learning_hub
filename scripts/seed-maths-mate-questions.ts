#!/usr/bin/env ts-node
/**
 * seed-maths-mate-questions.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads the extracted Maths Mate question bank
 * (`dev_resources/extracted_questions/all_questions.json`) and inserts the
 * records into the existing MongoDB `questions` collection so they flow
 * through the standard VectorSyncStatus pipeline into OpenSearch.
 *
 * Alignment with the existing system
 * ────────────────────────────────────
 *  • Same `questions` collection, same Mongoose schema
 *  • `status = 'approved'`  – textbook questions skip the review queue
 *  • `vectorSync.status = 'pending'` – picked up by the existing indexing job
 *  • `QuestionVisual.templateId` – links to the new lib-visual-host component
 *  • `metadata.generatedBy = 'maths_mate_skill_builder'` – auditable source
 *  • `topic` key resolved from strand → existing GRADE_TOPICS vocabulary
 *
 * Usage
 * ──────
 *  npx ts-node scripts/seed-maths-mate-questions.ts
 *  npx ts-node scripts/seed-maths-mate-questions.ts --dry-run
 *  npx ts-node scripts/seed-maths-mate-questions.ts --limit=200
 *  npx ts-node scripts/seed-maths-mate-questions.ts --file=Skill_Builder_Orange_Rose.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import mongoose from 'mongoose';

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    dryRun: false,
    limit: Infinity,
    batchSize: 100,
    inputFile: 'all_questions.json',
  };
  for (const a of args) {
    if (a === '--dry-run') opts.dryRun = true;
    else if (a.startsWith('--limit=')) opts.limit = parseInt(a.split('=')[1], 10);
    else if (a.startsWith('--batch=')) opts.batchSize = parseInt(a.split('=')[1], 10);
    else if (a.startsWith('--file=')) opts.inputFile = a.split('=')[1];
  }
  return opts;
}

// ─── Strand → topic key mapping ───────────────────────────────────────────────
// Maps Maths Mate strand names to the canonical topic keys used in GRADE_TOPICS

const STRAND_TO_TOPIC_KEY: Record<string, string> = {
  // Year 2–3 (Yellow/Red)
  'Whole Numbers to 10': 'ADDITION',
  'Whole Numbers to 12': 'ADDITION',

  // Year 3–4 (Orange/Rose)
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

  // Year 5–6 (Blue/Green)
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

  // Year 7–8 (Mauve/Lime)
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
  'Indices': 'PRIME_COMPOSITE_NUMBERS',
  'Square Roots': 'PRIME_COMPOSITE_NUMBERS',
  'Multiples / Factors / Primes': 'PRIME_COMPOSITE_NUMBERS',
  Factorisation: 'ALGEBRAIC_MANIPULATION',
  Expansion: 'ALGEBRAIC_MANIPULATION',
  Substitution: 'ALGEBRAIC_FOUNDATIONS',
  Expressions: 'ALGEBRAIC_FOUNDATIONS',
  'Algebraic Reasoning': 'ALGEBRAIC_FOUNDATIONS',
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

/** Topic key → curriculum category */
const TOPIC_TO_CATEGORY: Record<string, string> = {
  ADDITION: 'number-operations',
  SUBTRACTION: 'number-operations',
  MULTIPLICATION: 'number-operations',
  DIVISION: 'number-operations',
  DECIMAL_BASICS: 'number-operations',
  DECIMAL_OPERATIONS: 'number-operations',
  FRACTION_BASICS: 'number-operations',
  FRACTION_OPERATIONS: 'number-operations',
  FRACTION_DECIMAL_PERCENTAGE: 'number-operations',
  PLACE_VALUE: 'number-operations',
  ADVANCED_ARITHMETIC: 'number-operations',
  ADVANCED_NUMBER_OPERATIONS: 'number-operations',
  LARGE_NUMBER_OPERATIONS: 'number-operations',
  NEGATIVE_NUMBERS: 'number-operations',
  PRIME_COMPOSITE_NUMBERS: 'number-operations',
  NUMBER_PATTERNS: 'algebra-patterns',
  PATTERN_RECOGNITION: 'algebra-patterns',
  ALGEBRAIC_THINKING: 'algebra-patterns',
  ALGEBRAIC_EQUATIONS: 'algebra-patterns',
  ALGEBRAIC_FOUNDATIONS: 'algebra-patterns',
  ALGEBRAIC_MANIPULATION: 'algebra-patterns',
  LINEAR_EQUATIONS: 'algebra-patterns',
  ADVANCED_PATTERNS: 'algebra-patterns',
  RATIO_PROPORTION: 'number-operations',
  RATIOS_PROPORTIONS: 'number-operations',
  SHAPE_PROPERTIES: 'geometry-measurement',
  GEOMETRY_SPATIAL_REASONING: 'geometry-measurement',
  COORDINATE_GEOMETRY: 'geometry-measurement',
  TRANSFORMATIONS_SYMMETRY: 'geometry-measurement',
  PERIMETER_AREA_VOLUME: 'geometry-measurement',
  MEASUREMENT_MASTERY: 'geometry-measurement',
  TIME_MEASUREMENT: 'geometry-measurement',
  UNIT_CONVERSIONS: 'geometry-measurement',
  SPEED_CALCULATIONS: 'geometry-measurement',
  DATA_ANALYSIS: 'problem-solving-reasoning',
  DATA_ANALYSIS_PROBABILITY: 'problem-solving-reasoning',
  PROBABILITY_BASICS: 'problem-solving-reasoning',
  ADVANCED_PROBLEM_SOLVING: 'problem-solving-reasoning',
  FINANCIAL_LITERACY: 'problem-solving-reasoning',
};

// ─── Difficulty mapping ───────────────────────────────────────────────────────

function mapDifficulty(
  nzYearLevels: number[],
  continuationPage: number
): 'easy' | 'medium' | 'hard' {
  const year = nzYearLevels[0] ?? 4;
  const base = year <= 3 ? 'easy' : year <= 5 ? 'medium' : 'hard';
  // Later continuation pages within a skill are harder
  if (continuationPage >= 3 && base !== 'hard') {
    return base === 'easy' ? 'medium' : 'hard';
  }
  if (continuationPage >= 2 && base === 'easy') {
    return 'medium';
  }
  return base;
}

// ─── Question text cleaner ────────────────────────────────────────────────────

function buildQuestionText(
  skillDescription: string,
  questionText: string
): string {
  const q = questionText.trim();
  // If question_text already contains the instruction (ends with '.' or '='),
  // use it directly; otherwise prefix with skill context.
  if (q.length > 10 && /[.=?]/.test(q)) {
    return q.length > 300 ? q.slice(0, 300) + '…' : q;
  }
  return `${skillDescription}: ${q}`.slice(0, 300);
}

// ─── Topic resolution ─────────────────────────────────────────────────────────

function resolveTopicKey(strand: string, yearLevel: number): string {
  // Direct lookup
  const direct = STRAND_TO_TOPIC_KEY[strand];
  if (direct) return direct;

  // Fuzzy: try partial strand match
  for (const [key, topic] of Object.entries(STRAND_TO_TOPIC_KEY)) {
    if (strand.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(strand.toLowerCase())) {
      return topic;
    }
  }

  // Fallback by year
  if (yearLevel <= 4) return 'ADDITION';
  if (yearLevel <= 6) return 'ADVANCED_ARITHMETIC';
  return 'ADVANCED_NUMBER_OPERATIONS';
}

// ─── Extracted question shape (from all_questions.json) ──────────────────────

interface ExtractedQuestion {
  id: string;
  source_file: string;
  color_levels: string[];
  nz_year_levels: number[];
  strand: string;
  skill_id: string;
  skill_description: string;
  continuation_page: number;
  question_label: string;
  question_text: string;
  answer: string | null;
  requires_visual: boolean;
  visual_component: {
    type: string;
    description: string;
  } | null;
  page_number: number;
  embedding_text: string;
}

// ─── MongoDB document shape (minimal — matches question.schema.ts) ────────────

interface QuestionDoc {
  questionText: string;
  answer: string | number;
  explanation: string;
  grade: number;
  topic: string;
  category: string;
  format: string;
  status: string;
  options: unknown[];
  stepByStepSolution: string[];
  visuals: Array<{
    assetId: string;
    role: string;
    templateId?: string;
    placement?: string;
  }>;
  visualSelections: unknown[];
  metadata: {
    generatedBy: string;
    generationTime: number;
    difficulty: string;
    country: string;
    subject: string;
    curriculumVersion: string;
    resolvedTopicKey: string;
    resolvedTopicLabel: string;
    curriculumStrand: string;
    curriculumPhase: string;
    sourceTopicKey: string;
    fallbackUsed: boolean;
    validationScore: number;
  };
  vectorSync: {
    status: string;
    contentHash: string;
  };
  refinementHistory: unknown[];
  // Extra field for traceability (stored as schemaless Mixed-like top-level)
  sourceMathsMate: {
    skillId: string;
    questionLabel: string;
    colorLevels: string[];
    bookFile: string;
    pageNumber: number;
    embeddingText: string;
  };
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapToDocument(q: ExtractedQuestion): QuestionDoc {
  const grade = q.nz_year_levels[0] ?? 4;
  const topicKey = resolveTopicKey(q.strand, grade);
  const difficulty = mapDifficulty(q.nz_year_levels, q.continuation_page);
  const category = TOPIC_TO_CATEGORY[topicKey] ?? 'number-operations';
  const questionText = buildQuestionText(q.skill_description, q.question_text);
  const answer = q.answer ?? '';
  const contentHash = crypto
    .createHash('sha256')
    .update(`${questionText}|${grade}|${topicKey}`)
    .digest('hex')
    .slice(0, 16);

  const visuals: QuestionDoc['visuals'] = [];
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
    answer,
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
      resolvedTopicLabel: topicKey.replace(/_/g, ' ').toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      curriculumStrand: q.strand,
      curriculumPhase: `Year ${q.nz_year_levels.join('/')}`,
      sourceTopicKey: `${q.source_file}::${q.skill_id}::${q.question_label}`,
      fallbackUsed: false,
      validationScore: 1.0, // Textbook source — fully trusted
    },
    vectorSync: {
      status: 'pending',
      contentHash,
    },
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
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();

  const inputPath = path.join(
    __dirname,
    '../dev_resources/extracted_questions',
    opts.inputFile
  );

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`\nReading: ${inputPath}`);
  const raw: ExtractedQuestion[] = JSON.parse(
    fs.readFileSync(inputPath, 'utf8')
  );
  const questions = raw.slice(0, opts.limit);
  console.log(`Total records: ${questions.length}`);

  if (opts.dryRun) {
    console.log('\n── DRY RUN — first 3 mapped documents ──');
    for (const q of questions.slice(0, 3)) {
      const doc = mapToDocument(q);
      console.log(JSON.stringify(doc, null, 2));
    }
    // Breakdown stats
    const topicCounts: Record<string, number> = {};
    const visualCounts: Record<string, number> = {};
    const gradeCounts: Record<string, number> = {};
    for (const q of questions) {
      const topic = resolveTopicKey(q.strand, q.nz_year_levels[0]);
      topicCounts[topic] = (topicCounts[topic] ?? 0) + 1;
      if (q.visual_component) {
        visualCounts[q.visual_component.type] =
          (visualCounts[q.visual_component.type] ?? 0) + 1;
      }
      const g = `Year ${q.nz_year_levels[0]}`;
      gradeCounts[g] = (gradeCounts[g] ?? 0) + 1;
    }
    console.log('\n── Topic distribution ──');
    Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, v]) => console.log(`  ${k}: ${v}`));
    console.log('\n── Visual type distribution ──');
    Object.entries(visualCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, v]) => console.log(`  ${k}: ${v}`));
    console.log('\n── Year level distribution ──');
    Object.entries(gradeCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([k, v]) => console.log(`  ${k}: ${v}`));
    return;
  }

  // ── Connect to MongoDB ──
  const mongoUri =
    process.env['MONGODB_URI'] ??
    process.env['MONGO_URI'] ??
    'mongodb://localhost:27017/learninghub';

  console.log(`\nConnecting to MongoDB: ${mongoUri.replace(/\/\/.*@/, '//***@')}`);

  // Inline schema (avoids NestJS IoC overhead for a seed script)
  const questionSchema = new mongoose.Schema(
    {
      questionText: { type: String, required: true },
      answer:       { type: mongoose.Schema.Types.Mixed, required: true },
      explanation:  { type: String },
      grade:        { type: Number, required: true },
      topic:        { type: String, required: true },
      category:     { type: String },
      format:       { type: String, default: 'open-ended' },
      status:       { type: String, default: 'approved' },
      options:      { type: [mongoose.Schema.Types.Mixed], default: [] },
      stepByStepSolution: { type: [String], default: [] },
      visuals:      { type: [mongoose.Schema.Types.Mixed], default: [] },
      visualSelections: { type: [mongoose.Schema.Types.Mixed], default: [] },
      metadata:     { type: mongoose.Schema.Types.Mixed },
      vectorSync:   { type: mongoose.Schema.Types.Mixed, default: { status: 'pending' } },
      refinementHistory: { type: [mongoose.Schema.Types.Mixed], default: [] },
      sourceMathsMate: { type: mongoose.Schema.Types.Mixed },
    },
    {
      collection: 'questions',
      timestamps: true,
    }
  );
  questionSchema.index(
    { questionText: 1, grade: 1, topic: 1 },
    { unique: true }
  );

  await mongoose.connect(mongoUri);
  const QuestionModel = mongoose.model('Question', questionSchema);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  // ── Batch insert ──
  for (let i = 0; i < questions.length; i += opts.batchSize) {
    const batch = questions.slice(i, i + opts.batchSize).map(mapToDocument);
    try {
      const result = await QuestionModel.insertMany(batch, {
        ordered: false,        // continue on duplicate key errors
        rawResult: true,
      });
      const count = (result as any).insertedCount ?? batch.length;
      inserted += count;
      process.stdout.write(
        `\r  Progress: ${Math.min(i + opts.batchSize, questions.length)}/${questions.length} | inserted=${inserted} skipped=${skipped}`
      );
    } catch (err: any) {
      // Mongoose bulk insert throws if any duplicate detected when ordered=false
      // The successfully inserted docs are still committed
      const writeErrors: Array<{ code: number }> = err.writeErrors ?? [];
      const dupes = writeErrors.filter((e) => e.code === 11000).length;
      const otherErrors = writeErrors.length - dupes;
      inserted += batch.length - writeErrors.length;
      skipped += dupes;
      errors += otherErrors;
      if (otherErrors > 0) {
        console.warn(`\n  Non-duplicate errors in batch ${Math.floor(i / opts.batchSize) + 1}:`, otherErrors);
      }
      process.stdout.write(
        `\r  Progress: ${Math.min(i + opts.batchSize, questions.length)}/${questions.length} | inserted=${inserted} skipped=${skipped} errors=${errors}`
      );
    }
  }

  console.log('\n');
  console.log('─'.repeat(50));
  console.log(`Total records   : ${questions.length}`);
  console.log(`Inserted        : ${inserted}`);
  console.log(`Skipped (dupes) : ${skipped}`);
  console.log(`Errors          : ${errors}`);
  console.log('\nNext step: run the existing vector indexing job to embed and');
  console.log('store these questions in OpenSearch (vectorSync.status = pending).');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
