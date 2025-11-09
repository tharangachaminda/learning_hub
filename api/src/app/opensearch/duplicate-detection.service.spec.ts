import { Test, TestingModule } from '@nestjs/testing';
import { DuplicateDetectionService } from './duplicate-detection.service';
import { SemanticSearchService } from './semantic-search.service';
import { SearchResult } from './semantic-search.service';

describe('DuplicateDetectionService', () => {
  let service: DuplicateDetectionService;
  let mockSemanticSearch: jest.Mocked<SemanticSearchService>;

  beforeEach(async () => {
    mockSemanticSearch = {
      findSimilar: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DuplicateDetectionService,
        {
          provide: SemanticSearchService,
          useValue: mockSemanticSearch,
        },
      ],
    }).compile();

    service = module.get<DuplicateDetectionService>(DuplicateDetectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkDuplicate', () => {
    it('should return null when no similar questions found', async () => {
      // Arrange
      const questionText = 'What is 5 + 3?';
      mockSemanticSearch.findSimilar.mockResolvedValue([]);

      // Act
      const result = await service.checkDuplicate(questionText);

      // Assert
      expect(result).toBeNull();
      expect(mockSemanticSearch.findSimilar).toHaveBeenCalledWith(
        questionText,
        expect.objectContaining({
          limit: 20,
        })
      );
    });

    it('should return null when similarity score is below threshold', async () => {
      // Arrange
      const questionText = 'What is 5 + 3?';
      const similarQuestions: SearchResult[] = [
        {
          id: 'q1',
          questionText: 'What is 10 + 20?',
          answer: 30,
          similarityScore: 0.85, // Below 0.9 threshold
          metadata: {
            grade: '3',
            topic: 'addition',
            operation: 'ADDITION',
            difficulty: 'EASY',
            difficulty_score: 1,
            generation_timestamp: new Date().toISOString(),
            category: 'arithmetic',
            curriculum_strand: 'number-operations',
          },
        },
      ];
      mockSemanticSearch.findSimilar.mockResolvedValue(similarQuestions);

      // Act
      const result = await service.checkDuplicate(questionText);

      // Assert
      expect(result).toBeNull();
    });

    it('should return duplicate info when similarity score is at threshold', async () => {
      // Arrange
      const questionText = 'What is 5 + 3?';
      const duplicateQuestion: SearchResult = {
        id: 'q1',
        questionText: 'What is 5 plus 3?',
        answer: 8,
        similarityScore: 0.9, // Exactly at threshold
        metadata: {
          grade: '3',
          topic: 'addition',
          operation: 'ADDITION',
          difficulty: 'EASY',
          difficulty_score: 1,
          generation_timestamp: new Date().toISOString(),
          category: 'arithmetic',
          curriculum_strand: 'number-operations',
        },
      };
      mockSemanticSearch.findSimilar.mockResolvedValue([duplicateQuestion]);

      // Act
      const result = await service.checkDuplicate(questionText);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.isDuplicate).toBe(true);
      expect(result?.existingQuestion).toEqual(duplicateQuestion);
      expect(result?.similarityScore).toBe(0.9);
    });

    it('should return duplicate info when similarity score is above threshold', async () => {
      // Arrange
      const questionText = 'What is 5 + 3?';
      const duplicateQuestion: SearchResult = {
        id: 'q1',
        questionText: 'What is 5 + 3?',
        answer: 8,
        similarityScore: 0.98, // Above threshold
        metadata: {
          grade: '3',
          topic: 'addition',
          operation: 'ADDITION',
          difficulty: 'EASY',
          difficulty_score: 1,
          generation_timestamp: new Date().toISOString(),
          category: 'arithmetic',
          curriculum_strand: 'number-operations',
        },
      };
      mockSemanticSearch.findSimilar.mockResolvedValue([duplicateQuestion]);

      // Act
      const result = await service.checkDuplicate(questionText);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.isDuplicate).toBe(true);
      expect(result?.existingQuestion).toEqual(duplicateQuestion);
      expect(result?.similarityScore).toBe(0.98);
    });

    it('should return highest similarity match when multiple duplicates found', async () => {
      // Arrange
      const questionText = 'What is 5 + 3?';
      const similarQuestions: SearchResult[] = [
        {
          id: 'q1',
          questionText: 'What is 5 plus 3?',
          answer: 8,
          similarityScore: 0.92,
          metadata: {
            grade: '3',
            topic: 'addition',
            operation: 'ADDITION',
            difficulty: 'EASY',
            difficulty_score: 1,
            generation_timestamp: new Date().toISOString(),
            category: 'arithmetic',
            curriculum_strand: 'number-operations',
          },
        },
        {
          id: 'q2',
          questionText: 'What is 5 + 3?',
          answer: 8,
          similarityScore: 0.98, // Highest
          metadata: {
            grade: '3',
            topic: 'addition',
            operation: 'ADDITION',
            difficulty: 'EASY',
            difficulty_score: 1,
            generation_timestamp: new Date().toISOString(),
            category: 'arithmetic',
            curriculum_strand: 'number-operations',
          },
        },
        {
          id: 'q3',
          questionText: 'Calculate 5 + 3',
          answer: 8,
          similarityScore: 0.91,
          metadata: {
            grade: '3',
            topic: 'addition',
            operation: 'ADDITION',
            difficulty: 'EASY',
            difficulty_score: 1,
            generation_timestamp: new Date().toISOString(),
            category: 'arithmetic',
            curriculum_strand: 'number-operations',
          },
        },
      ];
      mockSemanticSearch.findSimilar.mockResolvedValue(similarQuestions);

      // Act
      const result = await service.checkDuplicate(questionText);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.existingQuestion.id).toBe('q2');
      expect(result?.similarityScore).toBe(0.98);
    });

    it('should pass filters to semantic search', async () => {
      // Arrange
      const questionText = 'What is 5 + 3?';
      const filters = {
        grade: 3,
        topic: 'addition',
        operation: 'ADDITION',
      };
      mockSemanticSearch.findSimilar.mockResolvedValue([]);

      // Act
      await service.checkDuplicate(questionText, filters);

      // Assert
      expect(mockSemanticSearch.findSimilar).toHaveBeenCalledWith(
        questionText,
        expect.objectContaining({
          grade: 3,
          topic: 'addition',
          operation: 'ADDITION',
          limit: 20,
        })
      );
    });

    it('should handle empty index gracefully', async () => {
      // Arrange
      const questionText = 'What is 5 + 3?';
      mockSemanticSearch.findSimilar.mockResolvedValue([]);

      // Act
      const result = await service.checkDuplicate(questionText);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle semantic search errors', async () => {
      // Arrange
      const questionText = 'What is 5 + 3?';
      mockSemanticSearch.findSimilar.mockRejectedValue(
        new Error('OpenSearch connection failed')
      );

      // Act & Assert
      await expect(service.checkDuplicate(questionText)).rejects.toThrow(
        'Failed to check for duplicate questions'
      );
    });

    it('should exclude specific question IDs from duplicate check', async () => {
      // Arrange
      const questionText = 'What is 5 + 3?';
      const filters = {
        excludeIds: ['q1', 'q2'],
      };
      mockSemanticSearch.findSimilar.mockResolvedValue([]);

      // Act
      await service.checkDuplicate(questionText, filters);

      // Assert
      expect(mockSemanticSearch.findSimilar).toHaveBeenCalledWith(
        questionText,
        expect.objectContaining({
          excludeIds: ['q1', 'q2'],
          limit: 20,
        })
      );
    });

    it('should use configurable similarity threshold', async () => {
      // Arrange
      const questionText = 'What is 5 + 3?';
      const customThreshold = 0.95;
      const similarQuestion: SearchResult = {
        id: 'q1',
        questionText: 'What is 5 plus 3?',
        answer: 8,
        similarityScore: 0.93, // Between 0.9 and 0.95
        metadata: {
          grade: '3',
          topic: 'addition',
          operation: 'ADDITION',
          difficulty: 'EASY',
          difficulty_score: 1,
          generation_timestamp: new Date().toISOString(),
          category: 'arithmetic',
          curriculum_strand: 'number-operations',
        },
      };
      mockSemanticSearch.findSimilar.mockResolvedValue([similarQuestion]);

      // Act - with custom threshold, this should NOT be duplicate
      const result = await service.checkDuplicate(
        questionText,
        {},
        customThreshold
      );

      // Assert
      expect(result).toBeNull();
    });
  });
});
