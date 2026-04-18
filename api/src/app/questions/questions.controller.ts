import {
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Logger,
  UseGuards,
  Request,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  QuestionsService,
  PaginatedQuestions,
  QuestionAnalytics,
  PracticeQuestionsResult,
} from './questions.service';
import { MathQuestionGenerator } from '../math-questions/services/math-question-generator.service';
import { OllamaService } from '../ai/ollama.service';
import { DifficultyLevel } from '../math-questions/entities/math-question.entity';
import {
  QuestionDocument,
  QuestionFormat,
  QuestionStatus,
} from './schemas/question.schema';
import { FindQuestionsDto } from './dto/find-questions.dto';
import { BatchGenerateQuestionsDto } from './dto/batch-generate-questions.dto';
import { ReviewQuestionDto } from './dto/review-question.dto';
import { RefineQuestionDto } from './dto/refine-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import {
  CreateLessonLearnedDto,
  ToggleLessonLearnedDto,
} from './dto/lesson-learned.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  GRADE_TOPICS,
  QUESTION_TYPE_DISPLAY_NAMES,
} from '../ai/curriculum.types';
import { QuestionIndexingService } from '../opensearch/question-indexing.service';

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
    private readonly mathGenerator: MathQuestionGenerator,
    private readonly ollamaService: OllamaService,
    private readonly questionIndexingService: QuestionIndexingService
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
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  async getStats() {
    return this.questionsService.getStats();
  }

  /**
   * Returns grade/topic structure for the frontend UI.
   */
  @Get('curriculum')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  getCurriculum() {
    const grades = Object.entries(GRADE_TOPICS).map(([grade, subjects]) => ({
      grade: Number(grade),
      topics: (subjects['mathematics'] || []).map((topic: string) => ({
        key: topic,
        label: QUESTION_TYPE_DISPLAY_NAMES[topic] || topic,
      })),
    }));
    return { grades };
  }

  /**
   * Returns detailed analytics: grade×topic matrix, difficulty/format
   * distributions, coverage gaps, and summary totals.
   */
  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  async getAnalytics(
    @Query('threshold') threshold?: string,
    @Query('grade') grade?: string
  ): Promise<QuestionAnalytics> {
    const gapThreshold = threshold ? parseInt(threshold, 10) || 10 : 10;
    const gradeNum = grade ? parseInt(grade, 10) : undefined;
    return this.questionsService.getAnalytics(
      gapThreshold,
      gradeNum && gradeNum >= 3 && gradeNum <= 8 ? gradeNum : undefined
    );
  }

  /**
   * Returns random approved questions for student practice.
   * Public endpoint — no auth required.
   */
  @Get('practice')
  async getPracticeQuestions(
    @Query('grade') grade: string,
    @Query('topic') topic: string,
    @Query('count') count?: string,
    @Query('difficulty') difficulty?: string
  ): Promise<PracticeQuestionsResult> {
    const gradeNum = parseInt(grade, 10);
    if (!gradeNum || gradeNum < 3 || gradeNum > 8) {
      throw new HttpException(
        'Grade must be between 3 and 8',
        HttpStatus.BAD_REQUEST
      );
    }
    if (!topic) {
      throw new HttpException('Topic is required', HttpStatus.BAD_REQUEST);
    }
    const questionCount = Math.min(parseInt(count ?? '10', 10) || 10, 50);
    return this.questionsService.getPracticeQuestions(
      gradeNum,
      topic.toUpperCase(),
      questionCount,
      difficulty
    );
  }

  /**
   * Returns all lesson learned entries, optionally filtered.
   */
  @Get('lessons-learned')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  async getLessonsLearned(
    @Query('grade') grade?: string,
    @Query('topic') topic?: string,
    @Query('category') category?: string
  ) {
    const filters: Record<string, unknown> = {};
    if (grade) filters['grade'] = Number(grade);
    if (topic) filters['topic'] = topic;
    if (category) filters['category'] = category;
    return this.questionsService.getLessonsLearned(filters);
  }

  /**
   * Returns a single stored question by its MongoDB ObjectId.
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<QuestionDocument | null> {
    return this.questionsService.findOne(id);
  }

  /**
   * Generates questions via AI and persists them to MongoDB.
   * Protected: requires admin or teacher role.
   */
  @Post('batch-generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  async batchGenerate(
    @Body() dto: BatchGenerateQuestionsDto
  ): Promise<{ stored: number; questions: QuestionDocument[] }> {
    const count = dto.count ?? 10;
    const difficulty = this.gradeToDifficulty(dto.grade);

    this.logger.log(
      `Batch generating ${count} questions: grade=${dto.grade} topic=${dto.topic}`
    );

    const startTime = Date.now();

    // Generate questions via AI pipeline (skip auto-persist; controller
    // persists with richer data including explanation, category, format)
    let generated;
    try {
      generated = await this.mathGenerator.generateQuestions(
        difficulty,
        count,
        dto.topic,
        false,
        dto.difficulty ?? 'medium'
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Question generation failed';
      this.logger.error(`Batch generation failed: ${message}`);
      throw new HttpException(
        { error: message },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

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
        difficulty: dto.difficulty ?? 'medium',
        country: 'NZ',
      },
    }));

    // Batch persist — duplicates are silently skipped
    const stored = await this.questionsService.createMany(questionDtos);

    // Index newly generated questions into OpenSearch for future RAG retrieval
    if (generated.length > 0) {
      try {
        await this.questionIndexingService.indexQuestions(generated);
        this.logger.log(
          `Indexed ${generated.length} questions into OpenSearch`
        );
      } catch (indexError) {
        // Non-blocking: questions are stored in MongoDB even if indexing fails
        this.logger.warn(
          `OpenSearch indexing failed (questions still saved): ${indexError}`
        );
      }
    }

    this.logger.log(
      `Batch complete: ${stored.length}/${
        generated.length
      } questions stored in ${Date.now() - startTime}ms`
    );

    return { stored: stored.length, questions: stored };
  }

  // ── Review Workflow ────────────────────────────────────────────

  /**
   * Approves or rejects a question.
   */
  @Patch(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  async reviewQuestion(
    @Param('id') id: string,
    @Body() dto: ReviewQuestionDto,
    @Request() req: { user?: { email?: string; userId?: string } }
  ) {
    const reviewedBy = req.user?.email || req.user?.userId || 'unknown';
    return this.questionsService.reviewQuestion(
      id,
      dto.status,
      reviewedBy,
      dto.reviewNotes
    );
  }

  /**
   * Bulk approve/reject multiple questions.
   */
  @Post('bulk-review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  async bulkReview(
    @Body()
    body: {
      questionIds: string[];
      status: QuestionStatus;
      reviewNotes?: string;
    },
    @Request() req: { user?: { email?: string; userId?: string } }
  ) {
    const reviewedBy = req.user?.email || req.user?.userId || 'unknown';
    const results = await Promise.allSettled(
      body.questionIds.map((id) =>
        this.questionsService.reviewQuestion(
          id,
          body.status,
          reviewedBy,
          body.reviewNotes
        )
      )
    );
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    return { succeeded, failed, total: body.questionIds.length };
  }

  // ── LLM Refinement ────────────────────────────────────────────

  /**
   * Sends the question + correction instruction to the LLM and returns
   * a refined version. Does NOT auto-apply — the frontend previews first.
   */
  @Post(':id/refine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  async refineQuestion(
    @Param('id') id: string,
    @Body() dto: RefineQuestionDto
  ) {
    const question = await this.questionsService.findOne(id);
    if (!question) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    // Fetch lessons learned for this grade/topic to enhance prompt
    const lessonsPrompt = await this.questionsService.getLessonsForPrompt(
      question.grade,
      question.topic
    );

    const prompt = this.buildRefinementPrompt(
      question,
      dto.instruction,
      lessonsPrompt
    );

    try {
      const response = await this.ollamaService.generateRaw(prompt);
      const refined = this.parseRefinementResponse(response);
      return {
        original: {
          questionText: question.questionText,
          answer: question.answer,
          explanation: question.explanation,
          stepByStepSolution: question.stepByStepSolution,
          options: question.options,
        },
        refined,
        instruction: dto.instruction,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Refinement failed for question ${id}: ${message}`);
      throw new HttpException(
        `Refinement failed: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Applies a previously previewed refinement to the question.
   */
  @Patch(':id/apply-refinement')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  async applyRefinement(
    @Param('id') id: string,
    @Body()
    body: {
      questionText: string;
      answer: number | string;
      explanation?: string;
      stepByStepSolution?: string[];
      options?: string[];
      instruction: string;
    },
    @Request() req: { user?: { email?: string; userId?: string } }
  ) {
    const refinedBy = req.user?.email || req.user?.userId || 'unknown';
    return this.questionsService.applyRefinement(
      id,
      {
        questionText: body.questionText,
        answer: body.answer,
        explanation: body.explanation,
        stepByStepSolution: body.stepByStepSolution,
        options: body.options,
      },
      body.instruction,
      refinedBy
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  async deleteQuestion(@Param('id') id: string) {
    await this.questionsService.deleteQuestion(id);
    return { deleted: true };
  }

  // ── Direct Content Editing ─────────────────────────────────────

  /**
   * Directly updates a question's editable content fields.
   * Resets status to pending for re-review.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  async updateQuestion(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
    @Request() req: { user?: { email?: string; userId?: string } }
  ) {
    const editedBy = req.user?.email || req.user?.userId || 'unknown';
    return this.questionsService.updateQuestionContent(id, dto, editedBy);
  }

  // ── Lessons Learned (mutations) ─────────────────────────────

  @Post('lessons-learned')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  async createLessonLearned(
    @Body() dto: CreateLessonLearnedDto,
    @Request() req: { user?: { email?: string; userId?: string } }
  ) {
    const recordedBy = req.user?.email || req.user?.userId || 'unknown';
    return this.questionsService.createLessonLearned(dto, recordedBy);
  }

  @Patch('lessons-learned/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  async toggleLessonLearned(
    @Param('id') id: string,
    @Body() dto: ToggleLessonLearnedDto
  ) {
    return this.questionsService.toggleLessonLearned(id, dto.isActive);
  }

  @Delete('lessons-learned/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deleteLessonLearned(@Param('id') id: string) {
    await this.questionsService.deleteLessonLearned(id);
    return { deleted: true };
  }

  // ── Private Helpers ────────────────────────────────────────────

  private buildRefinementPrompt(
    question: QuestionDocument,
    instruction: string,
    lessonsPrompt: string
  ): string {
    let prompt = `You are a mathematics education expert reviewing generated questions for the NZ Curriculum.

CURRENT QUESTION:
- Question: ${question.questionText}
- Answer: ${question.answer}
- Explanation: ${question.explanation || 'None'}
- Grade: ${question.grade}
- Topic: ${question.topic}
- Difficulty: ${question.metadata?.difficulty || 'medium'}
- Format: ${question.format}`;

    if (question.options?.length) {
      prompt += `\n- Options: ${question.options.join(', ')}`;
    }
    if (question.stepByStepSolution?.length) {
      prompt += `\n- Step-by-step: ${question.stepByStepSolution.join(' | ')}`;
    }

    prompt += `

REVIEWER'S CORRECTION INSTRUCTION:
${instruction}`;

    if (lessonsPrompt) {
      prompt += `\n\n${lessonsPrompt}`;
    }

    prompt += `

TASK: Refine the question according to the reviewer's instruction. Maintain curriculum alignment for Grade ${
      question.grade
    } NZ Mathematics. Keep the difficulty level at "${
      question.metadata?.difficulty || 'medium'
    }" unless the instruction says otherwise.

Respond in VALID JSON format only:
{
  "questionText": "refined question text — wrap ALL numbers and math expressions in LaTeX $...$ delimiters, e.g. A rugby team has $360$ jerseys shared among $12$ teams",
  "answer": <refined answer (number or string)>,
  "explanation": "refined explanation — wrap ALL numbers and math in $...$ delimiters",
  "stepByStepSolution": ["step with $math$ wrapped in LaTeX", ...],
  "options": ["option with $numbers$ in LaTeX", ...] or []
}

IMPORTANT LaTeX rules:
- Every number must be wrapped: $5$, $360$, $12$
- Every math expression must be wrapped: $5 + 3 = 8$, $\\frac{3}{4}$, $5 \\times 3$
- Use \\times for multiplication, \\div for division, \\frac{a}{b} for fractions
- Narrative text stays plain, only numbers and math use $...$`;

    return prompt;
  }

  private parseRefinementResponse(response: string): {
    questionText: string;
    answer: number | string;
    explanation: string;
    stepByStepSolution: string[];
    options: string[];
  } {
    this.logger.debug(
      `Raw LLM refinement response (first 500 chars): ${response.substring(
        0,
        500
      )}`
    );

    try {
      // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
      const cleaned = response
        .replace(/```(?:json)?\s*/gi, '')
        .replace(/```/g, '');

      // Extract the outermost JSON object containing "questionText"
      const jsonMatch = cleaned.match(/\{[\s\S]*?"questionText"[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(
          `No JSON with "questionText" found in LLM response: ${response.substring(
            0,
            200
          )}`
        );
      }

      // Sanitize control characters that break JSON.parse — replace with spaces
      // (structural whitespace and in-string newlines are both safe as spaces)
      // eslint-disable-next-line no-control-regex
      let sanitized = jsonMatch[0].replace(/[\u0000-\u001F\u007F]/g, ' ');

      // Fix LaTeX commands that collide with JSON escapes:
      // \frac → \f + rac (form feed), \times → \t + imes (tab),
      // \newline → \n + ewline (newline), \binom → \b + inom (backspace),
      // \right → \r + ight (carriage return)
      // When \b, \f, \n, \r, \t are followed by a letter, it's a LaTeX command — escape it
      sanitized = sanitized.replace(/\\([bfnrt])(?=[a-zA-Z])/g, '\\\\$1');

      // Fix remaining invalid JSON escape sequences (e.g. \$ \( \) \= \# etc.)
      // Valid JSON escapes are: \" \\ \/ \b \f \n \r \t \uXXXX
      // Replace any backslash NOT followed by a valid escape char with double-backslash
      sanitized = sanitized.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');

      const parsed = JSON.parse(sanitized);
      return {
        questionText: parsed.questionText || '',
        answer: parsed.answer ?? '',
        explanation: parsed.explanation || '',
        stepByStepSolution: parsed.stepByStepSolution || [],
        options: parsed.options || [],
      };
    } catch (error) {
      this.logger.error(
        `Failed to parse refinement response: ${
          error instanceof Error ? error.message : error
        }`
      );
      throw new Error(
        'Failed to parse LLM refinement response. Please try again.'
      );
    }
  }

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
