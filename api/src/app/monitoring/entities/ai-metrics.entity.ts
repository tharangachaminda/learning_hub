import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

/**
 * Entity for storing AI performance metrics snapshots.
 * Tracks key performance indicators for AI-generated content quality,
 * parent satisfaction, and system health metrics over time.
 *
 * @class AIMetrics
 */
@Entity('ai_metrics')
@Index(['timestamp'])
export class AIMetrics {
  /**
   * Unique identifier for the metrics snapshot
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Success rate of AI question generation (0-1)
   * Percentage of successful generations vs. total attempts
   */
  @Column('decimal', { precision: 5, scale: 4 })
  generationSuccessRate: number;

  /**
   * Average AI confidence score across all generations (0-1)
   * Measures AI's self-assessed quality of outputs
   */
  @Column('decimal', { precision: 5, scale: 4 })
  averageConfidenceScore: number;

  /**
   * Average parent satisfaction rating (1-5 scale)
   * Based on parent feedback submissions
   */
  @Column('decimal', { precision: 3, scale: 2 })
  parentSatisfactionRating: number;

  /**
   * Rate of content flagged for review (0-1)
   * Percentage of generated content requiring human review
   */
  @Column('decimal', { precision: 5, scale: 4 })
  contentFlagRate: number;

  /**
   * Rate of content requiring human review (0-1)
   * Percentage of content sent to human review workflow
   */
  @Column('decimal', { precision: 5, scale: 4 })
  humanReviewRate: number;

  /**
   * Average response time for AI generation in milliseconds
   */
  @Column('int')
  averageResponseTime: number;

  /**
   * Total number of generations in this snapshot period
   */
  @Column('int')
  totalGenerations: number;

  /**
   * Timestamp when metrics were recorded
   */
  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}
