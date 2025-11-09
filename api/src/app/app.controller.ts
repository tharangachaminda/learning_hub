import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { OpenSearchService } from './opensearch/opensearch.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly openSearchService: OpenSearchService
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  /**
   * Health check endpoint for API and dependencies
   *
   * @returns Status of API, OpenSearch, and other services
   */
  @Get('health')
  async getHealth() {
    const openSearchHealth = await this.openSearchService.checkHealth();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: 'healthy',
          version: '1.0.0',
        },
        opensearch: {
          status: openSearchHealth.status,
          clusterStatus: openSearchHealth.clusterStatus,
          nodes: openSearchHealth.numberOfNodes,
        },
      },
    };
  }
}
