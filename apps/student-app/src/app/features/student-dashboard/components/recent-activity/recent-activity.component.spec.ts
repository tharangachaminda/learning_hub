/**
 * Recent Activity Component - Unit Tests
 *
 * Test Strategy: Validate activity feed display.
 * - AC6: Last 3 completed practice sessions with scores
 * - AC25: ARIA labels for accessibility
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecentActivityComponent } from './recent-activity.component';
import { PracticeSession } from '../../../../models/dashboard.model';

describe('RecentActivityComponent', () => {
  let component: RecentActivityComponent;
  let fixture: ComponentFixture<RecentActivityComponent>;

  const mockSessions: PracticeSession[] = [
    {
      id: 'session-1',
      subject: 'math',
      topic: 'Addition',
      score: 80,
      questionsAnswered: 10,
      correctAnswers: 8,
      completedAt: '2026-02-20T14:30:00Z',
      durationMinutes: 15,
    },
    {
      id: 'session-2',
      subject: 'math',
      topic: 'Subtraction',
      score: 90,
      questionsAnswered: 10,
      correctAnswers: 9,
      completedAt: '2026-02-19T10:00:00Z',
      durationMinutes: 12,
    },
    {
      id: 'session-3',
      subject: 'math',
      topic: 'Multiplication',
      score: 70,
      questionsAnswered: 10,
      correctAnswers: 7,
      completedAt: '2026-02-18T16:00:00Z',
      durationMinutes: 20,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentActivityComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RecentActivityComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('activity feed (AC6)', () => {
    /**
     * Test: Displays completed practice sessions
     * Why Essential: AC6 requires last 3 sessions with scores
     * Impact: Student can't review recent performance
     */
    it('should display session topics', () => {
      component.recentActivity = mockSessions;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const content = compiled.textContent ?? '';
      expect(content).toContain('Addition');
      expect(content).toContain('Subtraction');
      expect(content).toContain('Multiplication');
    });

    it('should display scores for each session', () => {
      component.recentActivity = mockSessions;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const content = compiled.textContent ?? '';
      expect(content).toContain('80');
      expect(content).toContain('90');
      expect(content).toContain('70');
    });

    it('should render an entry for each session', () => {
      component.recentActivity = mockSessions;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const entries = compiled.querySelectorAll(
        '[data-testid="activity-entry"]'
      );
      expect(entries.length).toBe(3);
    });
  });

  describe('empty state', () => {
    /**
     * Test: Shows message when no recent activity
     * Why Essential: New students have no sessions yet
     */
    it('should show empty message when no activity', () => {
      component.recentActivity = [];
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const emptyMsg = compiled.querySelector('[data-testid="no-activity"]');
      expect(emptyMsg).toBeTruthy();
    });
  });

  describe('accessibility (AC25)', () => {
    it('should have section aria-label', () => {
      component.recentActivity = mockSessions;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const section = compiled.querySelector('[aria-label]');
      expect(section).toBeTruthy();
    });
  });
});
