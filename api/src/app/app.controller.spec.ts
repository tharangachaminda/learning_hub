import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OpenSearchService } from './opensearch/opensearch.service';

describe('AppController', () => {
  let app: TestingModule;
  let openSearchService: OpenSearchService;

  beforeAll(async () => {
    const mockOpenSearchService = {
      checkHealth: jest.fn(),
    };

    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: OpenSearchService,
          useValue: mockOpenSearchService,
        },
      ],
    }).compile();

    openSearchService = app.get<OpenSearchService>(OpenSearchService);
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.getData()).toEqual({ message: 'Hello API' });
    });
  });

  describe('getHealth', () => {
    it('should return health status of all services', async () => {
      const appController = app.get<AppController>(AppController);

      // Mock OpenSearch health response
      jest.spyOn(openSearchService, 'checkHealth').mockResolvedValue({
        status: 'healthy',
        clusterStatus: 'green',
        numberOfNodes: 1,
      });

      const health = await appController.getHealth();

      expect(health).toMatchObject({
        status: 'healthy',
        services: {
          api: {
            status: 'healthy',
            version: '1.0.0',
          },
          opensearch: {
            status: 'healthy',
            clusterStatus: 'green',
            nodes: 1,
          },
        },
      });
      expect(health.timestamp).toBeDefined();
    });

    it('should report unhealthy OpenSearch status', async () => {
      const appController = app.get<AppController>(AppController);

      jest.spyOn(openSearchService, 'checkHealth').mockResolvedValue({
        status: 'unhealthy',
        error: 'Connection refused',
      });

      const health = await appController.getHealth();

      expect(health.services.opensearch.status).toBe('unhealthy');
    });
  });
});
