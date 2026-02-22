/**
 * AI Recommendations Component - Unit Tests
 *
 * Test Strategy: Validate recommendation display and quick practice action.
 * - AC5: Show 2-3 personalized topic suggestions
 * - AC7: Quick practice button with AI-recommended topic
 * - AC22: Recommendations based on latest session data
 * - AC25: ARIA labels for accessibility
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AiRecommendationsComponent } from './ai-recommendations.component';
import { TopicRecommendation } from '../../../../models/dashboard.model';

describe('AiRecommendationsComponent', () => {
  let component: AiRecommendationsComponent;
  let fixture: ComponentFixture<AiRecommendationsComponent>;

  const mockRecommendations: TopicRecommendation[] = [
    {
      id: 'rec-1',
      topic: 'Fractions',
      subject: 'math',
      reason: 'You struggled with fractions last session',
      difficulty: 'medium',
      estimatedMinutes: 10,
    },
    {
      id: 'rec-2',
      topic: 'Multiplication',
      subject: 'math',
      reason: 'Ready to advance',
      difficulty: 'hard',
      estimatedMinutes: 15,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiRecommendationsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AiRecommendationsComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('recommendation display (AC5)', () => {
    /**
     * Test: Renders topic cards for each recommendation
     * Why Essential: AC5 requires 2-3 personalized topic suggestions
     * Impact: Students won't see what to practice next
     */
    it('should display recommendation topic names', () => {
      component.recommendations = mockRecommendations;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const content = compiled.textContent ?? '';
      expect(content).toContain('Fractions');
      expect(content).toContain('Multiplication');
    });

    it('should display reason for each recommendation', () => {
      component.recommendations = mockRecommendations;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const content = compiled.textContent ?? '';
      expect(content).toContain('struggled with fractions');
    });

    it('should display estimated time for each recommendation', () => {
      component.recommendations = mockRecommendations;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const content = compiled.textContent ?? '';
      expect(content).toContain('10');
      expect(content).toContain('15');
    });

    it('should render a card for each recommendation', () => {
      component.recommendations = mockRecommendations;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const cards = compiled.querySelectorAll(
        '[data-testid="recommendation-card"]'
      );
      expect(cards.length).toBe(2);
    });
  });

  describe('quick practice button (AC7)', () => {
    /**
     * Test: Each card has a practice button that emits the topic
     * Why Essential: AC7 requires quick practice with AI-recommended topic
     * Impact: Students can't start practicing recommended topics
     */
    it('should emit startPractice event when practice button is clicked', () => {
      component.recommendations = mockRecommendations;
      fixture.detectChanges();

      const spy = jest.spyOn(component.startPractice, 'emit');
      const compiled = fixture.nativeElement as HTMLElement;
      const practiceBtn = compiled.querySelector(
        '[data-testid="practice-btn"]'
      ) as HTMLButtonElement;
      expect(practiceBtn).toBeTruthy();

      practiceBtn.click();
      expect(spy).toHaveBeenCalledWith(mockRecommendations[0]);
    });
  });

  describe('empty state', () => {
    /**
     * Test: Shows friendly message when no recommendations
     * Why Essential: Prevents blank section when AI has no suggestions
     */
    it('should show empty message when no recommendations', () => {
      component.recommendations = [];
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const emptyMsg = compiled.querySelector(
        '[data-testid="no-recommendations"]'
      );
      expect(emptyMsg).toBeTruthy();
    });
  });

  describe('accessibility (AC25)', () => {
    it('should have section aria-label', () => {
      component.recommendations = mockRecommendations;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const section = compiled.querySelector('[aria-label]');
      expect(section).toBeTruthy();
    });
  });
});
