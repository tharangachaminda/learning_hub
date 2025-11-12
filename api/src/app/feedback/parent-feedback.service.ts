import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentFeedback } from './entities/parent-feedback.entity';

/**
 * Service for managing parent feedback on AI-generated questions.
 * Provides functionality to collect multi-dimensional ratings, calculate satisfaction scores,
 * and automatically flag low-quality content for review.
 *
 * @class ParentFeedbackService
 */
@Injectable()
export class ParentFeedbackService {
  constructor(
    @InjectRepository(ParentFeedback)
    private readonly feedbackRepository: Repository<ParentFeedback>
  ) {}

  /**
   * Submit parent feedback with multi-dimensional ratings.
   * Automatically calculates overall satisfaction and flags content below 3.0 threshold.
   *
   * @param feedbackData - The feedback data containing ratings and optional comments
   * @param feedbackData.questionId - UUID of the question being rated
   * @param feedbackData.parentId - UUID of the parent submitting feedback
   * @param feedbackData.explanationRating - Rating for explanation quality (1-5)
   * @param feedbackData.helpfulnessRating - Rating for helpfulness (1-5)
   * @param feedbackData.clarityRating - Rating for clarity (1-5)
   * @param feedbackData.ageAppropriateRating - Rating for age appropriateness (1-5)
   * @param feedbackData.comments - Optional text comments from parent
   * @returns Promise resolving to saved ParentFeedback entity with calculated fields
   * @throws Error if rating values are outside 1-5 range
   *
   * @example
   * ```typescript
   * const feedback = await service.submitFeedback({
   *   questionId: 'q-123',
   *   parentId: 'p-456',
   *   explanationRating: 4.5,
   *   helpfulnessRating: 4.0,
   *   clarityRating: 4.5,
   *   ageAppropriateRating: 5.0,
   *   comments: 'Great explanation!'
   * });
   * // feedback.overallSatisfaction = 4.5
   * // feedback.flaggedForReview = false
   * ```
   */
  async submitFeedback(feedbackData: {
    questionId: string;
    parentId: string;
    explanationRating: number;
    helpfulnessRating: number;
    clarityRating: number;
    ageAppropriateRating: number;
    comments?: string;
  }): Promise<ParentFeedback> {
    // Validate rating ranges (1-5)
    const ratings = [
      feedbackData.explanationRating,
      feedbackData.helpfulnessRating,
      feedbackData.clarityRating,
      feedbackData.ageAppropriateRating,
    ];

    for (const rating of ratings) {
      if (rating < 1 || rating > 5) {
        throw new Error(`Rating must be between 1 and 5, got ${rating}`);
      }
    }

    // Calculate overall satisfaction (average of all ratings)
    const overallSatisfaction =
      ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

    // Auto-flag for review if satisfaction < 3.0
    const flaggedForReview = overallSatisfaction < 3.0;

    const feedback = this.feedbackRepository.create({
      ...feedbackData,
      overallSatisfaction,
      flaggedForReview,
    });

    return await this.feedbackRepository.save(feedback);
  }

  /**
   * Retrieve all feedback submissions for a specific question.
   * Results are ordered by submission time (newest first).
   *
   * @param questionId - UUID of the question to get feedback for
   * @returns Promise resolving to array of ParentFeedback entities
   *
   * @example
   * ```typescript
   * const feedback = await service.getFeedbackByQuestion('q-123');
   * // Returns all feedback for question q-123, newest first
   * ```
   */
  async getFeedbackByQuestion(questionId: string): Promise<ParentFeedback[]> {
    return await this.feedbackRepository.find({
      where: { questionId },
      order: { submittedAt: 'DESC' },
    });
  }

  /**
   * Calculate average overall satisfaction score for a question.
   * Returns null if no feedback exists for the question.
   *
   * @param questionId - UUID of the question to calculate average for
   * @returns Promise resolving to average satisfaction score (1-5) or null
   *
   * @example
   * ```typescript
   * const avgSatisfaction = await service.getAverageSatisfaction('q-123');
   * // Returns 4.25 if that's the average, or null if no feedback exists
   * ```
   */
  async getAverageSatisfaction(questionId: string): Promise<number | null> {
    const result = await this.feedbackRepository
      .createQueryBuilder('feedback')
      .where('questionId = :questionId', { questionId })
      .select('AVG(feedback.overallSatisfaction)', 'avg')
      .getRawOne();

    return result.avg ? parseFloat(result.avg) : null;
  }

