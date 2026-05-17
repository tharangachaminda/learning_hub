#!/usr/bin/env ts-node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
type DifficultyName = 'easy' | 'medium' | 'hard';
type QuestionFormatName = 'open-ended' | 'multiple-choice';
type QuestionVisual = {
  assetId: string;
  role: VisualAssetRole;
  label: string;
  altText: string;
  subject?: string;
  keywords: string[];
  svgPath?: string;
  templateId?: string;
  placement?: VisualAssetPlacement;
};
type VisualAssetRole =
  | 'inline-symbol'
  | 'prompt-illustration'
  | 'answer-option'
  | 'explanation-aid';
type VisualAssetPlacement =
  | 'before-question'
  | 'after-question'
  | 'inline'
  | 'explanation';
type StoredQuestionRecord = {
  id?: string;
  _id?: string | { toString(): string };
  [key: string]: unknown;
};
type QuestionsServiceLike = {
  createMany: (questions: object[]) => Promise<StoredQuestionRecord[]>;
  reviewQuestion: (
    id: string,
    status: string,
    reviewedBy: string,
    notes: string
  ) => Promise<StoredQuestionRecord>;
  markVectorSyncPrepared: (id: string) => Promise<void>;
  markVectorSyncStored: (
    id: string,
    syncedBy: string,
    indexedDocumentId: string
  ) => Promise<void>;
  markVectorSyncFailed: (id: string, errorMessage: string) => Promise<void>;
  deleteAllQuestions: () => Promise<number>;
  resetAllVectorSyncStatuses: () => Promise<number>;
};
type QuestionIndexingServiceLike = {
  indexStoredQuestion: (question: StoredQuestionRecord) => Promise<void>;
};
type VectorIndexServiceLike = {
  recreateIndex: () => Promise<void>;
  createIndexIfNotExists: () => Promise<void>;
};
type VisualAssetRegistryServiceLike = {
  toQuestionVisual: (
    assetId: string,
    overrides?: Partial<QuestionVisual>
  ) => Promise<QuestionVisual | null>;
};

let mathematicsCurriculum: {
  subject: string;
  version: string;
  years: Array<{
    year: number;
    phase: string;
    topics: Array<{ key: string; label: string }>;
  }>;
};
let getMathematicsTopicCriteriaFn: (
  year: number,
  topicKey: string
) => { key: string; label: string; strand: string } | null;
let questionTypeToCategory: Record<string, string>;

type SeedOptions = {
  startYear: number;
  endYear: number;
  countPerDifficulty: number;
  recreateIndex: boolean;
  resetVectorSync: boolean;
  purgeQuestions: boolean;
  dryRun: boolean;
  generatedByUser: string;
  difficulties: DifficultyName[];
  inputFile?: string;
  topic?: string;
};

type SeedVisualSelection = {
  assetId: string;
  role?: VisualAssetRole;
  placement?: VisualAssetPlacement;
};

type SeedQuestionEntry = {
  seedId: string;
  grade: number;
  topic: string;
  difficulty: DifficultyName;
  questionText: string;
  answer: number | string;
  explanation: string;
  stepByStepSolution?: string[];
  format?: QuestionFormatName;
  options?: string[];
  visualSelections?: SeedVisualSelection[];
};

type SeedQuestionBank = {
  metadata: {
    version: string;
    generatedAt: string;
    generatedBy: string;
    subject: string;
    description?: string;
  };
  questions: SeedQuestionEntry[];
};

function parseArgs(): SeedOptions {
  const args = process.argv.slice(2);
  const options: SeedOptions = {
    startYear: 0,
    endYear: 10,
    countPerDifficulty: 10,
    recreateIndex: false,
    resetVectorSync: false,
    purgeQuestions: false,
    dryRun: false,
    generatedByUser: 'seed-script@system',
    difficulties: ['easy', 'medium', 'hard'],
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--recreate-index') {
      options.recreateIndex = true;
      options.resetVectorSync = true;
      continue;
    }

    if (arg === '--purge-questions') {
      options.purgeQuestions = true;
      continue;
    }

    if (arg === '--reset-vector-sync') {
      options.resetVectorSync = true;
      continue;
    }

    if (!arg.startsWith('--')) {
      continue;
    }

    const [rawKey, value] = arg.slice(2).split('=');
    if (value === undefined) {
      continue;
    }

    switch (rawKey) {
      case 'year':
        options.startYear = Number(value);
        options.endYear = Number(value);
        break;
      case 'start-year':
        options.startYear = Number(value);
        break;
      case 'end-year':
        options.endYear = Number(value);
        break;
      case 'count-per-difficulty':
        options.countPerDifficulty = Number(value);
        break;
      case 'generated-by':
        options.generatedByUser = value;
        break;
      case 'input-file':
        options.inputFile = value;
        break;
      case 'topic':
        options.topic = value.toUpperCase();
        break;
      case 'difficulties':
        options.difficulties = value
          .split(',')
          .map((item) => item.trim().toLowerCase())
          .filter((item): item is DifficultyName =>
            ['easy', 'medium', 'hard'].includes(item)
          );
        break;
      default:
        break;
    }
  }

  if (
    !Number.isInteger(options.startYear) ||
    !Number.isInteger(options.endYear) ||
    options.startYear < 0 ||
    options.endYear < options.startYear
  ) {
    throw new Error('Invalid year range. Use non-negative integers.');
  }

  if (
    !Number.isInteger(options.countPerDifficulty) ||
    options.countPerDifficulty <= 0
  ) {
    throw new Error('count-per-difficulty must be a positive integer.');
  }

  if (options.difficulties.length === 0) {
    throw new Error('At least one difficulty must be selected.');
  }

  return options;
}

