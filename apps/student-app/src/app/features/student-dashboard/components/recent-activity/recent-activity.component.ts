/**
 * Recent Activity Component
 *
 * Displays the student's last completed practice sessions in a
 * feed format with topic, score, and session details.
 *
 * Implements:
 * - AC6: Recent activity feed with last 3 sessions and scores
 * - AC25: Screen reader compatible with ARIA labels
 *
 * @example
 * ```html
 * <app-recent-activity
 *   [recentActivity]="dashboardData.recentActivity">
 * </app-recent-activity>
 * ```
 */

import { Component, Input } from '@angular/core';
import { PracticeSession } from '../../../../models/dashboard.model';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [],
  templateUrl: './recent-activity.component.html',
  styleUrls: ['./recent-activity.component.scss'],
})
export class RecentActivityComponent {
  /** List of recent practice sessions to display. */
  @Input() recentActivity: PracticeSession[] = [];
}
