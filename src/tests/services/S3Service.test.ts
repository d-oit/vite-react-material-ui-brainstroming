import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import AWS from 'aws-sdk';

// Services
import { LoggerService } from '../../services/LoggerService';
import { OfflineService } from '../../services/OfflineService';
import { S3Service } from '../../services/S3Service';

// Types
import type { Project, Node, Edge } from '../../types';
import { ProjectTemplate } from '../../types/project';

// Test utilities
import { mockLocalStorage, mockOnlineStatus } from '../test-utils';

// Mock dependencies FIRST
// Mock OfflineService
const mockOfflineService = {
  getOnlineStatus: vi.fn().mockReturnValue(true),
  addToSyncQueue: vi.fn(),
  addOnlineStatusListener: vi.fn(),
};

vi.mock('../../services/OfflineService', () => ({
  default: {
    getInstance: vi.fn(() => mockOfflineService),
  },
  OfflineService: {
    getInstance: vi.fn(() => mockOfflineService),
  },
}));

vi.mock('../../services/LoggerService', () => {
  const mockLoggerInstance = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  };
  return {
    LoggerService: {
      getInstance: vi.fn(() => mockLoggerInstance),
    },
  };
});

// Define mock S3 instance structure used by the AWS SDK mock
const mockS3Instance = {
  putObject: vi.fn().mockReturnThis(), // Chainable methods
  getObject: vi.fn().mockReturnThis(),
  listObjectsV2: vi.fn().mockReturnThis(),
  deleteObject: vi.fn().mockReturnThis(), // Add delete if used
  promise: vi.fn(), // Central promise mock
};

// Mock AWS SDK (only once)
vi.mock('aws-sdk', () => ({
  S3: vi.fn(() => mockS3Instance),
  config: {
    update: vi.fn(),
    Credentials: vi.fn(),
  },
}));
// No need to mock 'aws-sdk/clients/s3' separately if the main mock covers it

// Import the service *after* mocks are defined
let s3ServiceInstance: ReturnType<typeof S3Service.getInstance>; // Type as return value of getInstance
beforeAll(async () => {
  // Dynamically import the service after mocks are set up
  const module = await import('../../services/S3Service');
  // Get instance using the static getInstance method
  s3ServiceInstance = module.S3Service.getInstance(); // Use named export since that's how we imported it
});
// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Removed redundant AWS mock and global assignment

// Access the mocked logger instance for assertions if needed
type LoggerInstanceType = {
  info: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  debug: ReturnType<typeof vi.fn>;
};

let loggerInstance: LoggerInstanceType;
beforeEach(() => {
  // Access the mocked logger instance directly from the mock definition
  // The mock returns the instance object directly via getInstance
  const MockedLogger = vi.mocked(LoggerService); // Use the imported LoggerService
  loggerInstance = MockedLogger.getInstance() as unknown as LoggerInstanceType; // Cast to the mock type
});

