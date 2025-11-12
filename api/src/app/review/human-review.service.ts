import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ReviewItem,
  ReviewPriority,
  ReviewStatus,
} from './entities/review-item.entity';
import { QualityAssessment } from '../ai/quality-assessment.types';

/**
 * Service for managing human review workflow.
 * Queues AI-generated content for review, assigns reviewers,
 * and tracks review decisions.
 *
 * @class HumanReviewService
 */
@Injectable()
export class HumanReviewService {
  constructor(
    @InjectRepository(ReviewItem)
    private readonly reviewRepository: Repository<ReviewItem>
  ) {}

  /**
   * Queue content for human review based on quality assessment.
   * Automatically calculates priority based on quality flags and scores.
   *
   * @param questionData - Question data to review
   * @param questionData.questionId - UUID of the question
   * @param questionData.questionText - Question text
   * @param questionData.correctAnswer - Correct answer
   * @param assessment - Quality assessment that triggered review
   * @returns Promise resolving to saved review item
   *
   * @example
   * ```typescript
   * const review = await service.queueForReview(
   *   {
   *     questionId: 'q-123',
   *     questionText: '2 + 2 = ?',
   *     correctAnswer: '4'
   *   },
   *   qualityAssessment
   * );
   * // review.priority calculated based on flags and quality score
   * ```
   */
  async queueForReview(
    questionData: {
      questionId: string;
      questionText: string;
      correctAnswer: string;
    },
    assessment: QualityAssessment
  ): Promise<ReviewItem> {
    const priority = this.calculateReviewPriority(assessment);

    const reviewItem = this.reviewRepository.create({
      questionId: questionData.questionId,
      questionText: questionData.questionText,
      correctAnswer: questionData.correctAnswer,
      qualityAssessment: assessment,
      priority,
      reviewStatus: 'PENDING',
    });

    return await this.reviewRepository.save(reviewItem);
  }

