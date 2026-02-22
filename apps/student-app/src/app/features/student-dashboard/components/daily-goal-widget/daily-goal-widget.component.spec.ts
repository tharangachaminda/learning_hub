/**
 * Daily Goal Widget Component - Unit Tests
 *
 * Test Strategy: Validate daily goal display and streak counter.
 * - AC3: Progress bar for daily practice minutes
 * - AC4: Streak counter with flame emoji
 * - AC15: Touch targets min 60px
 * - AC25: ARIA labels for accessibility
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DailyGoalWidgetComponent } from './daily-goal-widget.component';
import { DailyGoal, Streak } from '../../../../models/dashboard.model';

describe('DailyGoalWidgetComponent', () => {
  let component: DailyGoalWidgetComponent;
  let fixture: ComponentFixture<DailyGoalWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyGoalWidgetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DailyGoalWidgetComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('daily goal progress (AC3)', () => {
    /**
     * Test: Progress bar reflects completed vs target minutes
     * Why Essential: AC3 requires visual progress bar for daily minutes
     * Impact: Student must see how close they are to daily goal
     */
    it('should display completed minutes and target minutes', () => {
      component.dailyGoal = {
        targetMinutes: 30,
        completedMinutes: 18,
        percentage: 60,
      };
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const content = compiled.textContent ?? '';
      expect(content).toContain('18');
      expect(content).toContain('30');
    });

    it('should render a progress bar with correct percentage', () => {
      component.dailyGoal = {
        targetMinutes: 30,
        completedMinutes: 18,
        percentage: 60,
      };
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const progressBar = compiled.querySelector('[role="progressbar"]');
      expect(progressBar).toBeTruthy();
      expect(progressBar?.getAttribute('aria-valuenow')).toBe('60');
      expect(progressBar?.getAttribute('aria-valuemin')).toBe('0');
      expect(progressBar?.getAttribute('aria-valuemax')).toBe('100');
    });

    it('should handle 100% completion', () => {
      component.dailyGoal = {
        targetMinutes: 30,
        completedMinutes: 30,
        percentage: 100,
      };
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const content = compiled.textContent ?? '';
      expect(content).toContain('30');

      const progressBar = compiled.querySelector('[role="progressbar"]');
      expect(progressBar?.getAttribute('aria-valuenow')).toBe('100');
    });
  });

  describe('streak counter (AC4)', () => {
    /**
     * Test: Streak counter displays with flame emoji
     * Why Essential: AC4 requires flame emoji with consecutive days count
     * Impact: Motivating visual feedback for practice consistency
     */
    it('should display current streak with flame emoji', () => {
      component.streak = { current: 5, longest: 12 };
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const streakEl = compiled.querySelector('[data-testid="streak-counter"]');
      expect(streakEl).toBeTruthy();
      expect(streakEl?.textContent).toContain('🔥');
      expect(streakEl?.textContent).toContain('5');
    });

    it('should display longest streak', () => {
      component.streak = { current: 5, longest: 12 };
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const content = compiled.textContent ?? '';
      expect(content).toContain('12');
    });

    it('should handle zero streak gracefully', () => {
      component.streak = { current: 0, longest: 0 };
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const streakEl = compiled.querySelector('[data-testid="streak-counter"]');
      expect(streakEl).toBeTruthy();
      expect(streakEl?.textContent).toContain('0');
    });
  });

  describe('accessibility (AC25)', () => {
    /**
     * Test: Widget has proper ARIA labels
     * Why Essential: AC25 requires screen reader compatibility
     */
    it('should have an accessible label on the widget container', () => {
      component.dailyGoal = {
        targetMinutes: 30,
        completedMinutes: 18,
        percentage: 60,
      };
      component.streak = { current: 5, longest: 12 };
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const widget = compiled.querySelector('[aria-label]');
      expect(widget).toBeTruthy();
    });
  });
});
