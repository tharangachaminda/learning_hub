import { Injectable } from '@nestjs/common';
import { AIMonitoringService } from '../monitoring/ai-monitoring.service';
import { ParentFeedbackService } from '../feedback/parent-feedback.service';
import { HumanReviewService } from '../review/human-review.service';

/**
 * Health status categories for system quality assessment.
 */
export type HealthStatus = 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';

/**
 * Overall quality metrics aggregated from all monitoring sources.
 */
export interface OverallQualityMetrics {
  aiPerformance: {
    averageConfidence: number | null;
    totalGenerations: number;
    averageFlagRate: number | null;
    averageReviewRate: number | null;
  };
  parentFeedback: {
    totalFeedback: number;
    averageSatisfaction: number | null;
    flaggedCount: number;
    flagRate: number;
  };
  reviewQueue: {
    totalPending: number;
    urgentCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  alerts: {
    activeAlertsCount: number;
    bySeverity: {
      CRITICAL: number;
      HIGH: number;
      MEDIUM: number;
      LOW: number;
    };
  };
}

/**
 * Health score breakdown by component.
 */
export interface HealthScore {
  overallScore: number;
  status: HealthStatus;
  components: {
    aiConfidence: {
      score: number;
      weight: number;
    };
    parentSatisfaction: {
      score: number;
      weight: number;
    };
    contentQuality: {
      score: number;
      weight: number;
    };
    reviewBacklog: {
      score: number;
      weight: number;
    };
  };
}

/**
 * Alerts summary grouped by severity.
 */
export interface AlertsSummary {
  totalAlerts: number;
  bySeverity: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  alerts: Array<{
    id: string | number;
    alertType: string;
    severity: string;
    createdAt: Date;
  }>;
}

/**
 * Service for aggregating quality metrics across monitoring, feedback, and review systems.
 * Provides unified dashboard view of AI quality assurance performance.
 *
 * @class QualityDashboardService
 */
@Injectable()
export class QualityDashboardService {
  constructor(
    private readonly monitoringService: AIMonitoringService,
    private readonly feedbackService: ParentFeedbackService,
    private readonly reviewService: HumanReviewService
  ) {}

