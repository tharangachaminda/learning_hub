import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AchievementService } from '../../../../services/achievement.service';
import { Achievement } from '../../../../models/achievement.model';

/**
 * Celebration Modal Component
 *
 * Displays animated celebration when students unlock achievements (AC-003).
 * Shows badge details, congratulatory message, and points awarded.
 * Auto-dismisses after animation or can be manually closed.
 *
 * @example
 * <app-celebration-modal></app-celebration-modal>
 */
@Component({
  selector: 'app-celebration-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './celebration-modal.component.html',
  styleUrls: ['./celebration-modal.component.scss'],
})
export class CelebrationModalComponent implements OnInit, OnDestroy {
  /**
   * Controls modal visibility
   */
  isVisible = false;

  /**
   * Currently displayed achievement
   */
  currentAchievement: Achievement | null = null;

  /**
   * Queue of achievements waiting to be displayed
   */
  achievementQueue: Achievement[] = [];

  /**
   * Subscription to achievement unlock events
   */
  private achievementSubscription?: Subscription;

  /**
   * Auto-close timer reference
   */
  private autoCloseTimer?: ReturnType<typeof setTimeout>;

  constructor(private achievementService: AchievementService) {}

  /**
   * Initialize component and subscribe to achievement unlocks
   */
  ngOnInit(): void {
    this.achievementSubscription =
      this.achievementService.newlyUnlocked$.subscribe((achievements) => {
        if (achievements.length > 0) {
          // Show first achievement immediately
          this.showCelebration(achievements[0]);

          // Queue remaining achievements
          if (achievements.length > 1) {
            this.achievementQueue.push(...achievements.slice(1));
          }
        }
      });
  }

  /**
   * Display celebration modal for an achievement
   *
   * @param achievement - Achievement to celebrate
   */
  showCelebration(achievement: Achievement): void {
    this.currentAchievement = achievement;
    this.isVisible = true;

    // Auto-close after 5 seconds
    this.autoCloseTimer = setTimeout(() => {
      this.closeModal();
    }, 5000);
  }

  /**
   * Close modal and show next queued achievement if any
   */
  closeModal(): void {
    // Clear auto-close timer
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = undefined;
    }

    this.isVisible = false;
    this.currentAchievement = null;

    // Show next achievement from queue if available
    if (this.achievementQueue.length > 0) {
      const nextAchievement = this.achievementQueue.shift();
      if (nextAchievement) {
        // Small delay before showing next celebration
        setTimeout(() => {
          this.showCelebration(nextAchievement);
        }, 300);
      }
    }
  }

  /**
   * Cleanup subscriptions on component destroy
   */
  ngOnDestroy(): void {
    if (this.achievementSubscription) {
      this.achievementSubscription.unsubscribe();
    }
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
    }
  }
}
