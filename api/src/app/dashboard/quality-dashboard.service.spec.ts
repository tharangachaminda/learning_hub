import { Test, TestingModule } from '@nestjs/testing';
import { QualityDashboardService } from './quality-dashboard.service';
import { AIMonitoringService } from '../monitoring/ai-monitoring.service';
import { ParentFeedbackService } from '../feedback/parent-feedback.service';
import { HumanReviewService } from '../review/human-review.service';

describe('QualityDashboardService', () => {
  let service: QualityDashboardService;
  let monitoringService: AIMonitoringService;
  let feedbackService: ParentFeedbackService;
  let reviewService: HumanReviewService;

  const mockMonitoringService = {
    calculateDashboardStats: jest.fn(),
    getMetricsTrend: jest.fn(),
    getActiveAlerts: jest.fn(),
  };

  const mockFeedbackService = {
    getParentFeedbackStats: jest.fn(),
  };

  const mockReviewService = {
    getReviewStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QualityDashboardService,
        {
          provide: AIMonitoringService,
          useValue: mockMonitoringService,
        },
        {
          provide: ParentFeedbackService,
          useValue: mockFeedbackService,
        },
        {
          provide: HumanReviewService,
          useValue: mockReviewService,
        },
      ],
    }).compile();

    service = module.get<QualityDashboardService>(QualityDashboardService);
    monitoringService = module.get<AIMonitoringService>(AIMonitoringService);
    feedbackService = module.get<ParentFeedbackService>(ParentFeedbackService);
    reviewService = module.get<HumanReviewService>(HumanReviewService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverallQualityMetrics', () => {
    it('should aggregate metrics from all sources', async () => {
      mockMonitoringService.calculateDashboardStats.mockResolvedValue({
        averageConfidence: 0.85,
        averageSatisfaction: 4.3,
        averageFlagRate: 0.03,
        averageReviewRate: 0.08,
        totalGenerations: 5000,
      });

      mockFeedbackService.getParentFeedbackStats.mockResolvedValue({
        totalFeedback: 150,
        averageSatisfaction: 4.3,
        flaggedCount: 5,
        flagRate: 0.0333,
      });

      mockReviewService.getReviewStats.mockResolvedValue({
        totalPending: 25,
        urgentCount: 5,
        highCount: 10,
        mediumCount: 7,
        lowCount: 3,
      });

      mockMonitoringService.getActiveAlerts.mockResolvedValue([
        { id: 'a-1', alertType: 'AI_CONFIDENCE_LOW', severity: 'HIGH' },
      ]);

      const result = await service.getOverallQualityMetrics();

      expect(result.aiPerformance.averageConfidence).toBe(0.85);
      expect(result.aiPerformance.totalGenerations).toBe(5000);
      expect(result.parentFeedback.totalFeedback).toBe(150);
      expect(result.parentFeedback.averageSatisfaction).toBe(4.3);
      expect(result.reviewQueue.totalPending).toBe(25);
      expect(result.reviewQueue.urgentCount).toBe(5);
      expect(result.alerts.activeAlertsCount).toBe(1);
      expect(mockMonitoringService.calculateDashboardStats).toHaveBeenCalled();
      expect(mockFeedbackService.getParentFeedbackStats).toHaveBeenCalled();
      expect(mockReviewService.getReviewStats).toHaveBeenCalled();
    });

    it('should handle empty data gracefully', async () => {
      mockMonitoringService.calculateDashboardStats.mockResolvedValue({
        averageConfidence: null,
        averageSatisfaction: null,
        averageFlagRate: null,
        averageReviewRate: null,
        totalGenerations: 0,
      });

      mockFeedbackService.getParentFeedbackStats.mockResolvedValue({
        totalFeedback: 0,
        averageSatisfaction: null,
        flaggedCount: 0,
        flagRate: 0,
      });

      mockReviewService.getReviewStats.mockResolvedValue({
        totalPending: 0,
        urgentCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
      });

      mockMonitoringService.getActiveAlerts.mockResolvedValue([]);

      const result = await service.getOverallQualityMetrics();

      expect(result.aiPerformance.totalGenerations).toBe(0);
      expect(result.parentFeedback.totalFeedback).toBe(0);
      expect(result.reviewQueue.totalPending).toBe(0);
      expect(result.alerts.activeAlertsCount).toBe(0);
    });
  });

  describe('getQualityTrends', () => {
    it('should retrieve quality metrics over time period', async () => {
      const startDate = new Date('2025-11-01');
      const endDate = new Date('2025-11-12');

      const mockMetrics = [
        {
          id: 'm-1',
          averageConfidenceScore: 0.85,
          parentSatisfactionRating: 4.3,
          contentFlagRate: 0.03,
          humanReviewRate: 0.08,
          timestamp: new Date('2025-11-10'),
        },
        {
          id: 'm-2',
          averageConfidenceScore: 0.87,
          parentSatisfactionRating: 4.5,
          contentFlagRate: 0.02,
          humanReviewRate: 0.06,
          timestamp: new Date('2025-11-11'),
        },
      ];

      mockMonitoringService.getMetricsTrend.mockResolvedValue(mockMetrics);

      const result = await service.getQualityTrends(startDate, endDate);

      expect(mockMonitoringService.getMetricsTrend).toHaveBeenCalledWith(
        startDate,
        endDate
      );
      expect(result).toHaveLength(2);
      expect(result[0].averageConfidenceScore).toBe(0.85);
      expect(result[1].averageConfidenceScore).toBe(0.87);
    });

    it('should return empty array for no data in period', async () => {
      mockMonitoringService.getMetricsTrend.mockResolvedValue([]);

      const result = await service.getQualityTrends(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      expect(result).toEqual([]);
    });
  });

  describe('getHealthScore', () => {
    it('should calculate overall health score from metrics', async () => {
      mockMonitoringService.calculateDashboardStats.mockResolvedValue({
        averageConfidence: 0.85,
        averageSatisfaction: 4.3,
        averageFlagRate: 0.03,
        averageReviewRate: 0.08,
        totalGenerations: 5000,
      });

      mockFeedbackService.getParentFeedbackStats.mockResolvedValue({
        totalFeedback: 150,
        averageSatisfaction: 4.3,
        flaggedCount: 5,
        flagRate: 0.0333,
      });

      mockReviewService.getReviewStats.mockResolvedValue({
        totalPending: 25,
        urgentCount: 5,
        highCount: 10,
        mediumCount: 7,
        lowCount: 3,
      });

      const result = await service.getHealthScore();

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.components).toHaveProperty('aiConfidence');
      expect(result.components).toHaveProperty('parentSatisfaction');
      expect(result.components).toHaveProperty('contentQuality');
      expect(result.components).toHaveProperty('reviewBacklog');
      expect(result.status).toMatch(/EXCELLENT|GOOD|WARNING|CRITICAL/);
    });

    it('should return CRITICAL status for very low scores', async () => {
      mockMonitoringService.calculateDashboardStats.mockResolvedValue({
        averageConfidence: 0.5,
        averageSatisfaction: 2.5,
        averageFlagRate: 0.15,
        averageReviewRate: 0.25,
        totalGenerations: 1000,
      });

      mockFeedbackService.getParentFeedbackStats.mockResolvedValue({
        totalFeedback: 50,
        averageSatisfaction: 2.5,
        flaggedCount: 20,
        flagRate: 0.4,
      });

      mockReviewService.getReviewStats.mockResolvedValue({
        totalPending: 100,
        urgentCount: 40,
        highCount: 35,
        mediumCount: 20,
        lowCount: 5,
      });

      const result = await service.getHealthScore();

      expect(result.status).toBe('CRITICAL');
      expect(result.overallScore).toBeLessThan(50);
    });

    it('should return EXCELLENT status for high scores', async () => {
      mockMonitoringService.calculateDashboardStats.mockResolvedValue({
        averageConfidence: 0.95,
        averageSatisfaction: 4.8,
        averageFlagRate: 0.01,
        averageReviewRate: 0.02,
        totalGenerations: 5000,
      });

      mockFeedbackService.getParentFeedbackStats.mockResolvedValue({
        totalFeedback: 200,
        averageSatisfaction: 4.8,
        flaggedCount: 2,
        flagRate: 0.01,
      });

      mockReviewService.getReviewStats.mockResolvedValue({
        totalPending: 5,
        urgentCount: 0,
        highCount: 1,
        mediumCount: 2,
        lowCount: 2,
      });

      const result = await service.getHealthScore();

      expect(result.status).toBe('EXCELLENT');
      expect(result.overallScore).toBeGreaterThan(90);
    });
  });

  describe('getAlertsSummary', () => {
    it('should return active alerts grouped by severity', async () => {
      const mockAlerts = [
        {
          id: 'a-1',
          alertType: 'AI_CONFIDENCE_LOW',
          severity: 'HIGH',
          createdAt: new Date(),
        },
        {
          id: 'a-2',
          alertType: 'PARENT_SATISFACTION_LOW',
          severity: 'MEDIUM',
          createdAt: new Date(),
        },
        {
          id: 'a-3',
          alertType: 'CONTENT_FLAG_RATE_HIGH',
          severity: 'HIGH',
          createdAt: new Date(),
        },
      ];

      mockMonitoringService.getActiveAlerts.mockResolvedValue(mockAlerts);

      const result = await service.getAlertsSummary();

      expect(result.totalAlerts).toBe(3);
      expect(result.bySeverity.HIGH).toBe(2);
      expect(result.bySeverity.MEDIUM).toBe(1);
      expect(result.alerts).toHaveLength(3);
    });

    it('should return empty summary when no alerts', async () => {
      mockMonitoringService.getActiveAlerts.mockResolvedValue([]);

      const result = await service.getAlertsSummary();

      expect(result.totalAlerts).toBe(0);
      expect(result.bySeverity.CRITICAL).toBe(0);
      expect(result.bySeverity.HIGH).toBe(0);
      expect(result.bySeverity.MEDIUM).toBe(0);
      expect(result.bySeverity.LOW).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should retrieve dashboard metrics in less than 500ms', async () => {
      mockMonitoringService.calculateDashboardStats.mockResolvedValue({
        averageConfidence: 0.85,
        averageSatisfaction: 4.3,
        averageFlagRate: 0.03,
        averageReviewRate: 0.08,
        totalGenerations: 5000,
      });

      mockFeedbackService.getParentFeedbackStats.mockResolvedValue({
        totalFeedback: 150,
        averageSatisfaction: 4.3,
        flaggedCount: 5,
        flagRate: 0.0333,
      });

      mockReviewService.getReviewStats.mockResolvedValue({
        totalPending: 25,
        urgentCount: 5,
        highCount: 10,
        mediumCount: 7,
        lowCount: 3,
      });

      mockMonitoringService.getActiveAlerts.mockResolvedValue([]);

      const start = Date.now();
      await service.getOverallQualityMetrics();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    });
  });
});
