/**
 * Test Suite: QuestionGeneratorComponent (Smart Container)
 *
 * Validates the container orchestrates Phase 1→2 flow,
 * runs health check on init, and manages signal-based state.
 */
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { QuestionGeneratorComponent } from './question-generator';
import { QuestionGeneratorService } from './services/question-generator.service';
import { StudentProfileService } from './services/student-profile.service';
import { GenerationParams } from './models/generation-params.model';
import { GeneratedQuestion } from './models/question.model';

describe('QuestionGeneratorComponent', () => {
  let component: QuestionGeneratorComponent;
  let fixture: ComponentFixture<QuestionGeneratorComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionGeneratorComponent],
      providers: [
        QuestionGeneratorService,
        StudentProfileService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(QuestionGeneratorComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.detectChanges(); // triggers ngOnInit → health check
    const req = httpMock.expectOne('/api/math-questions/health');
    req.flush({ status: 'ok' });
    expect(component).toBeTruthy();
  });

  it('should start in controls phase', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/math-questions/health');
    req.flush({ status: 'ok' });
    expect(component.phase()).toBe('controls');
  });

  it('should set serviceHealthy to true on successful health check', fakeAsync(() => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/math-questions/health');
    req.flush({ status: 'ok' });
    tick();
    expect(component.serviceHealthy()).toBe(true);
  }));

  it('should set serviceHealthy to false on health check failure', fakeAsync(() => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/math-questions/health');
    req.flush('Service unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
    });
    tick();
    expect(component.serviceHealthy()).toBe(false);
  }));

  it('should show error banner when service is unhealthy', fakeAsync(() => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/math-questions/health');
    req.flush('fail', { status: 503, statusText: 'Service Unavailable' });
    tick();
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector(
      '[data-testid="health-error-banner"]'
    );
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('not available');
  }));

  it('should not show error banner when service is healthy', fakeAsync(() => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/math-questions/health');
    req.flush({ status: 'ok' });
    tick();
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector(
      '[data-testid="health-error-banner"]'
    );
    expect(banner).toBeFalsy();
  }));

  it('should render generation controls in controls phase', fakeAsync(() => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/math-questions/health');
    req.flush({ status: 'ok' });
    tick();
    fixture.detectChanges();

    const controls = fixture.nativeElement.querySelector(
      'app-generation-controls'
    );
    expect(controls).toBeTruthy();
  }));

  it('should have isGenerating initially set to false', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/math-questions/health');
    req.flush({ status: 'ok' });
    expect(component.isGenerating()).toBe(false);
  });

  // ────────────────────────────────────────────────────
  // AC#9: API Call & Phase Transitions
  // ────────────────────────────────────────────────────
  describe('API Integration (AC#9)', () => {
    const mockParams: GenerationParams = {
      grade: 3,
      topic: 'ADDITION',
      difficulty: 'easy',
      count: 10,
      country: 'NZ',
    };

    const mockQuestion: GeneratedQuestion = {
      question: 'What is 5 + 3?',
      answer: 8,
      explanation: 'Add 5 and 3 to get 8.',
      metadata: {
        grade: 3,
        topic: 'ADDITION',
        difficulty: 'easy',
        country: 'NZ',
        generated_by: 'ollama',
        generation_time: 400,
      },
    };

    function initComponent(): void {
      fixture.detectChanges();
      const healthReq = httpMock.expectOne('/api/math-questions/health');
      healthReq.flush({ status: 'ok' });
    }

    it('should call API with correct params when onGenerate is triggered', fakeAsync(() => {
      initComponent();
      component.onGenerate(mockParams);

      const req = httpMock.expectOne(
        (r) =>
          r.url === '/api/math-questions/generate' &&
          r.params.get('difficulty') === 'grade_3' &&
          r.params.get('count') === '10' &&
          r.params.get('type') === 'addition'
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockQuestion]);
      tick();
    }));

    it('should set isGenerating to true during API call', fakeAsync(() => {
      initComponent();
      component.onGenerate(mockParams);
      expect(component.isGenerating()).toBe(true);

      const req = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      req.flush([mockQuestion]);
      tick();
    }));

    it('should transition to questions phase on success with questions', fakeAsync(() => {
      initComponent();
      component.onGenerate(mockParams);

      const req = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      req.flush([mockQuestion]);
      tick();

      expect(component.phase()).toBe('questions');
      expect(component.questions()).toHaveLength(1);
      expect(component.isGenerating()).toBe(false);
    }));

    it('should stay in controls phase when API returns 0 questions', fakeAsync(() => {
      initComponent();
      component.onGenerate(mockParams);

      const req = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      req.flush([]);
      tick();

      expect(component.phase()).toBe('controls');
      expect(component.questions()).toHaveLength(0);
      expect(component.isGenerating()).toBe(false);
    }));

    it('should show empty state message when 0 questions returned', fakeAsync(() => {
      initComponent();
      component.onGenerate(mockParams);

      const req = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      req.flush([]);
      tick();
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector(
        '[data-testid="empty-state"]'
      );
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('No questions found');
    }));

    it('should show error state on API failure', fakeAsync(() => {
      initComponent();
      component.onGenerate(mockParams);

      const req = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      req.flush('Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
      tick();
      fixture.detectChanges();

      const errorState = fixture.nativeElement.querySelector(
        '[data-testid="error-state"]'
      );
      expect(errorState).toBeTruthy();
      expect(errorState.textContent).toContain('Something went wrong');
    }));

    it('should provide Try Again action in error state', fakeAsync(() => {
      initComponent();
      component.onGenerate(mockParams);

      const req = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      req.flush('Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
      tick();
      fixture.detectChanges();

      const retryBtn = fixture.nativeElement.querySelector(
        '[data-testid="retry-btn"]'
      );
      expect(retryBtn).toBeTruthy();
      expect(retryBtn.textContent).toContain('Try Again');
    }));

    it('should show loading overlay with AI-themed text during generation', fakeAsync(() => {
      initComponent();
      component.onGenerate(mockParams);
      fixture.detectChanges();

      const overlay = fixture.nativeElement.querySelector(
        '[data-testid="loading-overlay"]'
      );
      expect(overlay).toBeTruthy();
      expect(overlay.textContent).toContain('Thinking...');
      expect(overlay.textContent).toContain('Preparing your questions');

      const req = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      req.flush([mockQuestion]);
      tick();
    }));

    it('should store generationParams when generate is called', fakeAsync(() => {
      initComponent();
      component.onGenerate(mockParams);

      expect(component.generationParams()).toEqual(mockParams);

      const req = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      req.flush([mockQuestion]);
      tick();
    }));
  });

  // ────────────────────────────────────────────────────
  // API Response Mapping (MathQuestion → GeneratedQuestion)
  // ────────────────────────────────────────────────────
  describe('API Response Mapping', () => {
    const mockParams: GenerationParams = {
      grade: 3,
      topic: 'ADDITION',
      difficulty: 'easy',
      count: 2,
      country: 'NZ',
    };

    /** Raw API response shape — what the backend actually returns */
    const rawApiResponse = [
      {
        question: '9 + 7 = ?',
        answer: 16,
        operation: 'addition',
        difficulty: 'grade_3',
        stepByStepSolution: ['Add 9 and 7 together to get 16.'],
        createdAt: '2026-02-14T07:47:50.205Z',
      },
      {
        question: '3 + 8 = ?',
        answer: 11,
        operation: 'addition',
        difficulty: 'grade_3',
        stepByStepSolution: ['Add 3 and 8 together to get 11.'],
        createdAt: '2026-02-14T07:48:00.210Z',
      },
    ];

    function initComponent(): void {
      fixture.detectChanges();
      const healthReq = httpMock.expectOne('/api/math-questions/health');
      healthReq.flush({ status: 'ok' });
    }

    it('should map raw API response into GeneratedQuestion format with metadata', fakeAsync(() => {
      initComponent();
      component.onGenerate(mockParams);

      const req = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      req.flush(rawApiResponse);
      tick();

      const q = component.questions()[0];
      expect(q.question).toBe('9 + 7 = ?');
      expect(q.answer).toBe(16);
      expect(q.metadata).toBeDefined();
      expect(q.metadata.grade).toBe(3);
      expect(q.metadata.topic).toBe('ADDITION');
      expect(q.metadata.difficulty).toBe('easy');
      expect(q.metadata.country).toBe('NZ');
    }));

    it('should map stepByStepSolution to explanation', fakeAsync(() => {
      initComponent();
      component.onGenerate(mockParams);

      const req = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      req.flush(rawApiResponse);
      tick();

      expect(component.questions()[0].explanation).toBe(
        'Add 9 and 7 together to get 16.'
      );
    }));

    it('should handle missing stepByStepSolution with fallback explanation', fakeAsync(() => {
      initComponent();
      component.onGenerate(mockParams);

      const noStepsResponse = [
        {
          question: '2 + 2 = ?',
          answer: 4,
          operation: 'addition',
          difficulty: 'grade_3',
          createdAt: '2026-02-14T07:47:50.205Z',
        },
      ];

      const req = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      req.flush(noStepsResponse);
      tick();

      expect(component.questions()[0].explanation).toBeTruthy();
    }));

    it('should transition to questions phase with mapped questions', fakeAsync(() => {
      initComponent();
      component.onGenerate(mockParams);

      const req = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      req.flush(rawApiResponse);
      tick();

      expect(component.phase()).toBe('questions');
      expect(component.questions()).toHaveLength(2);
    }));

    it('should generate 4 multiple-choice options by default (answerType=multiple-choice)', fakeAsync(() => {
      initComponent();
      component.onGenerate(mockParams);

      const req = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      req.flush(rawApiResponse);
      tick();

      const options = component.currentOptions();
      expect(options).toHaveLength(4);
      expect(options).toContain('16'); // correct answer for Q1
    }));

    it('should not generate options when answerType is open-ended', fakeAsync(() => {
      initComponent();
      const openEndedParams: GenerationParams = {
        ...mockParams,
        answerType: 'open-ended',
      };
      component.onGenerate(openEndedParams);

      const req = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      req.flush(rawApiResponse);
      tick();

      expect(component.currentOptions()).toHaveLength(0);
    }));

    it('should regenerate options per question on navigation', fakeAsync(() => {
      initComponent();
      component.onGenerate(mockParams);

      const req = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      req.flush(rawApiResponse);
      tick();

      const q1Options = component.currentOptions();
      expect(q1Options).toContain('16'); // Q1 answer

      component.goToNext();
      const q2Options = component.currentOptions();
      expect(q2Options).toContain('11'); // Q2 answer
    }));
  });

  // ────────────────────────────────────────────────────
  // Phase 2: Navigation State & Computed Properties
  // ────────────────────────────────────────────────────
  describe('Navigation State (AC#1, AC#6, AC#7)', () => {
    const mockQuestions: GeneratedQuestion[] = [
      {
        question: 'What is 5 + 3?',
        answer: 8,
        explanation: 'Add 5 and 3 to get 8.',
        metadata: {
          grade: 3,
          topic: 'ADDITION',
          difficulty: 'easy',
          country: 'NZ',
          generated_by: 'ollama',
          generation_time: 400,
        },
      },
      {
        question: 'What is 7 - 2?',
        answer: 5,
        explanation: 'Subtract 2 from 7.',
        metadata: {
          grade: 3,
          topic: 'SUBTRACTION',
          difficulty: 'easy',
          country: 'NZ',
          generated_by: 'ollama',
          generation_time: 350,
        },
      },
      {
        question: 'What is 4 × 3?',
        answer: 12,
        explanation: 'Multiply 4 by 3.',
        metadata: {
          grade: 3,
          topic: 'MULTIPLICATION',
          difficulty: 'medium',
          country: 'NZ',
          generated_by: 'ollama',
          generation_time: 500,
        },
      },
    ];

    const mockParams: GenerationParams = {
      grade: 3,
      topic: 'ADDITION',
      difficulty: 'easy',
      count: 3,
      country: 'NZ',
    };

    function initWithQuestions(): void {
      fixture.detectChanges();
      const healthReq = httpMock.expectOne('/api/math-questions/health');
      healthReq.flush({ status: 'ok' });

      component.onGenerate(mockParams);
      const genReq = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      genReq.flush(mockQuestions);
    }

    it('should initialise currentIndex to 0 after generation', fakeAsync(() => {
      initWithQuestions();
      tick();
      expect(component.currentIndex()).toBe(0);
    }));

    it('should compute currentQuestion from questions and currentIndex', fakeAsync(() => {
      initWithQuestions();
      tick();
      expect(component.currentQuestion()).toEqual(mockQuestions[0]);
    }));

    it('should compute progressPercent based on currentIndex', fakeAsync(() => {
      initWithQuestions();
      tick();
      // Question 1 of 3 → ((0+1)/3)*100 ≈ 33.33%
      expect(component.progressPercent()).toBeCloseTo(33.33, 0);
    }));

    it('should navigate to next question with goToNext()', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.goToNext();
      expect(component.currentIndex()).toBe(1);
      expect(component.currentQuestion()).toEqual(mockQuestions[1]);
    }));

    it('should navigate to previous question with goToPrevious()', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.goToNext(); // go to index 1
      component.goToPrevious(); // back to index 0
      expect(component.currentIndex()).toBe(0);
    }));

    it('should not go below index 0 on goToPrevious()', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.goToPrevious(); // already at 0
      expect(component.currentIndex()).toBe(0);
    }));

    it('should not go above last index on goToNext()', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.goToNext(); // 1
      component.goToNext(); // 2 (last)
      component.goToNext(); // should stay at 2
      expect(component.currentIndex()).toBe(2);
    }));

    it('should update progressPercent when navigating', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.goToNext(); // index 1 → Question 2 of 3
      // ((1+1)/3)*100 ≈ 66.67
      expect(component.progressPercent()).toBeCloseTo(66.67, 0);
    }));

    it('should reach 100% on the last question', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.goToNext(); // index 1
      component.goToNext(); // index 2 (last)
      // ((2+1)/3)*100 = 100%
      expect(component.progressPercent()).toBe(100);
    }));

    it('should initialise answers as empty Map', fakeAsync(() => {
      initWithQuestions();
      tick();
      expect(component.answers().size).toBe(0);
    }));

    it('should compute totalAnswered from answers map size', fakeAsync(() => {
      initWithQuestions();
      tick();
      expect(component.totalAnswered()).toBe(0);
    }));
  });

  // ────────────────────────────────────────────────────
  // AC#8: Answer Persistence Across Navigation
  // ────────────────────────────────────────────────────
  describe('Answer Persistence (AC#8)', () => {
    const mockQuestions: GeneratedQuestion[] = [
      {
        question: 'Q1',
        answer: 8,
        explanation: 'E1',
        metadata: {
          grade: 3,
          topic: 'ADD',
          difficulty: 'easy',
          country: 'NZ',
          generated_by: 'ollama',
          generation_time: 400,
        },
      },
      {
        question: 'Q2',
        answer: 5,
        explanation: 'E2',
        metadata: {
          grade: 3,
          topic: 'SUB',
          difficulty: 'easy',
          country: 'NZ',
          generated_by: 'ollama',
          generation_time: 350,
        },
      },
    ];

    const mockParams: GenerationParams = {
      grade: 3,
      topic: 'ADDITION',
      difficulty: 'easy',
      count: 2,
      country: 'NZ',
    };

    function initWithQuestions(): void {
      fixture.detectChanges();
      const healthReq = httpMock.expectOne('/api/math-questions/health');
      healthReq.flush({ status: 'ok' });

      component.onGenerate(mockParams);
      const genReq = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      genReq.flush(mockQuestions);
    }

    it('should store selected option via onOptionSelected()', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onOptionSelected('B');
      expect(component.answers().get(0)?.selectedOption).toBe('B');
    }));

    it('should store notes via onNotesChanged()', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onNotesChanged('My working');
      expect(component.answers().get(0)?.additionalNotes).toBe('My working');
    }));

    it('should preserve answer when navigating away and back', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onOptionSelected('C');
      component.onNotesChanged('Note for Q1');
      component.goToNext(); // go to Q2
      component.goToPrevious(); // back to Q1
      const answer = component.answers().get(0);
      expect(answer?.selectedOption).toBe('C');
      expect(answer?.additionalNotes).toBe('Note for Q1');
    }));

    it('should get current answer for the active question', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onOptionSelected('A');
      expect(component.currentAnswer()?.selectedOption).toBe('A');
    }));

    it('should return undefined for unanswered questions', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.goToNext();
      expect(component.currentAnswer()).toBeUndefined();
    }));

    it('should increment totalAnswered when answer is stored', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onOptionSelected('A');
      expect(component.totalAnswered()).toBe(1);
    }));

    it('should store hintUsed via onHintToggled()', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onHintToggled(true);
      expect(component.answers().get(0)?.hintUsed).toBe(true);
    }));

    it('should preserve hintUsed state on navigation', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onHintToggled(true);
      component.goToNext();
      component.goToPrevious();
      expect(component.answers().get(0)?.hintUsed).toBe(true);
    }));
  });

  // ────────────────────────────────────────────────────
  // AC#9: Per-Question Time Tracking
  // ────────────────────────────────────────────────────
  describe('Per-Question Time Tracking (AC#9)', () => {
    const mockQuestions: GeneratedQuestion[] = [
      {
        question: 'Q1',
        answer: 8,
        explanation: 'E1',
        metadata: {
          grade: 3,
          topic: 'ADD',
          difficulty: 'easy',
          country: 'NZ',
          generated_by: 'ollama',
          generation_time: 400,
        },
      },
      {
        question: 'Q2',
        answer: 5,
        explanation: 'E2',
        metadata: {
          grade: 3,
          topic: 'SUB',
          difficulty: 'easy',
          country: 'NZ',
          generated_by: 'ollama',
          generation_time: 350,
        },
      },
    ];

    const mockParams: GenerationParams = {
      grade: 3,
      topic: 'ADDITION',
      difficulty: 'easy',
      count: 2,
      country: 'NZ',
    };

    function initWithQuestions(): void {
      fixture.detectChanges();
      const healthReq = httpMock.expectOne('/api/math-questions/health');
      healthReq.flush({ status: 'ok' });

      component.onGenerate(mockParams);
      const genReq = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      genReq.flush(mockQuestions);
    }

    it('should start tracking time when entering questions phase', fakeAsync(() => {
      initWithQuestions();
      tick();
      expect(component.questionStartTime()).toBeGreaterThan(0);
    }));

    it('should record time spent on navigation away', fakeAsync(() => {
      initWithQuestions();
      tick();
      // Simulate 5 seconds on Q1
      tick(5000);
      component.goToNext();
      const answer = component.answers().get(0);
      expect(answer).toBeTruthy();
      expect(answer!.timeSpent).toBeGreaterThan(0);
    }));

    it('should accumulate time across multiple visits', fakeAsync(() => {
      initWithQuestions();
      tick();
      // First visit: 3 seconds on Q1
      tick(3000);
      component.goToNext();
      const firstVisitTime = component.answers().get(0)!.timeSpent;

      // Second visit: go back for 2 more seconds
      tick(2000);
      component.goToPrevious();
      tick(2000);
      component.goToNext();
      const secondVisitTime = component.answers().get(0)!.timeSpent;

      expect(secondVisitTime).toBeGreaterThan(firstVisitTime);
    }));
  });

  // ────────────────────────────────────────────────────
  // AC#1, AC#2: Submit State & Computed Properties
  // ────────────────────────────────────────────────────
  describe('Submit State (AC#1, AC#2, AC#7, AC#8)', () => {
    const mockQuestions: GeneratedQuestion[] = [
      {
        question: 'Q1',
        answer: 8,
        explanation: 'E1',
        metadata: {
          grade: 3,
          topic: 'ADD',
          difficulty: 'easy',
          country: 'NZ',
          generated_by: 'ollama',
          generation_time: 400,
        },
      },
      {
        question: 'Q2',
        answer: 5,
        explanation: 'E2',
        metadata: {
          grade: 3,
          topic: 'SUB',
          difficulty: 'easy',
          country: 'NZ',
          generated_by: 'ollama',
          generation_time: 350,
        },
      },
      {
        question: 'Q3',
        answer: 12,
        explanation: 'E3',
        metadata: {
          grade: 3,
          topic: 'MUL',
          difficulty: 'medium',
          country: 'NZ',
          generated_by: 'ollama',
          generation_time: 500,
        },
      },
    ];

    const mockParams: GenerationParams = {
      grade: 3,
      topic: 'ADDITION',
      difficulty: 'easy',
      count: 3,
      country: 'NZ',
    };

    function initWithQuestions(): void {
      fixture.detectChanges();
      const healthReq = httpMock.expectOne('/api/math-questions/health');
      healthReq.flush({ status: 'ok' });

      component.onGenerate(mockParams);
      const genReq = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      genReq.flush(mockQuestions);
    }

    it('should initialise isSubmitting to false', fakeAsync(() => {
      initWithQuestions();
      tick();
      expect(component.isSubmitting()).toBe(false);
    }));

    it('should initialise scoringResult to null', fakeAsync(() => {
      initWithQuestions();
      tick();
      expect(component.scoringResult()).toBeNull();
    }));

    it('should compute canSubmit as false when no answers', fakeAsync(() => {
      initWithQuestions();
      tick();
      expect(component.canSubmit()).toBe(false);
    }));

    it('should compute canSubmit as true when at least 1 answer exists', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onOptionSelected('8');
      expect(component.canSubmit()).toBe(true);
    }));

    it('should compute allAnswered as false when not all questions answered', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onOptionSelected('8');
      expect(component.allAnswered()).toBe(false);
    }));

    it('should compute allAnswered as true when all questions answered', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onOptionSelected('8'); // Q1
      component.goToNext();
      component.onOptionSelected('5'); // Q2
      component.goToNext();
      component.onOptionSelected('12'); // Q3
      expect(component.allAnswered()).toBe(true);
    }));
  });

  // ────────────────────────────────────────────────────
  // AC#1, AC#2: Submit Button (Template)
  // ────────────────────────────────────────────────────
  describe('Submit Button (AC#1, AC#2)', () => {
    const mockQuestions: GeneratedQuestion[] = [
      {
        question: 'Q1',
        answer: 8,
        explanation: 'E1',
        metadata: {
          grade: 3,
          topic: 'ADD',
          difficulty: 'easy',
          country: 'NZ',
          generated_by: 'ollama',
          generation_time: 400,
        },
      },
      {
        question: 'Q2',
        answer: 5,
        explanation: 'E2',
        metadata: {
          grade: 3,
          topic: 'SUB',
          difficulty: 'easy',
          country: 'NZ',
          generated_by: 'ollama',
          generation_time: 350,
        },
      },
    ];

    const mockParams: GenerationParams = {
      grade: 3,
      topic: 'ADDITION',
      difficulty: 'easy',
      count: 2,
      country: 'NZ',
    };

    function initWithQuestions(): void {
      fixture.detectChanges();
      const healthReq = httpMock.expectOne('/api/math-questions/health');
      healthReq.flush({ status: 'ok' });

      component.onGenerate(mockParams);
      const genReq = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      genReq.flush(mockQuestions);
    }

    it('should not show submit button when no answers given', fakeAsync(() => {
      initWithQuestions();
      tick();
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector(
        '[data-testid="submit-btn"]'
      );
      expect(btn).toBeFalsy();
    }));

    it('should show submit button when at least 1 answer exists', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onOptionSelected('8');
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector(
        '[data-testid="submit-btn"]'
      );
      expect(btn).toBeTruthy();
    }));

    it('should show correct "X of N answered" label on submit button', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onOptionSelected('8');
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector(
        '[data-testid="submit-btn"]'
      );
      expect(btn.textContent).toContain('1 of 2 answered');
    }));

    it('should update label when more answers are given', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onOptionSelected('8'); // Q1
      component.goToNext();
      component.onOptionSelected('5'); // Q2
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector(
        '[data-testid="submit-btn"]'
      );
      expect(btn.textContent).toContain('2 of 2 answered');
    }));

    it('should disable submit button while isSubmitting is true', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onOptionSelected('8');
      component.isSubmitting.set(true);
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector(
        '[data-testid="submit-btn"]'
      );
      expect(btn.disabled).toBe(true);
    }));
  });

  // ────────────────────────────────────────────────────
  // AC#3, AC#4, AC#7, AC#8: Submit Flow Orchestration
  // ────────────────────────────────────────────────────
  describe('Submit Flow (AC#3, AC#4, AC#7, AC#8)', () => {
    const mockQuestions: GeneratedQuestion[] = [
      {
        question: 'Q1',
        answer: 8,
        explanation: 'E1',
        metadata: {
          grade: 3,
          topic: 'ADD',
          difficulty: 'easy',
          country: 'NZ',
          generated_by: 'ollama',
          generation_time: 400,
        },
      },
      {
        question: 'Q2',
        answer: 5,
        explanation: 'E2',
        metadata: {
          grade: 3,
          topic: 'SUB',
          difficulty: 'easy',
          country: 'NZ',
          generated_by: 'ollama',
          generation_time: 350,
        },
      },
    ];

    const mockParams: GenerationParams = {
      grade: 3,
      topic: 'ADDITION',
      difficulty: 'easy',
      count: 2,
      country: 'NZ',
    };

    function initWithQuestions(): void {
      fixture.detectChanges();
      const healthReq = httpMock.expectOne('/api/math-questions/health');
      healthReq.flush({ status: 'ok' });

      component.onGenerate(mockParams);
      const genReq = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      genReq.flush(mockQuestions);
    }

    it('should open confirmation modal on onSubmitClick()', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onOptionSelected('8');
      component.onSubmitClick();
      expect(component.showConfirmModal()).toBe(true);
    }));

    it('should close modal on onCancelSubmit()', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onOptionSelected('8');
      component.onSubmitClick();
      component.onCancelSubmit();
      expect(component.showConfirmModal()).toBe(false);
    }));

    it('should run scoring and transition to results on onConfirmSubmit()', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onOptionSelected('8'); // correct
      component.onConfirmSubmit();
      tick();

      expect(component.phase()).toBe('results');
      expect(component.scoringResult()).toBeTruthy();
      expect(component.scoringResult()!.correct).toBe(1);
      expect(component.scoringResult()!.skipped).toBe(1);
      expect(component.scoringResult()!.total).toBe(2);
    }));

    it('should set isSubmitting briefly during scoring', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onOptionSelected('8');
      component.onConfirmSubmit();
      // isSubmitting should have been set and then cleared
      tick();
      expect(component.isSubmitting()).toBe(false);
    }));

    it('should close confirmation modal after submit', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onOptionSelected('8');
      component.onSubmitClick();
      component.onConfirmSubmit();
      tick();
      expect(component.showConfirmModal()).toBe(false);
    }));

    it('should assemble lastSubmission with correct structure', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onOptionSelected('8');
      component.goToNext();
      component.onOptionSelected('3'); // incorrect
      component.onConfirmSubmit();
      tick();

      const submission = component.lastSubmission();
      expect(submission).toBeTruthy();
      expect(submission!.generationParams.grade).toBe(3);
      expect(submission!.generationParams.topic).toBe('ADDITION');
      expect(submission!.generationParams.difficulty).toBe('easy');
      expect(submission!.generationParams.country).toBe('NZ');
      expect(submission!.answers).toHaveLength(2);
      expect(submission!.submittedAt).toBeTruthy();
      expect(submission!.totalTimeSpent).toBeGreaterThanOrEqual(0);
    }));

    it('should render confirmation modal in template when showConfirmModal is true', fakeAsync(() => {
      initWithQuestions();
      tick();
      component.onOptionSelected('8');
      component.onSubmitClick();
      fixture.detectChanges();

      const modal = fixture.nativeElement.querySelector(
        'app-submit-summary'
      );
      expect(modal).toBeTruthy();
    }));
  });

  // ────────────────────────────────────────────────────
  // AC#6: Post-Results Actions (Container)
  // ────────────────────────────────────────────────────
  describe('Post-Results Actions (AC#6)', () => {
    const mockQuestions: GeneratedQuestion[] = [
      {
        question: 'Q1',
        answer: 8,
        explanation: 'E1',
        metadata: {
          grade: 3,
          topic: 'ADD',
          difficulty: 'easy',
          country: 'NZ',
          generated_by: 'ollama',
          generation_time: 400,
        },
      },
    ];

    const mockParams: GenerationParams = {
      grade: 3,
      topic: 'ADDITION',
      difficulty: 'easy',
      count: 1,
      country: 'NZ',
    };

    function initAndSubmit(): void {
      fixture.detectChanges();
      const healthReq = httpMock.expectOne('/api/math-questions/health');
      healthReq.flush({ status: 'ok' });

      component.onGenerate(mockParams);
      const genReq = httpMock.expectOne(
        (r) => r.url === '/api/math-questions/generate'
      );
      genReq.flush(mockQuestions);
      component.onOptionSelected('8');
      component.onConfirmSubmit();
    }

    it('should reset to controls phase on onTryAgain()', fakeAsync(() => {
      initAndSubmit();
      tick();
      component.onTryAgain();
      expect(component.phase()).toBe('controls');
    }));

    it('should keep generationParams pre-filled after onTryAgain()', fakeAsync(() => {
      initAndSubmit();
      tick();
      component.onTryAgain();
      expect(component.generationParams()).toEqual(mockParams);
    }));

    it('should clear questions and answers on onTryAgain()', fakeAsync(() => {
      initAndSubmit();
      tick();
      component.onTryAgain();
      expect(component.questions()).toHaveLength(0);
      expect(component.answers().size).toBe(0);
    }));

    it('should render results view in template when phase is results', fakeAsync(() => {
      initAndSubmit();
      tick();
      fixture.detectChanges();

      const summary = fixture.nativeElement.querySelector(
        'app-submit-summary'
      );
      expect(summary).toBeTruthy();
    }));
  });
});
