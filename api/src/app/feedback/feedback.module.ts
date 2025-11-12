import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentFeedbackService } from './parent-feedback.service';
import { ParentFeedback } from './entities/parent-feedback.entity';

/**
 * Module for managing parent feedback on AI-generated content.
 * Provides services for collecting multi-dimensional ratings, calculating satisfaction scores,
 * and automatically flagging low-quality content for review.
 *
 * @module FeedbackModule
 */
@Module({
  imports: [TypeOrmModule.forFeature([ParentFeedback])],
  providers: [ParentFeedbackService],
  exports: [ParentFeedbackService],
})
export class FeedbackModule {}
