import { Test, TestingModule } from '@nestjs/testing';
import { QuestionIndexingService } from './question-indexing.service';
import { EmbeddingService } from './embedding.service';
import { VectorIndexService } from './vector-index.service';
import {
  MathQuestion,
  OperationType,
  DifficultyLevel,
} from '../math-questions/entities/math-question.entity';

describe('QuestionIndexingService', () => {
  let service: QuestionIndexingService;
  let embeddingService: EmbeddingService;
  let vectorIndexService: VectorIndexService;

  const mockEmbedding384 = new Array(384).fill(0).map((_, i) => Math.random());

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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('indexQuestion', () => {
    it('should generate embedding and index single question', async () => {
      const question = new MathQuestion(
        'What is 5 + 3?',
        8,
        OperationType.ADDITION,
        DifficultyLevel.GRADE_3,
        ['Step 1', 'Step 2']
      );
      question.id = 'q-001';

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding384);
      jest
        .spyOn(vectorIndexService, 'createIndexIfNotExists')
        .mockResolvedValue();
      jest.spyOn(vectorIndexService, 'indexQuestion').mockResolvedValue();

      await service.indexQuestion(question);

      expect(embeddingService.generateEmbedding).toHaveBeenCalledWith(
        'What is 5 + 3?'
      );
      expect(vectorIndexService.createIndexIfNotExists).toHaveBeenCalled();
      expect(vectorIndexService.indexQuestion).toHaveBeenCalledWith(
        'q-001',
        'What is 5 + 3?',
        8,
        mockEmbedding384,
        {
          grade: '3',
          topic: OperationType.ADDITION,
          operation: OperationType.ADDITION,
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
        OperationType.ADDITION,
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
        OperationType.ADDITION,
        DifficultyLevel.GRADE_3
      );

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding384);
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
        OperationType.ADDITION,
        DifficultyLevel.GRADE_3
      );
      question.id = 'q-002';

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding384);
      jest
        .spyOn(vectorIndexService, 'createIndexIfNotExists')
        .mockResolvedValue();
      jest.spyOn(vectorIndexService, 'indexQuestion').mockResolvedValue();

      await service.indexQuestion(question);

      expect(vectorIndexService.indexQuestion).toHaveBeenCalledWith(
        'q-002',
        expect.any(String),
        expect.any(Number),
        mockEmbedding384,
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
          OperationType.ADDITION,
          DifficultyLevel.GRADE_3
        ),
        new MathQuestion(
          'Calculate 10 - 4',
          6,
          OperationType.SUBTRACTION,
          DifficultyLevel.GRADE_3
        ),
      ];
      questions[0].id = 'q-001';
      questions[1].id = 'q-002';

      jest
        .spyOn(embeddingService, 'generateBatchEmbeddings')
        .mockResolvedValue([mockEmbedding384, mockEmbedding384]);
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
        }),
        expect.objectContaining({
          id: 'q-002',
          questionText: 'Calculate 10 - 4',
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
          OperationType.ADDITION,
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
        OperationType.ADDITION,
        DifficultyLevel.GRADE_3
      );
      question.id = 'q-001';

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding384);
      jest
        .spyOn(vectorIndexService, 'createIndexIfNotExists')
        .mockResolvedValue();
      jest.spyOn(vectorIndexService, 'indexQuestion').mockResolvedValue();

      await service.indexQuestion(question);

      // indexQuestion is called with 5 separate parameters, not an object
      // Parameters: (questionId, questionText, answer, embedding, metadata)
      const callArgs = (vectorIndexService.indexQuestion as jest.Mock).mock
        .calls[0];
      const metadata = callArgs[4]; // 5th parameter is metadata
      expect(metadata.difficulty_score).toBeGreaterThanOrEqual(0);
      expect(metadata.difficulty_score).toBeLessThanOrEqual(1);
    });

    it('should set correct metadata for subtraction questions', async () => {
      const question = new MathQuestion(
        'What is 10 - 4?',
        6,
        OperationType.SUBTRACTION,
        DifficultyLevel.GRADE_3
      );
      question.id = 'q-sub-001';

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding384);
      jest
        .spyOn(vectorIndexService, 'createIndexIfNotExists')
        .mockResolvedValue();
      jest.spyOn(vectorIndexService, 'indexQuestion').mockResolvedValue();

      await service.indexQuestion(question);

      expect(vectorIndexService.indexQuestion).toHaveBeenCalledWith(
        'q-sub-001',
        'What is 10 - 4?',
        6,
        mockEmbedding384,
        expect.objectContaining({
          topic: OperationType.SUBTRACTION,
          operation: OperationType.SUBTRACTION,
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
});
