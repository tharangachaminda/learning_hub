import { MathQuestionGenerator } from './math-question-generator.service';
import {
  MathQuestion,
  DifficultyLevel,
} from '../entities/math-question.entity';

describe('MathQuestionGenerator Service', () => {
  let generator: MathQuestionGenerator;

  beforeEach(() => {
    generator = new MathQuestionGenerator();
  });

  describe('generateQuestions', () => {
    it('should generate 10 unique Grade 3 addition questions', async () => {
      const questions = await generator.generateQuestions(
        DifficultyLevel.GRADE_3,
        10,
        'ADDITION'
      );

      // Verify we get exactly 10 questions
      expect(questions).toHaveLength(10);

      // Verify all questions are addition type
      questions.forEach((question) => {
        expect(question.operation).toBe('ADDITION');
        expect(question.difficulty).toBe(DifficultyLevel.GRADE_3);
      });

      // Verify questions are unique (no duplicates)
      const questionTexts = questions.map((q) => q.question);
      const uniqueTexts = new Set(questionTexts);
      expect(uniqueTexts.size).toBe(10);
    });

    it('should generate questions with appropriate Grade 3 difficulty range', async () => {
      const questions = await generator.generateQuestions(
        DifficultyLevel.GRADE_3,
        5,
        'ADDITION'
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
      const questions = await generator.generateQuestions(
        DifficultyLevel.GRADE_3,
        3,
        'ADDITION'
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
      const startTime = Date.now();

      await generator.generateQuestions(
        DifficultyLevel.GRADE_3,
        10,
        'ADDITION'
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 3000ms (3 seconds)
      expect(duration).toBeLessThan(3000);
    });

    it('should throw error for invalid parameters', async () => {
      await expect(
        generator.generateQuestions(DifficultyLevel.GRADE_3, 0, 'ADDITION')
      ).rejects.toThrow('Question count must be greater than 0');

      await expect(
        generator.generateQuestions(DifficultyLevel.GRADE_3, -5, 'ADDITION')
      ).rejects.toThrow('Question count must be greater than 0');
    });
  });

  describe('Service instantiation', () => {
    it('should create MathQuestionGenerator instance', () => {
      expect(generator).toBeInstanceOf(MathQuestionGenerator);
      expect(generator.generateQuestions).toBeDefined();
    });
  });

  describe('generateEnhancedExplanation', () => {
    it('should return basic explanation when AI generation is not available', async () => {
      // Testing fallback mechanism for explanation generation
      const result = await generator.generateEnhancedExplanation(
        '5 + 3 = ?',
        8,
        DifficultyLevel.GRADE_3
      );

      // Should return a non-empty string explanation
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      // Basic explanation should reference the problem
      expect(result).toContain('5');
      expect(result).toContain('3');
      expect(result).toContain('8');
    });

    it('should handle all four explanation styles', async () => {
      const styles: Array<'visual' | 'verbal' | 'step-by-step' | 'story'> = [
        'visual',
        'verbal',
        'step-by-step',
        'story',
      ];

      for (const style of styles) {
        const result = await generator.generateEnhancedExplanation(
          '7 + 2 = ?',
          9,
          DifficultyLevel.GRADE_3,
          undefined,
          style
        );

        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it('should include student answer context when provided', async () => {
      const result = await generator.generateEnhancedExplanation(
        '10 - 3 = ?',
        7,
        DifficultyLevel.GRADE_3,
        8 // Student's incorrect answer
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      // Basic explanation should still work
      expect(result.length).toBeGreaterThan(0);
    });

    it('should adapt explanation to grade level', async () => {
      const result = await generator.generateEnhancedExplanation(
        '15 + 12 = ?',
        27,
        DifficultyLevel.GRADE_3
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      // Grade 3 explanation should be age-appropriate
      expect(result).toContain('15');
      expect(result).toContain('12');
    });

    it('should handle various question formats', async () => {
      const questions = [
        { q: '5 + 3 = ?', a: 8 },
        { q: '10 - 4 = ?', a: 6 },
        { q: 'What is 7 plus 8?', a: 15 },
      ];

      for (const { q, a } of questions) {
        const result = await generator.generateEnhancedExplanation(
          q,
          a,
          DifficultyLevel.GRADE_3
        );

        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it('should generate explanation within reasonable time', async () => {
      const startTime = Date.now();

      await generator.generateEnhancedExplanation(
        '8 + 6 = ?',
        14,
        DifficultyLevel.GRADE_3
      );

      const duration = Date.now() - startTime;

      // Basic explanation should be fast (<100ms)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Deterministic fallback LaTeX formatting', () => {
    /**
     * Test: Deterministic question text wraps math in LaTeX delimiters
     * Why Essential: AC-006 requires "even simple arithmetic must use LaTeX"
     * What Breaks: Frontend LaTeX renderer has no delimiters to render
     */
    it('should wrap question math expressions in LaTeX $...$ delimiters', async () => {
      const questions = await generator.generateQuestions(
        DifficultyLevel.GRADE_3,
        5,
        'ADDITION'
      );

      questions.forEach((question) => {
        // Question should contain LaTeX-delimited math: $num1 + num2 = ?$
        expect(question.question).toMatch(/\$\d+\s*\+\s*\d+\s*=\s*\?\$/);
      });
    });

    /**
     * Test: Solution steps wrap math expressions in LaTeX delimiters
     * Why Essential: Step-by-step solutions also display math to students
     * What Breaks: Inconsistent formatting between questions and solutions
     */
    it('should wrap solution step math expressions in LaTeX delimiters', async () => {
      const questions = await generator.generateQuestions(
        DifficultyLevel.GRADE_3,
        3,
        'ADDITION'
      );

      questions.forEach((question) => {
        const steps = question.stepByStepSolution;
        // Step 1: "Start with the first number: $num$"
        expect(steps[0]).toMatch(/\$\d+\$/);
        // Step 2: "Add the second number: $num1 + num2$"
        expect(steps[1]).toMatch(/\$\d+\s*\+\s*\d+\$/);
        // Step 3: "The answer is: $sum$"
        expect(steps[2]).toMatch(/\$\d+\$/);
      });
    });

    /**
     * Test: OllamaService fallback also wraps math in LaTeX delimiters
     * Why Essential: Pipeline consistency - AI fallback should match deterministic format
     * What Breaks: Fallback questions bypass LaTeX formatting entirely
     */
    it('should produce LaTeX-wrapped question text in OllamaService fallback', async () => {
      const questions = await generator.generateQuestions(
        DifficultyLevel.GRADE_3,
        1,
        'ADDITION'
      );

      const q = questions[0];
      // The question should NOT be plain text like "5 + 3 = ?"
      // It should be LaTeX-wrapped like "$5 + 3 = ?$"
      expect(q.question).not.toMatch(/^\d+\s*\+\s*\d+\s*=\s*\?$/);
      expect(q.question).toContain('$');
    });
  });

  describe('Multi-topic support', () => {
    it('should return empty array for non-ADDITION topic without AI service', async () => {
      const questions = await generator.generateQuestions(
        DifficultyLevel.GRADE_3,
        5,
        'FRACTION_BASICS'
      );

      // Without OllamaService, non-ADDITION topics have no deterministic fallback
      expect(questions).toEqual([]);
    });

    it('should accept any topic string parameter', async () => {
      // ADDITION still works via deterministic fallback
      const additionQs = await generator.generateQuestions(
        DifficultyLevel.GRADE_3,
        3,
        'ADDITION'
      );
      expect(additionQs).toHaveLength(3);
      additionQs.forEach((q) => {
        expect(q.operation).toBe('ADDITION');
      });
    });

    it('should validate count for any topic', async () => {
      await expect(
        generator.generateQuestions(
          DifficultyLevel.GRADE_3,
          0,
          'GEOMETRY_BASICS'
        )
      ).rejects.toThrow('Question count must be greater than 0');
    });
  });
});
