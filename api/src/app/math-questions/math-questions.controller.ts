import { Controller, Get, Query, Post, Body, Optional } from '@nestjs/common';
import { MathQuestionGenerator } from './services/math-question-generator.service';
import {
  MathQuestion,
  DifficultyLevel,
  OperationType,
} from './entities/math-question.entity';
import {
  SemanticSearchService,
  SearchResult,
} from '../opensearch/semantic-search.service';
import { FindSimilarQuestionsDto } from './dto/find-similar-questions.dto';

/**
 * REST API controller for mathematical question generation
 * Provides endpoints for generating curriculum-aligned math problems
 *
 * @example
 * GET /api/math-questions/generate?difficulty=grade_3&count=10&type=addition
 */
@Controller('math-questions')
export class MathQuestionsController {
  constructor(
    private readonly questionGenerator: MathQuestionGenerator,
    @Optional() private readonly semanticSearchService?: SemanticSearchService
  ) {}

  /**
   * Generates mathematical questions based on specified parameters
   *
   * @param difficulty - Educational difficulty level (default: grade_3)
   * @param count - Number of questions to generate (default: 10, max: 50)
   * @param type - Type of mathematical operation (default: addition)
   * @returns Array of generated MathQuestion objects
   *
   * @example
   * GET /api/math-questions/generate?difficulty=grade_3&count=5&type=addition
   */
  @Get('generate')
  async generateQuestions(
    @Query('difficulty') difficulty: string = 'grade_3',
    @Query('count') count: string = '10',
    @Query('type') type: string = 'addition'
  ): Promise<MathQuestion[]> {
    const questionCount = Math.min(parseInt(count, 10) || 10, 50);
    const difficultyLevel = this.parseDifficultyLevel(difficulty);
    const operationType = this.parseOperationType(type);

    const startTime = Date.now();

    let questions: MathQuestion[];

    switch (operationType) {
      case OperationType.ADDITION:
        questions = await this.questionGenerator.generateAdditionQuestions(
          difficultyLevel,
          questionCount
        );
        break;
      case OperationType.SUBTRACTION:
        // Future implementation for subtraction
        throw new Error('Subtraction questions not yet implemented');
      default:
        throw new Error(`Unsupported operation type: ${type}`);
    }

    const generationTime = Date.now() - startTime;

    // Log performance for monitoring
    console.log(
      `Generated ${questionCount} ${type} questions in ${generationTime}ms`
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
   * Health check endpoint for the math questions service
   *
   * @returns Service status and capabilities
   */
  @Get('health')
  getServiceHealth(): object {
    return {
      status: 'healthy',
      service: 'math-questions',
      capabilities: {
        supportedDifficulties: Object.values(DifficultyLevel),
        supportedOperations: Object.values(OperationType),
        maxQuestionsPerRequest: 50,
        explanationStyles: ['visual', 'verbal', 'step-by-step', 'story'],
        semanticSearch: this.semanticSearchService !== undefined,
      },
      version: '2.0.0', // Updated with explanation generation
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
   * Converts difficulty level to grade number.
   *
   * @private
   */
  private difficultyToGrade(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case DifficultyLevel.GRADE_3:
        return 3;
      default:
        return 3;
    }
  }

  /**
   * Parses difficulty level string to enum value
   *
   * @param difficulty - Difficulty string from query parameter
   * @returns Corresponding DifficultyLevel enum value
   * @throws Error if difficulty level is not supported
   *
   * @private
   */
  private parseDifficultyLevel(difficulty: string): DifficultyLevel {
    const normalizedDifficulty = difficulty.toLowerCase();

    switch (normalizedDifficulty) {
      case 'grade_3':
      case 'grade3':
        return DifficultyLevel.GRADE_3;
      default:
        throw new Error(
          `Unsupported difficulty level: ${difficulty}. Supported: ${Object.values(
            DifficultyLevel
          ).join(', ')}`
        );
    }
  }

  /**
   * Parses operation type string to enum value
   *
   * @param type - Operation type string from query parameter
   * @returns Corresponding OperationType enum value
   * @throws Error if operation type is not supported
   *
   * @private
   */
  private parseOperationType(type: string): OperationType {
    const normalizedType = type.toLowerCase();

    switch (normalizedType) {
      case 'addition':
      case 'add':
        return OperationType.ADDITION;
      case 'subtraction':
      case 'subtract':
        return OperationType.SUBTRACTION;
      default:
        throw new Error(
          `Unsupported operation type: ${type}. Supported: ${Object.values(
            OperationType
          ).join(', ')}`
        );
    }
  }
}
