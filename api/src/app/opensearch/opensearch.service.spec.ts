import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpenSearchService } from './opensearch.service';

describe('OpenSearchService', () => {
  let service: OpenSearchService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenSearchService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'OPENSEARCH_HOST') {
                return 'http://localhost:9200';
              }
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<OpenSearchService>(OpenSearchService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getClient', () => {
    it('should return OpenSearch client after initialization', async () => {
      // Mock initialization
      await service.onModuleInit();
      const client = service.getClient();
      expect(client).toBeDefined();
    });

    it('should throw error if client not initialized', () => {
      // Create new service without initialization
      const uninitializedService = new OpenSearchService(configService);
      expect(() => uninitializedService.getClient()).toThrow(
        'OpenSearch client not initialized'
      );
    });
  });

  describe('checkHealth', () => {
    it('should return healthy status when cluster is accessible', async () => {
      // Mock OpenSearch client response
      const mockClient = {
        cluster: {
          health: jest.fn().mockResolvedValue({
            body: {
              status: 'green',
              number_of_nodes: 1,
            },
          }),
        },
      };

      // Replace client with mock
      (service as any).client = mockClient;

      const health = await service.checkHealth();
      expect(health.status).toBe('healthy');
      expect(health.clusterStatus).toBe('green');
      expect(health.numberOfNodes).toBe(1);
    });

    it('should return unhealthy status when cluster is red', async () => {
      const mockClient = {
        cluster: {
          health: jest.fn().mockResolvedValue({
            body: {
              status: 'red',
              number_of_nodes: 1,
            },
          }),
        },
      };

      (service as any).client = mockClient;

      const health = await service.checkHealth();
      expect(health.status).toBe('unhealthy');
      expect(health.clusterStatus).toBe('red');
    });

    it('should handle connection errors gracefully', async () => {
      const mockClient = {
        cluster: {
          health: jest.fn().mockRejectedValue(new Error('Connection refused')),
        },
      };

      (service as any).client = mockClient;

      const health = await service.checkHealth();
      expect(health.status).toBe('unhealthy');
      expect(health.error).toBe('Connection refused');
    });
  });

  describe('indexExists', () => {
    it('should return true when index exists', async () => {
      const mockClient = {
        indices: {
          exists: jest.fn().mockResolvedValue({ body: true }),
        },
      };

      (service as any).client = mockClient;

      const exists = await service.indexExists('test-index');
      expect(exists).toBe(true);
      expect(mockClient.indices.exists).toHaveBeenCalledWith({
        index: 'test-index',
      });
    });

    it('should return false when index does not exist', async () => {
      const mockClient = {
        indices: {
          exists: jest.fn().mockResolvedValue({ body: false }),
        },
      };

      (service as any).client = mockClient;

      const exists = await service.indexExists('non-existent-index');
      expect(exists).toBe(false);
    });

    it('should return false on error', async () => {
      const mockClient = {
        indices: {
          exists: jest.fn().mockRejectedValue(new Error('Network error')),
        },
      };

      (service as any).client = mockClient;

      const exists = await service.indexExists('error-index');
      expect(exists).toBe(false);
    });
  });

  describe('createIndex', () => {
    it('should create index with specified mapping', async () => {
      const mockClient = {
        indices: {
          exists: jest.fn().mockResolvedValue({ body: false }),
          create: jest.fn().mockResolvedValue({ body: { acknowledged: true } }),
        },
      };

      (service as any).client = mockClient;

      const mapping = {
        properties: {
          embedding: { type: 'dense_vector', dims: 384 },
        },
      };

      await service.createIndex('test-index', mapping);

      expect(mockClient.indices.create).toHaveBeenCalledWith({
        index: 'test-index',
        body: { mappings: mapping },
      });
    });

    it('should skip creation if index already exists', async () => {
      const mockClient = {
        indices: {
          exists: jest.fn().mockResolvedValue({ body: true }),
          create: jest.fn(),
        },
      };

      (service as any).client = mockClient;

      await service.createIndex('existing-index', {});

      expect(mockClient.indices.create).not.toHaveBeenCalled();
    });
  });

  describe('deleteIndex', () => {
    it('should delete existing index', async () => {
      const mockClient = {
        indices: {
          exists: jest.fn().mockResolvedValue({ body: true }),
          delete: jest.fn().mockResolvedValue({ body: { acknowledged: true } }),
        },
      };

      (service as any).client = mockClient;

      await service.deleteIndex('test-index');

      expect(mockClient.indices.delete).toHaveBeenCalledWith({
        index: 'test-index',
      });
    });

    it('should skip deletion if index does not exist', async () => {
      const mockClient = {
        indices: {
          exists: jest.fn().mockResolvedValue({ body: false }),
          delete: jest.fn(),
        },
      };

      (service as any).client = mockClient;

      await service.deleteIndex('non-existent-index');

      expect(mockClient.indices.delete).not.toHaveBeenCalled();
    });
  });

  describe('indexDocument', () => {
    it('should index a document successfully', async () => {
      const mockClient = {
        index: jest.fn().mockResolvedValue({ body: { result: 'created' } }),
      };

      (service as any).client = mockClient;

      const document = { field1: 'value1', field2: 'value2' };
      await service.indexDocument('test-index', 'doc-1', document);

      expect(mockClient.index).toHaveBeenCalledWith({
        index: 'test-index',
        id: 'doc-1',
        body: document,
        refresh: true,
      });
    });
  });

  describe('bulkIndex', () => {
    it('should bulk index multiple documents', async () => {
      const mockClient = {
        bulk: jest.fn().mockResolvedValue({
          body: { errors: false, items: [] },
        }),
      };

      (service as any).client = mockClient;

      const documents = [
        { id: 'doc-1', document: { field: 'value1' } },
        { id: 'doc-2', document: { field: 'value2' } },
      ];

      await service.bulkIndex('test-index', documents);

      expect(mockClient.bulk).toHaveBeenCalled();
      const callArgs = mockClient.bulk.mock.calls[0][0];
      expect(callArgs.body).toHaveLength(4); // 2 docs * 2 lines each
      expect(callArgs.refresh).toBe(true);
    });

    it('should throw error if bulk indexing has errors', async () => {
      const mockClient = {
        bulk: jest.fn().mockResolvedValue({
          body: { errors: true, items: [] },
        }),
      };

      (service as any).client = mockClient;

      const documents = [{ id: 'doc-1', document: { field: 'value1' } }];

      await expect(service.bulkIndex('test-index', documents)).rejects.toThrow(
        'Bulk indexing failed'
      );
    });
  });

  describe('search', () => {
    it('should search documents with query', async () => {
      const mockClient = {
        search: jest.fn().mockResolvedValue({
          body: {
            hits: {
              total: { value: 1 },
              hits: [{ _id: 'doc-1', _source: { field: 'value' } }],
            },
          },
        }),
      };

      (service as any).client = mockClient;

      const query = { match: { field: 'value' } };
      const results = await service.search('test-index', query, 10);

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'test-index',
        body: { query, size: 10 },
      });
      expect(results.hits.total.value).toBe(1);
    });
  });
});
