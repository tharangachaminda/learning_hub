/**
 * Test Suite: QuestionGeneratorService
 *
 * Validates HTTP integration with the math-questions API endpoints:
 * - Health check: GET /api/math-questions/health
 * - Generate: GET /api/math-questions/generate?difficulty=...&count=...&type=...
 */
import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { QuestionGeneratorService } from './question-generator.service';
import { GeneratedQuestion } from '../models/question.model';

describe('QuestionGeneratorService', () => {
  let service: QuestionGeneratorService;
  let httpMock: HttpTestingController;

  const mockQuestion: GeneratedQuestion = {
    question: 'What is 5 + 3?',
    answer: 8,
    explanation: 'Add 5 and 3 together to get 8.',
    metadata: {
      grade: 3,
      topic: 'ADDITION',
      difficulty: 'easy',
      country: 'NZ',
      generated_by: 'ollama',
      generation_time: 400,
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        QuestionGeneratorService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(QuestionGeneratorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('checkHealth', () => {
    it('should call GET /api/math-questions/health', () => {
      service.checkHealth().subscribe();
      const req = httpMock.expectOne('/api/math-questions/health');
      expect(req.request.method).toBe('GET');
      req.flush({ status: 'ok' });
    });

    it('should return health check response on success', () => {
      const mockHealth = { status: 'ok', capabilities: { ollama: true } };

      service.checkHealth().subscribe((response) => {
        expect(response).toEqual(mockHealth);
      });

      const req = httpMock.expectOne('/api/math-questions/health');
      req.flush(mockHealth);
    });

    it('should handle health check error gracefully', () => {
      service.checkHealth().subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
        },
      });

      const req = httpMock.expectOne('/api/math-questions/health');
      req.flush('Service unavailable', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    });
  });

  describe('generateQuestions', () => {
    it('should call GET /api/math-questions/generate with correct query params', () => {
      service.generateQuestions('grade_3', 10, 'addition').subscribe();

      const req = httpMock.expectOne(
        (r) =>
          r.url === '/api/math-questions/generate' &&
          r.params.get('difficulty') === 'grade_3' &&
          r.params.get('count') === '10' &&
          r.params.get('type') === 'addition'
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockQuestion]);
    });

    it('should return an array of generated questions on success', () => {
      const mockQuestions = [
        mockQuestion,
        { ...mockQuestion, question: 'What is 2 + 4?' },
      ];

      service
        .generateQuestions('grade_3', 10, 'addition')
        .subscribe((questions) => {
          expect(questions).toHaveLength(2);
          expect(questions[0].question).toBe('What is 5 + 3?');
        });

      const req = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      req.flush(mockQuestions);
    });

    it('should handle API error on generate', () => {
      service.generateQuestions('grade_3', 10, 'addition').subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      req.flush('Internal Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
    });

    it('should handle empty response (0 questions)', () => {
      service
        .generateQuestions('grade_3', 10, 'addition')
        .subscribe((questions) => {
          expect(questions).toEqual([]);
        });

      const req = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      req.flush([]);
    });
  });
});
