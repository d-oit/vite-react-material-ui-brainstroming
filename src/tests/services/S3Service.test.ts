import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import types only, rely on mocks for implementation
import type { Project, Node, Edge } from '../../types'; // Add Node, Edge if needed for Project type
import { S3Service } from '../../services/S3Service'; // Import the actual class for type usage
import { LoggerService } from '../../services/LoggerService'; // Import LoggerService class
import { ProjectTemplate } from '../../types/project'; // Import ProjectTemplate enum
import { mockLocalStorage, mockOnlineStatus } from '../test-utils';

// Mock dependencies FIRST
vi.mock('../../services/OfflineService', () => ({
  default: {
    getOnlineStatus: vi.fn().mockReturnValue(true),
    addToSyncQueue: vi.fn(),
    addOnlineStatusListener: vi.fn(), // Add listener if needed by S3Service
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
    default: {
      getInstance: vi.fn(() => mockLoggerInstance),
      info: mockLoggerInstance.info,
      error: mockLoggerInstance.error,
      warn: mockLoggerInstance.warn,
      debug: mockLoggerInstance.debug,
    },
    LoggerService: vi.fn(() => mockLoggerInstance),
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
let s3ServiceInstance: S3Service; // Use the imported class as the type
beforeAll(async () => {
  // Dynamically import the service after mocks are set up
  const module = await import('../../services/S3Service');
  // Assuming the class itself is the default export or access it via named export if needed
  s3ServiceInstance = module.S3Service.getInstance(); // Get instance after import
});


// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Removed redundant AWS mock and global assignment

// Access the mocked logger instance for assertions if needed
let loggerInstance: ReturnType<typeof LoggerService.getInstance>; // Use static method type
beforeEach(() => {
  // Get the mocked logger instance before each test
  const MockedLoggerService = require('../../services/LoggerService').default;
  loggerInstance = vi.mocked(MockedLoggerService.getInstance)(); // Call the mocked static method
});


describe('S3Service', () => {
  // Storage is mocked globally

  beforeEach(() => {
    mockLocalStorage();
    mockOnlineStatus(true);

    // Reset mocks
    vi.clearAllMocks();

    // Reset the service
    // Reset internal state using the instance obtained after mocking
    // @ts-expect-error - Accessing private property for testing
    s3ServiceInstance._isConfigured = false;
    // @ts-expect-error - Accessing private property for testing
    s3ServiceInstance._isAvailable = true;
    // @ts-expect-error - Accessing private property for testing
    s3ServiceInstance.operationQueue = [];
    // @ts-expect-error - Accessing private property for testing
    s3ServiceInstance.isProcessingQueue = false;
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
      const configUpdateSpy = vi.mocked(require('aws-sdk').config.update);

      // Call the method on the instance
      const result = await s3ServiceInstance.configure(accessKeyId, secretAccessKey, region, bucketName);

      // Verify the result
      // Assertions
      expect(result).toBe(true);
      expect(s3ServiceInstance.isConfigured()).toBe(true);
      expect(configUpdateSpy).toHaveBeenCalled();
    });

    it('should handle configuration errors', async () => {
      // Mock AWS SDK to throw an error
      // Mock S3 constructor to throw error for this test case
      vi.mocked(require('aws-sdk').S3).mockImplementationOnce(() => {
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
      vi.mocked(require('../../services/OfflineService').default.getOnlineStatus).mockReturnValue(true);

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
      expect(loggerInstance.info).toHaveBeenCalledWith(expect.stringContaining('uploaded to S3 successfully'), expect.any(Object));
    });

    it('should queue the upload when offline', async () => {
      // Ensure service is configured
      await s3ServiceInstance.configure('a', 'b', 'c', 'd');
      // Mock offline status
      vi.mocked(require('../../services/OfflineService').default.getOnlineStatus).mockReturnValue(false);

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
      expect(vi.mocked(require('../../services/OfflineService').default.addToSyncQueue)).toHaveBeenCalledWith(
        'uploadProject',
        project
      );
      expect(loggerInstance.info).toHaveBeenCalledWith(expect.stringContaining('queued for upload'), expect.any(Object));
    });

    it('should handle upload errors', async () => {
      // Ensure service is configured and online
      await s3ServiceInstance.configure('a', 'b', 'c', 'd');
      vi.mocked(require('../../services/OfflineService').default.getOnlineStatus).mockReturnValue(true);

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
      expect(loggerInstance.error).toHaveBeenCalledWith(expect.stringContaining('Error uploading project'), uploadError);
    });
  });

  describe('downloadProject', () => {
    it('should download a project from S3 when online', async () => {
      // Ensure service is configured and online
      await s3ServiceInstance.configure('a', 'b', 'c', 'd');
      vi.mocked(require('../../services/OfflineService').default.getOnlineStatus).mockReturnValue(true);

      // Mock the promise for getObject
      const mockProjectData = { id: 'test-project', name: 'Test Project', version: '1.0.0' };
      mockS3Instance.promise.mockResolvedValueOnce({ Body: JSON.stringify(mockProjectData) });

      // Call the method on the instance
      const result = await s3ServiceInstance.downloadProject('test-project', '1.0.0');

      // Verify the result
      expect(result).toEqual(mockProjectData);
      expect(mockS3Instance.getObject).toHaveBeenCalled();
      expect(loggerInstance.info).toHaveBeenCalledWith(expect.stringContaining('downloaded from S3 successfully'), expect.any(Object));
    });

    it('should return null when offline', async () => {
      // Ensure service is configured but offline
      await s3ServiceInstance.configure('a', 'b', 'c', 'd');
      vi.mocked(require('../../services/OfflineService').default.getOnlineStatus).mockReturnValue(false);

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
      vi.mocked(require('../../services/OfflineService').default.getOnlineStatus).mockReturnValue(true);

      // Mock the promise for getObject to reject
      const downloadError = new Error('S3 Download failed');
      mockS3Instance.promise.mockRejectedValueOnce(downloadError);

      // Call the method on the instance
      const result = await s3ServiceInstance.downloadProject('test-project', '1.0.0');

      // Verify the result
      expect(result).toBeNull();
      expect(mockS3Instance.getObject).toHaveBeenCalled();
      expect(loggerInstance.error).toHaveBeenCalledWith(expect.stringContaining('Error downloading project'), downloadError);
    });
  });
});
