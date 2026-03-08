/**
 * Enumeration of mathematical operation types supported by the question generator
 * Aligned with elementary mathematics curriculum requirements
 *
 * @example
 * ```typescript
 * const additionType = OperationType.ADDITION;
 * const subtractionType = OperationType.SUBTRACTION;
 * ```
 */
export enum OperationType {
  /** Addition operation for combining numbers (e.g., 5 + 3 = 8) */
  ADDITION = 'addition',
  /** Subtraction operation for finding differences (e.g., 8 - 3 = 5) */
  SUBTRACTION = 'subtraction',
}

/**
 * Educational difficulty levels based on New Zealand Mathematics Curriculum
 * Defines cognitive complexity and numerical ranges appropriate for each grade
 *
 * @example
 * ```typescript
 * const gradeLevel = DifficultyLevel.GRADE_3;
 * ```
 */
export enum DifficultyLevel {
  /**
   * Grade 3 difficulty level (ages 7-8)
   * - Single digit and simple double-digit arithmetic
   * - Numbers typically 0-100 for addition, 0-50 for subtraction
   * - Aligns with NZ Curriculum Level 2 numeracy standards
   */
  GRADE_3 = 'grade_3',

  /**
   * Grade 4 difficulty level (ages 8-9)
   * - Double-digit arithmetic with carrying/borrowing
   * - Numbers typically 0-1000
   * - Aligns with NZ Curriculum Level 2 numeracy standards
   */
  GRADE_4 = 'grade_4',

  /**
   * Grade 5 difficulty level (ages 9-10)
   * - Multi-digit operations, introduction to fractions/decimals
   * - Numbers typically 0-10,000
   * - Aligns with NZ Curriculum Level 3 numeracy standards
   */
  GRADE_5 = 'grade_5',

  /**
   * Grade 6 difficulty level (ages 10-11)
   * - Complex multi-digit operations, fractions, decimals, percentages
   * - Numbers typically 0-100,000
   * - Aligns with NZ Curriculum Level 3 numeracy standards
   */
  GRADE_6 = 'grade_6',

  /**
   * Grade 7 difficulty level (ages 11-12)
   * - Integers, ratios, proportions, intro to algebra
   * - Negative numbers, larger number ranges
   * - Aligns with NZ Curriculum Level 4 numeracy standards
   */
  GRADE_7 = 'grade_7',

  /**
   * Grade 8 difficulty level (ages 12-13)
   * - Algebra, equations, advanced fractions/decimals
   * - Complex problem-solving and reasoning
   * - Aligns with NZ Curriculum Level 4 numeracy standards
   */
  GRADE_8 = 'grade_8',
}

/**
 * Represents a mathematical question with answer and solution steps
 * Core entity for the AI-powered question generation system
 *
 * @example
 * ```typescript
 * const question = new MathQuestion(
 *   '5 + 3 = ?',
 *   8,
 *   OperationType.ADDITION,
 *   DifficultyLevel.GRADE_3,
 *   ['Start with 5', 'Add 3', 'The answer is 8']
 * );
 * ```
 */
export class MathQuestion {
  /** Unique identifier (set by database) */
  public id?: string;

  /** Timestamp when the question was created */
  public readonly createdAt: Date;

  /**
   * Creates a new MathQuestion instance
   *
   * @param question - The question text presented to the student
   * @param answer - The correct numerical answer
   * @param operation - The type of mathematical operation
   * @param difficulty - The educational difficulty level
   * @param stepByStepSolution - Array of solution explanation steps
   *
   * @throws Error when question text is empty
   * @throws Error when answer is not a valid number
   *
   * @example
   * ```typescript
   * const mathQ = new MathQuestion(
   *   '7 + 2 = ?',
   *   9,
   *   OperationType.ADDITION,
   *   DifficultyLevel.GRADE_3
   * );
   * ```
   */
  constructor(
    public readonly question: string,
    public readonly answer: number,
    public readonly operation: OperationType,
    public readonly difficulty: DifficultyLevel,
    public readonly stepByStepSolution: string[] = []
  ) {
    this.validateQuestionText(question);
    this.validateAnswer(answer);
    this.createdAt = new Date();
  }

  /**
   * Validates that question text is not empty or whitespace-only
   *
   * @param questionText - The question text to validate
   * @throws {Error} When question text is invalid
   *
   * @private
   */
  private validateQuestionText(questionText: string): void {
    if (!questionText || questionText.trim().length === 0) {
      throw new Error('Question text cannot be empty');
    }
  }

  /**
   * Validates that the answer is a valid number
   *
   * @param answerValue - The answer value to validate
   * @throws {Error} When answer is not a valid number
   *
   * @private
   */
  private validateAnswer(answerValue: number): void {
    if (
      typeof answerValue !== 'number' ||
      answerValue === null ||
      answerValue === undefined
    ) {
      throw new Error('Answer must be a valid number');
    }
  }
}
