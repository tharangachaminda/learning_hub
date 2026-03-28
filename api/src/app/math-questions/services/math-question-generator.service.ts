import { Injectable, Logger } from '@nestjs/common';
import {
  MathQuestion,
  DifficultyLevel,
} from '../entities/math-question.entity';
import { OllamaService } from '../../ai/ollama.service';
import { QuestionsService } from '../../questions/questions.service';

/**
 * Service responsible for generating mathematical questions for educational purposes
 * Implements AI-powered question generation with deterministic fallback
 *
 * @example
 * ```typescript
 * const generator = new MathQuestionGenerator(ollamaService);
 * const questions = await generator.generateAdditionQuestions(DifficultyLevel.GRADE_3, 10);
 * ```
 */
@Injectable()
export class MathQuestionGenerator {
  private readonly logger = new Logger(MathQuestionGenerator.name);

  /**
   * Creates a new MathQuestionGenerator instance.
   *
   * @param ollamaService - Optional AI service for LLM-powered question generation
   * @param questionsService - Optional persistence service for auto-saving generated questions to MongoDB
   */
  constructor(
    private readonly ollamaService?: OllamaService,
    private readonly questionsService?: QuestionsService
  ) {}

  /**
   * Generates mathematical questions for any topic and difficulty level.
   * Attempts AI generation first, falls back to deterministic for basic arithmetic.
   *
   * @param difficulty - The educational difficulty level for question complexity
   * @param count - Number of unique questions to generate (max 50)
   * @param topic - Topic string from GRADE_TOPICS (e.g. 'ADDITION', 'FRACTION_BASICS', 'FINANCIAL_LITERACY')
   * @returns Promise resolving to array of MathQuestion instances
   *
   * @throws {Error} When count is less than or equal to 0
   *
   * @example
   * ```typescript
   * const questions = await generator.generateQuestions(DifficultyLevel.GRADE_4, 5, 'FRACTION_BASICS');
   * console.log(`Generated ${questions.length} fraction questions`);
   * ```
   */
  async generateQuestions(
    difficulty: DifficultyLevel,
    count: number,
    topic: string,
    autoPersist = true,
    questionDifficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<MathQuestion[]> {
    this.validateQuestionCount(count);
    const startTime = Date.now();

    let questions: MathQuestion[] = [];

    // Try AI generation first if OllamaService is available
    if (this.ollamaService) {
      try {
        const aiQuestions = await this.generateWithAI(
          difficulty,
          count,
          topic,
          questionDifficulty
        );
        if (aiQuestions && aiQuestions.length > 0) {
          questions = aiQuestions;
        }
      } catch (error) {
        console.warn(
          'AI generation failed, falling back to deterministic:',
          error.message
        );
      }
    }

    // Fallback to deterministic generation (only supports ADDITION)
    if (questions.length === 0 && topic === 'ADDITION') {
      questions = await this.generateDeterministicAdditionQuestions(
        difficulty,
        count,
        topic
      );
    } else if (questions.length === 0) {
      // For non-ADDITION topics without AI, return empty (AI is required)
      console.warn(
        `Deterministic fallback not available for topic '${topic}'. AI service required.`
      );
    }

    // Auto-persist generated questions to MongoDB if QuestionsService is available
    if (autoPersist && questions.length > 0 && this.questionsService) {
      await this.persistQuestions(questions, difficulty, topic, startTime);
    }

    return questions;
  }

  /**
   * Generates addition questions for specified difficulty level and count
   * Attempts AI generation first, falls back to deterministic if AI unavailable
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

    // Try AI generation first if OllamaService is available
    if (this.ollamaService) {
      try {
        const aiQuestions = await this.generateWithAI(
          difficulty,
          count,
          'addition'
        );
        if (aiQuestions && aiQuestions.length > 0) {
          return aiQuestions;
        }
      } catch (error) {
        console.warn(
          'AI generation failed, falling back to deterministic:',
          error.message
        );
      }
    }

    // Fallback to deterministic generation
    return this.generateDeterministicAdditionQuestions(difficulty, count);
  }

  /**
   * Generates questions using AI with curriculum context
   *
   * @param difficulty - The educational difficulty level
   * @param count - Number of questions to generate
   * @param topic - Mathematical topic (e.g., 'addition')
   * @returns Promise resolving to array of MathQuestion instances
   *
   * @private
   */
  private async generateWithAI(
    difficulty: DifficultyLevel,
    count: number,
    topic: string,
    questionDifficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<MathQuestion[]> {
    const questions: MathQuestion[] = [];
    const gradeNumber = this.difficultyToGrade(difficulty);

    for (let i = 0; i < count; i++) {
      const aiQuestion = await this.ollamaService.generateMathQuestion({
        grade: gradeNumber,
        topic,
        difficulty: questionDifficulty,
        country: 'NZ',
      });

      // Convert AI question format to MathQuestion entity
      // Use the AI-generated explanation from question generation
      questions.push(
        new MathQuestion(
          aiQuestion.question,
          aiQuestion.answer,
          topic,
          difficulty,
          [aiQuestion.explanation] // stepByStepSolution from AI
        )
      );
    }

    return questions;
  }

  /**
   * Generates enhanced explanation for a specific math question.
   * Uses AI to create grade-appropriate, style-specific explanations.
   *
   * @param question - The mathematical question text
   * @param answer - The correct answer
   * @param difficulty - The educational difficulty level
   * @param studentAnswer - Optional student's answer for targeted feedback
   * @param style - Explanation style ('visual', 'verbal', 'step-by-step', 'story')
   * @returns Promise resolving to enhanced explanation text
   *
   * @example
   * ```typescript
   * const explanation = await generator.generateEnhancedExplanation(
   *   '7 + 5 = ?',
   *   12,
   *   DifficultyLevel.GRADE_3,
   *   10,
   *   'step-by-step'
   * );
   * console.log(explanation); // "Let's count together! Start with 7..."
   * ```
   */
  async generateEnhancedExplanation(
    question: string,
    answer: number,
    difficulty: DifficultyLevel,
    studentAnswer?: number,
    style: 'visual' | 'verbal' | 'step-by-step' | 'story' = 'step-by-step'
  ): Promise<string> {
    if (!this.ollamaService) {
      // Fallback to basic explanation if no AI service
      return this.generateBasicExplanation(question, answer, difficulty);
    }

    try {
      const gradeNumber = this.difficultyToGrade(difficulty);

      const explanationResult = await this.ollamaService.generateExplanation({
        question,
        answer,
        studentAnswer,
        grade: gradeNumber,
        style,
        country: 'NZ',
      });

      // Combine explanation with encouragement for complete educational experience
      let fullExplanation = explanationResult.explanation;

      if (explanationResult.encouragement) {
        fullExplanation = `${explanationResult.encouragement}\n\n${fullExplanation}`;
      }

      return fullExplanation;
    } catch (error) {
      console.warn(
        'Enhanced explanation generation failed, using basic:',
        error.message
      );
      return this.generateBasicExplanation(question, answer, difficulty);
    }
  }

  /**
   * Generates basic explanation as fallback.
   *
   * @private
   */
  private generateBasicExplanation(
    question: string,
    answer: number,
    difficulty: DifficultyLevel
  ): string {
    const additionMatch = question.match(/(\d+)\s*\+\s*(\d+)/);

    if (additionMatch) {
      const [, num1, num2] = additionMatch;
      return `Let's solve this together! Start with ${num1}, then add ${num2}. Count step by step to get ${answer}. Great work!`;
    }

    return `The answer is ${answer}. Let's practice more problems like this!`;
  }

  /**
   * Persists generated questions to MongoDB via QuestionsService.
   * Maps MathQuestion entities to the persistence schema format and saves in batch.
   * Failures are logged but do not interrupt the generation flow.
   *
   * @param questions - Array of generated MathQuestion entities to persist
   * @param difficulty - The difficulty level used for generation
   * @param topic - The topic string used for generation
   * @param startTime - Timestamp (ms) when generation started, used to calculate generationTime
   *
   * @private
   */
  private async persistQuestions(
    questions: MathQuestion[],
    difficulty: DifficultyLevel,
    topic: string,
    startTime: number
  ): Promise<void> {
    try {
      const gradeNumber = this.difficultyToGrade(difficulty);
      const generationTime = Date.now() - startTime;

      const dtos = questions.map((q) => ({
        questionText: q.question,
        answer: q.answer,
        grade: gradeNumber,
        topic,
        stepByStepSolution: q.stepByStepSolution,
        metadata: {
          generatedBy: this.ollamaService ? 'ollama' : 'deterministic',
          difficulty: difficulty as string,
          country: 'NZ',
          generationTime,
        },
      }));

      await this.questionsService.createMany(dtos);
    } catch (error) {
      this.logger.warn(
        `Failed to persist ${questions.length} generated questions: ${error.message}`
      );
    }
  }

  /**
   * Converts DifficultyLevel to grade number
   *
   * @param difficulty - The difficulty level enum
   * @returns Grade number (1-12)
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
   * Generates addition questions using deterministic algorithm
   *
   * @param difficulty - The educational difficulty level for question complexity
   * @param count - Number of unique questions to generate
   * @returns Promise resolving to array of MathQuestion instances
   *
   * @private
   */
  private async generateDeterministicAdditionQuestions(
    difficulty: DifficultyLevel,
    count: number,
    topic: string = 'ADDITION'
  ): Promise<MathQuestion[]> {
    const questions: MathQuestion[] = [];
    const usedQuestions = new Set<string>();

    while (questions.length < count) {
      const question = this.generateSingleAdditionQuestion(difficulty, topic);

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
    difficulty: DifficultyLevel,
    topic: string = 'ADDITION'
  ): MathQuestion {
    // Generate numbers appropriate for Grade 3 (0-50 range)
    const num1 = this.generateNumberForDifficulty(difficulty);
    const num2 = this.generateNumberForDifficulty(difficulty);

    const answer = num1 + num2;
    const questionText = `$${num1} + ${num2} = ?$`;

    const solution = this.generateSolutionSteps(num1, num2, answer, 'ADDITION');

    return new MathQuestion(questionText, answer, topic, difficulty, solution);
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
   * const steps = generateSolutionSteps(7, 3, 10, 'ADDITION');
   * // Returns: ["Start with the first number: 7", "Add the second number: 7 + 3", "The answer is: 10"]
   * ```
   *
   * @private
   */
  private generateSolutionSteps(
    num1: number,
    num2: number,
    answer: number,
    operation: string
  ): string[] {
    switch (operation) {
      case 'ADDITION':
        return this.generateAdditionSolutionSteps(num1, num2, answer);
      case 'SUBTRACTION':
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
      `Start with the first number: $${num1}$`,
      `Add the second number: $${num1} + ${num2}$`,
      `The answer is: $${sum}$`,
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
      `Start with the first number: $${num1}$`,
      `Subtract the second number: $${num1} - ${num2}$`,
      `The answer is: $${difference}$`,
    ];
  }
}
