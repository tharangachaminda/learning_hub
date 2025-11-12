import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

/**
 * Alert types for AI monitoring system.
 * Defines categories of quality degradation that trigger alerts.
 */
export type AlertType =
  | 'AI_CONFIDENCE_LOW'
  | 'PARENT_SATISFACTION_LOW'
  | 'CONTENT_FLAG_RATE_HIGH'
  | 'HUMAN_REVIEW_RATE_HIGH'
  | 'RESPONSE_TIME_HIGH'
  | 'GENERATION_FAILURE_HIGH';

/**
 * Alert severity levels for prioritization and response.
 */
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Entity for storing AI monitoring alerts.
 * Records quality threshold breaches and tracks resolution status.
 *
 * @class AIAlert
 */
@Entity('ai_alerts')
@Index(['isResolved', 'createdAt'])
@Index(['alertType'])
export class AIAlert {
  /**
   * Unique identifier for the alert
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Type of alert triggered
   */
  @Column({
    type: 'varchar',
    length: 50,
  })
  alertType: AlertType;

  /**
   * Severity level of the alert
   */
  @Column({
    type: 'varchar',
    length: 20,
  })
  severity: AlertSeverity;

  /**
   * Human-readable alert message
   */
  @Column('text')
  message: string;

  /**
   * Metrics snapshot at time of alert
   */
  @Column('jsonb')
  metrics: Record<string, any>;

  /**
   * Whether alert has been resolved
   */
  @Column('boolean', { default: false })
  isResolved: boolean;

  /**
   * Notes about alert resolution
   */
  @Column('text', { nullable: true })
  resolutionNotes?: string;

  /**
   * Timestamp when alert was created
   */
  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  /**
   * Timestamp when alert was resolved
   */
  @Column('timestamp', { nullable: true })
  resolvedAt?: Date;
}
