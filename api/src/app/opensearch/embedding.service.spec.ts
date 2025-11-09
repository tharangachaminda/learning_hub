import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { EmbeddingService } from './embedding.service';

describe('EmbeddingService', () => {
  let service: EmbeddingService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockOllamaUrl = 'http://localhost:11434';
  const mockEmbedding384 = new Array(384).fill(0).map((_, i) => Math.random());

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'OLLAMA_URL') return mockOllamaUrl;
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmbeddingService>(EmbeddingService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateEmbedding', () => {
    it('should generate 384-dimensional embedding for text', async () => {
      const text = 'What is 5 + 3?';
      const mockResponse: AxiosResponse = {
        data: { embedding: mockEmbedding384 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const result = await service.generateEmbedding(text);

      expect(result).toHaveLength(384);
      expect(result).toEqual(mockEmbedding384);
      expect(httpService.post).toHaveBeenCalledWith(
        `${mockOllamaUrl}/api/embeddings`,
        {
          model: 'nomic-embed-text',
          prompt: text,
        }
      );
    });

    it('should handle empty text', async () => {
      const mockResponse: AxiosResponse = {
        data: { embedding: mockEmbedding384 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const result = await service.generateEmbedding('');

      expect(result).toHaveLength(384);
      expect(httpService.post).toHaveBeenCalledWith(
        `${mockOllamaUrl}/api/embeddings`,
        {
          model: 'nomic-embed-text',
          prompt: '',
        }
      );
    });

    it('should throw error when Ollama server is unreachable', async () => {
      const text = 'What is 5 + 3?';
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => new Error('Connection refused')));

      await expect(service.generateEmbedding(text)).rejects.toThrow(
        'Failed to generate embedding: Connection refused'
      );
    });

    it('should throw error when response has no embedding', async () => {
      const text = 'What is 5 + 3?';
      const mockResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      await expect(service.generateEmbedding(text)).rejects.toThrow(
        'No embedding returned from Ollama'
      );
    });

    it('should validate embedding dimensions', async () => {
      const text = 'What is 5 + 3?';
      const wrongDimensionEmbedding = new Array(256).fill(0);
      const mockResponse: AxiosResponse = {
        data: { embedding: wrongDimensionEmbedding },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      await expect(service.generateEmbedding(text)).rejects.toThrow(
        'Invalid embedding dimensions: expected 384, got 256'
      );
    });
  });

  describe('generateBatchEmbeddings', () => {
    it('should generate embeddings for multiple texts', async () => {
      const texts = ['What is 5 + 3?', 'Calculate 10 - 4', 'Solve 7 × 2'];
      const mockResponse: AxiosResponse = {
        data: { embedding: mockEmbedding384 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const results = await service.generateBatchEmbeddings(texts);

      expect(results).toHaveLength(3);
      results.forEach((embedding) => {
        expect(embedding).toHaveLength(384);
      });
      expect(httpService.post).toHaveBeenCalledTimes(3);
    });

    it('should handle empty array', async () => {
      const results = await service.generateBatchEmbeddings([]);

      expect(results).toEqual([]);
      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should handle partial failures in batch', async () => {
      const texts = ['What is 5 + 3?', 'Calculate 10 - 4'];
      const mockSuccessResponse: AxiosResponse = {
        data: { embedding: mockEmbedding384 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest
        .spyOn(httpService, 'post')
        .mockReturnValueOnce(of(mockSuccessResponse))
        .mockReturnValueOnce(throwError(() => new Error('Timeout')));

      await expect(service.generateBatchEmbeddings(texts)).rejects.toThrow(
        'Failed to generate embedding: Timeout'
      );
    });
  });

  describe('caching', () => {
    it('should cache embeddings for identical text', async () => {
      const text = 'What is 5 + 3?';
      const mockResponse: AxiosResponse = {
        data: { embedding: mockEmbedding384 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      // First call should hit Ollama
      const result1 = await service.generateEmbedding(text);
      expect(httpService.post).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await service.generateEmbedding(text);
      expect(httpService.post).toHaveBeenCalledTimes(1); // Still 1, not 2
      expect(result2).toEqual(result1);
    });

    it('should not cache different texts', async () => {
      const text1 = 'What is 5 + 3?';
      const text2 = 'Calculate 10 - 4';
      const mockResponse: AxiosResponse = {
        data: { embedding: mockEmbedding384 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      await service.generateEmbedding(text1);
      await service.generateEmbedding(text2);

      expect(httpService.post).toHaveBeenCalledTimes(2);
    });

    it('should clear cache on demand', async () => {
      const text = 'What is 5 + 3?';
      const mockResponse: AxiosResponse = {
        data: { embedding: mockEmbedding384 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      // First call
      await service.generateEmbedding(text);
      expect(httpService.post).toHaveBeenCalledTimes(1);

      // Clear cache
      service.clearCache();

      // Should hit Ollama again
      await service.generateEmbedding(text);
      expect(httpService.post).toHaveBeenCalledTimes(2);
    });

    it('should return cache statistics', () => {
      const stats = service.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats.maxSize).toBe(1000);
    });
  });

  describe('embedding model configuration', () => {
    it('should use nomic-embed-text model by default', async () => {
      const text = 'What is 5 + 3?';
      const mockResponse: AxiosResponse = {
        data: { embedding: mockEmbedding384 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      await service.generateEmbedding(text);

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          model: 'nomic-embed-text',
        })
      );
    });

    it('should validate model produces 384-dimensional embeddings', async () => {
      const text = 'What is 5 + 3?';

      // The service should ensure we get 384 dimensions
      const mockResponse: AxiosResponse = {
        data: { embedding: mockEmbedding384 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const result = await service.generateEmbedding(text);

      expect(result).toHaveLength(384);
    });
  });
});
