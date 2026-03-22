import { MathQuestionGenerator } from './math-question-generator.service';
import { DifficultyLevel } from '../entities/math-question.entity';
import { QuestionsService } from '../../questions/questions.service';
import { QuestionStatus } from '../../questions/schemas/question.schema';

describe('MathQuestionGenerator — Question Persistence Integration (REQ-QG-023)', () => {
  let generator: MathQuestionGenerator;
  let mockQuestionsService: jest.Mocked<Partial<QuestionsService>>;

  beforeEach(() => {
    mockQuestionsService = {
      createMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue(null),
    };

    // Generator with QuestionsService injected for auto-persistence
    generator = new MathQuestionGenerator(
      undefined, // no OllamaService — use deterministic fallback
      mockQuestionsService as unknown as QuestionsService
    );
  });

  describe('Auto-persist after generation (AC-001)', () => {
    it('should call QuestionsService.createMany after generateQuestions', async () => {
      await generator.generateQuestions(DifficultyLevel.GRADE_3, 3, 'ADDITION');

      expect(mockQuestionsService.createMany).toHaveBeenCalledTimes(1);
    });

    it('should pass all generated questions to createMany', async () => {
      await generator.generateQuestions(DifficultyLevel.GRADE_3, 5, 'ADDITION');

      const callArgs = mockQuestionsService.createMany!.mock.calls[0][0];
      expect(callArgs).toHaveLength(5);
    });

    it('should map question fields correctly for persistence', async () => {
      await generator.generateQuestions(DifficultyLevel.GRADE_3, 1, 'ADDITION');

      const callArgs = mockQuestionsService.createMany!.mock.calls[0][0];
      const persisted = callArgs[0];

      expect(persisted).toEqual(
        expect.objectContaining({
          questionText: expect.any(String),
          answer: expect.any(Number),
          grade: 3,
          topic: 'ADDITION',
          stepByStepSolution: expect.any(Array),
        })
      );
    });

    it('should include metadata with generation context (AC-002)', async () => {
      await generator.generateQuestions(DifficultyLevel.GRADE_3, 1, 'ADDITION');

      const callArgs = mockQuestionsService.createMany!.mock.calls[0][0];
      const persisted = callArgs[0];

      expect(persisted.metadata).toEqual(
        expect.objectContaining({
          generatedBy: 'deterministic',
          difficulty: 'grade_3',
          country: 'NZ',
          generationTime: expect.any(Number),
        })
      );
    });
  });

  describe('Graceful failure handling', () => {
    it('should still return questions when persistence fails', async () => {
      mockQuestionsService.createMany!.mockRejectedValue(
        new Error('Database connection lost')
      );

      const questions = await generator.generateQuestions(
        DifficultyLevel.GRADE_3,
        3,
        'ADDITION'
      );

      // Questions should still be returned even if persistence fails
      expect(questions).toHaveLength(3);
    });

    it('should not call createMany when no questions are generated', async () => {
      // Non-ADDITION topic without AI = empty result
      await generator.generateQuestions(
        DifficultyLevel.GRADE_3,
        3,
        'FRACTION_BASICS'
      );

      expect(mockQuestionsService.createMany).not.toHaveBeenCalled();
    });
  });

  describe('Without QuestionsService (backward compat)', () => {
    it('should still generate questions when QuestionsService is not injected', async () => {
      const generatorWithoutPersistence = new MathQuestionGenerator();

      const questions = await generatorWithoutPersistence.generateQuestions(
        DifficultyLevel.GRADE_3,
        3,
        'ADDITION'
      );

      expect(questions).toHaveLength(3);
    });
  });
});