function loadSeedQuestionBank(inputFile: string): SeedQuestionBank {
  const absolutePath = resolve(process.cwd(), inputFile);
  const raw = readFileSync(absolutePath, 'utf8');
  const parsed = JSON.parse(raw) as SeedQuestionBank;

  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error(
      `Seed file ${absolutePath} does not contain any questions.`
    );
  }

  return parsed;
}

function topicToCategory(
  topic: string,
  resolvedTopic?: { key: string; strand: string } | null
): string {
  const directCategory = questionTypeToCategory[topic];
  if (directCategory) {
    return directCategory;
  }

  const resolvedCategory = resolvedTopic?.key
    ? questionTypeToCategory[resolvedTopic.key]
    : undefined;
  if (resolvedCategory) {
    return resolvedCategory;
  }

  switch (resolvedTopic?.strand) {
    case 'Algebra':
      return 'algebra-patterns';
    case 'Measurement':
    case 'Geometry':
      return 'geometry-measurement';
    case 'Statistics':
    case 'Probability':
      return 'problem-solving-reasoning';
    case 'Number':
    default:
      return 'number-operations';
  }
}

function getStoredQuestionId(question: StoredQuestionRecord): string {
  if (typeof question.id === 'string' && question.id.length > 0) {
    return question.id;
  }

  if (typeof question._id === 'string' && question._id.length > 0) {
    return question._id;
  }

  if (
    question._id &&
    typeof question._id === 'object' &&
    'toString' in question._id &&
    typeof question._id.toString === 'function'
  ) {
    const normalizedId = question._id.toString();
    if (normalizedId.length > 0) {
      return normalizedId;
    }
  }

  throw new Error('Stored question is missing an id/_id value.');
}

async function resolveSeedVisuals(
  question: SeedQuestionEntry,
  visualAssetRegistryService: VisualAssetRegistryServiceLike
): Promise<QuestionVisual[]> {
  if (!question.visualSelections?.length) {
    return [];
  }

  const resolvedVisuals = await Promise.all(
    question.visualSelections.map((selection) =>
      visualAssetRegistryService.toQuestionVisual(selection.assetId, {
        role: selection.role ?? 'prompt-illustration',
        placement: selection.placement ?? 'before-question',
      })
    )
  );

  return resolvedVisuals.filter((visual): visual is QuestionVisual =>
    Boolean(visual)
  );
}

async function buildQuestionDto(
  question: SeedQuestionEntry,
  generatedByUser: string,
  generationTime: number,
  visualAssetRegistryService: VisualAssetRegistryServiceLike
) {
  const yearPlan = mathematicsCurriculum.years.find(
    (year) => year.year === question.grade
  );
  const resolvedTopic = getMathematicsTopicCriteriaFn(
    question.grade,
    question.topic
  );
  const visuals = await resolveSeedVisuals(
    question,
    visualAssetRegistryService
  );

  return {
    questionText: question.questionText,
    answer: question.answer,
    explanation: question.explanation,
    grade: question.grade,
    topic: question.topic,
    category: topicToCategory(question.topic, resolvedTopic),
    format: question.format ?? 'open-ended',
    options: question.options ?? [],
    stepByStepSolution: question.stepByStepSolution ?? [question.explanation],
    visuals,
    generatedByUser,
    metadata: {
      generatedBy: 'gpt-5.4-seed',
      generationTime,
      difficulty: question.difficulty,
      country: 'NZ',
      subject: mathematicsCurriculum.subject,
      curriculumVersion: mathematicsCurriculum.version,
      resolvedTopicKey: resolvedTopic?.key,
      resolvedTopicLabel: resolvedTopic?.label,
      curriculumStrand: resolvedTopic?.strand,
      curriculumPhase: yearPlan?.phase,
      sourceTopicKey: question.topic,
    },
  };
}

