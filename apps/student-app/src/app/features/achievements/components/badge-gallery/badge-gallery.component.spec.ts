/**
 * Badge Gallery Component - Unit Tests
 *
 * Test Strategy: Validate display and interaction logic
 * - AC-004: Display all badges in collection
 * - AC-005: Show unlock dates and descriptions
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { BadgeGalleryComponent } from './badge-gallery.component';
import { AchievementService } from '../../../../services/achievement.service';
import {
  Achievement,
  StudentAchievements,
} from '../../../../models/achievement.model';

describe('BadgeGalleryComponent', () => {
  let component: BadgeGalleryComponent;
  let fixture: ComponentFixture<BadgeGalleryComponent>;
  let achievementService: jest.Mocked<AchievementService>;

  const mockAchievements: Achievement[] = [
    {
      id: 'first_steps',
      name: 'First Steps',
      description: 'Answer 10 questions correctly',
      category: 'milestone',
      badgeIcon: 'badge-first-steps',
      pointValue: 10,
      unlocked: true,
      unlockedDate: new Date('2024-12-26'),
      progress: 100,
    },
    {
      id: 'streak_starter',
      name: 'Streak Starter',
      description: 'Practice 3 days in a row',
      category: 'streak',
      badgeIcon: 'badge-streak',
      pointValue: 15,
      unlocked: false,
      progress: 66,
    },
  ];

  const mockStudentAchievements: StudentAchievements = {
    studentId: 'student-123',
    achievements: mockAchievements,
    totalPoints: 10,
    recentlyUnlocked: [],
  };

  const mockAchievementService = {
    getStudentAchievements: jest.fn(),
    getAchievementsByCategory: jest.fn(),
    getCompletionPercentage: jest.fn(),
    checkForNewAchievements: jest.fn(),
    newlyUnlocked$: of([]),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeGalleryComponent, HttpClientTestingModule],
      providers: [
        { provide: AchievementService, useValue: mockAchievementService },
      ],
    }).compileComponents();

    achievementService = TestBed.inject(
      AchievementService
    ) as jest.Mocked<AchievementService>;
    fixture = TestBed.createComponent(BadgeGalleryComponent);
    component = fixture.componentInstance;
    component.studentId = 'student-123';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loadAchievements', () => {
    /**
     * Test: Load and display achievements (AC-004)
     * Why Essential: Badge gallery must show all achievements
     * Impact: Gallery cannot display without loading data
     */
    it('should load achievements on init', () => {
      achievementService.getStudentAchievements.mockReturnValue(
        of(mockStudentAchievements)
      );
      achievementService.getCompletionPercentage.mockReturnValue(50);

      component.ngOnInit();

      expect(achievementService.getStudentAchievements).toHaveBeenCalledWith(
        'student-123'
      );
      expect(component.achievements.length).toBe(2);
      expect(component.totalPoints).toBe(10);
      expect(component.completionPercentage).toBe(50);
      expect(component.loading).toBe(false);
    });

    /**
     * Test: Handle loading errors gracefully
     * Why Essential: User experience when API fails
     * Impact: Application crash without error handling
     */
    it('should handle error when loading achievements fails', () => {
      achievementService.getStudentAchievements.mockReturnValue(
        throwError(() => new Error('API Error'))
      );

      component.loadAchievements();

      expect(component.error).toBe(
        'Failed to load achievements. Please try again.'
      );
      expect(component.loading).toBe(false);
    });
  });

  describe('getAchievementsByCategory', () => {
    /**
     * Test: Filter achievements by category (AC-004)
     * Why Essential: Organize badges by type for better UX
     * Impact: Disorganized badge display
     */
    it('should filter achievements by category', () => {
      component.achievements = mockAchievements;
      achievementService.getAchievementsByCategory.mockReturnValue([
        mockAchievements[0],
      ]);

      const milestones = component.getAchievementsByCategory('milestone');

      expect(achievementService.getAchievementsByCategory).toHaveBeenCalledWith(
        mockAchievements,
        'milestone'
      );
      expect(milestones.length).toBe(1);
    });
  });

  describe('getBadgeClass', () => {
    /**
     * Test: Apply correct CSS class based on unlock status (AC-004, AC-005)
     * Why Essential: Visual distinction between earned and locked badges
     * Impact: Confusing display without visual differentiation
     */
    it('should return "badge-unlocked" for unlocked achievements', () => {
      const unlockedAchievement = mockAchievements[0];
      const cssClass = component.getBadgeClass(unlockedAchievement);
      expect(cssClass).toBe('badge-unlocked');
    });

    it('should return "badge-locked" for locked achievements', () => {
      const lockedAchievement = mockAchievements[1];
      const cssClass = component.getBadgeClass(lockedAchievement);
      expect(cssClass).toBe('badge-locked');
    });
  });

  describe('formatDate', () => {
    /**
     * Test: Format unlock date for display (AC-005)
     * Why Essential: Show when achievement was earned
     * Impact: Missing critical information for students
     */
    it('should format unlock date correctly', () => {
      const date = new Date('2024-12-26');
      const formatted = component.formatDate(date);
      expect(formatted).toContain('Dec');
      expect(formatted).toContain('26');
      expect(formatted).toContain('2024');
    });

    it('should return empty string for undefined date', () => {
      const formatted = component.formatDate(undefined);
      expect(formatted).toBe('');
    });
  });

  describe('trackByAchievementId', () => {
    /**
     * Test: Angular performance optimization
     * Why Essential: Efficient re-rendering of achievement list
     * Impact: Performance degradation with many achievements
     */
    it('should return achievement id for tracking', () => {
      const achievement = mockAchievements[0];
      const trackId = component.trackByAchievementId(0, achievement);
      expect(trackId).toBe('first_steps');
    });
  });
});
