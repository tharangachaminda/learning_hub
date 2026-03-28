import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { QuestionsService, PaginatedQuestions } from './questions.service';
import { MathQuestionGenerator } from '../math-questions/services/math-question-generator.service';
import { DifficultyLevel } from '../math-questions/entities/math-question.entity';
import { QuestionDocument, QuestionFormat } from './schemas/question.schema';
import { FindQuestionsDto } from './dto/find-questions.dto';
import { BatchGenerateQuestionsDto } from './dto/batch-generate-questions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * REST API controller for persisted question management.
 *
 * Provides endpoints for querying stored questions (with filters),
 * retrieving individual questions, and batch-generating + persisting
 * new questions via the AI pipeline.
 *
 * @example
 * ```
 * GET  /api/questions?grade=5&topic=FRACTION_OPERATIONS&status=approved
 * GET  /api/questions/:id
 * POST /api/questions/batch-generate  { grade: 4, topic: "MULTIPLICATION", count: 10 }
 * ```
 */
@Controller('questions')
export class QuestionsController {
  private readonly logger = new Logger(QuestionsController.name);

  /**
   * Creates a new QuestionsController instance.
   *
   * @param questionsService - Service for question CRUD operations
   * @param mathGenerator - AI-powered question generation service
   */
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly mathGenerator: MathQuestionGenerator
  ) {}

  /**
   * Returns stored questions with optional filtering and pagination (AC-005).
   *
   * @param dto - Query parameters for filtering (grade, topic, status, format, page, limit)
   * @returns Paginated result with matching questions, total count, page, and limit
   *
   * @example
   * ```
   * GET /api/questions?grade=5&topic=FRACTION_OPERATIONS&status=approved&page=1&limit=20
   * ```
   */
  @Get()
  async findAll(@Query() dto: FindQuestionsDto): Promise<PaginatedQuestions> {
    const { page = 1, limit = 20, ...filters } = dto;
    return this.questionsService.findAll(filters, page, limit);
  }

  /**
   * Returns question counts grouped by status for the admin dashboard.
   *
   * Protected: requires admin or teacher role.
   *
   * @returns `{ pending, approved, rejected, total }`
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  async getStats() {
    return this.questionsService.getStats();
  }

  /**
   * Returns a single stored question by its MongoDB ObjectId.
   *
   * @param id - The question document's `_id`
   * @returns The matching QuestionDocument, or `null` if not found
   *
   * @example
   * ```
   * GET /api/questions/507f1f77bcf86cd799439011
   * ```
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<QuestionDocument | null> {
    return this.questionsService.findOne(id);
  }

  /**
   * Generates questions via AI and persists them to MongoDB (AC-006).
   *
   * Converts the grade number to a `DifficultyLevel` enum, triggers
   * the AI generator, maps the results to the Question schema format,
   * and batch-inserts them with `pending` status.
   *
   * @param dto - Batch generation parameters (grade, topic, count, format)
   * @returns Object with `stored` count and array of saved `questions`
   *
   * @throws {Error} When AI generation or persistence fails
   *
   * @example
   * ```
   * POST /api/questions/batch-generate
   * Body: { "grade": 4, "topic": "MULTIPLICATION", "count": 10 }
   * Response: { "stored": 10, "questions": [...] }
   * ```
   */
  @Post('batch-generate')
  async batchGenerate(
    @Body() dto: BatchGenerateQuestionsDto
  ): Promise<{ stored: number; questions: QuestionDocument[] }> {
    const count = dto.count ?? 10;
    const difficulty = this.gradeToDifficulty(dto.grade);

    this.logger.log(
      `Batch generating ${count} questions: grade=${dto.grade} topic=${dto.topic}`
    );

    const startTime = Date.now();

    // Generate questions via AI pipeline
    const generated = await this.mathGenerator.generateQuestions(
      difficulty,
      count,
      dto.topic
    );

    // Map generated MathQuestion entities to Question schema format
    const questionDtos = generated.map((q) => ({
      questionText: q.question,
      answer: q.answer,
      explanation: q.stepByStepSolution?.join('\n') || '',
      grade: dto.grade,
      topic: dto.topic,
      category: this.topicToCategory(dto.topic),
      format: dto.format ?? QuestionFormat.OPEN_ENDED,
      stepByStepSolution: q.stepByStepSolution || [],
      metadata: {
        generatedBy: 'llama3.1:latest',
        generationTime: Date.now() - startTime,
        difficulty: difficulty,
        country: 'NZ',
      },
    }));

    // Batch persist — duplicates are silently skipped
    const stored = await this.questionsService.createMany(questionDtos);

    this.logger.log(
      `Batch complete: ${stored.length}/${
        generated.length
      } questions stored in ${Date.now() - startTime}ms`
    );

    return { stored: stored.length, questions: stored };
  }

  /**
   * Converts a grade number (3–8) to a DifficultyLevel enum value.
   *
   * @param grade - Grade number
   * @returns Corresponding DifficultyLevel enum value
   * @private
   */
  private gradeToDifficulty(grade: number): DifficultyLevel {
    const mapping: Record<number, DifficultyLevel> = {
      3: DifficultyLevel.GRADE_3,
      4: DifficultyLevel.GRADE_4,
      5: DifficultyLevel.GRADE_5,
      6: DifficultyLevel.GRADE_6,
      7: DifficultyLevel.GRADE_7,
      8: DifficultyLevel.GRADE_8,
    };
    return mapping[grade] ?? DifficultyLevel.GRADE_3;
  }

  /**
   * Maps a topic string to its curriculum category.
   *
   * @param topic - Topic key (e.g. 'ADDITION', 'ALGEBRAIC_EQUATIONS')
   * @returns Category string
   * @private
   */
  private topicToCategory(topic: string): string {
    const categoryMap: Record<string, string> = {
      ADDITION: 'number-operations',
      SUBTRACTION: 'number-operations',
      MULTIPLICATION: 'number-operations',
      DIVISION: 'number-operations',
      DECIMAL_BASICS: 'number-operations',
      DECIMAL_OPERATIONS: 'number-operations',
      FRACTION_BASICS: 'number-operations',
      FRACTION_OPERATIONS: 'number-operations',
      ADVANCED_ARITHMETIC: 'number-operations',
      ADVANCED_FRACTIONS_DECIMALS: 'number-operations',
      LARGE_NUMBER_OPERATIONS: 'number-operations',
      PLACE_VALUE: 'number-operations',
      PATTERN_RECOGNITION: 'algebra-patterns',
      ALGEBRAIC_THINKING: 'algebra-patterns',
      ALGEBRAIC_EQUATIONS: 'algebra-patterns',
      ADVANCED_PATTERNS: 'algebra-patterns',
      RATIO_PROPORTION: 'algebra-patterns',
      SHAPE_PROPERTIES: 'geometry-measurement',
      AREA_VOLUME_CALCULATIONS: 'geometry-measurement',
      COORDINATE_GEOMETRY: 'geometry-measurement',
      TRANSFORMATIONS_SYMMETRY: 'geometry-measurement',
      MEASUREMENT_MASTERY: 'geometry-measurement',
      TIME_MEASUREMENT: 'geometry-measurement',
      ADVANCED_PROBLEM_SOLVING: 'problem-solving-reasoning',
      MATHEMATICAL_REASONING: 'problem-solving-reasoning',
      REAL_WORLD_APPLICATIONS: 'problem-solving-reasoning',
      DATA_ANALYSIS: 'problem-solving-reasoning',
      PROBABILITY_BASICS: 'problem-solving-reasoning',
      FINANCIAL_LITERACY: 'problem-solving-reasoning',
    };
    return categoryMap[topic] ?? 'number-operations';
  }
}
