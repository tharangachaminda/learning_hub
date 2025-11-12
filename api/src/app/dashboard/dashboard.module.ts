import { Module } from '@nestjs/common';
import { QualityDashboardService } from './quality-dashboard.service';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { FeedbackModule } from '../feedback/feedback.module';
import { ReviewModule } from '../review/review.module';

/**
 * Module for quality dashboard functionality.
 * Aggregates metrics from monitoring, feedback, and review systems
 * to provide unified quality assurance dashboard.
 */
@Module({
  imports: [MonitoringModule, FeedbackModule, ReviewModule],
  providers: [QualityDashboardService],
  exports: [QualityDashboardService],
})
export class DashboardModule {}
