/**
 * Subject Cards Component - Unit Tests
 *
 * Test Strategy: Validate subject progress card display.
 * - AC8: Subject cards display available subjects with progress indicators
 * - AC25: ARIA labels for accessibility
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubjectCardsComponent } from './subject-cards.component';
import { SubjectProgress } from '../../../../models/dashboard.model';

describe('SubjectCardsComponent', () => {
  let component: SubjectCardsComponent;
  let fixture: ComponentFixture<SubjectCardsComponent>;

  const mockSubjects: SubjectProgress[] = [
    {
      subject: 'math',
      displayName: 'Mathematics',
      icon: '🔢',
      masteryPercentage: 65,
      questionsAnswered: 120,
      lastPracticed: '2026-02-20T14:30:00Z',
    },
    {
      subject: 'reading',
      displayName: 'Reading',
      icon: '📖',
      masteryPercentage: 40,
      questionsAnswered: 50,
      lastPracticed: '2026-02-18T10:00:00Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectCardsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectCardsComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('subject display (AC8)', () => {
    /**
     * Test: Shows subject cards with display names
     * Why Essential: AC8 requires subject cards with progress indicators
     * Impact: Students can't see available subjects or their progress
     */
    it('should display subject display names', () => {
      component.subjects = mockSubjects;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const content = compiled.textContent ?? '';
      expect(content).toContain('Mathematics');
      expect(content).toContain('Reading');
    });

    it('should render a card for each subject', () => {
      component.subjects = mockSubjects;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const cards = compiled.querySelectorAll('[data-testid="subject-card"]');
      expect(cards.length).toBe(2);
    });

    it('should display subject icons', () => {
      component.subjects = mockSubjects;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const content = compiled.textContent ?? '';
      expect(content).toContain('🔢');
      expect(content).toContain('📖');
    });

    it('should display mastery percentage with progress bar', () => {
      component.subjects = mockSubjects;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const progressBar = compiled.querySelector('[role="progressbar"]');
      expect(progressBar).toBeTruthy();
      expect(progressBar?.getAttribute('aria-valuenow')).toBe('65');
    });

    it('should display questions answered count', () => {
      component.subjects = mockSubjects;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const content = compiled.textContent ?? '';
      expect(content).toContain('120');
    });
  });

  describe('empty state', () => {
    /**
     * Test: Shows message when no subjects available
     * Why Essential: New or unconfigured students need guidance
     */
    it('should show empty message when no subjects', () => {
      component.subjects = [];
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const emptyMsg = compiled.querySelector('[data-testid="no-subjects"]');
      expect(emptyMsg).toBeTruthy();
    });
  });

  describe('accessibility (AC25)', () => {
    it('should have section aria-label', () => {
      component.subjects = mockSubjects;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const section = compiled.querySelector('[aria-label]');
      expect(section).toBeTruthy();
    });
  });
});
