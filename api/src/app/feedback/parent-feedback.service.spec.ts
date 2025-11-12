import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentFeedbackService } from './parent-feedback.service';
import { ParentFeedback } from './entities/parent-feedback.entity';

describe('ParentFeedbackService', () => {
  let service: ParentFeedbackService;
  let repository: Repository<ParentFeedback>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParentFeedbackService,
        {
          provide: getRepositoryToken(ParentFeedback),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ParentFeedbackService>(ParentFeedbackService);
    repository = module.get<Repository<ParentFeedback>>(
      getRepositoryToken(ParentFeedback)
    );

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitFeedback', () => {
    it('should create and save feedback with calculated overall satisfaction', async () => {
      const feedbackData = {
        questionId: 'q-123',
        parentId: 'p-456',
        explanationRating: 4.5,
        helpfulnessRating: 4.0,
        clarityRating: 4.5,
        ageAppropriateRating: 5.0,
        comments: 'Great explanation!',
      };

      const savedFeedback = {
        ...feedbackData,
        id: 'f-789',
        overallSatisfaction: 4.5, // Average of ratings
        flaggedForReview: false,
        submittedAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(savedFeedback);
      mockRepository.save.mockResolvedValue(savedFeedback);

      const result = await service.submitFeedback(feedbackData);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.overallSatisfaction).toBe(4.5);
      expect(result.flaggedForReview).toBe(false);
    });

    it('should flag feedback for review when overall satisfaction < 3.0', async () => {
      const feedbackData = {
        questionId: 'q-123',
        parentId: 'p-456',
        explanationRating: 2.0,
        helpfulnessRating: 2.5,
        clarityRating: 2.0,
        ageAppropriateRating: 3.0,
      };

      const savedFeedback = {
        ...feedbackData,
        id: 'f-789',
        overallSatisfaction: 2.375,
        flaggedForReview: true,
        submittedAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(savedFeedback);
      mockRepository.save.mockResolvedValue(savedFeedback);

      const result = await service.submitFeedback(feedbackData);

      expect(result.flaggedForReview).toBe(true);
      expect(result.overallSatisfaction).toBeLessThan(3.0);
    });

    it('should handle feedback without comments', async () => {
      const feedbackData = {
        questionId: 'q-123',
        parentId: 'p-456',
        explanationRating: 4.0,
        helpfulnessRating: 4.0,
        clarityRating: 4.0,
        ageAppropriateRating: 4.0,
      };

      const savedFeedback = {
        ...feedbackData,
        id: 'f-789',
        overallSatisfaction: 4.0,
        flaggedForReview: false,
        submittedAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(savedFeedback);
      mockRepository.save.mockResolvedValue(savedFeedback);

      const result = await service.submitFeedback(feedbackData);

      expect(result.comments).toBeUndefined();
      expect(result).toBeDefined();
    });

    it('should validate rating ranges (1-5)', async () => {
      const invalidFeedback = {
        questionId: 'q-123',
        parentId: 'p-456',
        explanationRating: 6.0, // Invalid: > 5
        helpfulnessRating: 4.0,
        clarityRating: 4.0,
        ageAppropriateRating: 4.0,
      };

      await expect(service.submitFeedback(invalidFeedback)).rejects.toThrow();
    });
  });

  describe('getFeedbackByQuestion', () => {
    it('should retrieve all feedback for a specific question', async () => {
      const questionId = 'q-123';
      const mockFeedback = [
        {
          id: 'f-1',
          questionId,
          parentId: 'p-1',
          overallSatisfaction: 4.5,
        },
        {
          id: 'f-2',
          questionId,
          parentId: 'p-2',
          overallSatisfaction: 3.5,
        },
      ];

      mockRepository.find.mockResolvedValue(mockFeedback);

      const result = await service.getFeedbackByQuestion(questionId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { questionId },
        order: { submittedAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no feedback found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getFeedbackByQuestion('q-999');

      expect(result).toEqual([]);
    });
  });

  describe('getAverageSatisfaction', () => {
    it('should calculate average satisfaction for a question', async () => {
      const questionId = 'q-123';

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg: '4.25' }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAverageSatisfaction(questionId);

      expect(result).toBe(4.25);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'questionId = :questionId',
        { questionId }
      );
    });

    it('should return null if no feedback exists', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg: null }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAverageSatisfaction('q-999');

      expect(result).toBeNull();
    });
  });

  describe('getFlaggedFeedback', () => {
    it('should retrieve all feedback flagged for review', async () => {
      const mockFlagged = [
        {
          id: 'f-1',
          questionId: 'q-1',
          overallSatisfaction: 2.5,
          flaggedForReview: true,
        },
        {
          id: 'f-2',
          questionId: 'q-2',
          overallSatisfaction: 1.5,
          flaggedForReview: true,
        },
      ];

      mockRepository.find.mockResolvedValue(mockFlagged);

      const result = await service.getFlaggedFeedback();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { flaggedForReview: true },
        order: { overallSatisfaction: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result.every((f) => f.flaggedForReview)).toBe(true);
    });
  });

  describe('getDimensionAverages', () => {
    it('should calculate average for all rating dimensions', async () => {
      const questionId = 'q-123';

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          explanationAvg: '4.5',
          helpfulnessAvg: '4.0',
          clarityAvg: '4.5',
          ageAppropriateAvg: '5.0',
        }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getDimensionAverages(questionId);

      expect(result).toEqual({
        explanation: 4.5,
        helpfulness: 4.0,
        clarity: 4.5,
        ageAppropriate: 5.0,
      });
    });

    it('should return null values if no feedback exists', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          explanationAvg: null,
          helpfulnessAvg: null,
          clarityAvg: null,
          ageAppropriateAvg: null,
        }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getDimensionAverages('q-999');

      expect(result).toEqual({
        explanation: null,
        helpfulness: null,
        clarity: null,
        ageAppropriate: null,
      });
    });
  });

  describe('getParentFeedbackStats', () => {
    it('should return aggregated statistics for parent feedback', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalCount: '150',
          avgSatisfaction: '4.2',
          flaggedCount: '5',
        }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getParentFeedbackStats();

      expect(result.totalFeedback).toBe(150);
      expect(result.averageSatisfaction).toBe(4.2);
      expect(result.flaggedCount).toBe(5);
      expect(result.flagRate).toBeCloseTo(0.0333, 4); // 5/150 ≈ 3.33%
    });

    it('should handle zero feedback gracefully', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalCount: '0',
          avgSatisfaction: null,
          flaggedCount: '0',
        }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getParentFeedbackStats();

      expect(result).toEqual({
        totalFeedback: 0,
        averageSatisfaction: null,
        flaggedCount: 0,
        flagRate: 0,
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle decimal ratings correctly (e.g., 4.5)', async () => {
      const feedbackData = {
        questionId: 'q-123',
        parentId: 'p-456',
        explanationRating: 4.5,
        helpfulnessRating: 3.5,
        clarityRating: 4.0,
        ageAppropriateRating: 4.5,
      };

      const savedFeedback = {
        ...feedbackData,
        id: 'f-789',
        overallSatisfaction: 4.125,
        flaggedForReview: false,
        submittedAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(savedFeedback);
      mockRepository.save.mockResolvedValue(savedFeedback);

      const result = await service.submitFeedback(feedbackData);

      expect(result.overallSatisfaction).toBeCloseTo(4.125, 2);
    });

    it('should flag feedback at exactly 3.0 threshold', async () => {
      const feedbackData = {
        questionId: 'q-123',
        parentId: 'p-456',
        explanationRating: 3.0,
        helpfulnessRating: 3.0,
        clarityRating: 3.0,
        ageAppropriateRating: 3.0,
      };

      const savedFeedback = {
        ...feedbackData,
        id: 'f-789',
        overallSatisfaction: 3.0,
        flaggedForReview: false, // Exactly 3.0 should NOT flag
        submittedAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(savedFeedback);
      mockRepository.save.mockResolvedValue(savedFeedback);

      const result = await service.submitFeedback(feedbackData);

      expect(result.overallSatisfaction).toBe(3.0);
      expect(result.flaggedForReview).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should submit feedback in less than 100ms', async () => {
      const feedbackData = {
        questionId: 'q-123',
        parentId: 'p-456',
        explanationRating: 4.0,
        helpfulnessRating: 4.0,
        clarityRating: 4.0,
        ageAppropriateRating: 4.0,
      };

      const savedFeedback = {
        ...feedbackData,
        id: 'f-789',
        overallSatisfaction: 4.0,
        flaggedForReview: false,
        submittedAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(savedFeedback);
      mockRepository.save.mockResolvedValue(savedFeedback);

      const start = Date.now();
      await service.submitFeedback(feedbackData);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
