import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { QualityAssessment } from '../../ai/quality-assessment.types';

/**
 * Review priority levels for human review workflow.
 * Determines urgency and order of review processing.
 */
export type ReviewPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * Review status tracking for workflow progression.
 */
export type ReviewStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

/**
 * Entity for storing human review queue items.
 * Manages workflow for reviewing AI-generated content flagged for quality concerns.
 *
 * @class ReviewItem
 */
@Entity('review_items')
@Index(['reviewStatus', 'priority', 'createdAt'])
@Index(['reviewerId'])
export class ReviewItem {
  /**
   * Unique identifier for the review item
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the question being reviewed
   */
  @Column('uuid')
  @Index()
  questionId: string;

  /**
   * Question text for reviewer reference
   */
  @Column('text')
  questionText: string;

  /**
   * Correct answer for reviewer reference
   */
  @Column('varchar', { length: 100 })
  correctAnswer: string;

  /**
   * Quality assessment that triggered review
   */
  @Column('jsonb')
  qualityAssessment: QualityAssessment;

  /**
   * Priority level for review processing
   */
  @Column({
    type: 'varchar',
    length: 20,
  })
  priority: ReviewPriority;

  /**
   * Current status in review workflow
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: 'PENDING',
  })
  reviewStatus: ReviewStatus;

  /**
   * ID of reviewer assigned to this item
   */
  @Column('uuid', { nullable: true })
  reviewerId?: string;

  /**
   * Notes from reviewer about decision
   */
  @Column('text', { nullable: true })
  reviewerNotes?: string;

  /**
   * Timestamp when review item was created
   */
  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  /**
   * Timestamp when review was assigned
   */
  @Column('timestamp', { nullable: true })
  reviewStartedAt?: Date;

  /**
   * Timestamp when review was completed
   */
  @Column('timestamp', { nullable: true })
  reviewCompletedAt?: Date;
}
