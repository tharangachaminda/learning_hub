import { Test, TestingModule } from '@nestjs/testing';
import { MathQuestionsController } from './math-questions.controller';
import { MathQuestionGenerator } from './services/math-question-generator.service';
import {
  DifficultyLevel,
  OperationType,
  MathQuestion,
} from './entities/math-question.entity';

describe('MathQuestionsController', () => {
  let controller: MathQuestionsController;
  let mockGenerator: jest.Mocked<MathQuestionGenerator>;

  beforeEach(async () => {
    // Create mock generator
    mockGenerator = {
      generateAdditionQuestions: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MathQuestionsController],
      providers: [
        {
          provide: MathQuestionGenerator,
          useValue: mockGenerator,
        },
      ],
    }).compile();

    controller = module.get<MathQuestionsController>(MathQuestionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateQuestions', () => {
    it('should generate default 10 Grade 3 addition questions', async () => {
      // Arrange
      const mockQuestions = [
        new MathQuestion(
          '5 + 3 = ?',
          8,
          OperationType.ADDITION,
          DifficultyLevel.GRADE_3,
          ['Step 1', 'Step 2']
        ),
        new MathQuestion(
          '7 + 2 = ?',
          9,
          OperationType.ADDITION,
          DifficultyLevel.GRADE_3,
          ['Step 1', 'Step 2']
        ),
      ];
      mockGenerator.generateAdditionQuestions.mockResolvedValue(mockQuestions);

      // Act
      const result = await controller.generateQuestions();

      // Assert
      expect(result).toEqual(mockQuestions);
      expect(mockGenerator.generateAdditionQuestions).toHaveBeenCalledWith(
        DifficultyLevel.GRADE_3,
        10
      );
    });

    it('should generate specified number of questions', async () => {
      // Arrange
      const mockQuestions = [
        new MathQuestion(
          '5 + 3 = ?',
          8,
          OperationType.ADDITION,
          DifficultyLevel.GRADE_3,
          ['Step 1']
        ),
      ];
      mockGenerator.generateAdditionQuestions.mockResolvedValue(mockQuestions);

      // Act
      const result = await controller.generateQuestions(
        'grade_3',
        '5',
        'addition'
      );

      // Assert
      expect(result).toEqual(mockQuestions);
      expect(mockGenerator.generateAdditionQuestions).toHaveBeenCalledWith(
        DifficultyLevel.GRADE_3,
        5
      );
    });

    it('should limit maximum questions to 50', async () => {
      // Arrange
      const mockQuestions: MathQuestion[] = [];
      mockGenerator.generateAdditionQuestions.mockResolvedValue(mockQuestions);

      // Act
      await controller.generateQuestions('grade_3', '100', 'addition');

      // Assert
      expect(mockGenerator.generateAdditionQuestions).toHaveBeenCalledWith(
        DifficultyLevel.GRADE_3,
        50 // Should be limited to 50
      );
    });

    it('should handle invalid count and default to 10', async () => {
      // Arrange
      const mockQuestions: MathQuestion[] = [];
      mockGenerator.generateAdditionQuestions.mockResolvedValue(mockQuestions);

      // Act
      await controller.generateQuestions('grade_3', 'invalid', 'addition');

      // Assert
      expect(mockGenerator.generateAdditionQuestions).toHaveBeenCalledWith(
        DifficultyLevel.GRADE_3,
        10 // Should default to 10
      );
    });

    it('should throw error for unsupported difficulty', async () => {
      // Act & Assert
      await expect(
        controller.generateQuestions('invalid_difficulty', '10', 'addition')
      ).rejects.toThrow('Unsupported difficulty level: invalid_difficulty');
    });

    it('should throw error for unsupported operation type', async () => {
      // Act & Assert
      await expect(
        controller.generateQuestions('grade_3', '10', 'multiplication')
      ).rejects.toThrow('Unsupported operation type: multiplication');
    });

    it('should throw error for subtraction (not yet implemented)', async () => {
      // Act & Assert
      await expect(
        controller.generateQuestions('grade_3', '10', 'subtraction')
      ).rejects.toThrow('Subtraction questions not yet implemented');
    });

    it('should log performance warnings for slow generation', async () => {
      // Arrange
      const mockQuestions: MathQuestion[] = [];
      mockGenerator.generateAdditionQuestions.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockQuestions), 3100)
          )
      );
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      await controller.generateQuestions('grade_3', '10', 'addition');

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance warning: Generation took')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getServiceHealth', () => {
    it('should return service health information', () => {
      // Act
      const health = controller.getServiceHealth();

      // Assert
      expect(health).toEqual({
        status: 'healthy',
        service: 'math-questions',
        capabilities: {
          supportedDifficulties: [DifficultyLevel.GRADE_3],
          supportedOperations: [
            OperationType.ADDITION,
            OperationType.SUBTRACTION,
          ],
          maxQuestionsPerRequest: 50,
        },
        version: '1.0.0',
      });
    });
  });
});
