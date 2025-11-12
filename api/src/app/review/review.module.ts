import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HumanReviewService } from './human-review.service';
import { ReviewItem } from './entities/review-item.entity';

/**
 * Module for human review workflow management.
 * Provides services for queuing AI-generated content for review,
 * assigning reviewers, and tracking review decisions.
 *
 * @module ReviewModule
 */
@Module({
  imports: [TypeOrmModule.forFeature([ReviewItem])],
  providers: [HumanReviewService],
  exports: [HumanReviewService],
})
export class ReviewModule {}
