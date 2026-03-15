import { Controller, Get, Query, Post, Body, Optional } from '@nestjs/common';
import { MathQuestionGenerator } from './services/math-question-generator.service';
import { MathQuestion, DifficultyLevel } from './entities/math-question.entity';
import {
  SemanticSearchService,
  SearchResult,
} from '../opensearch/semantic-search.service';
import { FindSimilarQuestionsDto } from './dto/find-similar-questions.dto';
import { GRADE_TOPICS } from '../ai/curriculum.types';

/**
 * REST API controller for mathematical question generation.
 * Provides endpoints for generating curriculum-aligned math problems.
 * Validates topics against GRADE_TOPICS per grade.
 *
 * @example
 * GET /api/math-questions/generate?difficulty=grade_4&count=10&topic=FRACTION_BASICS
 */
@Controller('math-questions')
export class MathQuestionsController {
  constructor(
    private readonly questionGenerator: MathQuestionGenerator,
    @Optional() private readonly semanticSearchService?: SemanticSearchService
  ) {}

  /**
   * Generates mathematical questions based on specified parameters.
   * Validates the requested topic against GRADE_TOPICS for the given grade.
   *
   * @param difficulty - Educational difficulty level (default: 'grade_3')
   * @param count - Number of questions to generate (default: 10, max: 50)
   * @param topic - Topic string from GRADE_TOPICS (default: 'ADDITION')
   * @returns Promise resolving to array of generated MathQuestion objects
   *
   * @throws {Error} When difficulty level is not supported (grades 3–8)
   * @throws {Error} When topic is not valid for the requested grade
   *
   * @example
   * ```
   * GET /api/math-questions/generate?difficulty=grade_4&count=5&topic=FRACTION_BASICS
   * ```
   */
  @Get('generate')
  async generateQuestions(
    @Query('difficulty') difficulty: string = 'grade_3',
    @Query('count') count: string = '10',
    @Query('topic') topic: string = 'ADDITION'
  ): Promise<MathQuestion[]> {
    const questionCount = Math.min(parseInt(count, 10) || 10, 50);
    const difficultyLevel = this.parseDifficultyLevel(difficulty);
    const gradeNumber = this.difficultyToGrade(difficultyLevel);

    // Normalize topic to uppercase to match GRADE_TOPICS keys
    const normalizedTopic = topic.toUpperCase();

    // Validate topic against GRADE_TOPICS for the requested grade
    this.validateTopicForGrade(normalizedTopic, gradeNumber);

    const startTime = Date.now();

    const questions = await this.questionGenerator.generateQuestions(
      difficultyLevel,
      questionCount,
      normalizedTopic
    );

    const generationTime = Date.now() - startTime;

    // Log performance for monitoring
    console.log(
      `Generated ${questionCount} ${normalizedTopic} questions in ${generationTime}ms`
    );

    // Validate performance requirement (<3 seconds)
    if (generationTime > 3000) {
      console.warn(
        `Performance warning: Generation took ${generationTime}ms (>3000ms threshold)`
      );
    }

    return questions;
  }

  /**
   * Health check endpoint for the math questions service.
   *
   * @returns Service status and capabilities including supported grades
   */
  @Get('health')
  getServiceHealth(): object {
    return {
      status: 'healthy',
      service: 'math-questions',
      capabilities: {
        supportedDifficulties: Object.values(DifficultyLevel),
        supportedGrades: [3, 4, 5, 6, 7, 8],
        maxQuestionsPerRequest: 50,
        explanationStyles: ['visual', 'verbal', 'step-by-step', 'story'],
        semanticSearch: this.semanticSearchService !== undefined,
      },
      version: '2.0.0',
    };
  }

  /**
   * Finds similar questions using semantic search.
   * Uses vector embeddings and kNN search to find semantically similar questions.
   *
   * @param dto - Request body containing question text and optional filters
   * @returns Array of similar questions with similarity scores
   * @throws Error if semantic search service is not available
   *
   * @example
   * POST /api/math-questions/similar
   * {
   *   "questionText": "What is 5 + 3?",
   *   "grade": 3,
   *   "topic": "addition",
   *   "limit": 10
   * }
   */
  @Post('similar')
  async findSimilarQuestions(
    @Body() dto: FindSimilarQuestionsDto
  ): Promise<SearchResult[]> {
    if (!this.semanticSearchService) {
      throw new Error(
        'Semantic search service is not available. Please ensure OpenSearch is configured.'
      );
    }

    // Validate and cap limit
    const limit = dto.limit ? Math.min(dto.limit, 50) : 10;

    // Perform semantic search
    const results = await this.semanticSearchService.findSimilar(
      dto.questionText,
      {
        grade: dto.grade,
        topic: dto.topic,
        operation: dto.operation,
        excludeIds: dto.excludeIds,
        limit,
      }
    );

    return results;
  }

