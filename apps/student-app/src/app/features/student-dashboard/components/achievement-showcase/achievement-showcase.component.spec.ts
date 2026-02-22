/**
 * Achievement Showcase Component - Unit Tests
 *
 * Test Strategy: Validate recent achievement badge display.
 * - AC9: Display 3 most recent badges/achievements earned
 * - AC25: ARIA labels for accessibility
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AchievementShowcaseComponent } from './achievement-showcase.component';
import { Achievement } from '../../../../models/achievement.model';

describe('AchievementShowcaseComponent', () => {
  let component: AchievementShowcaseComponent;
  let fixture: ComponentFixture<AchievementShowcaseComponent>;

  const mockAchievements: Achievement[] = [
    {
      id: 'first_steps',
      name: 'First Steps',
      description: 'Answer 10 questions correctly',
      category: 'milestone',
      badgeIcon: 'badge-first-steps',
      pointValue: 10,
      unlocked: true,
      unlockedDate: new Date('2026-01-10'),
      progress: 100,
    },
    {
      id: 'streak_3',
      name: '3-Day Streak',
      description: 'Practice for 3 days in a row',
      category: 'streak',
      badgeIcon: 'badge-streak-3',
      pointValue: 15,
      unlocked: true,
      unlockedDate: new Date('2026-01-15'),
      progress: 100,
    },
    {
      id: 'math_explorer',
      name: 'Math Explorer',
      description: 'Try 5 different math topics',
      category: 'topic_mastery',
      badgeIcon: 'badge-math-explorer',
      pointValue: 20,
      unlocked: true,
      unlockedDate: new Date('2026-02-01'),
      progress: 100,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AchievementShowcaseComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AchievementShowcaseComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('achievement display (AC9)', () => {
    /**
     * Test: Shows recent achievement badges
     * Why Essential: AC9 requires 3 most recent badges display
     * Impact: Student can't see recently earned achievements
     */
    it('should display achievement names', () => {
      component.achievements = mockAchievements;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const content = compiled.textContent ?? '';
      expect(content).toContain('First Steps');
      expect(content).toContain('3-Day Streak');
      expect(content).toContain('Math Explorer');
    });

    it('should render a badge for each achievement', () => {
      component.achievements = mockAchievements;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const badges = compiled.querySelectorAll(
        '[data-testid="achievement-badge"]'
      );
      expect(badges.length).toBe(3);
    });

    it('should display point values', () => {
      component.achievements = mockAchievements;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const content = compiled.textContent ?? '';
      expect(content).toContain('10');
      expect(content).toContain('15');
      expect(content).toContain('20');
    });
  });

  describe('empty state', () => {
    /**
     * Test: Shows message when no achievements earned yet
     * Why Essential: New students have no achievements to display
     */
    it('should show empty message when no achievements', () => {
      component.achievements = [];
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const emptyMsg = compiled.querySelector(
        '[data-testid="no-achievements"]'
      );
      expect(emptyMsg).toBeTruthy();
    });
  });

  describe('accessibility (AC25)', () => {
    it('should have section aria-label', () => {
      component.achievements = mockAchievements;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const section = compiled.querySelector('[aria-label]');
      expect(section).toBeTruthy();
    });
  });
});
