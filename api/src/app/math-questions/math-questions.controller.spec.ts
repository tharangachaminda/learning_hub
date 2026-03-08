import { Test, TestingModule } from '@nestjs/testing';
import { MathQuestionsController } from './math-questions.controller';
import { MathQuestionGenerator } from './services/math-question-generator.service';
import {
  DifficultyLevel,
  OperationType,
  MathQuestion,
} from './entities/math-question.entity';
import { SemanticSearchService } from '../opensearch/semantic-search.service';

describe('MathQuestionsController', () => {
  let controller: MathQuestionsController;
  let mockGenerator: jest.Mocked<MathQuestionGenerator>;
  let mockSemanticSearch: jest.Mocked<SemanticSearchService>;

  beforeEach(async () => {
    // Create mock generator
    mockGenerator = {
      generateAdditionQuestions: jest.fn(),
      generateEnhancedExplanation: jest.fn(),
    } as any;

    // Create mock semantic search service
    mockSemanticSearch = {
      findSimilar: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MathQuestionsController],
      providers: [
        {
          provide: MathQuestionGenerator,
          useValue: mockGenerator,
        },
        {
          provide: SemanticSearchService,
          useValue: mockSemanticSearch,
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
          supportedDifficulties: [
            DifficultyLevel.GRADE_3,
            DifficultyLevel.GRADE_4,
            DifficultyLevel.GRADE_5,
            DifficultyLevel.GRADE_6,
            DifficultyLevel.GRADE_7,
            DifficultyLevel.GRADE_8,
          ],
          supportedOperations: [
            OperationType.ADDITION,
            OperationType.SUBTRACTION,
          ],
          maxQuestionsPerRequest: 50,
          explanationStyles: ['visual', 'verbal', 'step-by-step', 'story'],
          semanticSearch: true, // SemanticSearchService is provided in beforeEach
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

  describe('difficultyToGrade — grade number mapping (US-QG-003)', () => {
    const gradeTestCases = [
      { difficulty: 'grade_4', expectedGrade: 4 },
      { difficulty: 'grade_5', expectedGrade: 5 },
      { difficulty: 'grade_6', expectedGrade: 6 },
      { difficulty: 'grade_7', expectedGrade: 7 },
      { difficulty: 'grade_8', expectedGrade: 8 },
    ];

    gradeTestCases.forEach(({ difficulty, expectedGrade }) => {
      it(`should map ${difficulty} to grade number ${expectedGrade}`, async () => {
        // AC-003: Each grade maps to correct numeric value for curriculum lookup
        const requestBody = {
          question: 'Test question?',
          answer: 42,
          difficulty,
        };

        jest
          .spyOn(mockGenerator, 'generateEnhancedExplanation')
          .mockResolvedValue('Mock explanation');

        const result = await controller.generateExplanation(requestBody);

        expect(result.metadata.grade_level).toBe(expectedGrade);
      });
    });

    it('should still map grade_3 to grade number 3', async () => {
      // Regression: Ensure existing grade_3 mapping is preserved
      const requestBody = {
        question: 'Test question?',
        answer: 42,
        difficulty: 'grade_3',
      };

      jest
        .spyOn(mockGenerator, 'generateEnhancedExplanation')
        .mockResolvedValue('Mock explanation');

      const result = await controller.generateExplanation(requestBody);

      expect(result.metadata.grade_level).toBe(3);
    });
  });

  describe('findSimilarQuestions', () => {
    it('should find similar questions using semantic search', async () => {
      const dto = {
        questionText: 'What is 5 + 3?',
        grade: 3,
        topic: 'addition',
        limit: 10,
      };

      const mockResults = [
        {
          id: 'q-001',
          questionText: 'What is 4 + 6?',
          answer: 10,
          similarityScore: 0.95,
          metadata: {
            grade: '3',
            topic: 'addition',
            operation: 'addition',
            difficulty: 'grade_3',
          },
        },
        {
          id: 'q-002',
          questionText: 'Calculate 7 + 2',
          answer: 9,
          similarityScore: 0.88,
          metadata: {
            grade: '3',
            topic: 'addition',
            operation: 'addition',
            difficulty: 'grade_3',
          },
        },
      ];

      mockSemanticSearch.findSimilar.mockResolvedValue(mockResults);

      const results = await controller.findSimilarQuestions(dto);

      expect(mockSemanticSearch.findSimilar).toHaveBeenCalledWith(
        'What is 5 + 3?',
        {
          grade: 3,
          topic: 'addition',
          operation: undefined,
          excludeIds: undefined,
          limit: 10,
        }
      );
      expect(results).toEqual(mockResults);
      expect(results).toHaveLength(2);
    });

    it('should cap limit at 50', async () => {
      const dto = {
        questionText: 'What is 5 + 3?',
        limit: 100,
      };

      mockSemanticSearch.findSimilar.mockResolvedValue([]);

      await controller.findSimilarQuestions(dto);

      expect(mockSemanticSearch.findSimilar).toHaveBeenCalledWith(
        'What is 5 + 3?',
        expect.objectContaining({
          limit: 50,
        })
      );
    });

    it('should use default limit of 10 if not specified', async () => {
      const dto = {
        questionText: 'What is 5 + 3?',
      };

      mockSemanticSearch.findSimilar.mockResolvedValue([]);

      await controller.findSimilarQuestions(dto);

      expect(mockSemanticSearch.findSimilar).toHaveBeenCalledWith(
        'What is 5 + 3?',
        expect.objectContaining({
          limit: 10,
        })
      );
    });

    it('should pass through all filters', async () => {
      const dto = {
        questionText: 'What is 5 + 3?',
        grade: 3,
        topic: 'addition',
        operation: OperationType.ADDITION,
        excludeIds: ['q-001', 'q-002'],
        limit: 5,
      };

      mockSemanticSearch.findSimilar.mockResolvedValue([]);

      await controller.findSimilarQuestions(dto);

      expect(mockSemanticSearch.findSimilar).toHaveBeenCalledWith(
        'What is 5 + 3?',
        {
          grade: 3,
          topic: 'addition',
          operation: OperationType.ADDITION,
          excludeIds: ['q-001', 'q-002'],
          limit: 5,
        }
      );
    });

    it('should throw error if semantic search service is not available', async () => {
      // Create controller without semantic search service
      const module: TestingModule = await Test.createTestingModule({
        controllers: [MathQuestionsController],
        providers: [
          {
            provide: MathQuestionGenerator,
            useValue: mockGenerator,
          },
        ],
      }).compile();

      const controllerWithoutSearch = module.get<MathQuestionsController>(
        MathQuestionsController
      );

      const dto = {
        questionText: 'What is 5 + 3?',
      };

      await expect(
        controllerWithoutSearch.findSimilarQuestions(dto)
      ).rejects.toThrow(
        'Semantic search service is not available. Please ensure OpenSearch is configured.'
      );
    });
  });

  describe('parseDifficultyLevel — grades 4–8 support (US-QG-003)', () => {
    it('should parse grade_4 to DifficultyLevel.GRADE_4', async () => {
      // AC-001: grade_4 accepted as valid difficulty
      const mockQuestions: MathQuestion[] = [];
      mockGenerator.generateAdditionQuestions.mockResolvedValue(mockQuestions);

      await controller.generateQuestions('grade_4', '1', 'addition');

      expect(mockGenerator.generateAdditionQuestions).toHaveBeenCalledWith(
        DifficultyLevel.GRADE_4,
        1
      );
    });

    it('should parse grade_5 to DifficultyLevel.GRADE_5', async () => {
      // AC-001 + AC-002: grade_5 accepted and scoped correctly
      const mockQuestions: MathQuestion[] = [];
      mockGenerator.generateAdditionQuestions.mockResolvedValue(mockQuestions);

      await controller.generateQuestions('grade_5', '1', 'addition');

      expect(mockGenerator.generateAdditionQuestions).toHaveBeenCalledWith(
        DifficultyLevel.GRADE_5,
        1
      );
    });

    it('should parse grade_6 to DifficultyLevel.GRADE_6', async () => {
      const mockQuestions: MathQuestion[] = [];
      mockGenerator.generateAdditionQuestions.mockResolvedValue(mockQuestions);

      await controller.generateQuestions('grade_6', '1', 'addition');

      expect(mockGenerator.generateAdditionQuestions).toHaveBeenCalledWith(
        DifficultyLevel.GRADE_6,
        1
      );
    });

    it('should parse grade_7 to DifficultyLevel.GRADE_7', async () => {
      const mockQuestions: MathQuestion[] = [];
      mockGenerator.generateAdditionQuestions.mockResolvedValue(mockQuestions);

      await controller.generateQuestions('grade_7', '1', 'addition');

      expect(mockGenerator.generateAdditionQuestions).toHaveBeenCalledWith(
        DifficultyLevel.GRADE_7,
        1
      );
    });

    it('should parse grade_8 to DifficultyLevel.GRADE_8', async () => {
      const mockQuestions: MathQuestion[] = [];
      mockGenerator.generateAdditionQuestions.mockResolvedValue(mockQuestions);

      await controller.generateQuestions('grade_8', '1', 'addition');

      expect(mockGenerator.generateAdditionQuestions).toHaveBeenCalledWith(
        DifficultyLevel.GRADE_8,
        1
      );
    });

    it('should parse shorthand grade4 (without underscore)', async () => {
      // Flexible input parsing: grade4 → GRADE_4
      const mockQuestions: MathQuestion[] = [];
      mockGenerator.generateAdditionQuestions.mockResolvedValue(mockQuestions);

      await controller.generateQuestions('grade4', '1', 'addition');

      expect(mockGenerator.generateAdditionQuestions).toHaveBeenCalledWith(
        DifficultyLevel.GRADE_4,
        1
      );
    });

    it('should reject grade_2 with clear error (AC-004)', async () => {
      // AC-004: Invalid grades below range return 400 error
      await expect(
        controller.generateQuestions('grade_2', '1', 'addition')
      ).rejects.toThrow('Unsupported difficulty level: grade_2');
    });

    it('should reject grade_9 with clear error (AC-004)', async () => {
      // AC-004: Invalid grades above range return 400 error
      await expect(
        controller.generateQuestions('grade_9', '1', 'addition')
      ).rejects.toThrow('Unsupported difficulty level: grade_9');
    });
  });
});