  /**
   * Generates AI-powered explanation for a specific math question.
   * Supports multiple explanation styles adapted to grade level.
   *
   * @param body - Request body containing question details
   * @param body.question - The mathematical question
   * @param body.answer - The correct answer
   * @param body.studentAnswer - Optional student's answer for targeted feedback
   * @param body.difficulty - Grade difficulty level (default: grade_3)
   * @param body.style - Explanation style (default: step-by-step)
   * @returns Enhanced explanation with metadata
   *
   * @example
   * POST /api/math-questions/explain
   * Body: {
   *   "question": "7 + 5 = ?",
   *   "answer": 12,
   *   "studentAnswer": 10,
   *   "difficulty": "grade_3",
   *   "style": "step-by-step"
   * }
   */
  @Post('explain')
  async generateExplanation(
    @Body()
    body: {
      question: string;
      answer: number;
      studentAnswer?: number;
      difficulty?: string;
      style?: 'visual' | 'verbal' | 'step-by-step' | 'story';
    }
  ): Promise<{
    explanation: string;
    style: string;
    metadata: {
      generation_time: number;
      grade_level: number;
    };
  }> {
    const startTime = Date.now();

    const difficultyLevel = body.difficulty
      ? this.parseDifficultyLevel(body.difficulty)
      : DifficultyLevel.GRADE_3;

    const style = body.style || 'step-by-step';

    const explanation =
      await this.questionGenerator.generateEnhancedExplanation(
        body.question,
        body.answer,
        difficultyLevel,
        body.studentAnswer,
        style
      );

    const generationTime = Date.now() - startTime;

    // Log performance for monitoring
    console.log(`Generated ${style} explanation in ${generationTime}ms`);

    // Validate performance requirement (<2 seconds for Story 03)
    if (generationTime > 2000) {
      console.warn(
        `Performance warning: Explanation generation took ${generationTime}ms (>2000ms threshold)`
      );
    }

    return {
      explanation,
      style,
      metadata: {
        generation_time: generationTime,
        grade_level: this.difficultyToGrade(difficultyLevel),
      },
    };
  }

  /**
   * Converts a DifficultyLevel enum value to its corresponding grade number.
   * Used for curriculum level lookups and metadata in API responses.
   *
   * @param difficulty - The DifficultyLevel enum value
   * @returns The numeric grade (3–8) corresponding to the difficulty
   *
   * @example
   * ```typescript
   * difficultyToGrade(DifficultyLevel.GRADE_5); // 5
   * difficultyToGrade(DifficultyLevel.GRADE_8); // 8
   * ```
   *
   * @private
   */
  private difficultyToGrade(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case DifficultyLevel.GRADE_3:
        return 3;
      case DifficultyLevel.GRADE_4:
        return 4;
      case DifficultyLevel.GRADE_5:
        return 5;
      case DifficultyLevel.GRADE_6:
        return 6;
      case DifficultyLevel.GRADE_7:
        return 7;
      case DifficultyLevel.GRADE_8:
        return 8;
      default:
        return 3;
    }
  }

  /**
   * Parses difficulty level string to enum value.
   * Supports grade_3 through grade_8 with flexible input formats
   * (e.g., "grade_5", "grade5", "GRADE_5").
   *
   * @param difficulty - Difficulty string from query parameter
   * @returns Corresponding DifficultyLevel enum value
   * @throws {Error} When difficulty level is not in the supported range (grades 3–8)
   *
   * @example
   * ```typescript
   * parseDifficultyLevel('grade_5'); // DifficultyLevel.GRADE_5
   * parseDifficultyLevel('grade5');  // DifficultyLevel.GRADE_5
   * parseDifficultyLevel('grade_9'); // throws Error
   * ```
   *
   * @private
   */
  private parseDifficultyLevel(difficulty: string): DifficultyLevel {
    const normalizedDifficulty = difficulty.toLowerCase();

    switch (normalizedDifficulty) {
      case 'grade_3':
      case 'grade3':
        return DifficultyLevel.GRADE_3;
      case 'grade_4':
      case 'grade4':
        return DifficultyLevel.GRADE_4;
      case 'grade_5':
      case 'grade5':
        return DifficultyLevel.GRADE_5;
      case 'grade_6':
      case 'grade6':
        return DifficultyLevel.GRADE_6;
      case 'grade_7':
      case 'grade7':
        return DifficultyLevel.GRADE_7;
      case 'grade_8':
      case 'grade8':
        return DifficultyLevel.GRADE_8;
      default:
        throw new Error(
          `Unsupported difficulty level: ${difficulty}. Supported: ${Object.values(
            DifficultyLevel
          ).join(', ')}`
        );
    }
  }

  /**
   * Validates that a topic is available for the given grade.
   * Uses GRADE_TOPICS from curriculum.types.ts as the source of truth.
   *
   * @param topic - The topic string to validate (e.g. 'FRACTION_BASICS')
   * @param grade - The grade number (3–8)
   * @throws {Error} When topic is not valid for the grade, including list of valid topics
   *
   * @example
   * ```typescript
   * this.validateTopicForGrade('FRACTION_BASICS', 4); // passes
   * this.validateTopicForGrade('ALGEBRAIC_EQUATIONS', 3); // throws with valid topics for grade 3
   * ```
   *
   * @private
   */
  private validateTopicForGrade(topic: string, grade: number): void {
    const gradeTopics = GRADE_TOPICS[grade];
    if (!gradeTopics) {
      throw new Error(
        `Invalid topic '${topic}' for grade ${grade}. No topics defined for this grade.`
      );
    }

    const validTopics = gradeTopics['mathematics'] || [];
    if (!validTopics.includes(topic)) {
      throw new Error(
        `Invalid topic '${topic}' for grade ${grade}. Valid topics: ${validTopics.join(
          ', '
        )}`
      );
    }
  }
}
