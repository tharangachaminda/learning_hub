import {
  BadRequestException,
  ConflictException,
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
import { VisualAssetRegistryService } from '../ai/visual-asset-registry.service';
import { DifficultyLevel } from '../math-questions/entities/math-question.entity';
import {
  QuestionDocument,
  QuestionFormat,
  QuestionStatus,
} from './schemas/question.schema';
import { FindQuestionsDto } from './dto/find-questions.dto';
import { BatchGenerateQuestionsDto } from './dto/batch-generate-questions.dto';
import {
  CreateQuestionDto,
  CreateQuestionVisualSelectionDto,
} from './dto/create-question.dto';
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
import { QUESTION_TYPE_TO_CATEGORY } from '../ai/curriculum.types';
import { QuestionIndexingService } from '../opensearch/question-indexing.service';
import {
  getMathematicsTopicCriteria,
  getMathematicsYearPlan,
  MATHEMATICS_CURRICULUM,
} from '../ai/mathematics-curriculum.criteria';

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
    private readonly questionIndexingService: QuestionIndexingService,
    private readonly visualAssetRegistryService: VisualAssetRegistryService
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
  @Roles('admin', 'teacher', 'student')
  getCurriculum() {
    const years = MATHEMATICS_CURRICULUM.years.map((yearPlan) => ({
      grade: yearPlan.year,
      year: yearPlan.year,
      subject: MATHEMATICS_CURRICULUM.subject,
      phase: yearPlan.phase,
      focusSummary: yearPlan.focusSummary,
      topics: yearPlan.topics.map((topic) => ({
        key: topic.key,
        label: topic.label,
        strand: topic.strand,
        overview: topic.overview,
        legacyTopicKeys: topic.legacyTopicKeys ?? [],
        category: this.topicToCategory(topic.key, topic),
      })),
    }));

    return {
      subjects: [
        {
          subject: MATHEMATICS_CURRICULUM.subject,
          version: MATHEMATICS_CURRICULUM.version,
          years,
        },
      ],
      grades: years,
    };
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
    const gradeNum = grade !== undefined ? parseInt(grade, 10) : undefined;
    return this.questionsService.getAnalytics(
      gapThreshold,
      gradeNum !== undefined && gradeNum >= 0 && gradeNum <= 10
        ? gradeNum
        : undefined
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
    @Query('difficulty') difficulty?: string,
    @Query('subject') subject?: string
  ): Promise<PracticeQuestionsResult> {
    const gradeNum = parseInt(grade, 10);
    if (Number.isNaN(gradeNum) || gradeNum < 0 || gradeNum > 10) {
      throw new HttpException(
        'Grade must be between 0 and 10',
        HttpStatus.BAD_REQUEST
      );
    }
    this.validateSupportedSubject(subject);
    if (!topic) {
      throw new HttpException('Topic is required', HttpStatus.BAD_REQUEST);
    }
    this.resolveCurriculumTopicOrThrow(gradeNum, topic);
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
   * Manually creates a single question (no LLM involved). Used by the
   * admin/teacher "Question Creator" so authors can attach visuals picked
   * from the registry and submit for review directly.
   * Protected: requires admin or teacher role.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  async createQuestion(
    @Body() dto: CreateQuestionDto,
    @Request() req: { user?: { email?: string; userId?: string } }
  ): Promise<QuestionDocument> {
    const resolvedTopic = this.resolveCurriculumTopicOrThrow(
      dto.grade,
      dto.topic
    );
    const generatedByUser = req.user?.email || req.user?.userId || 'unknown';

    const visuals = await this.resolveManualVisualSelectionsOrThrow(
      dto.grade,
      dto.topic,
      dto.visualSelections ?? []
    );

    const created = await this.questionsService.create({
      questionText: dto.questionText,
      answer: dto.answer,
      answerAssetId: dto.answerAssetId,
      explanation: dto.explanation ?? '',
      grade: dto.grade,
      topic: dto.topic,
      category: dto.category ?? this.topicToCategory(dto.topic, resolvedTopic),
      subCategories: dto.subCategories ?? [],
      format: dto.format ?? QuestionFormat.OPEN_ENDED,
      options: dto.options ?? [],
      stepByStepSolution: dto.stepByStepSolution ?? [],
      visualSelections: dto.visualSelections ?? [],
      visuals,
      visualLayout: dto.visualLayout,
      generatedByUser,
      metadata: {
        source: 'manual',
        difficulty: dto.metadata?.difficulty ?? 'medium',
        country: dto.metadata?.country ?? 'NZ',
        subject: MATHEMATICS_CURRICULUM.subject,
        curriculumVersion: MATHEMATICS_CURRICULUM.version,
        resolvedTopicKey: resolvedTopic?.key,
        resolvedTopicLabel: resolvedTopic?.label,
        curriculumStrand: resolvedTopic?.strand,
        sourceTopicKey: dto.topic,
      },
    });

    if (!created) {
      throw new ConflictException(
        'A question with the same text, grade, and topic already exists.'
      );
    }

    return created;
  }

  /**
   * Generates questions via AI and persists them to MongoDB.
   * Protected: requires admin or teacher role.
   */
  @Post('batch-generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  async batchGenerate(
    @Body() dto: BatchGenerateQuestionsDto,
    @Request() req: { user?: { email?: string; userId?: string } }
  ): Promise<{ stored: number; questions: QuestionDocument[] }> {
    const count = dto.count ?? 10;
    this.validateSupportedSubject(dto.subject);
    const resolvedTopic = this.resolveCurriculumTopicOrThrow(
      dto.grade,
      dto.topic
    );
    const yearPlan = getMathematicsYearPlan(dto.grade);
    const difficulty = this.gradeToDifficulty(dto.grade);
    const generatedByUser = req.user?.email || req.user?.userId || 'unknown';

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
        dto.difficulty ?? 'medium',
        dto.grade,
        dto.format ?? QuestionFormat.OPEN_ENDED
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
      answerAssetId: q.answerAssetId,
      explanation: q.stepByStepSolution?.join('\n') || '',
      grade: dto.grade,
      topic: dto.topic,
      category: this.topicToCategory(dto.topic, resolvedTopic),
      subCategories: q.subCategory ? [q.subCategory] : [],
      format: q.format ?? dto.format ?? QuestionFormat.OPEN_ENDED,
      options: q.options ?? [],
      stepByStepSolution: q.stepByStepSolution || [],
      visualSelections: (q.visualSelections || []).flatMap((selection) => {
        if (!selection.assetId || !selection.role) {
          return [];
        }

        return [
          {
            assetId: selection.assetId,
            role: selection.role,
            placement: selection.placement,
            render: selection.render,
            layout: selection.layout,
          },
        ];
      }),
      visuals: q.visuals || [],
      visualLayout: q.visualLayout,
      generatedByUser,
      metadata: {
        generatedBy: 'falcon3:latest',
        generationTime: Date.now() - startTime,
        difficulty: dto.difficulty ?? 'medium',
        country: 'NZ',
        subject: dto.subject ?? MATHEMATICS_CURRICULUM.subject,
        curriculumVersion: MATHEMATICS_CURRICULUM.version,
        resolvedTopicKey: resolvedTopic?.key,
        resolvedTopicLabel: resolvedTopic?.label,
        curriculumStrand: resolvedTopic?.strand,
        curriculumPhase: yearPlan?.phase,
        sourceTopicKey: dto.topic,
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
    const question = await this.questionsService.reviewQuestion(
      id,
      dto.status,
      reviewedBy,
      dto.reviewNotes
    );

    return this.syncApprovedQuestion(question, reviewedBy);
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
        this.reviewAndSyncQuestion(
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

  @Post(':id/retry-index')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  async retryIndexQuestion(
    @Param('id') id: string,
    @Request() req: { user?: { email?: string; userId?: string } }
  ) {
    const question = await this.questionsService.findOne(id);
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    if (question.status !== QuestionStatus.APPROVED) {
      throw new BadRequestException(
        'Only approved questions can be retried for OpenSearch indexing'
      );
    }

    const reviewedBy = req.user?.email || req.user?.userId || 'unknown';
    return this.syncApprovedQuestion(question, reviewedBy);
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
      answerAssetId?: string;
      explanation?: string;
      stepByStepSolution?: string[];
      options?: Array<
        string | { value: string; assetId?: string; svgPath?: string }
      >;
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
        answerAssetId: body.answerAssetId,
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
    const existing = await this.questionsService.findOne(id);
    if (!existing) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    const visuals =
      dto.visualSelections !== undefined
        ? await this.resolveManualVisualSelectionsOrThrow(
            existing.grade,
            existing.topic,
            dto.visualSelections
          )
        : undefined;

    return this.questionsService.updateQuestionContent(
      id,
      {
        ...dto,
        visuals,
      },
      editedBy
    );
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
      prompt += `\n- Options: ${question.options
        .map((option) =>
          typeof option === 'string'
            ? option
            : option.assetId
            ? `${option.value} [asset:${option.assetId}]`
            : option.value
        )
        .join(', ')}`;
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

  private async reviewAndSyncQuestion(
    id: string,
    status: QuestionStatus,
    reviewedBy: string,
    reviewNotes?: string
  ) {
    const question = await this.questionsService.reviewQuestion(
      id,
      status,
      reviewedBy,
      reviewNotes
    );

    return this.syncApprovedQuestion(question, reviewedBy);
  }

  private async syncApprovedQuestion(
    question: QuestionDocument,
    reviewedBy: string
  ): Promise<QuestionDocument> {
    if (question.status !== QuestionStatus.APPROVED) {
      return question;
    }

    await this.questionsService.markVectorSyncPrepared(question.id);

    try {
      await this.questionIndexingService.indexStoredQuestion(question);
      return await this.questionsService.markVectorSyncStored(
        question.id,
        reviewedBy,
        question.id
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `OpenSearch indexing failed for approved question ${question.id}: ${message}`
      );

      return this.questionsService.markVectorSyncFailed(question.id, message);
    }
  }

  private parseRefinementResponse(response: string): {
    questionText: string;
    answer: number | string;
    answerAssetId?: string;
    explanation: string;
    stepByStepSolution: string[];
    options: Array<
      string | { value: string; assetId?: string; svgPath?: string }
    >;
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
      0: DifficultyLevel.GRADE_3,
      1: DifficultyLevel.GRADE_3,
      2: DifficultyLevel.GRADE_3,
      3: DifficultyLevel.GRADE_3,
      4: DifficultyLevel.GRADE_4,
      5: DifficultyLevel.GRADE_5,
      6: DifficultyLevel.GRADE_6,
      7: DifficultyLevel.GRADE_7,
      8: DifficultyLevel.GRADE_8,
      9: DifficultyLevel.GRADE_8,
      10: DifficultyLevel.GRADE_8,
    };
    return mapping[grade] ?? DifficultyLevel.GRADE_3;
  }

  private topicToCategory(
    topic: string,
    resolvedTopic?: { key: string; strand: string } | null
  ): string {
    const directCategory = QUESTION_TYPE_TO_CATEGORY[topic];
    if (directCategory) {
      return directCategory;
    }

    const resolvedCategory = resolvedTopic?.key
      ? QUESTION_TYPE_TO_CATEGORY[resolvedTopic.key]
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

  private validateSupportedSubject(subject?: string): void {
    const normalizedSubject = (
      subject || MATHEMATICS_CURRICULUM.subject
    ).toLowerCase();
    if (normalizedSubject !== MATHEMATICS_CURRICULUM.subject) {
      throw new BadRequestException(
        `Unsupported subject '${subject}'. Currently supported subjects: ${MATHEMATICS_CURRICULUM.subject}`
      );
    }
  }

  private resolveCurriculumTopicOrThrow(grade: number, topic: string) {
    const yearPlan = getMathematicsYearPlan(grade);
    const resolvedTopic = getMathematicsTopicCriteria(grade, topic);

    if (!yearPlan || !resolvedTopic) {
      const validTopics = yearPlan?.topics.flatMap((entry) => [
        entry.key,
        ...(entry.legacyTopicKeys ?? []),
      ]);
      throw new BadRequestException(
        `Topic '${topic}' is not supported for grade ${grade}. Valid topics: ${
          validTopics?.join(', ') || 'none'
        }`
      );
    }

    return resolvedTopic;
  }

  /**
   * Validates manually picked visual selections against the approved catalog
   * for the given grade/topic and resolves them into stored `QuestionVisual`s.
   * Unlike LLM generation (which silently drops unapproved picks), manual
   * creation must surface a clear error so the author can fix the selection.
   */
  private async resolveManualVisualSelectionsOrThrow(
    grade: number,
    topic: string,
    selections: CreateQuestionVisualSelectionDto[]
  ) {
    if (selections.length === 0) {
      return [];
    }

    const approvedAssets =
      await this.visualAssetRegistryService.getGenerationCatalog({
        grade,
        topic,
      });
    const approvedById = new Map(
      approvedAssets.map((asset) => [asset.assetId, asset])
    );

    const invalid = selections.filter((selection) => {
      const asset = approvedById.get(selection.assetId);
      return !asset || !asset.roles.includes(selection.role);
    });

    if (invalid.length > 0) {
      throw new BadRequestException(
        `Invalid visual selection(s) for grade ${grade}, topic '${topic}': ${invalid
          .map((selection) => selection.assetId)
          .join(', ')}`
      );
    }

    return this.visualAssetRegistryService.resolveSelectedVisuals(
      { grade, topic },
      selections,
      { maxVisuals: selections.length }
    );
  }
}
