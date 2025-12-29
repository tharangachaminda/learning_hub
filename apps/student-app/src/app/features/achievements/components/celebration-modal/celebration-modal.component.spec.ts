/**
 * Celebration Modal Component - Unit Tests
 *
 * Test Strategy: Validate achievement celebration display and animations (AC-003)
 * - Achievement unlock celebration appears with animations
 * - Badge details displayed with congratulatory message
 * - Modal closes after animation or user interaction
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { CelebrationModalComponent } from './celebration-modal.component';
import { AchievementService } from '../../../../services/achievement.service';
import { Achievement } from '../../../../models/achievement.model';

describe('CelebrationModalComponent', () => {
  let component: CelebrationModalComponent;
  let fixture: ComponentFixture<CelebrationModalComponent>;
  let mockAchievementService: {
    newlyUnlocked$: Subject<Achievement[]>;
  };

  const mockAchievement: Achievement = {
    id: 'streak_starter',
    name: 'Streak Starter',
    description: 'Practice 3 days in a row',
    category: 'streak',
    badgeIcon: 'badge-streak',
    pointValue: 15,
    unlocked: true,
    unlockedDate: new Date(),
    progress: 100,
  };

  beforeEach(async () => {
    mockAchievementService = {
      newlyUnlocked$: new Subject<Achievement[]>(),
    };

    await TestBed.configureTestingModule({
      imports: [CelebrationModalComponent],
      providers: [
        { provide: AchievementService, useValue: mockAchievementService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CelebrationModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Achievement Unlocked Subscription', () => {
    /**
     * Test: Subscribe to newly unlocked achievements (AC-003)
     * Why Essential: Modal must display when achievements unlock
     * Impact: No celebration without subscription to unlock events
     */
    it('should subscribe to newlyUnlocked$ observable on init', () => {
      const subscribeSpy = jest.spyOn(
        mockAchievementService.newlyUnlocked$,
        'subscribe'
      );

      component.ngOnInit();

      expect(subscribeSpy).toHaveBeenCalled();
    });

    /**
     * Test: Display modal when achievement unlocked (AC-003)
     * Why Essential: User must see celebration when earning badge
     * Impact: No visual feedback for achievement unlocks
     */
    it('should show modal when new achievement unlocked', (done) => {
      component.ngOnInit();

      mockAchievementService.newlyUnlocked$.next([mockAchievement]);

      setTimeout(() => {
        expect(component.isVisible).toBe(true);
        expect(component.currentAchievement).toEqual(mockAchievement);
        done();
      }, 10);
    });

    /**
     * Test: Handle multiple achievements (AC-003)
     * Why Essential: Queue celebrations for multiple unlocks
     * Impact: Only first achievement shown if no queue
     */
    it('should display first achievement when multiple unlocked', (done) => {
      const achievement2: Achievement = {
        ...mockAchievement,
        id: 'addition_master',
        name: 'Addition Master',
      };

      component.ngOnInit();

      mockAchievementService.newlyUnlocked$.next([
        mockAchievement,
        achievement2,
      ]);

      setTimeout(() => {
        expect(component.currentAchievement).toEqual(mockAchievement);
        expect(component.achievementQueue.length).toBe(1); // Second achievement queued
        done();
      }, 10);
    });
  });

  describe('Modal Visibility', () => {
    /**
     * Test: Modal hidden initially (AC-003)
     * Why Essential: Modal should not block UI on page load
     * Impact: Always-visible modal disrupts user experience
     */
    it('should be hidden initially', () => {
      expect(component.isVisible).toBe(false);
      expect(component.currentAchievement).toBeNull();
    });

    /**
     * Test: Close modal on user action (AC-003)
     * Why Essential: User can dismiss celebration
     * Impact: Modal cannot be closed manually
     */
    it('should close modal when close button clicked', () => {
      component.isVisible = true;
      component.currentAchievement = mockAchievement;

      component.closeModal();

      expect(component.isVisible).toBe(false);
      expect(component.currentAchievement).toBeNull();
    });

    /**
     * Test: Auto-close after animation (AC-003)
     * Why Essential: Celebration doesn't block user indefinitely
     * Impact: Manual close required every time
     */
    it('should auto-close modal after 5 seconds', (done) => {
      jest.useFakeTimers();
      component.showCelebration(mockAchievement);

      expect(component.isVisible).toBe(true);

      jest.advanceTimersByTime(5000);

      expect(component.isVisible).toBe(false);
      jest.useRealTimers();
      done();
    });
  });

  describe('Achievement Display', () => {
    /**
     * Test: Display achievement details (AC-003)
     * Why Essential: User sees what they earned
     * Impact: Generic celebration without context
     */
    it('should display achievement name and description', () => {
      component.showCelebration(mockAchievement);

      expect(component.currentAchievement?.name).toBe('Streak Starter');
      expect(component.currentAchievement?.description).toBe(
        'Practice 3 days in a row'
      );
    });

    /**
     * Test: Display points awarded (AC-003)
     * Why Essential: User knows point value of achievement
     * Impact: Missing reward information
     */
    it('should display points awarded', () => {
      component.showCelebration(mockAchievement);

      expect(component.currentAchievement?.pointValue).toBe(15);
    });
  });

  describe('Queue Management', () => {
    /**
     * Test: Process queued achievements (AC-003)
     * Why Essential: All unlocked achievements get celebrated
     * Impact: Some achievements never shown
     */
    it('should show next achievement from queue after closing', (done) => {
      const achievement2: Achievement = {
        ...mockAchievement,
        id: 'addition_master',
        name: 'Addition Master',
        pointValue: 20,
      };

      component.achievementQueue = [achievement2];
      component.currentAchievement = mockAchievement;
      component.isVisible = true;

      component.closeModal();

      // Wait for the 300ms delay in closeModal() before checking
      setTimeout(() => {
        expect(component.currentAchievement).toEqual(achievement2);
        expect(component.isVisible).toBe(true);
        expect(component.achievementQueue.length).toBe(0);
        done();
      }, 350); // Wait longer than the 300ms delay in component
    });
  });

  describe('Cleanup', () => {
    /**
     * Test: Unsubscribe on component destroy (AC-003)
     * Why Essential: Prevent memory leaks
     * Impact: Subscription persists after component destroyed
     */
    it('should unsubscribe from newlyUnlocked$ on destroy', () => {
      component.ngOnInit();
      const subscription = component['achievementSubscription'];
      const unsubscribeSpy = jest.spyOn(subscription!, 'unsubscribe');

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });
});
