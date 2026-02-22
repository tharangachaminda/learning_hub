/**
 * AI Recommendations Component
 *
 * Displays personalized topic suggestions from the AI engine.
 * Each recommendation shows the topic, reason, difficulty, and
 * estimated time, with a quick practice button.
 *
 * Implements:
 * - AC5: 2-3 personalized topic suggestions based on performance
 * - AC7: Quick practice button initiates session with recommended topic
 * - AC22: Recommendations reflect latest session data
 * - AC25: Screen reader compatible with ARIA labels
 *
 * @example
 * ```html
 * <app-ai-recommendations
 *   [recommendations]="dashboardData.recommendations"
 *   (startPractice)="onStartPractice($event)">
 * </app-ai-recommendations>
 * ```
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TopicRecommendation } from '../../../../models/dashboard.model';

@Component({
  selector: 'app-ai-recommendations',
  standalone: true,
  imports: [],
  templateUrl: './ai-recommendations.component.html',
  styleUrls: ['./ai-recommendations.component.scss'],
})
export class AiRecommendationsComponent {
  /** List of AI-generated topic recommendations. */
  @Input() recommendations: TopicRecommendation[] = [];

  /**
   * Emits when the student clicks a quick practice button.
   *
   * @param recommendation - The selected topic recommendation
   */
  @Output() startPractice = new EventEmitter<TopicRecommendation>();

  /**
   * Handle quick practice button click.
   *
   * @param recommendation - The recommendation to start practicing
   */
  onPracticeClick(recommendation: TopicRecommendation): void {
    this.startPractice.emit(recommendation);
  }
}
