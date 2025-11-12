import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AIMetrics } from './entities/ai-metrics.entity';
import { AIAlert, AlertType, AlertSeverity } from './entities/ai-alert.entity';

/**
 * Monitoring thresholds for alert triggering.
 * Based on story requirements for quality assurance.
 */
const ALERT_THRESHOLDS = {
  MIN_CONFIDENCE_SCORE: 0.8,
  MIN_PARENT_SATISFACTION: 4.0,
  MAX_CONTENT_FLAG_RATE: 0.05,
  MAX_HUMAN_REVIEW_RATE: 0.15,
} as const;

/**
 * Service for monitoring AI performance and quality metrics.
 * Tracks performance indicators, detects quality degradation,
 * and generates alerts when thresholds are breached.
 *
 * @class AIMonitoringService
 */
@Injectable()
export class AIMonitoringService {
  constructor(
    @InjectRepository(AIMetrics)
    private readonly metricsRepository: Repository<AIMetrics>,
    @InjectRepository(AIAlert)
    private readonly alertRepository: Repository<AIAlert>
  ) {}

  /**
   * Record AI performance metrics snapshot.
   * Stores current performance indicators for trending and analysis.
   *
   * @param metricsData - The metrics data to record
   * @param metricsData.generationSuccessRate - Success rate (0-1)
   * @param metricsData.averageConfidenceScore - Average confidence (0-1)
   * @param metricsData.parentSatisfactionRating - Parent satisfaction (1-5)
   * @param metricsData.contentFlagRate - Content flag rate (0-1)
   * @param metricsData.humanReviewRate - Human review rate (0-1)
   * @param metricsData.averageResponseTime - Response time in ms
   * @param metricsData.totalGenerations - Total generation count
   * @returns Promise resolving to saved metrics entity
   *
   * @example
   * ```typescript
   * const metrics = await service.recordMetrics({
   *   generationSuccessRate: 0.95,
   *   averageConfidenceScore: 0.85,
   *   parentSatisfactionRating: 4.5,
   *   contentFlagRate: 0.02,
   *   humanReviewRate: 0.05,
   *   averageResponseTime: 1200,
   *   totalGenerations: 1000
   * });
   * ```
   */
  async recordMetrics(metricsData: {
    generationSuccessRate: number;
    averageConfidenceScore: number;
    parentSatisfactionRating: number;
    contentFlagRate: number;
    humanReviewRate: number;
    averageResponseTime: number;
    totalGenerations: number;
  }): Promise<AIMetrics> {
    const metrics = this.metricsRepository.create(metricsData);
    return await this.metricsRepository.save(metrics);
  }

  /**
   * Check metrics against alert thresholds and create alerts for breaches.
   * Implements story-defined thresholds for quality assurance.
   *
   * @param metrics - Current metrics to check
   * @param metrics.averageConfidenceScore - Average confidence (0-1)
   * @param metrics.parentSatisfactionRating - Parent satisfaction (1-5)
   * @param metrics.contentFlagRate - Content flag rate (0-1)
   * @param metrics.humanReviewRate - Human review rate (0-1)
   * @returns Promise resolving to array of created alerts
   *
   * @example
   * ```typescript
   * const alerts = await service.checkAlertThresholds({
   *   averageConfidenceScore: 0.75, // Below 0.8 threshold
   *   parentSatisfactionRating: 4.5,
   *   contentFlagRate: 0.02,
   *   humanReviewRate: 0.05
   * });
   * // alerts contains AI_CONFIDENCE_LOW alert
   * ```
   */
  async checkAlertThresholds(metrics: {
    averageConfidenceScore: number;
    parentSatisfactionRating: number;
    contentFlagRate: number;
    humanReviewRate: number;
  }): Promise<AIAlert[]> {
    const alerts: AIAlert[] = [];

    // Check confidence score threshold
    if (
      metrics.averageConfidenceScore < ALERT_THRESHOLDS.MIN_CONFIDENCE_SCORE
    ) {
      const alert = this.alertRepository.create({
        alertType: 'AI_CONFIDENCE_LOW',
        severity: 'HIGH',
        message: `Average AI confidence score dropped to ${metrics.averageConfidenceScore} (threshold: ${ALERT_THRESHOLDS.MIN_CONFIDENCE_SCORE})`,
        metrics,
        isResolved: false,
      });
      alerts.push(await this.alertRepository.save(alert));
    }

    // Check parent satisfaction threshold
    if (
      metrics.parentSatisfactionRating <
      ALERT_THRESHOLDS.MIN_PARENT_SATISFACTION
    ) {
      const alert = this.alertRepository.create({
        alertType: 'PARENT_SATISFACTION_LOW',
        severity: 'MEDIUM',
        message: `Parent satisfaction dropped to ${metrics.parentSatisfactionRating} (threshold: ${ALERT_THRESHOLDS.MIN_PARENT_SATISFACTION})`,
        metrics,
        isResolved: false,
      });
      alerts.push(await this.alertRepository.save(alert));
    }

    // Check content flag rate threshold
    if (metrics.contentFlagRate > ALERT_THRESHOLDS.MAX_CONTENT_FLAG_RATE) {
      const alert = this.alertRepository.create({
        alertType: 'CONTENT_FLAG_RATE_HIGH',
        severity: 'HIGH',
        message: `Content flag rate increased to ${metrics.contentFlagRate} (threshold: ${ALERT_THRESHOLDS.MAX_CONTENT_FLAG_RATE})`,
        metrics,
        isResolved: false,
      });
      alerts.push(await this.alertRepository.save(alert));
    }

    // Check human review rate threshold
    if (metrics.humanReviewRate > ALERT_THRESHOLDS.MAX_HUMAN_REVIEW_RATE) {
      const alert = this.alertRepository.create({
        alertType: 'HUMAN_REVIEW_RATE_HIGH',
        severity: 'MEDIUM',
        message: `Human review rate increased to ${metrics.humanReviewRate} (threshold: ${ALERT_THRESHOLDS.MAX_HUMAN_REVIEW_RATE})`,
        metrics,
        isResolved: false,
      });
      alerts.push(await this.alertRepository.save(alert));
    }

    return alerts;
  }

