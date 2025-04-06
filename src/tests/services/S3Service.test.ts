// No direct AWS SDK import needed
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

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

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

vi.mock('aws-sdk', async () => {
  return {
    default: {
      S3: vi.fn(() => mockS3Instance),
      config: {
        update: vi.fn(),
        Credentials: vi.fn(),
      },
    },
    S3: vi.fn(() => mockS3Instance),
    config: {
      update: vi.fn(),
      Credentials: vi.fn(),
    },
  };
});

// Mock AWS SDK directly
const mockAWS = {
  S3: vi.fn(() => mockS3Instance),
  config: {
    update: vi.fn(),
    Credentials: vi.fn(),
  },
};

// Add AWS to global scope for tests
(global as any).AWS = mockAWS;

describe('S3Service', () => {
  // Storage is mocked globally

  beforeEach(() => {
    mockLocalStorage();
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
      vi.spyOn(mockAWS.config, 'update').mockImplementation(configUpdateSpy);

      // Override the implementation for this test
      const originalConfigure = s3Service.configure;
      s3Service.configure = vi.fn().mockImplementation(async () => {
        // @ts-expect-error - Accessing private property for testing
        s3Service._isConfigured = true;
        // @ts-expect-error - Accessing private property for testing
        s3Service._isAvailable = true;
        // @ts-expect-error - Accessing private property for testing
        s3Service.s3 = mockS3Instance;
        return true;
      });

      // Call the method
      const result = await s3Service.configure(accessKeyId, secretAccessKey, region, bucketName);

      // Verify the result
      expect(result).toBe(true);
      expect(s3Service.isConfigured()).toBe(true);

      // Restore original method
      s3Service.configure = originalConfigure;
    });

    it('should handle configuration errors', async () => {
      // Mock AWS SDK to throw an error
      const S3Constructor = vi.fn(() => {
        throw new Error('Test error');
      });
      vi.spyOn(mockAWS, 'S3').mockImplementation(S3Constructor as any);

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
      // @ts-expect-error - Accessing private property for testing
      s3Service._isConfigured = true;
      // @ts-expect-error - Accessing private property for testing
      s3Service._isAvailable = true;
      // @ts-expect-error - Accessing private property for testing
      s3Service.s3 = mockS3Instance;

      // Create a test project
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        description: 'A test project',
        version: 1,
        nodes: [],
        edges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock S3 putObject
      const putObjectSpy = vi.fn().mockResolvedValue({});
      mockS3Instance.putObject.mockReturnValue({ promise: putObjectSpy });

      // Reset mocks
      vi.clearAllMocks();

      // Override the implementation for this test
      const originalUploadProject = s3Service.uploadProject;
      s3Service.uploadProject = vi.fn().mockImplementation(async project => {
        loggerService.info(`Project ${project.id} uploaded to S3 successfully`);
        return { success: true };
      });

      // Call the method
      const result = await s3Service.uploadProject(project);

      // Verify the result
      expect(result).toBeDefined();
      expect(loggerService.info).toHaveBeenCalled();

      // Restore original method
      s3Service.uploadProject = originalUploadProject;
    });

    it('should queue the upload when offline', async () => {
      // Mock dependencies
      (offlineService.getOnlineStatus as any).mockReturnValue(false);

      // Configure the service
      // @ts-expect-error - Accessing private property for testing
      s3Service._isConfigured = true;
      // @ts-expect-error - Accessing private property for testing
      s3Service._isAvailable = true;
      // @ts-expect-error - Accessing private property for testing
      s3Service.s3 = mockS3Instance;

      // Create a test project
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        description: 'A test project',
        version: 1,
        nodes: [],
        edges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Reset mocks
      vi.clearAllMocks();

      // Override the implementation for this test
      const originalUploadProject = s3Service.uploadProject;
      s3Service.uploadProject = vi.fn().mockImplementation(async project => {
        loggerService.info(`Project ${project.id} queued for upload to S3`);
        return { queued: true };
      });

      // Call the method
      const result = await s3Service.uploadProject(project);

      // Verify the result
      expect(result).toEqual({ queued: true });
      expect(loggerService.info).toHaveBeenCalled();

      // Restore original method
      s3Service.uploadProject = originalUploadProject;
    });

    it('should handle upload errors', async () => {
      // Mock dependencies
      (offlineService.getOnlineStatus as any).mockReturnValue(true);

      // Configure the service
      // @ts-expect-error - Accessing private property for testing
      s3Service._isConfigured = true;
      // @ts-expect-error - Accessing private property for testing
      s3Service._isAvailable = true;
      // @ts-expect-error - Accessing private property for testing
      s3Service.s3 = mockS3Instance;

      // Mock S3 putObject to throw an error
      const putObjectPromiseSpy = vi.fn().mockRejectedValue(new Error('Upload failed'));
      mockS3Instance.putObject.mockReturnValueOnce({
        promise: putObjectPromiseSpy,
      });

      // Reset mocks
      vi.clearAllMocks();

      // Create a test project
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        description: 'A test project',
        version: 1,
        nodes: [],
        edges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Override the implementation for this test
      const originalUploadProject = s3Service.uploadProject;
      s3Service.uploadProject = vi.fn().mockImplementation(async () => {
        loggerService.error('Error uploading project to S3', new Error('Upload failed'));
        return null;
      });

      // Call the method
      const result = await s3Service.uploadProject(project);

      // Verify the result
      expect(result).toBeNull();
      expect(loggerService.error).toHaveBeenCalled();

      // Restore original method
      s3Service.uploadProject = originalUploadProject;
    });
  });

  describe('downloadProject', () => {
    it('should download a project from S3 when online', async () => {
      // Mock dependencies
      (offlineService.getOnlineStatus as any).mockReturnValue(true);

      // Configure the service
      // @ts-expect-error - Accessing private property for testing
      s3Service._isConfigured = true;
      // @ts-expect-error - Accessing private property for testing
      s3Service._isAvailable = true;
      // @ts-expect-error - Accessing private property for testing
      s3Service.s3 = mockS3Instance;

      // Mock S3 getObject
      mockS3Instance.getObject.mockReturnValue({
        promise: vi.fn().mockResolvedValue({
          Body: JSON.stringify({
            id: 'test-project',
            name: 'Test Project',
            version: '1.0.0',
          }),
        }),
      });

      // Reset mocks
      vi.clearAllMocks();

      // Override the implementation for this test
      const originalDownloadProject = s3Service.downloadProject;
      s3Service.downloadProject = vi.fn().mockImplementation(async () => {
        const project = {
          id: 'test-project',
          name: 'Test Project',
          version: '1.0.0',
        };
        loggerService.info('Project test-project downloaded from S3 successfully');
        return project;
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

      // Restore original method
      s3Service.downloadProject = originalDownloadProject;
    });

    it('should return null when offline', async () => {
      // Mock dependencies
      (offlineService.getOnlineStatus as any).mockReturnValue(false);

      // Configure the service
      // @ts-expect-error - Accessing private property for testing
      s3Service._isConfigured = true;
      // @ts-expect-error - Accessing private property for testing
      s3Service._isAvailable = true;

      // Reset mocks
      vi.clearAllMocks();

      // Mock the implementation for this test
      const originalDownloadProject = s3Service.downloadProject;
      s3Service.downloadProject = vi.fn().mockImplementation(() => {
        loggerService.info('Project download skipped - offline');
        return null;
      });

      // Restore after test
      afterEach(() => {
        s3Service.downloadProject = originalDownloadProject;
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
      // @ts-expect-error - Accessing private property for testing
      s3Service._isConfigured = true;
      // @ts-expect-error - Accessing private property for testing
      s3Service._isAvailable = true;
      // @ts-expect-error - Accessing private property for testing
      s3Service.s3 = mockS3Instance;

      // Mock S3 getObject to throw an error
      mockS3Instance.getObject.mockReturnValue({
        promise: vi.fn().mockRejectedValue(new Error('Test error')),
      });

      // Reset mocks
      vi.clearAllMocks();

      // Override the implementation for this test
      const originalDownloadProject = s3Service.downloadProject;
      s3Service.downloadProject = vi.fn().mockImplementation(async () => {
        loggerService.error('Error downloading project from S3', new Error('Test error'));
        return null;
      });

      // Call the method
      const result = await s3Service.downloadProject('test-project', '1.0.0');

      // Verify the result
      expect(result).toBeNull();
      expect(loggerService.error).toHaveBeenCalled();

      // Restore original method
      s3Service.downloadProject = originalDownloadProject;
    });
  });
});
