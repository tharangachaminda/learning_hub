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

  describe('generateExplanation', () => {
    it('should generate grade-appropriate explanation with step-by-step style', async () => {
      // Mock successful AI explanation response
      mockAxios.post.mockResolvedValue({
        data: {
          response: `Let's count together! Start with 7. Now add 5 more: 8, 9, 10, 11, 12. The answer is 12! Great job!`,
        },
      });

      const explanationRequest = {
        question: '7 + 5 = ?',
        answer: 12,
        studentAnswer: 10,
        grade: 3,
        style: 'step-by-step' as const,
        country: 'NZ',
      };

      const result = await service.generateExplanation(explanationRequest);

      expect(result).toEqual({
        explanation: expect.any(String),
        style: 'step-by-step',
        grade_level: 3,
        vocabulary_level: expect.stringMatching(/simple|moderate|complex/),
        encouragement: expect.any(String),
        visual_aids: expect.any(Array),
        metadata: {
          generation_time: expect.any(Number),
          word_count: expect.any(Number),
          sentence_count: expect.any(Number),
          avg_sentence_length: expect.any(Number),
          educational_appropriate: expect.any(Boolean),
        },
      });

      expect(result.explanation.length).toBeGreaterThan(10);
      expect(result.metadata.generation_time).toBeLessThan(2500); // <2.5s for some margin
    });

    it('should generate visual style explanation with counting aids', async () => {
      mockAxios.post.mockResolvedValue({
        data: {
          response: `Use your fingers to count! Hold up 7 fingers. Now add 5 more fingers. Count them all: 12 fingers!`,
        },
      });

      const result = await service.generateExplanation({
        question: '7 + 5 = ?',
        answer: 12,
        grade: 3,
        style: 'visual',
        country: 'NZ',
      });

      expect(result.style).toBe('visual');
      expect(result.explanation.toLowerCase()).toMatch(
        /finger|count|draw|picture|blocks/
      );
    });

    it('should generate verbal style explanation with conversational tone', async () => {
      mockAxios.post.mockResolvedValue({
        data: {
          response: `Hey! Let's figure this out together. You have 7, and you need to add 5 more. Let's count up from 7: that gives us 12!`,
        },
      });

      const result = await service.generateExplanation({
        question: '7 + 5 = ?',
        answer: 12,
        grade: 3,
        style: 'verbal',
        country: 'NZ',
      });

      expect(result.style).toBe('verbal');
      expect(result.explanation).toBeDefined();
    });

    it('should generate story style explanation with narrative context', async () => {
      mockAxios.post.mockResolvedValue({
        data: {
          response: `Emma had 7 kiwi birds at the zoo. Her friend Liam gave her 5 more kiwi birds. Now Emma has 12 kiwi birds altogether!`,
        },
      });

      const result = await service.generateExplanation({
        question: '7 + 5 = ?',
        answer: 12,
        grade: 3,
        style: 'story',
        country: 'NZ',
      });

      expect(result.style).toBe('story');
      expect(result.explanation).toBeDefined();
    });

    it('should fallback to deterministic explanation when AI fails', async () => {
      // Mock AI failure
      mockAxios.post.mockRejectedValue(new Error('AI service unavailable'));

      const result = await service.generateExplanation({
        question: '7 + 5 = ?',
        answer: 12,
        grade: 3,
        style: 'step-by-step',
        country: 'NZ',
      });

      // Should still get a valid explanation from fallback
      expect(result.explanation).toBeDefined();
      expect(result.explanation.length).toBeGreaterThan(10);
      expect(result.metadata.educational_appropriate).toBe(true);
      expect(result.encouragement).toBeDefined();
    });

    it('should analyze explanation for educational appropriateness', async () => {
      mockAxios.post.mockResolvedValue({
        data: {
          response: `Start with 7. Count up 5 more. You get 12!`,
        },
      });

      const result = await service.generateExplanation({
        question: '7 + 5 = ?',
        answer: 12,
        grade: 3,
        style: 'step-by-step',
        country: 'NZ',
      });

      expect(result.metadata.word_count).toBeGreaterThan(0);
      expect(result.metadata.sentence_count).toBeGreaterThan(0);
      expect(result.metadata.avg_sentence_length).toBeGreaterThan(0);
      expect(result.vocabulary_level).toMatch(/simple|moderate|complex/);
    });

    it('should maintain performance under 2 seconds', async () => {
      mockAxios.post.mockResolvedValue({
        data: {
          response: `Let's add! 7 plus 5 equals 12.`,
        },
      });

      const startTime = Date.now();

      const result = await service.generateExplanation({
        question: '7 + 5 = ?',
        answer: 12,
        grade: 3,
        style: 'step-by-step',
        country: 'NZ',
      });

      const totalTime = Date.now() - startTime;

      expect(result.metadata.generation_time).toBeLessThan(2000); // AC requirement: <2s
      expect(totalTime).toBeLessThan(2500); // Allow some margin for test execution
    });
  });
});
