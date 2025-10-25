import { Test, TestingModule } from '@nestjs/testing';
import { OllamaService } from './ollama.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

describe('OllamaService', () => {
  let service: OllamaService;
  let httpService: HttpService;
  let mockAxios: any;

  beforeEach(async () => {
    // Create mock axios instance with proper structure
    mockAxios = {
      get: jest.fn(),
      post: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaService,
        {
          provide: HttpService,
          useValue: {
            axiosRef: mockAxios,
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:11434'),
          },
        },
      ],
    }).compile();

    service = module.get<OllamaService>(OllamaService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkHealth', () => {
    it('should return health status when Ollama is available', async () => {
      // Mock successful Ollama response
      mockAxios.get.mockResolvedValue({
        data: {
          models: [{ name: 'llama3.1:latest' }, { name: 'qwen3:14b' }],
        },
      });

      const result = await service.checkHealth();

      expect(result).toEqual({
        status: 'healthy',
        models: expect.arrayContaining(['llama3.1:latest']),
        responseTime: expect.any(Number),
      });
    });

    it('should handle connection errors gracefully', async () => {
      // Mock network error
      mockAxios.get.mockRejectedValue(new Error('Connection refused'));

      const result = await service.checkHealth();

      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });
  });

  describe('generateMathQuestion', () => {
    it('should generate Grade 3 addition question using AI with country context', async () => {
      // Mock successful AI response with NZ cultural context
      mockAxios.post.mockResolvedValue({
        data: {
          response:
            'QUESTION: Emma collected 7 shells at Piha Beach and found 4 more near the rocks. How many shells does she have altogether? 7 + 4 = ?\nANSWER: 11\nEXPLANATION: When we add 7 + 4, we count on from 7: 8, 9, 10, 11. So Emma has 11 shells from the beach.',
        },
      });

      const questionRequest = {
        grade: 3,
        topic: 'addition',
        difficulty: 'medium',
        country: 'NZ',
        context: 'NZ Mathematics Curriculum',
      };

      const result = await service.generateMathQuestion(questionRequest);

      expect(result).toEqual({
        question: expect.stringMatching(/\d+\s*\+\s*\d+\s*=\s*\?/),
        answer: expect.any(Number),
        explanation: expect.any(String),
        metadata: {
          grade: 3,
          topic: 'addition',
          difficulty: 'medium',
          country: 'NZ',
          generated_by: 'llama3.1:latest',
          generation_time: expect.any(Number),
          validation_score: expect.any(Number),
        },
      });
    });

    it('should maintain generation time under 3 seconds', async () => {
      // Mock fast AI response
      mockAxios.post.mockResolvedValue({
        data: {
          response:
            'QUESTION: 5 + 3 = ?\nANSWER: 8\nEXPLANATION: Add 5 and 3 to get 8.',
        },
      });

      const startTime = Date.now();

      const questionRequest = {
        grade: 3,
        topic: 'addition',
        difficulty: 'easy',
        country: 'NZ',
      };

      await service.generateMathQuestion(questionRequest);

      const generationTime = Date.now() - startTime;
      expect(generationTime).toBeLessThan(3000); // <3 seconds requirement
    });

    it('should fallback to deterministic generation when AI fails', async () => {
      // Mock AI failure
      mockAxios.post.mockRejectedValue(new Error('Ollama server error'));

      const questionRequest = {
        grade: 3,
        topic: 'addition',
        difficulty: 'easy',
        country: 'NZ',
      };

      const result = await service.generateMathQuestion(questionRequest);

      // Should get a valid question even if AI fails
      expect(result.question).toBeDefined();
      expect(result.answer).toBeDefined();
      expect(result.metadata.fallback_used).toBe(true);
      expect(result.metadata.country).toBe('NZ');
    });
  });
  describe('validateMathematicalAccuracy', () => {
    it('should validate AI-generated questions for mathematical correctness with detailed analysis', async () => {
      const aiQuestion = {
        question: '7 + 5 = ?',
        answer: 12,
        explanation: 'Add 7 and 5 to get 12',
      };

      const validation = await service.validateMathematicalAccuracy(aiQuestion);

      expect(validation).toEqual({
        isCorrect: true,
        accuracy_score: expect.any(Number),
        curriculum_aligned: true,
        age_appropriate: true,
        validation_details: {
          expected_answer: expect.any(Number),
          operation_detected: expect.any(String),
          complexity_score: expect.any(Number),
        },
      });
    });
  });
});
