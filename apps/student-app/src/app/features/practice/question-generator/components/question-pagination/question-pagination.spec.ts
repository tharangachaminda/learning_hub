import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuestionPaginationComponent } from './question-pagination';

/**
 * Unit tests for QuestionPaginationComponent.
 *
 * Validates AC-6: Paginated Navigation and AC-7: Progress Bar.
 * - Previous/Next buttons with boundary disabling
 * - "Q X/N" counter
 * - Progress bar with accurate width
 */
describe('QuestionPaginationComponent', () => {
  let component: QuestionPaginationComponent;
  let fixture: ComponentFixture<QuestionPaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionPaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionPaginationComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.componentRef.setInput('currentIndex', 0);
    fixture.componentRef.setInput('totalQuestions', 10);
    fixture.componentRef.setInput('progressPercent', 0);
    fixture.componentRef.setInput('totalAnswered', 0);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Previous Button (AC-6)', () => {
    it('should disable Previous button on first question', () => {
      fixture.componentRef.setInput('currentIndex', 0);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.componentRef.setInput('progressPercent', 0);
      fixture.componentRef.setInput('totalAnswered', 0);
      fixture.detectChanges();

      const prevBtn = fixture.nativeElement.querySelector(
        '[data-testid="prev-btn"]'
      ) as HTMLButtonElement;
      expect(prevBtn).toBeTruthy();
      expect(prevBtn.disabled).toBe(true);
    });

    it('should enable Previous button when not on first question', () => {
      fixture.componentRef.setInput('currentIndex', 2);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.componentRef.setInput('progressPercent', 20);
      fixture.componentRef.setInput('totalAnswered', 0);
      fixture.detectChanges();

      const prevBtn = fixture.nativeElement.querySelector(
        '[data-testid="prev-btn"]'
      ) as HTMLButtonElement;
      expect(prevBtn.disabled).toBe(false);
    });

    it('should emit previous event when Previous is clicked', () => {
      fixture.componentRef.setInput('currentIndex', 2);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.componentRef.setInput('progressPercent', 20);
      fixture.componentRef.setInput('totalAnswered', 0);
      fixture.detectChanges();

      const spy = jest.fn();
      component.previous.subscribe(spy);

      const prevBtn = fixture.nativeElement.querySelector(
        '[data-testid="prev-btn"]'
      ) as HTMLButtonElement;
      prevBtn.click();

      expect(spy).toHaveBeenCalled();
    });

    it('should display "← Previous" text', () => {
      fixture.componentRef.setInput('currentIndex', 1);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.componentRef.setInput('progressPercent', 10);
      fixture.componentRef.setInput('totalAnswered', 0);
      fixture.detectChanges();

      const prevBtn = fixture.nativeElement.querySelector(
        '[data-testid="prev-btn"]'
      );
      expect(prevBtn.textContent).toContain('Previous');
    });
  });

  describe('Next Button (AC-6)', () => {
    it('should disable Next button on last question', () => {
      fixture.componentRef.setInput('currentIndex', 9);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.componentRef.setInput('progressPercent', 90);
      fixture.componentRef.setInput('totalAnswered', 0);
      fixture.detectChanges();

      const nextBtn = fixture.nativeElement.querySelector(
        '[data-testid="next-btn"]'
      ) as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(true);
    });

    it('should enable Next button when not on last question', () => {
      fixture.componentRef.setInput('currentIndex', 0);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.componentRef.setInput('progressPercent', 0);
      fixture.componentRef.setInput('totalAnswered', 0);
      fixture.detectChanges();

      const nextBtn = fixture.nativeElement.querySelector(
        '[data-testid="next-btn"]'
      ) as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(false);
    });

    it('should emit next event when Next is clicked', () => {
      fixture.componentRef.setInput('currentIndex', 0);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.componentRef.setInput('progressPercent', 0);
      fixture.componentRef.setInput('totalAnswered', 0);
      fixture.detectChanges();

      const spy = jest.fn();
      component.next.subscribe(spy);

      const nextBtn = fixture.nativeElement.querySelector(
        '[data-testid="next-btn"]'
      ) as HTMLButtonElement;
      nextBtn.click();

      expect(spy).toHaveBeenCalled();
    });

    it('should display "Next →" text', () => {
      fixture.componentRef.setInput('currentIndex', 0);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.componentRef.setInput('progressPercent', 0);
      fixture.componentRef.setInput('totalAnswered', 0);
      fixture.detectChanges();

      const nextBtn = fixture.nativeElement.querySelector(
        '[data-testid="next-btn"]'
      );
      expect(nextBtn.textContent).toContain('Next');
    });
  });

  describe('Question Counter (AC-6)', () => {
    it('should display "Q X/N" counter', () => {
      fixture.componentRef.setInput('currentIndex', 4);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.componentRef.setInput('progressPercent', 40);
      fixture.componentRef.setInput('totalAnswered', 0);
      fixture.detectChanges();

      const counter = fixture.nativeElement.querySelector(
        '[data-testid="page-counter"]'
      );
      expect(counter).toBeTruthy();
      expect(counter.textContent).toContain('Q 5/10');
    });
  });

  describe('Progress Bar (AC-7)', () => {
    it('should render progress bar element', () => {
      fixture.componentRef.setInput('currentIndex', 0);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.componentRef.setInput('progressPercent', 0);
      fixture.componentRef.setInput('totalAnswered', 0);
      fixture.detectChanges();

      const progressBar = fixture.nativeElement.querySelector(
        '[data-testid="progress-bar"]'
      );
      expect(progressBar).toBeTruthy();
    });

    it('should set progress bar width based on progressPercent', () => {
      fixture.componentRef.setInput('currentIndex', 4);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.componentRef.setInput('progressPercent', 40);
      fixture.componentRef.setInput('totalAnswered', 0);
      fixture.detectChanges();

      const progressFill = fixture.nativeElement.querySelector(
        '[data-testid="progress-fill"]'
      ) as HTMLElement;
      expect(progressFill.style.width).toBe('40%');
    });

    it('should have ARIA attributes on progress bar', () => {
      fixture.componentRef.setInput('currentIndex', 2);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.componentRef.setInput('progressPercent', 20);
      fixture.componentRef.setInput('totalAnswered', 0);
      fixture.detectChanges();

      const progressBar = fixture.nativeElement.querySelector(
        '[data-testid="progress-bar"]'
      );
      expect(progressBar.getAttribute('role')).toBe('progressbar');
      expect(progressBar.getAttribute('aria-valuenow')).toBe('20');
    });
  });
});
