/**
 * Achievement Showcase Component
 *
 * Displays the student's most recently earned achievement badges
 * in a compact showcase format on the dashboard.
 *
 * Implements:
 * - AC9: Display 3 most recent badges/achievements earned
 * - AC25: Screen reader compatible with ARIA labels
 *
 * @example
 * ```html
 * <app-achievement-showcase
 *   [achievements]="dashboardData.achievements">
 * </app-achievement-showcase>
 * ```
 */

import { Component, Input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faShield, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { Achievement } from '../../../../models/achievement.model';

@Component({
  selector: 'app-achievement-showcase',
  standalone: true,
  imports: [FaIconComponent],
  templateUrl: './achievement-showcase.component.html',
  styleUrls: ['./achievement-showcase.component.scss'],
})
export class AchievementShowcaseComponent {
  protected readonly trophyIcon = faTrophy;
  protected readonly badgeIcon = faShield;

  /** List of recent achievements to display. */
  @Input() achievements: Achievement[] = [];
}