  /**
   * Calculate review priority based on quality assessment.
   * Uses story-defined logic: CRITICAL flags → URGENT, HIGH flags or quality < 0.6 → HIGH,
   * quality < 0.8 → MEDIUM, otherwise → LOW.
   *
   * @param assessment - Quality assessment to evaluate
   * @returns Calculated priority level
   *
   * @example
   * ```typescript
   * const priority = service.calculateReviewPriority(assessment);
   * // Returns 'URGENT' for CRITICAL flags
   * // Returns 'HIGH' for HIGH flags or quality < 0.6
   * // Returns 'MEDIUM' for quality 0.6-0.8
   * // Returns 'LOW' for quality >= 0.8
   * ```
   */
  private calculateReviewPriority(
    assessment: QualityAssessment
  ): ReviewPriority {
    const criticalFlags = assessment.flags.filter(
      (f) => f.severity === 'CRITICAL'
    );
    const highFlags = assessment.flags.filter((f) => f.severity === 'HIGH');

    if (criticalFlags.length > 0) return 'URGENT';
    if (highFlags.length > 0 || assessment.overallQuality < 0.6) return 'HIGH';
    if (assessment.overallQuality < 0.8) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Retrieve all pending review items ordered by priority.
   * URGENT items appear first, then HIGH, MEDIUM, LOW.
   *
   * @returns Promise resolving to array of pending review items
   *
   * @example
   * ```typescript
   * const pending = await service.getPendingReviews();
   * // Returns reviews ordered: URGENT → HIGH → MEDIUM → LOW
   * ```
   */
  async getPendingReviews(): Promise<ReviewItem[]> {
    return await this.reviewRepository.find({
      where: { reviewStatus: 'PENDING' },
      order: {
        priority: 'DESC', // URGENT=4, HIGH=3, MEDIUM=2, LOW=1 when alphabetically reversed
        createdAt: 'ASC',
      },
    });
  }

  /**
   * Retrieve reviews filtered by specific priority level.
   * Returns only pending reviews of the specified priority.
   *
   * @param priority - Priority level to filter by
   * @returns Promise resolving to filtered review items
   *
   * @example
   * ```typescript
   * const urgentReviews = await service.getReviewsByPriority('URGENT');
   * // Returns only URGENT pending reviews
   * ```
   */
  async getReviewsByPriority(priority: ReviewPriority): Promise<ReviewItem[]> {
    return await this.reviewRepository.find({
      where: {
        priority,
        reviewStatus: 'PENDING',
      },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Assign review to a reviewer and update status to IN_REVIEW.
   * Records reviewer ID and assignment timestamp.
   *
   * @param reviewId - UUID of review item to assign
   * @param reviewerId - UUID of reviewer to assign
   * @returns Promise that resolves when assignment is complete
   *
   * @example
   * ```typescript
   * await service.assignReview('review-uuid', 'reviewer-uuid');
   * // Review status → IN_REVIEW, reviewerId set, reviewStartedAt recorded
   * ```
   */
  async assignReview(reviewId: string, reviewerId: string): Promise<void> {
    await this.reviewRepository
      .createQueryBuilder()
      .update(ReviewItem)
      .set({
        reviewStatus: 'IN_REVIEW',
        reviewerId,
        reviewStartedAt: new Date(),
      })
      .where('id = :reviewId', { reviewId })
      .execute();
  }

  /**
   * Mark review as approved with reviewer notes.
   * Updates status to APPROVED and records completion timestamp.
   *
   * @param reviewId - UUID of review item to approve
   * @param reviewerNotes - Notes explaining approval decision
   * @returns Promise that resolves when approval is recorded
   *
   * @example
   * ```typescript
   * await service.approveReview(
   *   'review-uuid',
   *   'Content is accurate and age-appropriate'
   * );
   * ```
   */
  async approveReview(reviewId: string, reviewerNotes: string): Promise<void> {
    await this.reviewRepository
      .createQueryBuilder()
      .update(ReviewItem)
      .set({
        reviewStatus: 'APPROVED',
        reviewerNotes,
        reviewCompletedAt: new Date(),
      })
      .where('id = :reviewId', { reviewId })
      .execute();
  }

  /**
   * Mark review as rejected with rejection reason.
   * Updates status to REJECTED and records completion timestamp.
   *
   * @param reviewId - UUID of review item to reject
   * @param rejectionReason - Reason for rejection
   * @returns Promise that resolves when rejection is recorded
   *
   * @example
   * ```typescript
   * await service.rejectReview(
   *   'review-uuid',
   *   'Mathematical error in solution steps'
   * );
   * ```
   */
  async rejectReview(reviewId: string, rejectionReason: string): Promise<void> {
    await this.reviewRepository
      .createQueryBuilder()
      .update(ReviewItem)
      .set({
        reviewStatus: 'REJECTED',
        reviewerNotes: rejectionReason,
        reviewCompletedAt: new Date(),
      })
      .where('id = :reviewId', { reviewId })
      .execute();
  }

  /**
   * Calculate review queue statistics by priority level.
   * Returns counts of pending reviews for each priority.
   *
   * @returns Promise resolving to review statistics
   *
   * @example
   * ```typescript
   * const stats = await service.getReviewStats();
   * // Returns: { totalPending: 25, urgentCount: 5, highCount: 10, ... }
   * ```
   */
  async getReviewStats(): Promise<{
    totalPending: number;
    urgentCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  }> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('COUNT(*)', 'totalPending')
      .addSelect(
        "SUM(CASE WHEN review.priority = 'URGENT' THEN 1 ELSE 0 END)",
        'urgentCount'
      )
      .addSelect(
        "SUM(CASE WHEN review.priority = 'HIGH' THEN 1 ELSE 0 END)",
        'highCount'
      )
      .addSelect(
        "SUM(CASE WHEN review.priority = 'MEDIUM' THEN 1 ELSE 0 END)",
        'mediumCount'
      )
      .addSelect(
        "SUM(CASE WHEN review.priority = 'LOW' THEN 1 ELSE 0 END)",
        'lowCount'
      )
      .where("review.reviewStatus = 'PENDING'")
      .getRawOne();

    return {
      totalPending: parseInt(result.totalPending, 10),
      urgentCount: parseInt(result.urgentCount || '0', 10),
      highCount: parseInt(result.highCount || '0', 10),
      mediumCount: parseInt(result.mediumCount || '0', 10),
      lowCount: parseInt(result.lowCount || '0', 10),
    };
  }

  /**
   * Retrieve review item by ID.
   * Returns null if review item not found.
   *
   * @param reviewId - UUID of review item to retrieve
   * @returns Promise resolving to review item or null
   *
   * @example
   * ```typescript
   * const review = await service.getReviewById('review-uuid');
   * // Returns review item or null if not found
   * ```
   */
  async getReviewById(reviewId: string): Promise<ReviewItem | null> {
    return await this.reviewRepository.findOne({
      where: { id: reviewId },
    });
  }
}
