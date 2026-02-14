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
});
