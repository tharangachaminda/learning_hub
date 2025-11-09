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
      generateEnhancedExplanation: jest.fn(),
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
          explanationStyles: ['visual', 'verbal', 'step-by-step', 'story'],
        },
        version: '2.0.0',
      });
    });
  });

  describe('generateExplanation', () => {
    it('should generate step-by-step explanation by default', async () => {
      // Arrange
      const requestBody = {
        question: '7 + 5 = ?',
        answer: 12,
        difficulty: 'grade_3',
      };

      const mockExplanation =
        "Let's solve 7 + 5 step by step!\n\nStep 1: Start with 7\nStep 2: Count up 5 more\nStep 3: 7, 8, 9, 10, 11, 12\n\nGreat work!";

      jest
        .spyOn(mockGenerator, 'generateEnhancedExplanation')
        .mockResolvedValue(mockExplanation);

      // Act
      const result = await controller.generateExplanation(requestBody);

      // Assert
      expect(result).toMatchObject({
        explanation: mockExplanation,
        style: 'step-by-step',
        metadata: {
          grade_level: 3,
        },
      });
      expect(result.metadata.generation_time).toBeDefined();
      expect(result.metadata.generation_time).toBeLessThan(2000);
      expect(mockGenerator.generateEnhancedExplanation).toHaveBeenCalledWith(
        requestBody.question,
        requestBody.answer,
        DifficultyLevel.GRADE_3,
        undefined,
        'step-by-step'
      );
    });

    it('should generate visual explanation when style is specified', async () => {
      // Arrange
      const requestBody = {
        question: '3 + 2 = ?',
        answer: 5,
        style: 'visual' as const,
      };

      const mockExplanation =
        "Let's use counting blocks!\n\n🔵🔵🔵 (3 blocks)\n+ 🔵🔵 (2 blocks)\n= 🔵🔵🔵🔵🔵 (5 blocks total)";

      jest
        .spyOn(mockGenerator, 'generateEnhancedExplanation')
        .mockResolvedValue(mockExplanation);

      // Act
      const result = await controller.generateExplanation(requestBody);

      // Assert
      expect(result.style).toBe('visual');
      expect(mockGenerator.generateEnhancedExplanation).toHaveBeenCalledWith(
        requestBody.question,
        requestBody.answer,
        DifficultyLevel.GRADE_3,
        undefined,
        'visual'
      );
    });

    it('should include student answer for targeted feedback', async () => {
      // Arrange
      const requestBody = {
        question: '8 - 3 = ?',
        answer: 5,
        studentAnswer: 6,
        style: 'verbal' as const,
      };

      const mockExplanation =
        "You got 6, which is very close! Let's think about it together...";

      jest
        .spyOn(mockGenerator, 'generateEnhancedExplanation')
        .mockResolvedValue(mockExplanation);

      // Act
      const result = await controller.generateExplanation(requestBody);

      // Assert
      expect(mockGenerator.generateEnhancedExplanation).toHaveBeenCalledWith(
        requestBody.question,
        requestBody.answer,
        DifficultyLevel.GRADE_3,
        requestBody.studentAnswer,
        'verbal'
      );
    });

    it('should log performance warning if generation exceeds 2 seconds', async () => {
      // Arrange
      const requestBody = {
        question: '10 + 15 = ?',
        answer: 25,
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock slow generation (>2 seconds)
      jest
        .spyOn(mockGenerator, 'generateEnhancedExplanation')
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve('Slow explanation'), 2100)
            )
        );

      // Act
      await controller.generateExplanation(requestBody);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Performance warning: Explanation generation took'
        )
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('>2000ms threshold')
      );

      consoleSpy.mockRestore();
    });

    it('should support all four explanation styles', async () => {
      // Arrange
      const styles: Array<'visual' | 'verbal' | 'step-by-step' | 'story'> = [
        'visual',
        'verbal',
        'step-by-step',
        'story',
      ];

      jest
        .spyOn(mockGenerator, 'generateEnhancedExplanation')
        .mockResolvedValue('Mock explanation');

      // Act & Assert
      for (const style of styles) {
        const result = await controller.generateExplanation({
          question: '5 + 3 = ?',
          answer: 8,
          style,
        });

        expect(result.style).toBe(style);
      }

      expect(mockGenerator.generateEnhancedExplanation).toHaveBeenCalledTimes(
        4
      );
    });
  });
});
