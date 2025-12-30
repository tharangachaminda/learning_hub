/**
 * Badge Gallery Component
 *
 * Displays all student achievements in a grid layout.
 * Implements AC-004: View all badges in collection gallery
 * Implements AC-005: Show unlock dates and descriptions
 */

import { Component, OnInit, Input } from '@angular/core';
import {
  Achievement,
  StudentAchievements,
} from '../../../../models/achievement.model';
import { AchievementService } from '../../../../services/achievement.service';

@Component({
  selector: 'app-badge-gallery',
  standalone: true,
  imports: [], // No CommonModule needed with new control flow
  templateUrl: './badge-gallery.component.html',
  styleUrls: ['./badge-gallery.component.scss'],
})
export class BadgeGalleryComponent implements OnInit {
  @Input() studentId = 'integration-test-student'; // Default for testing, should come from auth service

  achievements: Achievement[] = [];
  totalPoints = 0;
  completionPercentage = 0;
  loading = true;
  error: string | null = null;

  // Category organization for display
  categories = [
    { key: 'milestone' as const, label: 'Milestones', icon: '🎯' },
    { key: 'streak' as const, label: 'Streaks', icon: '🔥' },
    { key: 'topic_mastery' as const, label: 'Topic Masters', icon: '⭐' },
    { key: 'accuracy' as const, label: 'Accuracy', icon: '🎓' },
  ];

  constructor(private achievementService: AchievementService) {}

  ngOnInit(): void {
    this.loadAchievements();
  }

  /**
   * Load all achievements for the student
   *
   * Fetches achievement data and calculates statistics.
   * Implements AC-004 requirement.
   */
  loadAchievements(): void {
    this.loading = true;
    this.error = null;

    this.achievementService.getStudentAchievements(this.studentId).subscribe({
      next: (data: StudentAchievements) => {
        this.achievements = data.achievements;
        this.totalPoints = data.totalPoints;
        this.completionPercentage =
          this.achievementService.getCompletionPercentage(data.achievements);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load achievements. Please try again.';
        this.loading = false;
        console.error('Error loading achievements:', err);
      },
    });
  }

  /**
   * Get achievements for a specific category
   *
   * Organizes badges by type for display.
   *
   * @param category - Achievement category
   * @returns Filtered achievements
   */
  getAchievementsByCategory(category: Achievement['category']): Achievement[] {
    return this.achievementService.getAchievementsByCategory(
      this.achievements,
      category
    );
  }

  /**
   * Get CSS class for badge state
   *
   * Applies visual styling based on unlock status.
   * Implements AC-005 (visual distinction).
   *
   * @param achievement - Achievement to style
   * @returns CSS class name
   */
  getBadgeClass(achievement: Achievement): string {
    if (achievement.unlocked) {
      return 'badge-unlocked';
    }
    return 'badge-locked';
  }

  /**
   * Format unlock date for display
   *
   * Implements AC-005 (show unlock date).
   *
   * @param date - Unlock date
   * @returns Formatted date string
   */
  formatDate(date: Date | undefined): string {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /**
   * Track achievements for Angular ngFor performance
   */
  trackByAchievementId(index: number, achievement: Achievement): string {
    return achievement.id;
  }
}