  /**
   * Retrieve all feedback flagged for human review.
   * Results are ordered by satisfaction score (lowest first).
   *
   * @returns Promise resolving to array of flagged ParentFeedback entities
   *
   * @example
   * ```typescript
   * const flaggedFeedback = await service.getFlaggedFeedback();
   * // Returns all feedback with flaggedForReview=true, lowest scores first
   * ```
   */
  async getFlaggedFeedback(): Promise<ParentFeedback[]> {
    return await this.feedbackRepository.find({
      where: { flaggedForReview: true },
      order: { overallSatisfaction: 'ASC' },
    });
  }

  /**
   * Calculate average ratings for each dimension (explanation, helpfulness, clarity, age-appropriate).
   * Returns null values for dimensions with no feedback.
   *
   * @param questionId - UUID of the question to calculate dimension averages for
   * @returns Promise resolving to object with average ratings for each dimension
   *
   * @example
   * ```typescript
   * const averages = await service.getDimensionAverages('q-123');
   * // Returns: { explanation: 4.5, helpfulness: 4.0, clarity: 4.5, ageAppropriate: 5.0 }
   * ```
   */
  async getDimensionAverages(questionId: string): Promise<{
    explanation: number | null;
    helpfulness: number | null;
    clarity: number | null;
    ageAppropriate: number | null;
  }> {
    const result = await this.feedbackRepository
      .createQueryBuilder('feedback')
      .where('questionId = :questionId', { questionId })
      .select('AVG(feedback.explanationRating)', 'explanationAvg')
      .addSelect('AVG(feedback.helpfulnessRating)', 'helpfulnessAvg')
      .addSelect('AVG(feedback.clarityRating)', 'clarityAvg')
      .addSelect('AVG(feedback.ageAppropriateRating)', 'ageAppropriateAvg')
      .getRawOne();

    return {
      explanation: result.explanationAvg
        ? parseFloat(result.explanationAvg)
        : null,
      helpfulness: result.helpfulnessAvg
        ? parseFloat(result.helpfulnessAvg)
        : null,
      clarity: result.clarityAvg ? parseFloat(result.clarityAvg) : null,
      ageAppropriate: result.ageAppropriateAvg
        ? parseFloat(result.ageAppropriateAvg)
        : null,
    };
  }

  /**
   * Get aggregated statistics for all parent feedback.
   * Includes total feedback count, average satisfaction, flagged count, and flag rate.
   *
   * @returns Promise resolving to feedback statistics object
   *
   * @example
   * ```typescript
   * const stats = await service.getParentFeedbackStats();
   * // Returns: {
   * //   totalFeedback: 150,
   * //   averageSatisfaction: 4.2,
   * //   flaggedCount: 5,
   * //   flagRate: 0.0333
   * // }
   * ```
   */
  async getParentFeedbackStats(): Promise<{
    totalFeedback: number;
    averageSatisfaction: number | null;
    flaggedCount: number;
    flagRate: number;
  }> {
    const result = await this.feedbackRepository
      .createQueryBuilder('feedback')
      .select('COUNT(*)', 'totalCount')
      .addSelect('AVG(feedback.overallSatisfaction)', 'avgSatisfaction')
      .addSelect(
        'SUM(CASE WHEN feedback.flaggedForReview = true THEN 1 ELSE 0 END)',
        'flaggedCount'
      )
      .getRawOne();

    const totalFeedback = parseInt(result.totalCount, 10);
    const flaggedCount = parseInt(result.flaggedCount, 10);

    return {
      totalFeedback,
      averageSatisfaction: result.avgSatisfaction
        ? parseFloat(result.avgSatisfaction)
        : null,
      flaggedCount,
      flagRate: totalFeedback > 0 ? flaggedCount / totalFeedback : 0,
    };
  }
}
