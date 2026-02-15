/**
 * Test Suite: SubmitSummaryComponent
 *
 * Validates the confirmation modal and results display presentation
 * component for the AI Question Generator submit flow.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubmitSummaryComponent } from './submit-summary';

describe('SubmitSummaryComponent', () => {
  let component: SubmitSummaryComponent;
  let fixture: ComponentFixture<SubmitSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmitSummaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmitSummaryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ────────────────────────────────────────────────────
  // Confirmation Modal Mode
  // ────────────────────────────────────────────────────
  describe('Confirmation Modal', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('mode', 'confirm');
      fixture.componentRef.setInput('totalAnswered', 7);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.detectChanges();
    });

    it('should display confirmation message with answered count', () => {
      const text = fixture.nativeElement.querySelector(
        '[data-testid="confirm-message"]'
      );
      expect(text).toBeTruthy();
      expect(text.textContent).toContain('7 out of 10');
    });

    it('should mention unanswered will be skipped', () => {
      const text = fixture.nativeElement.querySelector(
        '[data-testid="confirm-message"]'
      );
      expect(text.textContent).toContain('skipped');
    });

    it('should show Cancel button', () => {
      const btn = fixture.nativeElement.querySelector(
        '[data-testid="cancel-btn"]'
      );
      expect(btn).toBeTruthy();
      expect(btn.textContent).toContain('Cancel');
    });

    it('should show Submit button', () => {
      const btn = fixture.nativeElement.querySelector(
        '[data-testid="confirm-submit-btn"]'
      );
      expect(btn).toBeTruthy();
      expect(btn.textContent).toContain('Submit');
    });

    it('should emit cancel event when Cancel is clicked', () => {
      const cancelSpy = jest.fn();
      component.cancel.subscribe(cancelSpy);

      const btn = fixture.nativeElement.querySelector(
        '[data-testid="cancel-btn"]'
      );
      btn.click();

      expect(cancelSpy).toHaveBeenCalled();
    });

    it('should emit confirmSubmit event when Submit is clicked', () => {
      const submitSpy = jest.fn();
      component.confirmSubmit.subscribe(submitSpy);

      const btn = fixture.nativeElement.querySelector(
        '[data-testid="confirm-submit-btn"]'
      );
      btn.click();

      expect(submitSpy).toHaveBeenCalled();
    });

    it('should close on Escape key', () => {
      const cancelSpy = jest.fn();
      component.cancel.subscribe(cancelSpy);

      const overlay = fixture.nativeElement.querySelector(
        '[data-testid="modal-overlay"]'
      );
      overlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(cancelSpy).toHaveBeenCalled();
    });

    it('should show modal overlay backdrop', () => {
      const overlay = fixture.nativeElement.querySelector(
        '[data-testid="modal-overlay"]'
      );
      expect(overlay).toBeTruthy();
    });
  });

  // ────────────────────────────────────────────────────
  // Results Display Mode (AC#5)
  // ────────────────────────────────────────────────────
  describe('Results Display', () => {
    it('should show correct count with green styling', () => {
      fixture.componentRef.setInput('mode', 'results');
      fixture.componentRef.setInput('scoringResult', {
        correct: 8,
        incorrect: 1,
        skipped: 1,
        total: 10,
        percentage: 80,
        timeSpent: '02:30',
      });
      fixture.detectChanges();

      const correct = fixture.nativeElement.querySelector(
        '[data-testid="result-correct"]'
      );
      expect(correct).toBeTruthy();
      expect(correct.textContent).toContain('8');
    });

    it('should show incorrect count', () => {
      fixture.componentRef.setInput('mode', 'results');
      fixture.componentRef.setInput('scoringResult', {
        correct: 6,
        incorrect: 3,
        skipped: 1,
        total: 10,
        percentage: 60,
        timeSpent: '03:00',
      });
      fixture.detectChanges();

      const incorrect = fixture.nativeElement.querySelector(
        '[data-testid="result-incorrect"]'
      );
      expect(incorrect).toBeTruthy();
      expect(incorrect.textContent).toContain('3');
    });

    it('should show skipped count', () => {
      fixture.componentRef.setInput('mode', 'results');
      fixture.componentRef.setInput('scoringResult', {
        correct: 5,
        incorrect: 3,
        skipped: 2,
        total: 10,
        percentage: 50,
        timeSpent: '04:00',
      });
      fixture.detectChanges();

      const skipped = fixture.nativeElement.querySelector(
        '[data-testid="result-skipped"]'
      );
      expect(skipped).toBeTruthy();
      expect(skipped.textContent).toContain('2');
    });

    it('should show formatted time', () => {
      fixture.componentRef.setInput('mode', 'results');
      fixture.componentRef.setInput('scoringResult', {
        correct: 5,
        incorrect: 3,
        skipped: 2,
        total: 10,
        percentage: 50,
        timeSpent: '04:15',
      });
      fixture.detectChanges();

      const time = fixture.nativeElement.querySelector(
        '[data-testid="result-time"]'
      );
      expect(time).toBeTruthy();
      expect(time.textContent).toContain('04:15');
    });

    it('should show percentage', () => {
      fixture.componentRef.setInput('mode', 'results');
      fixture.componentRef.setInput('scoringResult', {
        correct: 7,
        incorrect: 2,
        skipped: 1,
        total: 10,
        percentage: 70,
        timeSpent: '03:00',
      });
      fixture.detectChanges();

      const percentage = fixture.nativeElement.querySelector(
        '[data-testid="result-percentage"]'
      );
      expect(percentage).toBeTruthy();
      expect(percentage.textContent).toContain('70');
    });

    it('should show superstar message for score ≥ 80%', () => {
      fixture.componentRef.setInput('mode', 'results');
      fixture.componentRef.setInput('scoringResult', {
        correct: 9,
        incorrect: 1,
        skipped: 0,
        total: 10,
        percentage: 90,
        timeSpent: '02:00',
      });
      fixture.detectChanges();

      const message = fixture.nativeElement.querySelector(
        '[data-testid="encouraging-text"]'
      );
      expect(message.textContent).toContain('maths superstar');
    });

    it('should show great effort message for score 50-79%', () => {
      fixture.componentRef.setInput('mode', 'results');
      fixture.componentRef.setInput('scoringResult', {
        correct: 6,
        incorrect: 3,
        skipped: 1,
        total: 10,
        percentage: 60,
        timeSpent: '03:00',
      });
      fixture.detectChanges();

      const message = fixture.nativeElement.querySelector(
        '[data-testid="encouraging-text"]'
      );
      expect(message.textContent).toContain('Keep practising');
    });

    it('should show good try message for score < 50%', () => {
      fixture.componentRef.setInput('mode', 'results');
      fixture.componentRef.setInput('scoringResult', {
        correct: 3,
        incorrect: 5,
        skipped: 2,
        total: 10,
        percentage: 30,
        timeSpent: '04:00',
      });
      fixture.detectChanges();

      const message = fixture.nativeElement.querySelector(
        '[data-testid="encouraging-text"]'
      );
      expect(message.textContent).toContain('practise some more');
    });

    it('should apply celebratory animation class for score ≥ 80%', () => {
      fixture.componentRef.setInput('mode', 'results');
      fixture.componentRef.setInput('scoringResult', {
        correct: 8,
        incorrect: 2,
        skipped: 0,
        total: 10,
        percentage: 80,
        timeSpent: '02:00',
      });
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector(
        '[data-testid="results-card"]'
      );
      expect(card.classList.contains('celebrate')).toBe(true);
    });

    it('should not apply celebratory animation for score < 80%', () => {
      fixture.componentRef.setInput('mode', 'results');
      fixture.componentRef.setInput('scoringResult', {
        correct: 7,
        incorrect: 2,
        skipped: 1,
        total: 10,
        percentage: 70,
        timeSpent: '02:00',
      });
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector(
        '[data-testid="results-card"]'
      );
      expect(card.classList.contains('celebrate')).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────
  // Post-Results Actions (AC#6)
  // ────────────────────────────────────────────────────
  describe('Post-Results Actions', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('mode', 'results');
      fixture.componentRef.setInput('scoringResult', {
        correct: 5,
        incorrect: 3,
        skipped: 2,
        total: 10,
        percentage: 50,
        timeSpent: '03:00',
      });
      fixture.detectChanges();
    });

    it('should show Try Again button', () => {
      const btn = fixture.nativeElement.querySelector(
        '[data-testid="try-again-btn"]'
      );
      expect(btn).toBeTruthy();
      expect(btn.textContent).toContain('Try Again');
    });

    it('should show Back to Dashboard button', () => {
      const btn = fixture.nativeElement.querySelector(
        '[data-testid="back-dashboard-btn"]'
      );
      expect(btn).toBeTruthy();
      expect(btn.textContent).toContain('Back to Dashboard');
    });

    it('should emit tryAgain event when Try Again is clicked', () => {
      const tryAgainSpy = jest.fn();
      component.tryAgain.subscribe(tryAgainSpy);

      const btn = fixture.nativeElement.querySelector(
        '[data-testid="try-again-btn"]'
      );
      btn.click();

      expect(tryAgainSpy).toHaveBeenCalled();
    });

    it('should emit backToDashboard event when Back to Dashboard is clicked', () => {
      const dashSpy = jest.fn();
      component.backToDashboard.subscribe(dashSpy);

      const btn = fixture.nativeElement.querySelector(
        '[data-testid="back-dashboard-btn"]'
      );
      btn.click();

      expect(dashSpy).toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────
  // Accessibility (AC#10)
  // ────────────────────────────────────────────────────
  describe('Accessibility', () => {
    it('should have role="dialog" and aria-modal on confirmation overlay', () => {
      fixture.componentRef.setInput('mode', 'confirm');
      fixture.componentRef.setInput('totalAnswered', 5);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.detectChanges();

      const overlay = fixture.nativeElement.querySelector('[data-testid="modal-overlay"]');
      expect(overlay.getAttribute('role')).toBe('dialog');
      expect(overlay.getAttribute('aria-modal')).toBe('true');
    });

    it('should have aria-describedby on confirmation overlay linking to message', () => {
      fixture.componentRef.setInput('mode', 'confirm');
      fixture.componentRef.setInput('totalAnswered', 5);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.detectChanges();

      const overlay = fixture.nativeElement.querySelector('[data-testid="modal-overlay"]');
      expect(overlay.getAttribute('aria-describedby')).toBe('confirm-desc');

      const desc = fixture.nativeElement.querySelector('#confirm-desc');
      expect(desc).toBeTruthy();
    });

    it('should have aria-labelledby on results card linking to heading', () => {
      fixture.componentRef.setInput('mode', 'results');
      fixture.componentRef.setInput('scoringResult', {
        correct: 8, incorrect: 1, skipped: 1, total: 10,
        percentage: 80, timeSpent: '02:30',
      });
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('[data-testid="results-card"]');
      expect(card.getAttribute('aria-labelledby')).toBe('results-heading');

      const heading = fixture.nativeElement.querySelector('#results-heading');
      expect(heading).toBeTruthy();
    });

    it('should have aria-live="polite" on results card for screen reader announcements', () => {
      fixture.componentRef.setInput('mode', 'results');
      fixture.componentRef.setInput('scoringResult', {
        correct: 5, incorrect: 3, skipped: 2, total: 10,
        percentage: 50, timeSpent: '03:00',
      });
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('[data-testid="results-card"]');
      expect(card.getAttribute('aria-live')).toBe('polite');
    });

    it('should mark emoji icons as aria-hidden in results breakdown', () => {
      fixture.componentRef.setInput('mode', 'results');
      fixture.componentRef.setInput('scoringResult', {
        correct: 5, incorrect: 3, skipped: 2, total: 10,
        percentage: 50, timeSpent: '03:00',
      });
      fixture.detectChanges();

      const icons = fixture.nativeElement.querySelectorAll('.result-icon');
      icons.forEach((icon: HTMLElement) => {
        expect(icon.getAttribute('aria-hidden')).toBe('true');
      });
    });

    it('should have group role with aria-label on each result breakdown item', () => {
      fixture.componentRef.setInput('mode', 'results');
      fixture.componentRef.setInput('scoringResult', {
        correct: 5, incorrect: 3, skipped: 2, total: 10,
        percentage: 50, timeSpent: '03:00',
      });
      fixture.detectChanges();

      const correct = fixture.nativeElement.querySelector('[data-testid="result-correct"]');
      expect(correct.getAttribute('role')).toBe('group');
      expect(correct.getAttribute('aria-label')).toContain('Correct: 5');

      const incorrect = fixture.nativeElement.querySelector('[data-testid="result-incorrect"]');
      expect(incorrect.getAttribute('aria-label')).toContain('Incorrect: 3');
    });
  });
});