describe('S3Service', () => {
  // Storage is mocked globally

  beforeEach(() => {
    mockLocalStorage();
    mockOnlineStatus(true);

    // Reset mocks
    vi.clearAllMocks();

    // Reset the service
    // Reset internal state using bracket notation for private properties
    s3ServiceInstance['_isConfigured'] = false;
    s3ServiceInstance['_isAvailable'] = true;
    s3ServiceInstance['operationQueue'] = [];
    s3ServiceInstance['isProcessingQueue'] = false;
    // Reset promise mock before each test
    mockS3Instance.promise.mockReset();
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
      const configUpdateSpy = vi.mocked(AWS.config.update);

      // Call the method on the instance
      const result = await s3ServiceInstance.configure(
        accessKeyId,
        secretAccessKey,
        region,
        bucketName
      );

      // Verify the result
      // Assertions
      expect(result).toBe(true);
      expect(s3ServiceInstance.isConfigured()).toBe(true);
      expect(configUpdateSpy).toHaveBeenCalled();
    });

    it('should handle configuration errors', async () => {
      // Mock AWS SDK to throw an error
      // Mock S3 constructor to throw error for this test case
      vi.mocked(AWS.S3).mockImplementationOnce(() => {
        throw new Error('Test config error');
      });

      // Call the method on the instance
      const result = await s3ServiceInstance.configure(
        'test-access-key',
        'test-secret-key',
        'us-east-1',
        'test-bucket'
      );

      // Verify the result
      expect(result).toBe(false);
      expect(s3ServiceInstance.isConfigured()).toBe(false);
      expect(loggerInstance.error).toHaveBeenCalledWith('Error configuring S3', expect.any(Error));
    });
  });

  describe('uploadProject', () => {
    it('should upload a project to S3 when online', async () => {
      // Ensure service is configured for the test
      await s3ServiceInstance.configure('a', 'b', 'c', 'd');
      mockOfflineService.getOnlineStatus.mockReturnValue(true);

      // Create a test project
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        description: 'A test project',
        version: '1.0.0', // Correct version type
        nodes: [] as Node[],
        edges: [] as Edge[],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        template: ProjectTemplate.CUSTOM, // Add missing properties
        syncSettings: { enableS3Sync: false, syncFrequency: 'manual' }, // Add missing properties
      };

      // Mock the promise for putObject
      mockS3Instance.promise.mockResolvedValueOnce({});

      // Call the method on the instance
      const result = await s3ServiceInstance.uploadProject(project);

      // Verify the result
      expect(result).toEqual({ success: true });
      expect(mockS3Instance.putObject).toHaveBeenCalled();
      expect(loggerInstance.info).toHaveBeenCalledWith(
        expect.stringContaining('uploaded to S3 successfully'),
        expect.any(Object)
      );
    });

    it('should queue the upload when offline', async () => {
      // Ensure service is configured
      await s3ServiceInstance.configure('a', 'b', 'c', 'd');
      // Mock offline status
      mockOfflineService.getOnlineStatus.mockReturnValue(false);

      // Create a test project
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        description: 'A test project',
        version: '1.0.0', // Correct version type
        nodes: [] as Node[],
        edges: [] as Edge[],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add missing properties
        template: ProjectTemplate.CUSTOM,
        syncSettings: { enableS3Sync: false, syncFrequency: 'manual' },
      };

      // Call the method on the instance
      const result = await s3ServiceInstance.uploadProject(project);

      // Verify the result
      expect(result).toEqual({ queued: true });
      expect(mockOfflineService.addToSyncQueue).toHaveBeenCalledWith('uploadProject', project);
      expect(loggerInstance.info).toHaveBeenCalledWith(
        expect.stringContaining('queued for upload'),
        expect.any(Object)
      );
    });

    it('should handle upload errors', async () => {
      // Ensure service is configured and online
      await s3ServiceInstance.configure('a', 'b', 'c', 'd');
      mockOfflineService.getOnlineStatus.mockReturnValue(true);

      // Mock the promise for putObject to reject
      const uploadError = new Error('S3 Upload failed');
      mockS3Instance.promise.mockRejectedValueOnce(uploadError);

      // Create a test project
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        description: 'A test project',
        version: '1.0.0', // Correct version type
        nodes: [] as Node[],
        edges: [] as Edge[],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add missing properties
        template: ProjectTemplate.CUSTOM,
        syncSettings: { enableS3Sync: false, syncFrequency: 'manual' },
      };

      // Call the method on the instance
      const result = await s3ServiceInstance.uploadProject(project);

      // Verify the result
      expect(result).toEqual({ success: false, error: uploadError });
      expect(mockS3Instance.putObject).toHaveBeenCalled();
      expect(loggerInstance.error).toHaveBeenCalledWith(
        expect.stringContaining('Error uploading project'),
        uploadError
      );
    });
  });

  describe('downloadProject', () => {
    it('should download a project from S3 when online', async () => {
      // Ensure service is configured and online
      await s3ServiceInstance.configure('a', 'b', 'c', 'd');
      mockOfflineService.getOnlineStatus.mockReturnValue(true);

      // Mock the promise for getObject
      const mockProjectData = { id: 'test-project', name: 'Test Project', version: '1.0.0' };
      mockS3Instance.promise.mockResolvedValueOnce({ Body: JSON.stringify(mockProjectData) });

      // Call the method on the instance
      const result = await s3ServiceInstance.downloadProject('test-project', '1.0.0');

      // Verify the result
      expect(result).toEqual(mockProjectData);
      expect(mockS3Instance.getObject).toHaveBeenCalled();
      expect(loggerInstance.info).toHaveBeenCalledWith(
        expect.stringContaining('downloaded from S3 successfully'),
        expect.any(Object)
      );
    });

    it('should return null when offline', async () => {
      // Ensure service is configured but offline
      await s3ServiceInstance.configure('a', 'b', 'c', 'd');
      mockOfflineService.getOnlineStatus.mockReturnValue(false);

      // Call the method on the instance
      const result = await s3ServiceInstance.downloadProject('test-project', '1.0.0');

      // Verify the result
      expect(result).toBeNull();
      expect(mockS3Instance.getObject).not.toHaveBeenCalled();
      expect(loggerInstance.info).toHaveBeenCalledWith('Project download skipped - offline');
    });

    it('should handle download errors', async () => {
      // Ensure service is configured and online
      await s3ServiceInstance.configure('a', 'b', 'c', 'd');
      mockOfflineService.getOnlineStatus.mockReturnValue(true);

      // Mock the promise for getObject to reject
      const downloadError = new Error('S3 Download failed');
      mockS3Instance.promise.mockRejectedValueOnce(downloadError);

      // Call the method on the instance
      const result = await s3ServiceInstance.downloadProject('test-project', '1.0.0');

      // Verify the result
      expect(result).toBeNull();
      expect(mockS3Instance.getObject).toHaveBeenCalled();
      expect(loggerInstance.error).toHaveBeenCalledWith(
        expect.stringContaining('Error downloading project'),
        downloadError
      );
    });
  });
});
