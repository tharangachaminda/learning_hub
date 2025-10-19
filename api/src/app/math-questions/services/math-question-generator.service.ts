import {
  MathQuestion,
  OperationType,
  DifficultyLevel,
} from '../entities/math-question.entity';

/**
 * Service responsible for generating mathematical questions for educational purposes
 * Implements curriculum-aligned question generation with appropriate difficulty levels
 *
 * @example
 * ```typescript
 * const generator = new MathQuestionGenerator();
 * const questions = await generator.generateAdditionQuestions(DifficultyLevel.GRADE_3, 10);
 * ```
 */
export class MathQuestionGenerator {
  /**
   * Generates addition questions for specified difficulty level and count
   *
   * @param difficulty - The educational difficulty level for question complexity
   * @param count - Number of unique questions to generate
   * @returns Promise resolving to array of MathQuestion instances
   *
   * @throws {Error} When count is less than or equal to 0
   *
   * @example
   * ```typescript
   * const questions = await generator.generateAdditionQuestions(DifficultyLevel.GRADE_3, 5);
   * console.log(`Generated ${questions.length} addition questions`);
   * ```
   */
  async generateAdditionQuestions(
    difficulty: DifficultyLevel,
    count: number
  ): Promise<MathQuestion[]> {
    this.validateQuestionCount(count);

    const questions: MathQuestion[] = [];
    const usedQuestions = new Set<string>();

    while (questions.length < count) {
      const question = this.generateSingleAdditionQuestion(difficulty);

      // Ensure uniqueness
      if (!usedQuestions.has(question.question)) {
        usedQuestions.add(question.question);
        questions.push(question);
      }
    }

    return questions;
  }

  /**
   * Validates that question count is valid
   *
   * @param count - Number of questions to validate
   * @throws {Error} When count is invalid
   *
   * @private
   */
  private validateQuestionCount(count: number): void {
    if (count <= 0) {
      throw new Error('Question count must be greater than 0');
    }
  }

  /**
   * Generates a single addition question for the specified difficulty
   *
   * @param difficulty - The difficulty level for the question
   * @returns A single MathQuestion instance
   *
   * @private
   */
  private generateSingleAdditionQuestion(
    difficulty: DifficultyLevel
  ): MathQuestion {
    // Generate numbers appropriate for Grade 3 (0-50 range)
    const num1 = this.generateNumberForDifficulty(difficulty);
    const num2 = this.generateNumberForDifficulty(difficulty);

    const answer = num1 + num2;
    const questionText = `${num1} + ${num2} = ?`;

    const solution = this.generateSolutionSteps(
      num1,
      num2,
      answer,
      OperationType.ADDITION
    );

    return new MathQuestion(
      questionText,
      answer,
      OperationType.ADDITION,
      difficulty,
      solution
    );
  }

  /**
   * Generates appropriate numbers based on difficulty level
   * Implements New Zealand Curriculum Level 2-3 numerical ranges
   *
   * @param difficulty - The educational difficulty level
   * @returns A random number appropriate for the grade level complexity
   *
   * @private
   */
  private generateNumberForDifficulty(difficulty: DifficultyLevel): number {
    const ranges = this.getDifficultyRanges(difficulty);
    return (
      Math.floor(Math.random() * (ranges.max - ranges.min + 1)) + ranges.min
    );
  }

  /**
   * Gets numerical ranges for different difficulty levels
   * Based on NZ Curriculum standards for age-appropriate mathematics
   *
   * @param difficulty - The difficulty level to get ranges for
   * @returns Object containing min and max values for the difficulty
   *
   * @private
   */
  private getDifficultyRanges(difficulty: DifficultyLevel): {
    min: number;
    max: number;
  } {
    switch (difficulty) {
      case DifficultyLevel.GRADE_3:
        // Grade 3 (ages 7-8): Single digit to simple double-digit
        // Range allows for both 3+5=8 and 15+7=22 style problems
        return { min: 0, max: 50 };
      default:
        // Fallback for future difficulty levels
        return { min: 0, max: 10 };
    }
  }

  /**
   * Generates pedagogical step-by-step solution explanations
   * Creates instructional content aligned with elementary math teaching methods
   *
   * @param num1 - First number in the mathematical operation
   * @param num2 - Second number in the mathematical operation
   * @param answer - The correct calculated answer
   * @param operation - The type of mathematical operation being performed
   * @returns Array of sequential solution explanation steps
   *
   * @example
   * ```typescript
   * // For 7 + 3 = 10
   * const steps = generateSolutionSteps(7, 3, 10, OperationType.ADDITION);
   * // Returns: ["Start with the first number: 7", "Add the second number: 7 + 3", "The answer is: 10"]
   * ```
   *
   * @private
   */
  private generateSolutionSteps(
    num1: number,
    num2: number,
    answer: number,
    operation: OperationType
  ): string[] {
    switch (operation) {
      case OperationType.ADDITION:
        return this.generateAdditionSolutionSteps(num1, num2, answer);
      case OperationType.SUBTRACTION:
        return this.generateSubtractionSolutionSteps(num1, num2, answer);
      default:
        return [`The answer is: ${answer}`];
    }
  }

  /**
   * Generates specific solution steps for addition operations
   * Provides clear, sequential guidance for students learning addition
   *
   * @param num1 - The first addend
   * @param num2 - The second addend
   * @param sum - The calculated sum
   * @returns Array of addition-specific solution steps
   *
   * @private
   */
  private generateAdditionSolutionSteps(
    num1: number,
    num2: number,
    sum: number
  ): string[] {
    return [
      `Start with the first number: ${num1}`,
      `Add the second number: ${num1} + ${num2}`,
      `The answer is: ${sum}`,
    ];
  }

  /**
   * Generates specific solution steps for subtraction operations
   * Provides clear, sequential guidance for students learning subtraction
   *
   * @param num1 - The minuend (number being subtracted from)
   * @param num2 - The subtrahend (number being subtracted)
   * @param difference - The calculated difference
   * @returns Array of subtraction-specific solution steps
   *
   * @private
   */
  private generateSubtractionSolutionSteps(
    num1: number,
    num2: number,
    difference: number
  ): string[] {
    return [
      `Start with the first number: ${num1}`,
      `Subtract the second number: ${num1} - ${num2}`,
      `The answer is: ${difference}`,
    ];
  }
}
