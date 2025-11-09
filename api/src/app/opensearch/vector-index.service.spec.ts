import { Test, TestingModule } from '@nestjs/testing';
import { VectorIndexService } from './vector-index.service';
import { OpenSearchService } from './opensearch.service';

describe('VectorIndexService', () => {
  let service: VectorIndexService;
  let openSearchService: OpenSearchService;

  beforeEach(async () => {
    const mockOpenSearchService = {
      indexExists: jest.fn(),
      getClient: jest.fn(),
      deleteIndex: jest.fn(),
      indexDocument: jest.fn(),
      bulkIndex: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VectorIndexService,
        {
          provide: OpenSearchService,
          useValue: mockOpenSearchService,
        },
      ],
    }).compile();

    service = module.get<VectorIndexService>(VectorIndexService);
    openSearchService = module.get<OpenSearchService>(OpenSearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getIndexName', () => {
    it('should return the math-questions index name', () => {
      expect(service.getIndexName()).toBe('math-questions');
    });
  });

  describe('getIndexMapping', () => {
    it('should return proper mapping for vector search', () => {
      const mapping = service.getIndexMapping();

      expect(mapping.properties).toBeDefined();
      expect(mapping.properties.questionText).toEqual({
        type: 'text',
        analyzer: 'standard',
      });
      expect(mapping.properties.embedding).toBeDefined();
      expect(mapping.properties.embedding.type).toBe('knn_vector');
      expect(mapping.properties.embedding.dimension).toBe(384);
      expect(mapping.properties.metadata).toBeDefined();
    });

    it('should configure cosine similarity for embedding', () => {
      const mapping = service.getIndexMapping();

      expect(mapping.properties.embedding.method.space_type).toBe(
        'cosinesimil'
      );
      expect(mapping.properties.embedding.method.name).toBe('hnsw');
    });

    it('should include all required metadata fields', () => {
      const mapping = service.getIndexMapping();
      const metadata = mapping.properties.metadata.properties;

      expect(metadata.grade).toEqual({ type: 'keyword' });
      expect(metadata.topic).toEqual({ type: 'keyword' });
      expect(metadata.operation).toEqual({ type: 'keyword' });
      expect(metadata.difficulty).toEqual({ type: 'keyword' });
      expect(metadata.difficulty_score).toEqual({ type: 'float' });
      expect(metadata.generation_timestamp).toEqual({ type: 'date' });
    });
  });

  describe('getIndexSettings', () => {
    it('should enable knn for vector search', () => {
      const settings = service.getIndexSettings();

      expect(settings.index.knn).toBe(true);
      expect(settings.index.knn_algo_param_ef_search).toBe(100);
    });

    it('should configure single shard for development', () => {
      const settings = service.getIndexSettings();

      expect(settings.index.number_of_shards).toBe(1);
      expect(settings.index.number_of_replicas).toBe(0);
    });
  });

  describe('createIndexIfNotExists', () => {
    it('should skip creation if index already exists', async () => {
      jest.spyOn(openSearchService, 'indexExists').mockResolvedValue(true);
      const createSpy = jest.fn();
      jest.spyOn(openSearchService, 'getClient').mockReturnValue({
        indices: { create: createSpy },
      } as any);

      await service.createIndexIfNotExists();

      expect(openSearchService.indexExists).toHaveBeenCalledWith(
        'math-questions'
      );
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('should create index with proper settings and mapping', async () => {
      jest.spyOn(openSearchService, 'indexExists').mockResolvedValue(false);
      const createSpy = jest
        .fn()
        .mockResolvedValue({ body: { acknowledged: true } });
      jest.spyOn(openSearchService, 'getClient').mockReturnValue({
        indices: { create: createSpy },
      } as any);

      await service.createIndexIfNotExists();

      expect(createSpy).toHaveBeenCalledWith({
        index: 'math-questions',
        body: {
          settings: service.getIndexSettings(),
          mappings: service.getIndexMapping(),
        },
      });
    });
  });

  describe('deleteIndex', () => {
    it('should delete the index', async () => {
      jest.spyOn(openSearchService, 'deleteIndex').mockResolvedValue(undefined);

      await service.deleteIndex();

      expect(openSearchService.deleteIndex).toHaveBeenCalledWith(
        'math-questions'
      );
    });
  });

  describe('recreateIndex', () => {
    it('should delete and recreate the index', async () => {
      jest.spyOn(openSearchService, 'deleteIndex').mockResolvedValue(undefined);
      jest.spyOn(openSearchService, 'indexExists').mockResolvedValue(false);
      const createSpy = jest
        .fn()
        .mockResolvedValue({ body: { acknowledged: true } });
      jest.spyOn(openSearchService, 'getClient').mockReturnValue({
        indices: { create: createSpy },
      } as any);

      await service.recreateIndex();

      expect(openSearchService.deleteIndex).toHaveBeenCalled();
      expect(createSpy).toHaveBeenCalled();
    });
  });

  describe('getIndexStats', () => {
    it('should return index statistics', async () => {
      const mockStats = {
        body: [
          {
            'docs.count': '100',
            'store.size': '50kb',
          },
        ],
      };

      jest.spyOn(openSearchService, 'getClient').mockReturnValue({
        cat: {
          indices: jest.fn().mockResolvedValue(mockStats),
        },
      } as any);

      const stats = await service.getIndexStats();

      expect(stats.documentCount).toBe(100);
      expect(stats.indexSize).toBe('50kb');
    });
  });

  describe('indexQuestion', () => {
    it('should index a question with embedding and metadata', async () => {
      jest
        .spyOn(openSearchService, 'indexDocument')
        .mockResolvedValue(undefined);

      const questionId = 'q-123';
      const questionText = '5 + 3 = ?';
      const answer = 8;
      const embedding = new Array(384).fill(0.1);
      const metadata = {
        grade: 'grade_3',
        topic: 'addition',
        operation: 'ADDITION',
        difficulty: 'easy',
      };

      await service.indexQuestion(
        questionId,
        questionText,
        answer,
        embedding,
        metadata
      );

      expect(openSearchService.indexDocument).toHaveBeenCalledWith(
        'math-questions',
        questionId,
        expect.objectContaining({
          questionText,
          answer,
          embedding,
          metadata: expect.objectContaining({
            ...metadata,
            generation_timestamp: expect.any(String),
          }),
        })
      );
    });
  });

  describe('bulkIndexQuestions', () => {
    it('should bulk index multiple questions', async () => {
      jest.spyOn(openSearchService, 'bulkIndex').mockResolvedValue(undefined);

      const questions = [
        {
          id: 'q-1',
          questionText: '5 + 3 = ?',
          answer: 8,
          embedding: new Array(384).fill(0.1),
          metadata: { grade: 'grade_3', topic: 'addition' },
        },
        {
          id: 'q-2',
          questionText: '10 - 4 = ?',
          answer: 6,
          embedding: new Array(384).fill(0.2),
          metadata: { grade: 'grade_3', topic: 'subtraction' },
        },
      ];

      await service.bulkIndexQuestions(questions);

      expect(openSearchService.bulkIndex).toHaveBeenCalledWith(
        'math-questions',
        expect.arrayContaining([
          expect.objectContaining({
            id: 'q-1',
            document: expect.objectContaining({
              questionText: '5 + 3 = ?',
              answer: 8,
            }),
          }),
          expect.objectContaining({
            id: 'q-2',
            document: expect.objectContaining({
              questionText: '10 - 4 = ?',
              answer: 6,
            }),
          }),
        ])
      );
    });
  });
});