  /**
   * Get overall quality metrics aggregated from all sources.
   * Combines AI performance, parent feedback, review queue, and alerts.
   *
   * @returns Promise resolving to comprehensive quality metrics
   *
   * @example
   * ```typescript
   * const metrics = await service.getOverallQualityMetrics();
   * console.log(metrics.aiPerformance.averageConfidence); // 0.85
   * console.log(metrics.parentFeedback.averageSatisfaction); // 4.3
   * ```
   */
  async getOverallQualityMetrics(): Promise<OverallQualityMetrics> {
    const [monitoringStats, feedbackStats, reviewStats, activeAlerts] =
      await Promise.all([
        this.monitoringService.calculateDashboardStats(),
        this.feedbackService.getParentFeedbackStats(),
        this.reviewService.getReviewStats(),
        this.monitoringService.getActiveAlerts(),
      ]);

    // Group alerts by severity
    const alertsBySeverity = activeAlerts.reduce(
      (acc, alert) => {
        const severity = alert.severity as keyof typeof acc;
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      },
      { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
    );

    return {
      aiPerformance: {
        averageConfidence: monitoringStats.averageConfidence,
        totalGenerations: monitoringStats.totalGenerations,
        averageFlagRate: monitoringStats.averageFlagRate,
        averageReviewRate: monitoringStats.averageReviewRate,
      },
      parentFeedback: {
        totalFeedback: feedbackStats.totalFeedback,
        averageSatisfaction: feedbackStats.averageSatisfaction,
        flaggedCount: feedbackStats.flaggedCount,
        flagRate: feedbackStats.flagRate,
      },
      reviewQueue: {
        totalPending: reviewStats.totalPending,
        urgentCount: reviewStats.urgentCount,
        highCount: reviewStats.highCount,
        mediumCount: reviewStats.mediumCount,
        lowCount: reviewStats.lowCount,
      },
      alerts: {
        activeAlertsCount: activeAlerts.length,
        bySeverity: alertsBySeverity,
      },
    };
  }

  /**
   * Get quality metrics trends over specified time period.
   * Retrieves time-series data for confidence, satisfaction, flags, and reviews.
   *
   * @param startDate - Start of time period
   * @param endDate - End of time period
   * @returns Promise resolving to array of metrics snapshots
   *
   * @example
   * ```typescript
   * const trends = await service.getQualityTrends(
   *   new Date('2025-11-01'),
   *   new Date('2025-11-12')
   * );
   * // Returns array of daily metrics
   * ```
   */
  async getQualityTrends(startDate: Date, endDate: Date) {
    return this.monitoringService.getMetricsTrend(startDate, endDate);
  }

  /**
   * Calculate comprehensive health score for the system.
   * Combines weighted scores from AI confidence, satisfaction, content quality, and review backlog.
   *
   * @returns Promise resolving to health score with status and component breakdown
   *
   * @example
   * ```typescript
   * const health = await service.getHealthScore();
   * console.log(health.status); // 'GOOD'
   * console.log(health.overallScore); // 82.5
   * ```
   */
  async getHealthScore(): Promise<HealthScore> {
    const [monitoringStats, feedbackStats, reviewStats] = await Promise.all([
      this.monitoringService.calculateDashboardStats(),
      this.feedbackService.getParentFeedbackStats(),
      this.reviewService.getReviewStats(),
    ]);

    // Calculate component scores (0-100 scale)
    const aiConfidenceScore = this.calculateAIConfidenceScore(
      monitoringStats.averageConfidence
    );
    const parentSatisfactionScore = this.calculateParentSatisfactionScore(
      feedbackStats.averageSatisfaction
    );
    const contentQualityScore = this.calculateContentQualityScore(
      monitoringStats.averageFlagRate
    );
    const reviewBacklogScore = this.calculateReviewBacklogScore(
      reviewStats.totalPending,
      reviewStats.urgentCount
    );

    // Component weights (must sum to 1.0)
    const weights = {
      aiConfidence: 0.35,
      parentSatisfaction: 0.3,
      contentQuality: 0.2,
      reviewBacklog: 0.15,
    };

    // Calculate weighted overall score
    const overallScore =
      aiConfidenceScore * weights.aiConfidence +
      parentSatisfactionScore * weights.parentSatisfaction +
      contentQualityScore * weights.contentQuality +
      reviewBacklogScore * weights.reviewBacklog;

    const status = this.determineHealthStatus(overallScore);

    return {
      overallScore: Math.round(overallScore * 10) / 10,
      status,
      components: {
        aiConfidence: {
          score: Math.round(aiConfidenceScore * 10) / 10,
          weight: weights.aiConfidence,
        },
        parentSatisfaction: {
          score: Math.round(parentSatisfactionScore * 10) / 10,
          weight: weights.parentSatisfaction,
        },
        contentQuality: {
          score: Math.round(contentQualityScore * 10) / 10,
          weight: weights.contentQuality,
        },
        reviewBacklog: {
          score: Math.round(reviewBacklogScore * 10) / 10,
          weight: weights.reviewBacklog,
        },
      },
    };
  }

  /**
   * Get summary of active alerts grouped by severity.
   * Provides quick view of system alerts requiring attention.
   *
   * @returns Promise resolving to alerts summary
   *
   * @example
   * ```typescript
   * const summary = await service.getAlertsSummary();
   * console.log(summary.totalAlerts); // 5
   * console.log(summary.bySeverity.HIGH); // 2
   * ```
   */
  async getAlertsSummary(): Promise<AlertsSummary> {
    const activeAlerts = await this.monitoringService.getActiveAlerts();

    const bySeverity = activeAlerts.reduce(
      (acc, alert) => {
        const severity = alert.severity as keyof typeof acc;
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      },
      { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
    );

    return {
      totalAlerts: activeAlerts.length,
      bySeverity,
      alerts: activeAlerts.map((alert) => ({
        id: alert.id,
        alertType: alert.alertType,
        severity: alert.severity,
        createdAt: alert.createdAt,
      })),
    };
  }

  /**
   * Calculate AI confidence score (0-100).
   * Maps confidence values to health score scale.
   *
   * @param confidence - AI confidence score (0-1) or null
   * @returns Health score from 0-100
   * @private
   */
  private calculateAIConfidenceScore(confidence: number | null): number {
    if (confidence === null) return 0;

    // Excellent: >= 0.9 → 90-100
    // Good: >= 0.8 → 75-89
    // Warning: >= 0.7 → 50-74
    // Critical: < 0.7 → 0-49
    if (confidence >= 0.9) return 90 + (confidence - 0.9) * 100;
    if (confidence >= 0.8) return 75 + (confidence - 0.8) * 150;
    if (confidence >= 0.7) return 50 + (confidence - 0.7) * 250;
    return confidence * 70;
  }

  /**
   * Calculate parent satisfaction score (0-100).
   * Maps satisfaction ratings to health score scale.
   *
   * @param satisfaction - Parent satisfaction rating (1-5) or null
   * @returns Health score from 0-100
   * @private
   */
  private calculateParentSatisfactionScore(
    satisfaction: number | null
  ): number {
    if (satisfaction === null) return 0;

    // Convert 1-5 scale to 0-100
    // Excellent: >= 4.5 → 90-100
    // Good: >= 4.0 → 75-89
    // Warning: >= 3.5 → 50-74
    // Critical: < 3.5 → 0-49
    const normalized = ((satisfaction - 1) / 4) * 100;
    return Math.max(0, Math.min(100, normalized));
  }

  /**
   * Calculate content quality score (0-100).
   * Maps content flag rate to health score (inverted - lower flags = higher score).
   *
   * @param flagRate - Content flag rate (0-1) or null
   * @returns Health score from 0-100
   * @private
   */
  private calculateContentQualityScore(flagRate: number | null): number {
    if (flagRate === null) return 100;

    // Invert flag rate: lower flags = better quality
    // Excellent: <= 0.02 → 90-100
    // Good: <= 0.05 → 75-89
    // Warning: <= 0.10 → 50-74
    // Critical: > 0.10 → 0-49
    if (flagRate <= 0.02) return 100 - flagRate * 500;
    if (flagRate <= 0.05) return 90 - (flagRate - 0.02) * 500;
    if (flagRate <= 0.1) return 75 - (flagRate - 0.05) * 500;
    return Math.max(0, 50 - (flagRate - 0.1) * 500);
  }

  /**
   * Calculate review backlog score (0-100).
   * Considers total pending reviews and urgent review count.
   *
   * @param totalPending - Total pending reviews
   * @param urgentCount - Count of urgent reviews
   * @returns Health score from 0-100
   * @private
   */
  private calculateReviewBacklogScore(
    totalPending: number,
    urgentCount: number
  ): number {
    // Penalize urgent reviews more heavily
    const weightedBacklog = totalPending + urgentCount * 2;

    // Excellent: <= 10 → 90-100
    // Good: <= 30 → 75-89
    // Warning: <= 60 → 50-74
    // Critical: > 60 → 0-49
    if (weightedBacklog <= 10) return 100 - weightedBacklog;
    if (weightedBacklog <= 30) return 90 - (weightedBacklog - 10) * 0.75;
    if (weightedBacklog <= 60) return 75 - (weightedBacklog - 30) * 0.83;
    return Math.max(0, 50 - (weightedBacklog - 60));
  }

  /**
   * Determine health status from overall score.
   *
   * @param score - Overall health score (0-100)
   * @returns Health status category
   * @private
   */
  private determineHealthStatus(score: number): HealthStatus {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 75) return 'GOOD';
    if (score >= 50) return 'WARNING';
    return 'CRITICAL';
  }
}
