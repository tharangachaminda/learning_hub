import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QuestionsService } from './questions.service';
import {
  Question,
  QuestionDocument,
  QuestionStatus,
  QuestionFormat,
  VectorSyncStatus,
} from './schemas/question.schema';
import { LessonLearned } from './schemas/lesson-learned.schema';

/**
 * Helper factory to build a valid question DTO for tests.
 */
function buildQuestionDto(
  overrides: Partial<Question> = {}
): Partial<Question> {
  return {
    questionText: 'What is $5 + 3$?',
    answer: 8,
    explanation: 'Add five and three to get eight.',
    grade: 3,
    topic: 'ADDITION',
    category: 'number-operations',
    format: QuestionFormat.OPEN_ENDED,
    options: [],
    stepByStepSolution: ['Start with 5', 'Add 3', 'Answer is 8'],
    metadata: {
      generatedBy: 'falcon3:latest',
      generationTime: 1200,
      difficulty: 'medium',
      country: 'NZ',
    },
    ...overrides,
  };
}

describe('QuestionsService', () => {
  let service: QuestionsService;
  let model: Model<QuestionDocument>;
  let lessonModel: Model<LessonLearned>;

  const mockQuestion = {
    _id: '507f1f77bcf86cd799439011',
    questionText: 'What is $5 + 3$?',
    answer: 8,
    explanation: 'Add five and three to get eight.',
    grade: 3,
    topic: 'ADDITION',
    category: 'number-operations',
    format: QuestionFormat.OPEN_ENDED,
    options: [],
    status: QuestionStatus.PENDING,
    stepByStepSolution: ['Start with 5', 'Add 3', 'Answer is 8'],
    metadata: {
      generatedBy: 'falcon3:latest',
      generationTime: 1200,
      difficulty: 'medium',
      country: 'NZ',
    },
    vectorSync: {
      status: VectorSyncStatus.PENDING,
    },
    createdAt: new Date('2026-03-20'),
    updatedAt: new Date('2026-03-20'),
    toObject: jest.fn().mockReturnThis(),
  };

  const mockQueryChain = {
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        {
          provide: getModelToken(Question.name),
          useValue: {
            new: jest.fn().mockResolvedValue(mockQuestion),
            constructor: jest.fn().mockResolvedValue(mockQuestion),
            aggregate: jest.fn(),
            create: jest.fn(),
            insertMany: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            countDocuments: jest.fn(),
            exec: jest.fn(),
          },
        },
        {
          provide: getModelToken(LessonLearned.name),
          useValue: {
            new: jest.fn(),
            constructor: jest.fn(),
            create: jest.fn(),
            find: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
            exec: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
    model = module.get<Model<QuestionDocument>>(getModelToken(Question.name));
    lessonModel = module.get<Model<LessonLearned>>(
      getModelToken(LessonLearned.name)
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create (AC-001, AC-003)', () => {
    it('should save a question and return it with pending status', async () => {
      const dto = buildQuestionDto();
      (model.create as jest.Mock).mockResolvedValue(mockQuestion);

      const result = await service.create(dto);

      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({
          questionText: dto.questionText,
          grade: dto.grade,
          topic: dto.topic,
          status: QuestionStatus.PENDING,
          vectorSync: expect.objectContaining({
            status: VectorSyncStatus.PENDING,
          }),
        })
      );
      expect(result).toBeDefined();
      expect(result.status).toBe(QuestionStatus.PENDING);
    });

    it('should store all metadata fields (AC-002)', async () => {
      const dto = buildQuestionDto();
      (model.create as jest.Mock).mockResolvedValue(mockQuestion);

      await service.create(dto);

      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            generatedBy: 'falcon3:latest',
            generationTime: 1200,
            difficulty: 'medium',
            country: 'NZ',
          }),
        })
      );
    });

    it('should handle duplicate questions gracefully (AC-004)', async () => {
      const dto = buildQuestionDto();
      const duplicateError = new Error('E11000 duplicate key error');
      (duplicateError as any).code = 11000;
      (model.create as jest.Mock).mockRejectedValue(duplicateError);

      const result = await service.create(dto);

      expect(result).toBeNull();
    });

    it('should rethrow non-duplicate errors', async () => {
      const dto = buildQuestionDto();
      const genericError = new Error('Connection failed');
      (model.create as jest.Mock).mockRejectedValue(genericError);

      await expect(service.create(dto)).rejects.toThrow('Connection failed');
    });
  });

  describe('findAll (AC-005)', () => {
    it('should return questions filtered by grade', async () => {
      (model.find as jest.Mock).mockReturnValue(mockQueryChain);
      mockQueryChain.exec.mockResolvedValue([mockQuestion]);
      (model.countDocuments as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findAll({ grade: 3 });

      expect(model.find).toHaveBeenCalledWith(
        expect.objectContaining({ grade: 3 })
      );
      expect(result.data).toHaveLength(1);
    });

    it('should return questions filtered by topic', async () => {
      (model.find as jest.Mock).mockReturnValue(mockQueryChain);
      mockQueryChain.exec.mockResolvedValue([mockQuestion]);
      (model.countDocuments as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findAll({ topic: 'ADDITION' });

      expect(model.find).toHaveBeenCalledWith(
        expect.objectContaining({ topic: 'ADDITION' })
      );
    });

    it('should return questions filtered by status', async () => {
      (model.find as jest.Mock).mockReturnValue(mockQueryChain);
      mockQueryChain.exec.mockResolvedValue([]);
      (model.countDocuments as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      const result = await service.findAll({ status: QuestionStatus.APPROVED });

      expect(model.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: QuestionStatus.APPROVED })
      );
      expect(result.data).toHaveLength(0);
    });

    it('should return questions filtered by format', async () => {
      (model.find as jest.Mock).mockReturnValue(mockQueryChain);
      mockQueryChain.exec.mockResolvedValue([mockQuestion]);
      (model.countDocuments as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findAll({
        format: QuestionFormat.OPEN_ENDED,
      });

      expect(model.find).toHaveBeenCalledWith(
        expect.objectContaining({ format: QuestionFormat.OPEN_ENDED })
      );
    });

    it('should limit approvedNotIndexed to approved questions not stored in OpenSearch', async () => {
      (model.find as jest.Mock).mockReturnValue(mockQueryChain);
      mockQueryChain.exec.mockResolvedValue([mockQuestion]);
      (model.countDocuments as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      await service.findAll({ approvedNotIndexed: true });

      expect(model.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: QuestionStatus.APPROVED,
          'vectorSync.status': { $ne: 'stored' },
        })
      );
    });

    it('should support combined filters', async () => {
      (model.find as jest.Mock).mockReturnValue(mockQueryChain);
      mockQueryChain.exec.mockResolvedValue([]);
      (model.countDocuments as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      const result = await service.findAll({
        grade: 5,
        topic: 'FRACTION_OPERATIONS',
        status: QuestionStatus.APPROVED,
        format: QuestionFormat.OPEN_ENDED,
      });

      expect(model.find).toHaveBeenCalledWith(
        expect.objectContaining({
          grade: 5,
          topic: 'FRACTION_OPERATIONS',
          status: QuestionStatus.APPROVED,
          format: QuestionFormat.OPEN_ENDED,
        })
      );
    });

    it('should support pagination with skip and limit', async () => {
      (model.find as jest.Mock).mockReturnValue(mockQueryChain);
      mockQueryChain.exec.mockResolvedValue([mockQuestion]);
      (model.countDocuments as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(50),
      });

      const result = await service.findAll({ grade: 3 }, 2, 10);

      expect(mockQueryChain.skip).toHaveBeenCalledWith(10);
      expect(mockQueryChain.limit).toHaveBeenCalledWith(10);
      expect(result.total).toBe(50);
      expect(result.page).toBe(2);
    });

    it('should return all questions when no filters provided', async () => {
      (model.find as jest.Mock).mockReturnValue(mockQueryChain);
      mockQueryChain.exec.mockResolvedValue([mockQuestion]);
      (model.countDocuments as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findAll({});

      expect(model.find).toHaveBeenCalledWith({});
    });
  });

  describe('getAnalytics', () => {
    it('should include indexed counts in analytics summaries and difficulty breakdowns', async () => {
      (model.aggregate as jest.Mock)
        .mockResolvedValueOnce([
          {
            _id: {
              grade: 3,
              topic: 'ADDITION',
              status: QuestionStatus.APPROVED,
            },
            count: 4,
          },
        ])
        .mockResolvedValueOnce([
          {
            _id: { grade: 3, topic: 'ADDITION', difficulty: 'easy' },
            count: 2,
          },
          {
            _id: { grade: 3, topic: 'ADDITION', difficulty: 'medium' },
            count: 2,
          },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            _id: { grade: 3, topic: 'ADDITION' },
            count: 1,
          },
        ])
        .mockResolvedValueOnce([
          {
            _id: { grade: 3, topic: 'ADDITION', difficulty: 'easy' },
            count: 1,
          },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            _id: { grade: 3, topic: 'ADDITION' },
            lastCreated: new Date('2026-05-09'),
          },
        ]);

      const result = await service.getAnalytics(10, 3);
      const additionEntry = result.gradeTopicMatrix.find(
        (entry) => entry.grade === 3 && entry.topic === 'ADDITION'
      );
      const additionHealth = result.topicHealth.find(
        (entry) => entry.grade === 3 && entry.topic === 'ADDITION'
      );
      const easyDifficulty = result.byDifficulty.find(
        (entry) =>
          entry.grade === 3 &&
          entry.topic === 'ADDITION' &&
          entry.difficulty === 'easy'
      );

      expect(additionEntry).toEqual(
        expect.objectContaining({ approved: 4, indexed: 1 })
      );
      expect(result.summary.totalIndexed).toBe(1);
      expect(easyDifficulty).toEqual(
        expect.objectContaining({ count: 2, indexed: 1 })
      );
      expect(additionHealth).toEqual(
        expect.objectContaining({
          indexed: 1,
          indexedDifficultyDepth: expect.objectContaining({ easy: 1 }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a single question by ID', async () => {
      (model.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockQuestion),
      });

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(model.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toBeDefined();
      expect(result.questionText).toBe('What is $5 + 3$?');
    });

    it('should return null for non-existent ID', async () => {
      (model.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findOne('000000000000000000000000');

      expect(result).toBeNull();
    });
  });

  describe('createMany (AC-006)', () => {
    it('should batch insert multiple questions', async () => {
      const dtos = [
        buildQuestionDto({ questionText: 'What is $2 + 3$?', answer: 5 }),
        buildQuestionDto({ questionText: 'What is $4 + 6$?', answer: 10 }),
        buildQuestionDto({ questionText: 'What is $7 + 1$?', answer: 8 }),
      ];

      const savedQuestions = dtos.map((dto, i) => ({
        ...mockQuestion,
        _id: `id_${i}`,
        questionText: dto.questionText,
        answer: dto.answer,
        status: QuestionStatus.PENDING,
      }));

      (model.insertMany as jest.Mock).mockResolvedValue(savedQuestions);

      const result = await service.createMany(dtos);

      expect(model.insertMany).toHaveBeenCalled();
      expect(result).toHaveLength(3);
    });

    it('should set pending status on all batch-inserted questions', async () => {
      const dtos = [
        buildQuestionDto({ questionText: 'Q1?' }),
        buildQuestionDto({ questionText: 'Q2?' }),
      ];

      const savedQuestions = dtos.map((dto, i) => ({
        ...mockQuestion,
        _id: `id_${i}`,
        questionText: dto.questionText,
        status: QuestionStatus.PENDING,
      }));

      (model.insertMany as jest.Mock).mockResolvedValue(savedQuestions);

      const result = await service.createMany(dtos);

      // Verify insertMany was called with status: pending on each
      const callArgs = (model.insertMany as jest.Mock).mock.calls[0][0];
      callArgs.forEach((item: any) => {
        expect(item.status).toBe(QuestionStatus.PENDING);
        expect(item.vectorSync).toEqual(
          expect.objectContaining({ status: VectorSyncStatus.PENDING })
        );
      });
    });

    it('should skip duplicates in batch insert and return non-duplicates', async () => {
      const dtos = [
        buildQuestionDto({ questionText: 'Unique Q?' }),
        buildQuestionDto({ questionText: 'Duplicate Q?' }),
      ];

      const savedQuestions = [
        {
          ...mockQuestion,
          questionText: 'Unique Q?',
          status: QuestionStatus.PENDING,
        },
      ];

      (model.insertMany as jest.Mock).mockResolvedValue(savedQuestions);

      const result = await service.createMany(dtos);

      // insertMany with ordered: false skips duplicates
      expect(model.insertMany).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ ordered: false })
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('vector sync state transitions', () => {
    it('should mark vectorSync as prepared', async () => {
      const question = {
        ...mockQuestion,
        vectorSync: {
          status: VectorSyncStatus.STORED,
          storedAt: new Date('2026-05-08'),
          storedBy: 'admin@example.com',
          documentId: 'doc-1',
          syncError: 'boom',
          contentHash: 'hash-1',
          embeddingModelVersion: 'nomic-embed-text:v1',
        },
        save: jest.fn().mockResolvedValue(undefined),
      };
      (model.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(question),
      });

      const result = await service.markVectorSyncPrepared(
        '507f1f77bcf86cd799439011'
      );

      expect(result.vectorSync).toEqual(
        expect.objectContaining({ status: VectorSyncStatus.PREPARED })
      );
      expect(result.vectorSync.preparedAt).toBeInstanceOf(Date);
      expect(result.vectorSync.storedAt).toBeUndefined();
      expect(result.vectorSync.storedBy).toBeUndefined();
      expect(result.vectorSync.documentId).toBeUndefined();
      expect(result.vectorSync.syncError).toBeUndefined();
      expect(result.vectorSync.contentHash).toBeUndefined();
      expect(result.vectorSync.embeddingModelVersion).toBeUndefined();
      expect(question.save).toHaveBeenCalled();
    });

    it('should mark vectorSync as stored', async () => {
      const question = {
        ...mockQuestion,
        vectorSync: {
          status: VectorSyncStatus.PREPARED,
          preparedAt: new Date('2026-05-08'),
        },
        save: jest.fn().mockResolvedValue(undefined),
      };
      (model.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(question),
      });

      const result = await service.markVectorSyncStored(
        '507f1f77bcf86cd799439011',
        'teacher@example.com',
        '507f1f77bcf86cd799439011'
      );

      expect(result.vectorSync).toEqual(
        expect.objectContaining({
          status: VectorSyncStatus.STORED,
          storedBy: 'teacher@example.com',
          documentId: '507f1f77bcf86cd799439011',
        })
      );
      expect(result.vectorSync.storedAt).toBeInstanceOf(Date);
      expect(question.save).toHaveBeenCalled();
    });

    it('should mark vectorSync as failed', async () => {
      const question = {
        ...mockQuestion,
        vectorSync: {
          status: VectorSyncStatus.PREPARED,
          preparedAt: new Date('2026-05-08'),
        },
        save: jest.fn().mockResolvedValue(undefined),
      };
      (model.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(question),
      });

      const result = await service.markVectorSyncFailed(
        '507f1f77bcf86cd799439011',
        'OpenSearch unavailable'
      );

      expect(result.vectorSync).toEqual(
        expect.objectContaining({
          status: VectorSyncStatus.FAILED,
          syncError: 'OpenSearch unavailable',
        })
      );
      expect(question.save).toHaveBeenCalled();
    });

    it('should reset vectorSync to pending when a question is rejected', async () => {
      const question = {
        ...mockQuestion,
        vectorSync: {
          status: VectorSyncStatus.STORED,
          documentId: 'doc-1',
          storedAt: new Date('2026-05-08'),
          storedBy: 'admin@example.com',
        },
        save: jest.fn().mockResolvedValue(undefined),
      };
      (model.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(question),
      });
      (lessonModel.create as jest.Mock).mockResolvedValue({});

      await service.reviewQuestion(
        '507f1f77bcf86cd799439011',
        QuestionStatus.REJECTED,
        'reviewer@example.com',
        'Needs correction'
      );

      expect(question.vectorSync).toEqual(
        expect.objectContaining({ status: VectorSyncStatus.PENDING })
      );
      expect(question.vectorSync.documentId).toBeUndefined();
      expect(question.save).toHaveBeenCalled();
    });

    it('should reset vectorSync to pending when applying a refinement', async () => {
      const question = {
        ...mockQuestion,
        refinementHistory: [],
        reviewedBy: 'reviewer@example.com',
        reviewedAt: new Date('2026-05-08'),
        vectorSync: {
          status: VectorSyncStatus.STORED,
          documentId: 'doc-1',
          storedAt: new Date('2026-05-08'),
        },
        save: jest.fn().mockResolvedValue(undefined),
      };
      (model.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(question),
      });

      await service.applyRefinement(
        '507f1f77bcf86cd799439011',
        {
          questionText: 'What is $9 + 8$?',
          answer: 17,
          explanation: 'Add nine and eight to get seventeen.',
        },
        'Improve clarity',
        'editor@example.com'
      );

      expect(question.status).toBe(QuestionStatus.PENDING);
      expect(question.vectorSync).toEqual(
        expect.objectContaining({ status: VectorSyncStatus.PENDING })
      );
      expect(question.vectorSync.documentId).toBeUndefined();
      expect(question.save).toHaveBeenCalled();
    });

    it('should reset vectorSync to pending when updating question content', async () => {
      const question = {
        ...mockQuestion,
        refinementHistory: [],
        reviewedBy: 'reviewer@example.com',
        reviewedAt: new Date('2026-05-08'),
        vectorSync: {
          status: VectorSyncStatus.STORED,
          documentId: 'doc-1',
          storedAt: new Date('2026-05-08'),
        },
        save: jest.fn().mockResolvedValue(undefined),
      };
      (model.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(question),
      });

      await service.updateQuestionContent(
        '507f1f77bcf86cd799439011',
        {
          questionText: 'What is $15 + 4$?',
          explanation: 'Add fifteen and four.',
        },
        'editor@example.com'
      );

      expect(question.status).toBe(QuestionStatus.PENDING);
      expect(question.vectorSync).toEqual(
        expect.objectContaining({ status: VectorSyncStatus.PENDING })
      );
      expect(question.vectorSync.documentId).toBeUndefined();
      expect(question.reviewedBy).toBeUndefined();
      expect(question.reviewedAt).toBeUndefined();
      expect(question.save).toHaveBeenCalled();
    });
  });
});
