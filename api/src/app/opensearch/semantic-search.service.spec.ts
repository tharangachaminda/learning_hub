import { Test, TestingModule } from '@nestjs/testing';
import { SemanticSearchService } from './semantic-search.service';
import { OpenSearchService } from './opensearch.service';
import { EmbeddingService } from './embedding.service';

describe('SemanticSearchService', () => {
  let service: SemanticSearchService;
  let openSearchService: OpenSearchService;
  let embeddingService: EmbeddingService;

  const mockEmbedding384 = new Array(384).fill(0).map((_, i) => Math.random());
  const mockSearchResults = {
    hits: {
      total: { value: 3 },
      hits: [
        {
          _id: 'q-001',
          _score: 0.95,
          _source: {
            questionText: 'What is 5 + 3?',
            answer: 8,
            metadata: {
              grade: '3',
              topic: 'addition',
              operation: 'addition',
              difficulty: 'grade_3',
            },
          },
        },
        {
          _id: 'q-002',
          _score: 0.88,
          _source: {
            questionText: 'Calculate 4 + 6',
            answer: 10,
            metadata: {
              grade: '3',
              topic: 'addition',
              operation: 'addition',
              difficulty: 'grade_3',
            },
          },
        },
        {
          _id: 'q-003',
          _score: 0.82,
          _source: {
            questionText: 'What is 7 + 2?',
            answer: 9,
            metadata: {
              grade: '3',
              topic: 'addition',
              operation: 'addition',
              difficulty: 'grade_3',
            },
          },
        },
      ],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SemanticSearchService,
        {
          provide: OpenSearchService,
          useValue: {
            search: jest.fn(),
          },
        },
        {
          provide: EmbeddingService,
          useValue: {
            generateEmbedding: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SemanticSearchService>(SemanticSearchService);
    openSearchService = module.get<OpenSearchService>(OpenSearchService);
    embeddingService = module.get<EmbeddingService>(EmbeddingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findSimilar', () => {
    it('should find similar questions using kNN search', async () => {
      const questionText = 'What is 5 + 3?';

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding384);
      jest
        .spyOn(openSearchService, 'search')
        .mockResolvedValue(mockSearchResults);

      const results = await service.findSimilar(questionText);

      expect(embeddingService.generateEmbedding).toHaveBeenCalledWith(
        questionText
      );
      expect(openSearchService.search).toHaveBeenCalledWith(
        'math-questions',
        expect.objectContaining({
          knn: expect.objectContaining({
            embedding: expect.objectContaining({
              vector: mockEmbedding384,
              k: 10,
            }),
          }),
        }),
        10
      );
      expect(results).toHaveLength(3);
      expect(results[0]).toMatchObject({
        id: 'q-001',
        questionText: 'What is 5 + 3?',
        answer: 8,
        similarityScore: 0.95,
      });
    });

    it('should prefer answerText when present in indexed documents', async () => {
      const questionText = 'What shape comes next?';
      const textAnswerResults = {
        hits: {
          hits: [
            {
              _id: 'q-100',
              _score: 0.91,
              _source: {
                questionText: 'Look at the pattern. What comes next?',
                answer: 0,
                answerText: 'full circle',
                metadata: {
                  grade: '0',
                  topic: 'EARLY_PATTERNING',
                  operation: 'EARLY_PATTERNING',
                  difficulty: 'easy',
                },
              },
            },
          ],
        },
      };

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding384);
      jest
        .spyOn(openSearchService, 'search')
        .mockResolvedValue(textAnswerResults as any);

      const results = await service.findSimilar(questionText);

      expect(results[0]?.answer).toBe('full circle');
    });

    it('should filter by grade level', async () => {
      const questionText = 'What is 5 + 3?';

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding384);
      jest
        .spyOn(openSearchService, 'search')
        .mockResolvedValue(mockSearchResults);

      await service.findSimilar(questionText, { grade: 3 });

      expect(openSearchService.search).toHaveBeenCalledWith(
        'math-questions',
        expect.objectContaining({
          knn: expect.objectContaining({
            embedding: expect.objectContaining({
              filter: expect.objectContaining({
                term: { 'metadata.grade': '3' },
              }),
            }),
          }),
        }),
        10
      );
    });

    it('should filter by topic', async () => {
      const questionText = 'What is 5 + 3?';

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding384);
      jest
        .spyOn(openSearchService, 'search')
        .mockResolvedValue(mockSearchResults);

      await service.findSimilar(questionText, { topic: 'addition' });

      expect(openSearchService.search).toHaveBeenCalledWith(
        'math-questions',
        expect.objectContaining({
          knn: expect.objectContaining({
            embedding: expect.objectContaining({
              filter: expect.objectContaining({
                bool: expect.objectContaining({
                  should: expect.arrayContaining([
                    { term: { 'metadata.topic': 'addition' } },
                    { term: { 'metadata.source_topic_key': 'addition' } },
                  ]),
                  minimum_should_match: 1,
                }),
              }),
            }),
          }),
        }),
        10
      );
    });

    it('should filter by difficulty', async () => {
      const questionText = 'What is 5 + 3?';

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding384);
      jest
        .spyOn(openSearchService, 'search')
        .mockResolvedValue(mockSearchResults);

      await service.findSimilar(questionText, { difficulty: 'easy' });

      expect(openSearchService.search).toHaveBeenCalledWith(
        'math-questions',
        expect.objectContaining({
          knn: expect.objectContaining({
            embedding: expect.objectContaining({
              filter: expect.objectContaining({
                term: { 'metadata.difficulty': 'easy' },
              }),
            }),
          }),
        }),
        10
      );
    });

    it('should combine grade, topic, and difficulty filters', async () => {
      const questionText = 'What is 5 + 3?';

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding384);
      jest
        .spyOn(openSearchService, 'search')
        .mockResolvedValue(mockSearchResults);

      await service.findSimilar(questionText, {
        grade: 0,
        topic: 'counting_and_quantity',
        difficulty: 'easy',
      });

      expect(openSearchService.search).toHaveBeenCalledWith(
        'math-questions',
        expect.objectContaining({
          knn: expect.objectContaining({
            embedding: expect.objectContaining({
              filter: expect.objectContaining({
                bool: expect.objectContaining({
                  must: expect.arrayContaining([
                    { term: { 'metadata.grade': '0' } },
                    { term: { 'metadata.difficulty': 'easy' } },
                  ]),
                }),
              }),
            }),
          }),
        }),
        10
      );
    });

    it('should filter by operation', async () => {
      const questionText = 'What is 5 + 3?';

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding384);
      jest
        .spyOn(openSearchService, 'search')
        .mockResolvedValue(mockSearchResults);

      await service.findSimilar(questionText, { operation: 'addition' });

      expect(openSearchService.search).toHaveBeenCalledWith(
        'math-questions',
        expect.objectContaining({
          knn: expect.objectContaining({
            embedding: expect.objectContaining({
              filter: expect.objectContaining({
                bool: expect.objectContaining({
                  should: expect.arrayContaining([
                    { term: { 'metadata.operation': 'addition' } },
                    { term: { 'metadata.source_topic_key': 'addition' } },
                  ]),
                  minimum_should_match: 1,
                }),
              }),
            }),
          }),
        }),
        10
      );
    });

    it('should combine multiple filters', async () => {
      const questionText = 'What is 5 + 3?';

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding384);
      jest
        .spyOn(openSearchService, 'search')
        .mockResolvedValue(mockSearchResults);

      await service.findSimilar(questionText, {
        grade: 3,
        topic: 'addition',
        operation: 'addition',
      });

      expect(openSearchService.search).toHaveBeenCalledWith(
        'math-questions',
        expect.objectContaining({
          knn: expect.objectContaining({
            embedding: expect.objectContaining({
              filter: expect.objectContaining({
                bool: expect.objectContaining({
                  must: expect.arrayContaining([
                    { term: { 'metadata.grade': '3' } },
                    expect.objectContaining({
                      bool: expect.objectContaining({
                        minimum_should_match: 1,
                      }),
                    }),
                    expect.objectContaining({
                      bool: expect.objectContaining({
                        minimum_should_match: 1,
                      }),
                    }),
                  ]),
                }),
              }),
            }),
          }),
        }),
        10
      );
    });

    it('should exclude specified question IDs', async () => {
      const questionText = 'What is 5 + 3?';
      const excludeIds = ['q-001', 'q-002'];

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding384);
      jest
        .spyOn(openSearchService, 'search')
        .mockResolvedValue(mockSearchResults);

      await service.findSimilar(questionText, { excludeIds });

      expect(openSearchService.search).toHaveBeenCalledWith(
        'math-questions',
        expect.objectContaining({
          knn: expect.objectContaining({
            embedding: expect.objectContaining({
              filter: expect.objectContaining({
                bool: expect.objectContaining({
                  must_not: expect.arrayContaining([
                    { ids: { values: excludeIds } },
                  ]),
                }),
              }),
            }),
          }),
        }),
        10
      );
    });

    it('should limit results by k parameter', async () => {
      const questionText = 'What is 5 + 3?';

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding384);
      jest
        .spyOn(openSearchService, 'search')
        .mockResolvedValue(mockSearchResults);

      await service.findSimilar(questionText, { limit: 5 });

      expect(openSearchService.search).toHaveBeenCalledWith(
        'math-questions',
        expect.objectContaining({
          knn: expect.objectContaining({
            embedding: expect.objectContaining({
              k: 5,
            }),
          }),
        }),
        5
      );
    });

    it('should handle empty results', async () => {
      const questionText = 'What is 5 + 3?';
      const emptyResults = { hits: { total: { value: 0 }, hits: [] } };

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding384);
      jest.spyOn(openSearchService, 'search').mockResolvedValue(emptyResults);

      const results = await service.findSimilar(questionText);

      expect(results).toEqual([]);
    });

    it('should handle embedding generation failure', async () => {
      const questionText = 'What is 5 + 3?';

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockRejectedValue(new Error('Ollama unavailable'));

      await expect(service.findSimilar(questionText)).rejects.toThrow(
        'Failed to find similar questions: Ollama unavailable'
      );
    });

    it('should return empty results when OpenSearch is unavailable', async () => {
      const questionText = 'What is 5 + 3?';

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding384);
      jest
        .spyOn(openSearchService, 'search')
        .mockRejectedValue(new Error('Connection Error'));

      await expect(service.findSimilar(questionText)).resolves.toEqual([]);
    });

    it('should return results sorted by similarity score descending', async () => {
      const questionText = 'What is 5 + 3?';

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding384);
      jest
        .spyOn(openSearchService, 'search')
        .mockResolvedValue(mockSearchResults);

      const results = await service.findSimilar(questionText);

      expect(results[0].similarityScore).toBeGreaterThan(
        results[1].similarityScore
      );
      expect(results[1].similarityScore).toBeGreaterThan(
        results[2].similarityScore
      );
    });

    it('should include metadata in results', async () => {
      const questionText = 'What is 5 + 3?';

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding384);
      jest
        .spyOn(openSearchService, 'search')
        .mockResolvedValue(mockSearchResults);

      const results = await service.findSimilar(questionText);

      expect(results[0].metadata).toMatchObject({
        grade: '3',
        topic: 'addition',
        operation: 'addition',
        difficulty: 'grade_3',
      });
    });
  });

  describe('findSimilarByEmbedding', () => {
    it('should search using provided embedding vector', async () => {
      jest
        .spyOn(openSearchService, 'search')
        .mockResolvedValue(mockSearchResults);

      const results = await service.findSimilarByEmbedding(mockEmbedding384);

      expect(embeddingService.generateEmbedding).not.toHaveBeenCalled();
      expect(openSearchService.search).toHaveBeenCalledWith(
        'math-questions',
        expect.objectContaining({
          knn: expect.objectContaining({
            embedding: expect.objectContaining({
              vector: mockEmbedding384,
            }),
          }),
        }),
        10
      );
      expect(results).toHaveLength(3);
    });

    it('should apply filters with provided embedding', async () => {
      jest
        .spyOn(openSearchService, 'search')
        .mockResolvedValue(mockSearchResults);

      await service.findSimilarByEmbedding(mockEmbedding384, { grade: 3 });

      expect(openSearchService.search).toHaveBeenCalledWith(
        'math-questions',
        expect.objectContaining({
          knn: expect.objectContaining({
            embedding: expect.objectContaining({
              filter: expect.objectContaining({
                term: { 'metadata.grade': '3' },
              }),
            }),
          }),
        }),
        10
      );
    });
  });
});