async function seedQuestions(params: {
  questions: SeedQuestionEntry[];
  generatedByUser: string;
  questionsService: QuestionsServiceLike;
  questionIndexingService: QuestionIndexingServiceLike;
  visualAssetRegistryService: VisualAssetRegistryServiceLike;
  questionStatusApproved: string;
}) {
  const {
    questions,
    generatedByUser,
    questionsService,
    questionIndexingService,
    visualAssetRegistryService,
    questionStatusApproved,
  } = params;

  const generationStartedAt = Date.now();
  const questionDtos = await Promise.all(
    questions.map((question) =>
      buildQuestionDto(
        question,
        generatedByUser,
        Date.now() - generationStartedAt,
        visualAssetRegistryService
      )
    )
  );

  const storedQuestions = await questionsService.createMany(questionDtos);

  let approvedCount = 0;
  let indexedCount = 0;
  let failedCount = 0;

  for (const storedQuestion of storedQuestions) {
    const storedQuestionId = getStoredQuestionId(storedQuestion);
    const approved = await questionsService.reviewQuestion(
      storedQuestionId,
      questionStatusApproved,
      generatedByUser,
      'Initial seeded corpus for OpenSearch and RAG bootstrapping.'
    );
    approvedCount += 1;

    try {
      const approvedQuestionId = getStoredQuestionId(approved);
      await questionsService.markVectorSyncPrepared(approvedQuestionId);
      await questionIndexingService.indexStoredQuestion(approved);
      await questionsService.markVectorSyncStored(
        approvedQuestionId,
        generatedByUser,
        approvedQuestionId
      );
      indexedCount += 1;
    } catch (error) {
      failedCount += 1;
      const message = error instanceof Error ? error.message : String(error);
      await questionsService.markVectorSyncFailed(
        getStoredQuestionId(approved),
        message
      );
    }
  }

  return {
    generatedCount: questions.length,
    storedCount: storedQuestions.length,
    approvedCount,
    indexedCount,
    failedCount,
  };
}

