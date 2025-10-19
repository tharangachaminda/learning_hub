import { Controller, Get, Query } from '@nestjs/common';
import { MathQuestionGenerator } from './services/math-question-generator.service';
import {
  MathQuestion,
  DifficultyLevel,
  OperationType,
} from './entities/math-question.entity';

/**
 * REST API controller for mathematical question generation
 * Provides endpoints for generating curriculum-aligned math problems
 *
 * @example
 * GET /api/math-questions/generate?difficulty=grade_3&count=10&type=addition
 */
@Controller('math-questions')
export class MathQuestionsController {
  constructor(private readonly questionGenerator: MathQuestionGenerator) {}

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
      },
      version: '1.0.0',
    };
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
