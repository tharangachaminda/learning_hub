import { Test, TestingModule } from '@nestjs/testing';
import { QuestionIndexingService } from './question-indexing.service';
import { EmbeddingService } from './embedding.service';
import { VectorIndexService } from './vector-index.service';
import {
  MathQuestion,
  DifficultyLevel,
} from '../math-questions/entities/math-question.entity';
import { Types } from 'mongoose';

describe('QuestionIndexingService', () => {
  let service: QuestionIndexingService;
  let embeddingService: EmbeddingService;
  let vectorIndexService: VectorIndexService;
  let warnSpy: jest.SpyInstance;

  const mockEmbedding768 = new Array(768).fill(0).map((_, i) => Math.random());

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionIndexingService,
        {
          provide: EmbeddingService,
          useValue: {
            generateEmbedding: jest.fn(),
            generateBatchEmbeddings: jest.fn(),
          },
        },
        {
          provide: VectorIndexService,
          useValue: {
            createIndexIfNotExists: jest.fn(),
            indexQuestion: jest.fn(),
            bulkIndexQuestions: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QuestionIndexingService>(QuestionIndexingService);
    embeddingService = module.get<EmbeddingService>(EmbeddingService);
    vectorIndexService = module.get<VectorIndexService>(VectorIndexService);
    warnSpy = jest
      .spyOn((service as any).logger, 'warn')
      .mockImplementation(() => undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('indexQuestion', () => {
    it('should generate embedding and index single question', async () => {
      const question = new MathQuestion(
        'What is 5 + 3?',
        8,
        'ADDITION',
        DifficultyLevel.GRADE_3,
        ['Step 1', 'Step 2']
      );
      question.id = 'q-001';

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding768);
      jest
        .spyOn(vectorIndexService, 'createIndexIfNotExists')
        .mockResolvedValue();
      jest.spyOn(vectorIndexService, 'indexQuestion').mockResolvedValue();

      await service.indexQuestion(question);

      expect(embeddingService.generateEmbedding).toHaveBeenCalledWith(
        'What is 5 + 3?\n\nExplanation: Step 1\nStep 2'
      );
      expect(vectorIndexService.createIndexIfNotExists).toHaveBeenCalled();
      expect(vectorIndexService.indexQuestion).toHaveBeenCalledWith(
        'q-001',
        'What is 5 + 3?',
        'Step 1\nStep 2',
        8,
        mockEmbedding768,
        {
          grade: '3',
          topic: 'ADDITION',
          operation: 'ADDITION',
          difficulty: DifficultyLevel.GRADE_3,
          difficulty_score: expect.any(Number),
          category: 'math',
          curriculum_strand: 'number',
        }
      );
    });

    it('should handle embedding generation failure gracefully', async () => {
      const question = new MathQuestion(
        'What is 5 + 3?',
        8,
        'ADDITION',
        DifficultyLevel.GRADE_3
      );

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockRejectedValue(new Error('Ollama unavailable'));

      await expect(service.indexQuestion(question)).rejects.toThrow(
        'Failed to index question: Ollama unavailable'
      );
    });

    it('should handle indexing failure gracefully', async () => {
      const question = new MathQuestion(
        'What is 5 + 3?',
        8,
        'ADDITION',
        DifficultyLevel.GRADE_3
      );

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding768);
      jest
        .spyOn(vectorIndexService, 'createIndexIfNotExists')
        .mockResolvedValue();
      jest
        .spyOn(vectorIndexService, 'indexQuestion')
        .mockRejectedValue(new Error('OpenSearch connection failed'));

      await expect(service.indexQuestion(question)).rejects.toThrow(
        'Failed to index question: OpenSearch connection failed'
      );
    });

    it('should extract grade from difficulty level', async () => {
      const question = new MathQuestion(
        'What is 5 + 3?',
        8,
        'ADDITION',
        DifficultyLevel.GRADE_3
      );
      question.id = 'q-002';

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding768);
      jest
        .spyOn(vectorIndexService, 'createIndexIfNotExists')
        .mockResolvedValue();
      jest.spyOn(vectorIndexService, 'indexQuestion').mockResolvedValue();

      await service.indexQuestion(question);

      expect(vectorIndexService.indexQuestion).toHaveBeenCalledWith(
        'q-002',
        expect.any(String),
        expect.any(String),
        expect.any(Number),
        mockEmbedding768,
        expect.objectContaining({
          grade: '3',
        })
      );
    });
  });

  describe('indexQuestions', () => {
    it('should generate embeddings and bulk index multiple questions', async () => {
      const questions = [
        new MathQuestion(
          'What is 5 + 3?',
          8,
          'ADDITION',
          DifficultyLevel.GRADE_3
        ),
        new MathQuestion(
          'Calculate 10 - 4',
          6,
          'SUBTRACTION',
          DifficultyLevel.GRADE_3
        ),
      ];
      questions[0].id = 'q-001';
      questions[1].id = 'q-002';

      jest
        .spyOn(embeddingService, 'generateBatchEmbeddings')
        .mockResolvedValue([mockEmbedding768, mockEmbedding768]);
      jest
        .spyOn(vectorIndexService, 'createIndexIfNotExists')
        .mockResolvedValue();
      jest.spyOn(vectorIndexService, 'bulkIndexQuestions').mockResolvedValue();

      await service.indexQuestions(questions);

      expect(embeddingService.generateBatchEmbeddings).toHaveBeenCalledWith([
        'What is 5 + 3?',
        'Calculate 10 - 4',
      ]);
      expect(vectorIndexService.createIndexIfNotExists).toHaveBeenCalled();
      expect(vectorIndexService.bulkIndexQuestions).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'q-001',
          questionText: 'What is 5 + 3?',
          explanation: '',
        }),
        expect.objectContaining({
          id: 'q-002',
          questionText: 'Calculate 10 - 4',
          explanation: '',
        }),
      ]);
    });

    it('should handle empty array', async () => {
      await service.indexQuestions([]);

      expect(embeddingService.generateBatchEmbeddings).not.toHaveBeenCalled();
      expect(vectorIndexService.bulkIndexQuestions).not.toHaveBeenCalled();
    });

    it('should handle batch embedding failure', async () => {
      const questions = [
        new MathQuestion(
          'What is 5 + 3?',
          8,
          'ADDITION',
          DifficultyLevel.GRADE_3
        ),
      ];

      jest
        .spyOn(embeddingService, 'generateBatchEmbeddings')
        .mockRejectedValue(new Error('Batch embedding failed'));

      await expect(service.indexQuestions(questions)).rejects.toThrow(
        'Failed to index questions: Batch embedding failed'
      );
    });
  });

  describe('metadata extraction', () => {
    it('should calculate difficulty score based on difficulty level', async () => {
      const question = new MathQuestion(
        'What is 5 + 3?',
        8,
        'ADDITION',
        DifficultyLevel.GRADE_3
      );
      question.id = 'q-001';

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding768);
      jest
        .spyOn(vectorIndexService, 'createIndexIfNotExists')
        .mockResolvedValue();
      jest.spyOn(vectorIndexService, 'indexQuestion').mockResolvedValue();

      await service.indexQuestion(question);

      // indexQuestion is called with 5 separate parameters, not an object
      // Parameters: (questionId, questionText, answer, embedding, metadata)
      const callArgs = (vectorIndexService.indexQuestion as jest.Mock).mock
        .calls[0];
      const metadata = callArgs[5]; // 6th parameter is metadata
      expect(metadata.difficulty_score).toBeGreaterThanOrEqual(0);
      expect(metadata.difficulty_score).toBeLessThanOrEqual(1);
    });

    it('should set correct metadata for subtraction questions', async () => {
      const question = new MathQuestion(
        'What is 10 - 4?',
        6,
        'SUBTRACTION',
        DifficultyLevel.GRADE_3
      );
      question.id = 'q-sub-001';

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding768);
      jest
        .spyOn(vectorIndexService, 'createIndexIfNotExists')
        .mockResolvedValue();
      jest.spyOn(vectorIndexService, 'indexQuestion').mockResolvedValue();

      await service.indexQuestion(question);

      expect(vectorIndexService.indexQuestion).toHaveBeenCalledWith(
        'q-sub-001',
        'What is 10 - 4?',
        '',
        6,
        mockEmbedding768,
        expect.objectContaining({
          topic: 'SUBTRACTION',
          operation: 'SUBTRACTION',
        })
      );
    });
  });

  describe('ensureIndexExists', () => {
    it('should create index if it does not exist', async () => {
      jest
        .spyOn(vectorIndexService, 'createIndexIfNotExists')
        .mockResolvedValue();

      await service.ensureIndexExists();

      expect(vectorIndexService.createIndexIfNotExists).toHaveBeenCalled();
    });

    it('should handle index creation failure', async () => {
      jest
        .spyOn(vectorIndexService, 'createIndexIfNotExists')
        .mockRejectedValue(new Error('Index creation failed'));

      await expect(service.ensureIndexExists()).rejects.toThrow(
        'Index creation failed'
      );
    });
  });

  describe('indexStoredQuestions', () => {
    it('should index persisted questions using question text plus explanation', async () => {
      const storedQuestion = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        questionText: 'What is $12 + 5$?',
        explanation: 'Add the ones, then the tens.',
        answer: 17,
        grade: 3,
        topic: 'ADDITION',
        category: 'number-operations',
        metadata: {
          difficulty: 'medium',
        },
      } as any;

      jest
        .spyOn(embeddingService, 'generateBatchEmbeddings')
        .mockResolvedValue([mockEmbedding768]);
      jest
        .spyOn(vectorIndexService, 'createIndexIfNotExists')
        .mockResolvedValue();
      jest.spyOn(vectorIndexService, 'bulkIndexQuestions').mockResolvedValue();

      await service.indexStoredQuestions([storedQuestion]);

      expect(embeddingService.generateBatchEmbeddings).toHaveBeenCalledWith([
        'What is $12 + 5$?\n\nExplanation: Add the ones, then the tens.',
      ]);
      expect(vectorIndexService.bulkIndexQuestions).toHaveBeenCalledWith([
        expect.objectContaining({
          id: '507f1f77bcf86cd799439011',
          questionText: 'What is $12 + 5$?',
          explanation: 'Add the ones, then the tens.',
          metadata: expect.objectContaining({
            grade: '3',
            topic: 'ADDITION',
            operation: 'ADDITION',
            difficulty: 'medium',
            category: 'number-operations',
            curriculum_strand: 'number-operations',
          }),
        }),
      ]);
    });
  });

  describe('indexStoredQuestion', () => {
    it('should warn and rethrow when OpenSearch is unavailable during approval indexing', async () => {
      const storedQuestion = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        questionText: 'What is $12 + 5$?',
        explanation: 'Add the ones, then the tens.',
        answer: 17,
        grade: 3,
        topic: 'ADDITION',
        category: 'number-operations',
        metadata: {
          difficulty: 'medium',
        },
      } as any;

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding768);
      jest
        .spyOn(vectorIndexService, 'createIndexIfNotExists')
        .mockResolvedValue();
      jest
        .spyOn(vectorIndexService, 'indexQuestion')
        .mockRejectedValue(new Error('Connection Error'));

      await expect(service.indexStoredQuestion(storedQuestion)).rejects.toThrow(
        'Failed to index question: Connection Error'
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to index stored question: 507f1f77bcf86cd799439011 (OpenSearch unavailable): Connection Error'
        )
      );
    });
  });
});
