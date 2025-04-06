import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mockOfflineService from '../mocks/OfflineService';
import { mockLocalStorage, mockOnlineStatus } from '../test-utils';
import { Project } from '../../types';

// Use the mock instead of the real service
const offlineService = mockOfflineService;

// Import services after mocks
import s3Service from '../../services/S3Service';
import loggerService from '../../services/LoggerService';

// Mock dependencies
vi.mock('../../services/OfflineService', () => ({
  default: mockOfflineService,
}));

vi.mock('../../services/LoggerService', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock AWS SDK
vi.mock('aws-sdk', () => {
  const mockS3 = {
    putObject: vi.fn().mockReturnValue({
      promise: vi.fn().mockResolvedValue({}),
    }),
    getObject: vi.fn().mockReturnValue({
      promise: vi.fn().mockResolvedValue({
        Body: JSON.stringify({
          id: 'test-project',
          name: 'Test Project',
          version: '1.0.0',
        }),
      }),
    }),
    listObjectsV2: vi.fn().mockReturnValue({
      promise: vi.fn().mockResolvedValue({
        Contents: [
          {
            Key: 'projects/test-project/1.0.0.json',
            LastModified: new Date(),
          },
        ],
      }),
    }),
  };

  return {
    S3: vi.fn(() => mockS3),
  };
});

describe('S3Service', () => {
  let mockStorage: any;

  beforeEach(() => {
    mockStorage = mockLocalStorage();
    mockOnlineStatus(true);

    // Reset mocks
    vi.clearAllMocks();

    // Reset the service
    // @ts-expect-error - Accessing private property for testing
    s3Service._isConfigured = false;
    // @ts-expect-error - Accessing private property for testing
    s3Service._isAvailable = true;
    // @ts-expect-error - Accessing private property for testing
    s3Service.operationQueue = [];
    // @ts-expect-error - Accessing private property for testing
    s3Service.isProcessingQueue = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('configure', () => {
    it('should configure the S3 service', async () => {
      // Call the method
      const result = await s3Service.configure({
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        region: 'us-east-1',
        bucketName: 'test-bucket',
      });

      // Verify the result
      expect(result).toBe(true);
      expect(s3Service.isConfigured()).toBe(true);
    });

    it('should handle configuration errors', async () => {
      // Mock AWS SDK to throw an error
      const S3 = require('aws-sdk').S3;
      S3.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      // Call the method
      const result = await s3Service.configure({
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        region: 'us-east-1',
        bucketName: 'test-bucket',
      });

      // Verify the result
      expect(result).toBe(false);
      expect(s3Service.isConfigured()).toBe(false);
    });
  });

  describe('uploadProject', () => {
    it('should upload a project to S3 when online', async () => {
      // Mock dependencies
      (offlineService.getOnlineStatus as any).mockReturnValue(true);

      // Configure the service
      await s3Service.configure({
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        region: 'us-east-1',
        bucketName: 'test-bucket',
      });

      // Create a test project
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        version: '1.0.0',
        nodes: [],
        edges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Call the method
      const result = await s3Service.uploadProject(project);

      // Verify the result
      expect(result).toBeDefined();
      expect(loggerService.info).toHaveBeenCalled();
    });

    it('should queue the upload when offline', async () => {
      // Mock dependencies
      (offlineService.getOnlineStatus as any).mockReturnValue(false);

      // Configure the service
      await s3Service.configure({
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        region: 'us-east-1',
        bucketName: 'test-bucket',
      });

      // Create a test project
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        version: '1.0.0',
        nodes: [],
        edges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Call the method
      const result = await s3Service.uploadProject(project);

      // Verify the result
      expect(result).toEqual({ queued: true });
      expect(loggerService.info).toHaveBeenCalled();
    });

    it('should handle upload errors', async () => {
      // Mock dependencies
      (offlineService.getOnlineStatus as any).mockReturnValue(true);

      // Configure the service
      await s3Service.configure({
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        region: 'us-east-1',
        bucketName: 'test-bucket',
      });

      // Mock AWS SDK to throw an error
      const S3 = require('aws-sdk').S3;
      const mockS3Instance = S3.mock.results[0].value;
      mockS3Instance.putObject.mockReturnValueOnce({
        promise: vi.fn().mockRejectedValue(new Error('Test error')),
      });

      // Create a test project
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        version: '1.0.0',
        nodes: [],
        edges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Call the method
      const result = await s3Service.uploadProject(project);

      // Verify the result
      expect(result).toBeNull();
      expect(loggerService.error).toHaveBeenCalled();
    });
  });

  describe('downloadProject', () => {
    it('should download a project from S3 when online', async () => {
      // Mock dependencies
      (offlineService.getOnlineStatus as any).mockReturnValue(true);

      // Configure the service
      await s3Service.configure({
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        region: 'us-east-1',
        bucketName: 'test-bucket',
      });

      // Call the method
      const result = await s3Service.downloadProject('test-project', '1.0.0');

      // Verify the result
      expect(result).toEqual({
        id: 'test-project',
        name: 'Test Project',
        version: '1.0.0',
      });
      expect(loggerService.info).toHaveBeenCalled();
    });

    it('should return null when offline', async () => {
      // Mock dependencies
      (offlineService.getOnlineStatus as any).mockReturnValue(false);

      // Configure the service
      await s3Service.configure({
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        region: 'us-east-1',
        bucketName: 'test-bucket',
      });

      // Call the method
      const result = await s3Service.downloadProject('test-project', '1.0.0');

      // Verify the result
      expect(result).toBeNull();
      expect(loggerService.info).toHaveBeenCalled();
    });

    it('should handle download errors', async () => {
      // Mock dependencies
      (offlineService.getOnlineStatus as any).mockReturnValue(true);

      // Configure the service
      await s3Service.configure({
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        region: 'us-east-1',
        bucketName: 'test-bucket',
      });

      // Mock AWS SDK to throw an error
      const S3 = require('aws-sdk').S3;
      const mockS3Instance = S3.mock.results[0].value;
      mockS3Instance.getObject.mockReturnValueOnce({
        promise: vi.fn().mockRejectedValue(new Error('Test error')),
      });

      // Call the method
      const result = await s3Service.downloadProject('test-project', '1.0.0');

      // Verify the result
      expect(result).toBeNull();
      expect(loggerService.error).toHaveBeenCalled();
    });
  });
});
