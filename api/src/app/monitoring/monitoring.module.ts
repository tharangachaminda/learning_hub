import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIMonitoringService } from './ai-monitoring.service';
import { AIMetrics } from './entities/ai-metrics.entity';
import { AIAlert } from './entities/ai-alert.entity';

/**
 * Module for AI performance monitoring and alerting.
 * Provides services for tracking metrics, detecting quality degradation,
 * and managing alert workflows.
 *
 * @module MonitoringModule
 */
@Module({
  imports: [TypeOrmModule.forFeature([AIMetrics, AIAlert])],
  providers: [AIMonitoringService],
  exports: [AIMonitoringService],
})
export class MonitoringModule {}
