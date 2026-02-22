/**
 * Daily Goal Widget Component
 *
 * Displays the student's daily practice goal progress with a visual
 * progress bar and current streak counter with flame emoji.
 *
 * Implements:
 * - AC3: Daily goal progress bar for practice minutes
 * - AC4: Streak counter with flame emoji for consecutive days
 * - AC15: Touch-friendly targets (min 60px)
 * - AC25: Screen reader compatible with ARIA labels
 *
 * @example
 * ```html
 * <app-daily-goal-widget
 *   [dailyGoal]="dashboardData.dailyGoal"
 *   [streak]="dashboardData.streak">
 * </app-daily-goal-widget>
 * ```
 */

import { Component, Input } from '@angular/core';
import { DailyGoal, Streak } from '../../../../models/dashboard.model';

@Component({
  selector: 'app-daily-goal-widget',
  standalone: true,
  imports: [],
  templateUrl: './daily-goal-widget.component.html',
  styleUrls: ['./daily-goal-widget.component.scss'],
})
export class DailyGoalWidgetComponent {
  /** Daily goal data with target, completed minutes, and percentage. */
  @Input() dailyGoal: DailyGoal = {
    targetMinutes: 0,
    completedMinutes: 0,
    percentage: 0,
  };

  /** Streak data with current and longest consecutive practice days. */
  @Input() streak: Streak = { current: 0, longest: 0 };
}
