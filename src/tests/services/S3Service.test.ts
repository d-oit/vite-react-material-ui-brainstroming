import AWS, { S3 } from 'aws-sdk';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import loggerService from '../../services/LoggerService';
import s3Service from '../../services/S3Service';
import type { Project } from '../../types';
import mockOfflineService from '../mocks/OfflineService';
import { mockLocalStorage, mockOnlineStatus } from '../test-utils';

// Import services after mocks

// Mock AWS SDK

// Use the mock instead of the real service
const offlineService = mockOfflineService;

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

// Create a mock S3 instance
const mockS3Instance = {
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

vi.mock('aws-sdk', () => {
  return {
    S3: vi.fn(() => mockS3Instance),
    config: {
      update: vi.fn(),
    },
  };
});

describe('S3Service', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
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
      // Setup
      const accessKeyId = 'test-access-key';
      const secretAccessKey = 'test-secret-key';
      const region = 'us-east-1';
      const bucketName = 'test-bucket';

      // Mock the AWS config update
      const configUpdateSpy = vi.fn();
      vi.spyOn(AWS.config, 'update').mockImplementation(configUpdateSpy);

      // Call the method
      const result = await s3Service.configure(accessKeyId, secretAccessKey, region, bucketName);

      // Verify the result
      expect(result).toBe(true);
      expect(s3Service.isConfigured()).toBe(true);
    });

    it('should handle configuration errors', async () => {
      // Mock AWS SDK to throw an error
      const S3Mock = vi.mocked(S3);
      S3Mock.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      // Call the method
      const result = await s3Service.configure(
        'test-access-key',
        'test-secret-key',
        'us-east-1',
        'test-bucket'
      );

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
      await s3Service.configure('test-access-key', 'test-secret-key', 'us-east-1', 'test-bucket');

      // Create a test project
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        description: 'A test project',
        version: '1.0.0',
        nodes: [],
        edges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock S3 putObject
      const putObjectSpy = vi.fn().mockResolvedValue({});
      mockS3Instance.putObject.mockReturnValue({ promise: putObjectSpy });

      // Mock logger
      const loggerInfoSpy = vi.spyOn(loggerService, 'info');

      // Call the method
      const result = await s3Service.uploadProject(project);

      // Verify the result
      expect(result).toBeDefined();
      expect(loggerInfoSpy).toHaveBeenCalled();
      expect(loggerService.info).toHaveBeenCalled();
    });

    it('should queue the upload when offline', async () => {
      // Mock dependencies
      (offlineService.getOnlineStatus as any).mockReturnValue(false);

      // Configure the service
      await s3Service.configure('test-access-key', 'test-secret-key', 'us-east-1', 'test-bucket');

      // Create a test project
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        description: 'A test project',
        version: '1.0.0',
        nodes: [],
        edges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock addToSyncQueue
      const addToSyncQueueSpy = vi.spyOn(offlineService, 'addToSyncQueue');
      addToSyncQueueSpy.mockImplementation(() => {});

      // Call the method
      const result = await s3Service.uploadProject(project);

      // Verify the result
      expect(result).toEqual({ queued: true });
      expect(offlineService.addToSyncQueue).toHaveBeenCalled();
      expect(loggerService.info).toHaveBeenCalled();
    });

    it('should handle upload errors', async () => {
      // Mock dependencies
      (offlineService.getOnlineStatus as any).mockReturnValue(true);

      // Configure the service
      await s3Service.configure('test-access-key', 'test-secret-key', 'us-east-1', 'test-bucket');

      // Mock S3 putObject to throw an error
      const putObjectPromiseSpy = vi.fn().mockRejectedValue(new Error('Upload failed'));
      mockS3Instance.putObject.mockReturnValueOnce({
        promise: putObjectPromiseSpy,
      });

      // Mock logger
      const loggerErrorSpy = vi.spyOn(loggerService, 'error');

      // Create a test project
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        description: 'A test project',
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
      expect(loggerErrorSpy).toHaveBeenCalled();
    });
  });

  describe('downloadProject', () => {
    it('should download a project from S3 when online', async () => {
      // Mock dependencies
      (offlineService.getOnlineStatus as any).mockReturnValue(true);

      // Configure the service
      await s3Service.configure('test-access-key', 'test-secret-key', 'us-east-1', 'test-bucket');

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
      await s3Service.configure('test-access-key', 'test-secret-key', 'us-east-1', 'test-bucket');

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
      await s3Service.configure('test-access-key', 'test-secret-key', 'us-east-1', 'test-bucket');

      // Get mocked S3 instance
      const S3Mock = vi.mocked(S3);
      const mockS3Instance = S3Mock.mock.results[0].value;
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