  /**
   * Retrieve metrics trend for a time period.
   * Returns metrics snapshots ordered chronologically for trending analysis.
   *
   * @param startDate - Start of time period
   * @param endDate - End of time period
   * @returns Promise resolving to array of metrics snapshots
   *
   * @example
   * ```typescript
   * const trend = await service.getMetricsTrend(
   *   new Date('2025-11-01'),
   *   new Date('2025-11-12')
   * );
   * // Returns metrics snapshots for time period
   * ```
   */
  async getMetricsTrend(startDate: Date, endDate: Date): Promise<AIMetrics[]> {
    return await this.metricsRepository.find({
      where: {
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'ASC' },
    });
  }

  /**
   * Retrieve all active (unresolved) alerts.
   * Returns alerts ordered by creation time (newest first).
   *
   * @returns Promise resolving to array of active alerts
   *
   * @example
   * ```typescript
   * const activeAlerts = await service.getActiveAlerts();
   * // Returns unresolved alerts, newest first
   * ```
   */
  async getActiveAlerts(): Promise<AIAlert[]> {
    return await this.alertRepository.find({
      where: { isResolved: false },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Mark an alert as resolved with resolution notes.
   * Updates alert status and records resolution timestamp.
   *
   * @param alertId - UUID of alert to resolve
   * @param resolutionNotes - Notes describing how alert was resolved
   * @returns Promise that resolves when alert is updated
   *
   * @example
   * ```typescript
   * await service.resolveAlert(
   *   'alert-uuid-123',
   *   'AI model retrained with improved dataset'
   * );
   * ```
   */
  async resolveAlert(alertId: string, resolutionNotes: string): Promise<void> {
    await this.alertRepository
      .createQueryBuilder()
      .update(AIAlert)
      .set({
        isResolved: true,
        resolutionNotes,
        resolvedAt: new Date(),
      })
      .where('id = :alertId', { alertId })
      .execute();
  }

  /**
   * Calculate aggregated statistics for dashboard display.
   * Computes averages and totals across recent metrics snapshots.
   *
   * @returns Promise resolving to dashboard statistics
   *
   * @example
   * ```typescript
   * const stats = await service.calculateDashboardStats();
   * // Returns: { averageConfidence: 0.85, averageSatisfaction: 4.3, ... }
   * ```
   */
  async calculateDashboardStats(): Promise<{
    averageConfidence: number | null;
    averageSatisfaction: number | null;
    averageFlagRate: number | null;
    averageReviewRate: number | null;
    totalGenerations: number;
  }> {
    const result = await this.metricsRepository
      .createQueryBuilder('metrics')
      .select('AVG(metrics.averageConfidenceScore)', 'avgConfidence')
      .addSelect('AVG(metrics.parentSatisfactionRating)', 'avgSatisfaction')
      .addSelect('AVG(metrics.contentFlagRate)', 'avgFlagRate')
      .addSelect('AVG(metrics.humanReviewRate)', 'avgReviewRate')
      .addSelect('SUM(metrics.totalGenerations)', 'totalGenerations')
      .getRawOne();

    return {
      averageConfidence: result.avgConfidence
        ? parseFloat(result.avgConfidence)
        : null,
      averageSatisfaction: result.avgSatisfaction
        ? parseFloat(result.avgSatisfaction)
        : null,
      averageFlagRate: result.avgFlagRate
        ? parseFloat(result.avgFlagRate)
        : null,
      averageReviewRate: result.avgReviewRate
        ? parseFloat(result.avgReviewRate)
        : null,
      totalGenerations: result.totalGenerations
        ? parseInt(result.totalGenerations, 10)
        : 0,
    };
  }
}
