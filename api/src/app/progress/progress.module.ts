/**
 * Progress Tracking Module
 *
 * Provides progress tracking and analytics functionality.
 * Implements User Story US-PT-001: Basic Progress Tracking
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgressTrackingService } from './services/progress-tracking.service';
import { AchievementService } from './services/achievement.service';
import { ProgressController } from './controllers/progress.controller';
import {
  ProgressAttempt,
  ProgressAttemptSchema,
} from './schemas/progress-attempt.schema';

/**
 * Progress module configuration
 *
 * Exports ProgressTrackingService and AchievementService for use in other modules.
 * Controllers added in Step 4.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProgressAttempt.name, schema: ProgressAttemptSchema },
    ]),
  ],
  controllers: [ProgressController],
  providers: [ProgressTrackingService, AchievementService],
  exports: [ProgressTrackingService, AchievementService],
})
export class ProgressModule {}
