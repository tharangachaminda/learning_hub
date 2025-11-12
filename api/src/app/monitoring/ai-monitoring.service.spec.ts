import { Test, TestingModule } from '@nestjs/testing';
import { AIMonitoringService } from './ai-monitoring.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AIMetrics } from './entities/ai-metrics.entity';
import { AIAlert } from './entities/ai-alert.entity';

describe('AIMonitoringService', () => {
  let service: AIMonitoringService;
  let metricsRepository: Repository<AIMetrics>;
  let alertRepository: Repository<AIAlert>;

  const mockMetricsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAlertRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIMonitoringService,
        {
          provide: getRepositoryToken(AIMetrics),
          useValue: mockMetricsRepository,
        },
        {
          provide: getRepositoryToken(AIAlert),
          useValue: mockAlertRepository,
        },
      ],
    }).compile();

    service = module.get<AIMonitoringService>(AIMonitoringService);
    metricsRepository = module.get<Repository<AIMetrics>>(
      getRepositoryToken(AIMetrics)
    );
    alertRepository = module.get<Repository<AIAlert>>(
      getRepositoryToken(AIAlert)
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordMetrics', () => {
    it('should save AI performance metrics snapshot', async () => {
      const metricsData = {
        generationSuccessRate: 0.95,
        averageConfidenceScore: 0.85,
        parentSatisfactionRating: 4.5,
        contentFlagRate: 0.02,
        humanReviewRate: 0.05,
        averageResponseTime: 1200,
        totalGenerations: 1000,
      };

      const savedMetrics = {
        ...metricsData,
        id: 'm-123',
        timestamp: new Date(),
      };

      mockMetricsRepository.create.mockReturnValue(savedMetrics);
      mockMetricsRepository.save.mockResolvedValue(savedMetrics);

      const result = await service.recordMetrics(metricsData);

      expect(mockMetricsRepository.create).toHaveBeenCalledWith(metricsData);
      expect(mockMetricsRepository.save).toHaveBeenCalled();
      expect(result.averageConfidenceScore).toBe(0.85);
      expect(result.timestamp).toBeDefined();
    });

    it('should handle zero generations gracefully', async () => {
      const metricsData = {
        generationSuccessRate: 0,
        averageConfidenceScore: 0,
        parentSatisfactionRating: 0,
        contentFlagRate: 0,
        humanReviewRate: 0,
        averageResponseTime: 0,
        totalGenerations: 0,
      };

      const savedMetrics = {
        ...metricsData,
        id: 'm-456',
        timestamp: new Date(),
      };

      mockMetricsRepository.create.mockReturnValue(savedMetrics);
      mockMetricsRepository.save.mockResolvedValue(savedMetrics);

      const result = await service.recordMetrics(metricsData);

      expect(result.totalGenerations).toBe(0);
      expect(result).toBeDefined();
    });
  });

  describe('checkAlertThresholds', () => {
    it('should create alert when confidence score drops below 0.8', async () => {
      const metrics = {
        averageConfidenceScore: 0.75,
        parentSatisfactionRating: 4.5,
        contentFlagRate: 0.02,
        humanReviewRate: 0.05,
      };

      const savedAlert = {
        id: 'a-123',
        alertType: 'AI_CONFIDENCE_LOW',
        severity: 'HIGH',
        message: 'Average AI confidence score dropped to 0.75 (threshold: 0.8)',
        metrics: metrics,
        isResolved: false,
        createdAt: new Date(),
      };

      mockAlertRepository.create.mockReturnValue(savedAlert);
      mockAlertRepository.save.mockResolvedValue(savedAlert);

      const alerts = await service.checkAlertThresholds(metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].alertType).toBe('AI_CONFIDENCE_LOW');
      expect(alerts[0].severity).toBe('HIGH');
      expect(mockAlertRepository.save).toHaveBeenCalled();
    });

    it('should create alert when parent satisfaction drops below 4.0', async () => {
      const metrics = {
        averageConfidenceScore: 0.85,
        parentSatisfactionRating: 3.5,
        contentFlagRate: 0.02,
        humanReviewRate: 0.05,
      };

      mockAlertRepository.create.mockReturnValue({});
      mockAlertRepository.save.mockResolvedValue({
        alertType: 'PARENT_SATISFACTION_LOW',
      });

      const alerts = await service.checkAlertThresholds(metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].alertType).toBe('PARENT_SATISFACTION_LOW');
    });

    it('should create alert when content flag rate exceeds 0.05', async () => {
      const metrics = {
        averageConfidenceScore: 0.85,
        parentSatisfactionRating: 4.5,
        contentFlagRate: 0.08,
        humanReviewRate: 0.05,
      };

      mockAlertRepository.create.mockReturnValue({});
      mockAlertRepository.save.mockResolvedValue({
        alertType: 'CONTENT_FLAG_RATE_HIGH',
      });

      const alerts = await service.checkAlertThresholds(metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].alertType).toBe('CONTENT_FLAG_RATE_HIGH');
    });

    it('should create alert when human review rate exceeds 0.15', async () => {
      const metrics = {
        averageConfidenceScore: 0.85,
        parentSatisfactionRating: 4.5,
        contentFlagRate: 0.02,
        humanReviewRate: 0.2,
      };

      mockAlertRepository.create.mockReturnValue({});
      mockAlertRepository.save.mockResolvedValue({
        alertType: 'HUMAN_REVIEW_RATE_HIGH',
      });

      const alerts = await service.checkAlertThresholds(metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].alertType).toBe('HUMAN_REVIEW_RATE_HIGH');
    });

    it('should create multiple alerts when multiple thresholds breached', async () => {
      const metrics = {
        averageConfidenceScore: 0.7,
        parentSatisfactionRating: 3.0,
        contentFlagRate: 0.1,
        humanReviewRate: 0.2,
      };

      mockAlertRepository.create.mockReturnValue({});
      mockAlertRepository.save.mockResolvedValue({});

      const alerts = await service.checkAlertThresholds(metrics);

      expect(alerts.length).toBeGreaterThanOrEqual(4);
      expect(mockAlertRepository.save).toHaveBeenCalledTimes(4);
    });

    it('should return empty array when all metrics within thresholds', async () => {
      const metrics = {
        averageConfidenceScore: 0.9,
        parentSatisfactionRating: 4.5,
        contentFlagRate: 0.02,
        humanReviewRate: 0.08,
      };

      const alerts = await service.checkAlertThresholds(metrics);

      expect(alerts).toHaveLength(0);
      expect(mockAlertRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getMetricsTrend', () => {
    it('should retrieve metrics for time period', async () => {
      const startDate = new Date('2025-11-01');
      const endDate = new Date('2025-11-12');

      const mockMetrics = [
        {
          id: 'm-1',
          averageConfidenceScore: 0.85,
          timestamp: new Date('2025-11-10'),
        },
        {
          id: 'm-2',
          averageConfidenceScore: 0.87,
          timestamp: new Date('2025-11-11'),
        },
      ];

      mockMetricsRepository.find.mockResolvedValue(mockMetrics);

      const result = await service.getMetricsTrend(startDate, endDate);

      expect(mockMetricsRepository.find).toHaveBeenCalledWith({
        where: expect.any(Object),
        order: { timestamp: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('getActiveAlerts', () => {
    it('should retrieve unresolved alerts', async () => {
      const mockAlerts = [
        {
          id: 'a-1',
          alertType: 'AI_CONFIDENCE_LOW',
          severity: 'HIGH',
          isResolved: false,
        },
        {
          id: 'a-2',
          alertType: 'PARENT_SATISFACTION_LOW',
          severity: 'MEDIUM',
          isResolved: false,
        },
      ];

      mockAlertRepository.find.mockResolvedValue(mockAlerts);

      const result = await service.getActiveAlerts();

      expect(mockAlertRepository.find).toHaveBeenCalledWith({
        where: { isResolved: false },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('resolveAlert', () => {
    it('should mark alert as resolved with resolution notes', async () => {
      const alertId = 'a-123';
      const resolutionNotes = 'AI model retrained, confidence improved';

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };

      mockAlertRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.resolveAlert(alertId, resolutionNotes);

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({
        isResolved: true,
        resolutionNotes,
        resolvedAt: expect.any(Date),
      });
    });
  });

  describe('calculateDashboardStats', () => {
    it('should compute aggregated statistics for dashboard', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          avgConfidence: '0.85',
          avgSatisfaction: '4.3',
          avgFlagRate: '0.03',
          avgReviewRate: '0.08',
          totalGenerations: '5000',
        }),
      };

      mockMetricsRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await service.calculateDashboardStats();

      expect(result).toEqual({
        averageConfidence: 0.85,
        averageSatisfaction: 4.3,
        averageFlagRate: 0.03,
        averageReviewRate: 0.08,
        totalGenerations: 5000,
      });
    });

    it('should handle no data gracefully', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          avgConfidence: null,
          avgSatisfaction: null,
          avgFlagRate: null,
          avgReviewRate: null,
          totalGenerations: '0',
        }),
      };

      mockMetricsRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await service.calculateDashboardStats();

      expect(result.totalGenerations).toBe(0);
      expect(result.averageConfidence).toBeNull();
    });
  });

  describe('Performance', () => {
    it('should record metrics in less than 100ms', async () => {
      const metricsData = {
        generationSuccessRate: 0.95,
        averageConfidenceScore: 0.85,
        parentSatisfactionRating: 4.5,
        contentFlagRate: 0.02,
        humanReviewRate: 0.05,
        averageResponseTime: 1200,
        totalGenerations: 1000,
      };

      mockMetricsRepository.create.mockReturnValue(metricsData);
      mockMetricsRepository.save.mockResolvedValue(metricsData);

      const start = Date.now();
      await service.recordMetrics(metricsData);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