async function main() {
  const options = parseArgs();

  const { AppModule } = await import('../api/src/app/app.module');
  const curriculumModule = await import(
    '../api/src/app/ai/mathematics-curriculum.criteria'
  );
  const curriculumTypesModule = await import(
    '../api/src/app/ai/curriculum.types'
  );
  const { QuestionsService } = await import(
    '../api/src/app/questions/questions.service'
  );
  const { QuestionStatus } = await import(
    '../api/src/app/questions/schemas/question.schema'
  );
  const { QuestionIndexingService } = await import(
    '../api/src/app/opensearch/question-indexing.service'
  );
  const { VectorIndexService } = await import(
    '../api/src/app/opensearch/vector-index.service'
  );
  const { VisualAssetRegistryService } = await import(
    '../api/src/app/ai/visual-asset-registry.service'
  );

  mathematicsCurriculum = curriculumModule.MATHEMATICS_CURRICULUM;
  getMathematicsTopicCriteriaFn = curriculumModule.getMathematicsTopicCriteria;
  questionTypeToCategory = curriculumTypesModule.QUESTION_TYPE_TO_CATEGORY;

  if (!options.inputFile) {
    throw new Error(
      'This seeding workflow now requires --input-file so it can use curated JSON instead of Ollama generation.'
    );
  }

  const seedBank = loadSeedQuestionBank(options.inputFile);
  const selectedQuestions = seedBank.questions.filter(
    (question) =>
      question.grade >= options.startYear &&
      question.grade <= options.endYear &&
      options.difficulties.includes(question.difficulty) &&
      (!options.topic || question.topic === options.topic)
  );

  if (selectedQuestions.length === 0) {
    throw new Error(
      'No year/topic/difficulty combinations matched the filters.'
    );
  }

  const countsByCombo = new Map<string, number>();
  for (const question of selectedQuestions) {
    const key = `${question.grade}:${question.topic}:${question.difficulty}`;
    countsByCombo.set(key, (countsByCombo.get(key) ?? 0) + 1);
  }

  const selectedYears = mathematicsCurriculum.years.filter(
    (year) => year.year >= options.startYear && year.year <= options.endYear
  );

  const selectedCombos = selectedYears.flatMap((year) =>
    year.topics
      .filter((topic) => !options.topic || topic.key === options.topic)
      .flatMap((topic) =>
        options.difficulties.map((difficulty) => ({
          grade: year.year,
          topic: topic.key,
          topicLabel: topic.label,
          difficulty,
          count:
            countsByCombo.get(`${year.year}:${topic.key}:${difficulty}`) ?? 0,
        }))
      )
  );

  const missingCombos = selectedCombos.filter(
    (combo) => combo.count < options.countPerDifficulty
  );

  if (missingCombos.length > 0) {
    throw new Error(
      `Seed bank is missing required questions for ${missingCombos
        .map(
          (combo) =>
            `Year ${combo.grade} ${combo.topic} ${combo.difficulty} (${combo.count}/${options.countPerDifficulty})`
        )
        .join('; ')}`
    );
  }

  const plannedQuestionCount = selectedQuestions.length;

  console.log('Initial Question Bank Seeder');
  console.log('============================');
  console.log(`Input file: ${options.inputFile}`);
  console.log(`Seed source: ${seedBank.metadata.generatedBy}`);
  console.log(`Years: ${options.startYear} to ${options.endYear}`);
  console.log(`Difficulties: ${options.difficulties.join(', ')}`);
  console.log(
    `Topic filter: ${options.topic ? options.topic : 'all curriculum topics'}`
  );
  console.log(`Minimum per difficulty/topic: ${options.countPerDifficulty}`);
  console.log(`Planned combinations: ${selectedCombos.length}`);
  console.log(`Planned question count: ${plannedQuestionCount}`);
  console.log(`Recreate OpenSearch index: ${options.recreateIndex}`);
  console.log(`Purge Mongo questions: ${options.purgeQuestions}`);
  console.log(`Reset Mongo vectorSync state: ${options.resetVectorSync}`);
  console.log(`Dry run: ${options.dryRun}`);

  if (options.dryRun) {
    console.log('\nPreview of combinations:');
    for (const combo of selectedCombos.slice(0, 10)) {
      console.log(
        `- Year ${combo.grade} | ${combo.topic} (${combo.topicLabel}) | ${combo.difficulty} | ${combo.count} questions`
      );
    }

    if (selectedCombos.length > 10) {
      console.log(`... and ${selectedCombos.length - 10} more combinations`);
    }
    return;
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const questionsService = app.get(QuestionsService) as QuestionsServiceLike;
    const questionIndexingService = app.get(
      QuestionIndexingService
    ) as QuestionIndexingServiceLike;
    const vectorIndexService = app.get(
      VectorIndexService
    ) as VectorIndexServiceLike;
    const visualAssetRegistryService = app.get(
      VisualAssetRegistryService
    ) as VisualAssetRegistryServiceLike;

    if (options.recreateIndex) {
      console.log('\nRecreating OpenSearch index...');
      await vectorIndexService.recreateIndex();
    } else {
      await vectorIndexService.createIndexIfNotExists();
    }

    if (options.purgeQuestions) {
      console.log('Deleting all stored questions from MongoDB...');
      const deletedCount = await questionsService.deleteAllQuestions();
      console.log(`Deleted ${deletedCount} existing questions.`);
    }

    if (options.resetVectorSync && !options.purgeQuestions) {
      console.log('Resetting Mongo vectorSync statuses...');
      const resetCount = await questionsService.resetAllVectorSyncStatuses();
      console.log(`Reset vectorSync metadata on ${resetCount} questions.`);
    }

    const totals = {
      generatedCount: 0,
      storedCount: 0,
      approvedCount: 0,
      indexedCount: 0,
      failedCount: 0,
    };

    for (const combo of selectedCombos) {
      const batchQuestions = selectedQuestions.filter(
        (question) =>
          question.grade === combo.grade &&
          question.topic === combo.topic &&
          question.difficulty === combo.difficulty
      );

      console.log(
        `\nImporting Year ${combo.grade} ${combo.topic} (${combo.difficulty}) from JSON...`
      );

      const result = await seedQuestions({
        questions: batchQuestions,
        generatedByUser: options.generatedByUser,
        questionsService,
        questionIndexingService,
        visualAssetRegistryService,
        questionStatusApproved: QuestionStatus.APPROVED,
      });

      totals.generatedCount += result.generatedCount;
      totals.storedCount += result.storedCount;
      totals.approvedCount += result.approvedCount;
      totals.indexedCount += result.indexedCount;
      totals.failedCount += result.failedCount;

      console.log(
        `Generated ${result.generatedCount}, stored ${result.storedCount}, indexed ${result.indexedCount}, failed ${result.failedCount}.`
      );
    }

    console.log('\nSeeding complete');
    console.log('---------------');
    console.log(`Generated: ${totals.generatedCount}`);
    console.log(`Stored: ${totals.storedCount}`);
    console.log(`Approved: ${totals.approvedCount}`);
    console.log(`Indexed: ${totals.indexedCount}`);
    console.log(`Failed indexing: ${totals.failedCount}`);
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(
    '\nSeeder failed:',
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
