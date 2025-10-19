import { MathQuestionGenerator } from './math-question-generator.service';
import {
  MathQuestion,
  OperationType,
  DifficultyLevel,
} from '../entities/math-question.entity';

describe('MathQuestionGenerator Service', () => {
  let generator: MathQuestionGenerator;

  beforeEach(() => {
    generator = new MathQuestionGenerator();
  });

  describe('generateAdditionQuestions', () => {
    it('should generate 10 unique Grade 3 addition questions', async () => {
      // RED PHASE: This test MUST fail initially
      // Testing AC-001: Generate 10 unique addition problems for Grade 3

      const questions = await generator.generateAdditionQuestions(
        DifficultyLevel.GRADE_3,
        10
      );

      // Verify we get exactly 10 questions
      expect(questions).toHaveLength(10);

      // Verify all questions are addition type
      questions.forEach((question) => {
        expect(question.operation).toBe(OperationType.ADDITION);
        expect(question.difficulty).toBe(DifficultyLevel.GRADE_3);
      });

      // Verify questions are unique (no duplicates)
      const questionTexts = questions.map((q) => q.question);
      const uniqueTexts = new Set(questionTexts);
      expect(uniqueTexts.size).toBe(10);
    });

    it('should generate questions with appropriate Grade 3 difficulty range', async () => {
      // RED PHASE: Testing AC-002 - appropriate difficulty for Grade 3
      // Single-digit (3+5) to double-digit (15+7) range

      const questions = await generator.generateAdditionQuestions(
        DifficultyLevel.GRADE_3,
        5
      );

      questions.forEach((question) => {
        // Parse the question to extract numbers (e.g., "5 + 3 = ?" -> [5, 3])
        const numbers = question.question.match(/\d+/g)?.map(Number) || [];
        expect(numbers).toHaveLength(2);

        const [num1, num2] = numbers;

        // Grade 3 range: individual numbers 0-50, sum typically under 100
        expect(num1).toBeGreaterThanOrEqual(0);
        expect(num1).toBeLessThanOrEqual(50);
        expect(num2).toBeGreaterThanOrEqual(0);
        expect(num2).toBeLessThanOrEqual(50);

        // Verify answer is mathematically correct
        const expectedAnswer = num1 + num2;
        expect(question.answer).toBe(expectedAnswer);

        // Ensure result is reasonable for Grade 3 (typically under 100)
        expect(question.answer).toBeLessThanOrEqual(100);
      });
    });

    it('should include step-by-step solutions for each question', async () => {
      // RED PHASE: Testing AC-003 - step-by-step solution explanations

      const questions = await generator.generateAdditionQuestions(
        DifficultyLevel.GRADE_3,
        3
      );

      questions.forEach((question) => {
        expect(question.stepByStepSolution).toBeDefined();
        expect(question.stepByStepSolution.length).toBeGreaterThan(0);

        // Solution should contain meaningful steps (not just empty strings)
        question.stepByStepSolution.forEach((step) => {
          expect(step.trim()).not.toBe('');
        });
      });
    });

    it('should complete generation within performance requirements', async () => {
      // RED PHASE: Testing AC-004 - 3 second performance requirement

      const startTime = Date.now();

      await generator.generateAdditionQuestions(DifficultyLevel.GRADE_3, 10);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 3000ms (3 seconds)
      expect(duration).toBeLessThan(3000);
    });

    it('should throw error for invalid parameters', async () => {
      // RED PHASE: Testing edge cases and validation

      // Should reject invalid count
      await expect(
        generator.generateAdditionQuestions(DifficultyLevel.GRADE_3, 0)
      ).rejects.toThrow('Question count must be greater than 0');

      await expect(
        generator.generateAdditionQuestions(DifficultyLevel.GRADE_3, -5)
      ).rejects.toThrow('Question count must be greater than 0');
    });
  });

  describe('Service instantiation', () => {
    it('should create MathQuestionGenerator instance', () => {
      // RED PHASE: Basic service instantiation test
      expect(generator).toBeInstanceOf(MathQuestionGenerator);
      expect(generator.generateAdditionQuestions).toBeDefined();
    });
  });
});
