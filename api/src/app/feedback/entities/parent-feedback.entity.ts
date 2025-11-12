import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Parent feedback entity for collecting quality ratings on AI-generated content.
 * Supports AC-003 (Parent rating and feedback system) from Story US-AI-006.
 *
 * @example
 * ```typescript
 * const feedback = new ParentFeedback();
 * feedback.questionId = 'q-123';
 * feedback.explanationRating = 4.5;
 * feedback.overallSatisfaction = 4.0;
 * ```
 */
@Entity('parent_feedback')
@Index(['questionId'])
@Index(['parentId'])
@Index(['submittedAt'])
export class ParentFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  questionId: string;

  @Column()
  @Index()
  parentId: string;

  /**
   * Rating for explanation quality (1-5 stars)
   */
  @Column('decimal', { precision: 2, scale: 1 })
  explanationRating: number;

  /**
   * Rating for helpfulness (1-5 stars)
   */
  @Column('decimal', { precision: 2, scale: 1 })
  helpfulnessRating: number;

  /**
   * Rating for clarity (1-5 stars)
   */
  @Column('decimal', { precision: 2, scale: 1 })
  clarityRating: number;

  /**
   * Rating for age-appropriateness (1-5 stars)
   */
  @Column('decimal', { precision: 2, scale: 1 })
  ageAppropriateRating: number;

  /**
   * Overall satisfaction score (1-5 stars, calculated)
   */
  @Column('decimal', { precision: 2, scale: 1 })
  overallSatisfaction: number;

  /**
   * Optional text comments from parent
   */
  @Column('text', { nullable: true })
  comments?: string;

  /**
   * Whether this feedback triggered a quality flag
   */
  @Column({ default: false })
  flaggedForReview: boolean;

  @CreateDateColumn()
  submittedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
