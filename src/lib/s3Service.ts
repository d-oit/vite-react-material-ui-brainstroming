import AWS from 'aws-sdk';

import loggerService from '../services/LoggerService';
import type { Project } from '../types';
import { isValidUrl, /* sanitizeUrl, */ validateS3Endpoint } from '../utils/urlValidation';

/**
 * Create a dummy S3 client that gracefully fails all operations
 * @param errorMessage Error message to use for rejections
 * @returns Dummy S3 client
 */
const createDummyS3Client = (errorMessage: string): AWS.S3 => {
  return {
    putObject: () => ({ promise: () => Promise.reject(new Error(errorMessage)) }),
    getObject: () => ({ promise: () => Promise.reject(new Error(errorMessage)) }),
    listObjectsV2: () => ({ promise: () => Promise.reject(new Error(errorMessage)) }),
    deleteObjects: () => ({ promise: () => Promise.reject(new Error(errorMessage)) }),
    upload: () => ({
      promise: () => Promise.reject(new Error(errorMessage)),
      on: (_event: string, _callback: unknown) => {
        // Mock the progress event but don't call the callback since we're failing anyway
        return {};
      },
    }),
  } as AWS.S3;
};

/**
 * Check if S3 is enabled in the environment
 * @returns True if S3 is enabled, false otherwise
 */
export const isS3Enabled = (): boolean => {
  return import.meta.env.VITE_S3_ENABLED === 'true';
};

/**
 * Initialize S3 client with proper validation and error handling
 * @returns Configured S3 client or dummy client if configuration is invalid
 */
const initS3Client = () => {
  // First check if S3 is enabled
  if (!isS3Enabled()) {
    loggerService.info('S3 integration is disabled by configuration');
    return createDummyS3Client('S3 integration is disabled');
  }

  // Check if S3 is configured in environment variables
  const endpoint = import.meta.env.VITE_AWS_S3_ENDPOINT;
  const region = import.meta.env.VITE_AWS_REGION || 'us-east-1';
  const bucket = import.meta.env.VITE_AWS_S3_BUCKET;
  const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
  const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;

  // Check for required credentials
  if (!accessKeyId || !secretAccessKey) {
    loggerService.warn(
      'S3 credentials not configured. Please set VITE_AWS_ACCESS_KEY_ID and VITE_AWS_SECRET_ACCESS_KEY in your .env file.'
    );
    return createDummyS3Client('S3 credentials not configured');
  }

  // If S3 is not configured at all, return a dummy client
  if (!bucket) {
    loggerService.warn(
      'S3 bucket not configured. Please set VITE_AWS_S3_BUCKET in your .env file.'
    );
    return createDummyS3Client('S3 bucket not configured');
  }

  // Validate the endpoint URL if provided
  if (endpoint) {
    const validation = validateS3Endpoint(endpoint);
    if (!validation.isValid) {
      loggerService.error(`Invalid S3 endpoint URL: ${validation.message}`);
      return createDummyS3Client(`Invalid S3 endpoint URL: ${validation.message}`);
    }

    if (validation.message) {
      // This is a warning, but we can still proceed
      loggerService.warn(`S3 endpoint warning: ${validation.message}`);
    }
  }

  const config: AWS.S3.ClientConfiguration = {
    region,
    signatureVersion: 'v4',
  };

  // Add endpoint if specified (for S3-compatible services)
  if (endpoint) {
    config.endpoint = endpoint;
    config.s3ForcePathStyle = true;
  }

  return new AWS.S3(config);
};

// Get bucket name from environment variables
const getBucketName = (): string => {
  const bucket = import.meta.env.VITE_AWS_S3_BUCKET;
  if (!bucket) {
    // Instead of throwing an error, log a warning and return a default value
    loggerService.warn(
      'S3 bucket not configured. Please set VITE_AWS_S3_BUCKET in your .env file.'
    );
    return 'do-it-brainstorming-default';
  }
  return bucket;
};

/**
 * Retry mechanism for S3 operations with exponential backoff
 * @param operation Function to retry
 * @param maxRetries Maximum number of retries (default: 3)
 * @param baseDelay Base delay in ms (default: 1000)
 * @returns Promise that resolves with the operation result
 */
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  let retryableError = true;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if this is a non-retryable error
      if (error instanceof Error) {
        // Don't retry client errors (4xx)
        if (
          error.name === 'AccessDenied' ||
          error.name === 'InvalidAccessKeyId' ||
          error.name === 'InvalidToken' ||
          error.name === 'MissingSecurityHeader'
        ) {
          loggerService.error(`S3 authentication error: ${error.message}`);
          retryableError = false;
          break;
        }

        // Don't retry if the bucket doesn't exist
        if (error.name === 'NoSuchBucket') {
          loggerService.error(`S3 bucket does not exist: ${error.message}`);
          retryableError = false;
          break;
        }
      }

      loggerService.warn(
        `S3 operation failed (attempt ${attempt}/${maxRetries}): ${lastError.message}`
      );

      if (attempt < maxRetries) {
        // Exponential backoff with jitter: 1-2s, 2-4s, 4-8s, etc.
        const delay = Math.pow(2, attempt - 1) * baseDelay;
        const jitter = Math.random() * 0.3 * delay; // Add up to 30% jitter
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
  }

  if (lastError) {
    if (!retryableError) {
      loggerService.error(`S3 operation failed with non-retryable error: ${lastError.message}`);
    } else {
      loggerService.error(`S3 operation failed after ${maxRetries} attempts: ${lastError.message}`);
    }
    throw lastError;
  }

  // This should never happen, but TypeScript requires it
  throw new Error('Unknown error in S3 operation');
};

// Progress callback type
export type ProgressCallback = (progress: number) => void;

/**
 * Upload a project to S3 with progress tracking and error handling
 * @param project Project to upload
 * @param onProgress Optional callback for upload progress
 * @returns Promise that resolves with the S3 URL of the uploaded project
 */
export const uploadProject = async (
  project: Project,
  onProgress?: ProgressCallback
): Promise<string> => {
  // First check if S3 is enabled
  if (!isS3Enabled()) {
    loggerService.info('S3 upload skipped - S3 integration is disabled');
    return Promise.reject(new Error('S3 integration is disabled'));
  }

  return withRetry(async () => {
    const s3 = initS3Client();
    const bucketName = getBucketName();
    const key = `projects/${project.id}/${project.version}.json`;

    // Also store a latest.json file for easy access to the latest version
    const latestKey = `projects/${project.id}/latest.json`;

    // Store project metadata for listing
    const metadataKey = `projects/${project.id}/metadata.json`;
    const metadata = {
      id: project.id,
      name: project.name,
      description: project.description,
      version: project.version,
      updatedAt: project.updatedAt,
      isArchived: project.isArchived,
      template: project.template,
      syncedAt: new Date().toISOString(),
    };

    // Upload the project version
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(project),
      ContentType: 'application/json',
    };

    // Use managed upload for progress tracking
    const managedUpload = s3.upload(params);

    if (onProgress) {
      managedUpload.on('httpUploadProgress', progress => {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        onProgress(percentage);
      });
    }

    const result = await managedUpload.promise();

    // Upload latest version reference
    await s3
      .putObject({
        Bucket: bucketName,
        Key: latestKey,
        Body: JSON.stringify(project),
        ContentType: 'application/json',
      })
      .promise();

    // Upload metadata
    await s3
      .putObject({
        Bucket: bucketName,
        Key: metadataKey,
        Body: JSON.stringify(metadata),
        ContentType: 'application/json',
      })
      .promise();

    loggerService.info(`Project ${project.id} (v${project.version}) uploaded to S3 successfully`);
    return result.Location;
  });
};

/**
 * Download a project from S3 with error handling
 * @param projectId Project ID to download
 * @param version Optional specific version to download
 * @param onProgress Optional callback for download progress
 * @returns Promise that resolves with the downloaded project
 */
export const downloadProject = async (
  projectId: string,
  version?: string | number,
  onProgress?: ProgressCallback
): Promise<Project> => {
  // First check if S3 is enabled
  if (!isS3Enabled()) {
    loggerService.info('S3 download skipped - S3 integration is disabled');
    return Promise.reject(new Error('S3 integration is disabled'));
  }

  return withRetry(async () => {
    const s3 = initS3Client();
    const bucketName = getBucketName();

    // If version is not specified, get the latest version
    let key: string;

    if (version) {
      key = `projects/${projectId}/${version}.json`;
    } else {
      // Try to get the latest.json file first
      try {
        key = `projects/${projectId}/latest.json`;
        const latestParams = {
          Bucket: bucketName,
          Key: key,
        };

        // Log the download attempt
        loggerService.info(`Attempting to download latest version of project ${projectId} from S3`);

        const latestResult = await s3.getObject(latestParams).promise();

        // Validate the response
        if (!latestResult.Body) {
          throw new Error('Empty response body from S3');
        }

        // Parse the project data
        try {
          const project = JSON.parse(latestResult.Body.toString());

          // Validate the project data
          if (!project || typeof project !== 'object') {
            throw new Error('Invalid project data format');
          }

          if (project.id !== projectId) {
            throw new Error(`Project ID mismatch: expected ${projectId}, got ${project.id}`);
          }

          loggerService.info(`Downloaded latest version of project ${projectId} from S3`);
          return project;
        } catch (parseError) {
          loggerService.error(
            `Failed to parse project data: ${parseError instanceof Error ? parseError.message : String(parseError)}`
          );
          throw new Error('Invalid project data format');
        }
      } catch (error) {
        loggerService.warn(
          `No latest.json found for project ${projectId}, falling back to listing versions: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      // Fall back to listing all versions
      const listParams = {
        Bucket: bucketName,
        Prefix: `projects/${projectId}/`,
        MaxKeys: 1000,
      };

      const listedObjects = await s3.listObjectsV2(listParams).promise();

      if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
        throw new Error(`No versions found for project ${projectId}`);
      }

      // Sort by last modified date (descending)
      const sortedObjects = listedObjects.Contents.sort((a, b) => {
        return (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0);
      });

      key = sortedObjects[0]?.Key || '';
    }

    const params = {
      Bucket: bucketName,
      Key: key,
    };

    // Use getObject with progress tracking if callback provided
    if (onProgress) {
      const request = s3.getObject(params);

      request.on('httpDownloadProgress', progress => {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        onProgress(percentage);
      });

      const result = await request.promise();
      const project = JSON.parse(result.Body?.toString() || '{}');
      loggerService.info(`Project ${projectId} downloaded from S3 successfully`);
      return project;
    } else {
      const result = await s3.getObject(params).promise();
      const project = JSON.parse(result.Body?.toString() || '{}');
      loggerService.info(`Project ${projectId} downloaded from S3 successfully`);
      return project;
    }
  });
};

// List all projects in S3
export const listProjects = async (): Promise<
  {
    id: string;
    name: string;
    description: string;
    version: number;
    updatedAt: string;
    isArchived?: boolean;
    template?: string;
    versions: string[];
  }[]
> => {
  return withRetry(async () => {
    const s3 = initS3Client();
    const bucketName = getBucketName();

    const params = {
      Bucket: bucketName,
      Prefix: 'projects/',
      Delimiter: '/',
    };

    const result = await s3.listObjectsV2(params).promise();

    if (!result.CommonPrefixes) {
      return [];
    }

    const projects = await Promise.all(
      result.CommonPrefixes.map(async prefix => {
        const projectId = prefix.Prefix?.split('/')[1] || '';
        let metadata = {
          id: projectId,
          name: projectId,
          description: '',
          version: 1,
          updatedAt: new Date().toISOString(),
        };

        // Try to get metadata file first
        try {
          const metadataParams = {
            Bucket: bucketName,
            Key: `projects/${projectId}/metadata.json`,
          };

          const metadataResult = await s3.getObject(metadataParams).promise();
          metadata = JSON.parse(metadataResult.Body?.toString() || '{}');
        } catch (_) {
          loggerService.warn(`No metadata found for project ${projectId}`);
        }

        // List all versions for this project
        const versionParams = {
          Bucket: bucketName,
          Prefix: `projects/${projectId}/`,
        };

        const versionResult = await s3.listObjectsV2(versionParams).promise();
        const versions =
          versionResult.Contents?.filter(obj => {
            const key = obj.Key || '';
            return (
              key.endsWith('.json') &&
              !key.endsWith('latest.json') &&
              !key.endsWith('metadata.json')
            );
          })
            .map(obj => {
              const key = obj.Key || '';
              const version = key.split('/').pop()?.replace('.json', '') || '';
              return version;
            })
            .filter(version => version !== '') || [];

        return {
          ...metadata,
          versions,
        };
      })
    );

    return projects;
  });
};

// Delete a project from S3
export const deleteProject = async (projectId: string): Promise<void> => {
  return withRetry(async () => {
    const s3 = initS3Client();
    const bucketName = getBucketName();

    // List all objects for this project
    const listParams = {
      Bucket: bucketName,
      Prefix: `projects/${projectId}/`,
    };

    const listResult = await s3.listObjectsV2(listParams).promise();

    if (!listResult.Contents || listResult.Contents.length === 0) {
      loggerService.warn(`No objects found for project ${projectId}`);
      return;
    }

    // Delete all objects
    const deleteParams = {
      Bucket: bucketName,
      Delete: {
        Objects: listResult.Contents.map(obj => ({ Key: obj.Key || '' })),
        Quiet: false,
      },
    };

    await s3.deleteObjects(deleteParams).promise();
    loggerService.info(`Project ${projectId} deleted from S3 successfully`);
  });
};

// Check if S3 is configured and valid
export const isS3Configured = (): boolean => {
  try {
    const endpoint = import.meta.env.VITE_AWS_S3_ENDPOINT;
    const bucket = import.meta.env.VITE_AWS_S3_BUCKET;
    const region = import.meta.env.VITE_AWS_REGION;

    // Basic configuration check
    if (!bucket || !region) {
      return false;
    }

    // If endpoint is provided, validate it
    if (endpoint && !isValidUrl(endpoint)) {
      loggerService.warn('Invalid S3 endpoint URL:', endpoint);
      return false;
    }

    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Get S3 configuration status with detailed information
 * @returns Object with configuration status and details
 */
export const getS3ConfigStatus = (): {
  isConfigured: boolean;
  missingConfig: string[];
  invalidUrls: string[];
} => {
  const result = {
    isConfigured: false,
    missingConfig: [] as string[],
    invalidUrls: [] as string[],
  };

  try {
    const endpoint = import.meta.env.VITE_AWS_S3_ENDPOINT;
    const bucket = import.meta.env.VITE_AWS_S3_BUCKET;
    const region = import.meta.env.VITE_AWS_REGION;

    // Check for missing configuration
    if (!bucket) result.missingConfig.push('S3 Bucket');
    if (!region) result.missingConfig.push('AWS Region');

    // Validate endpoint URL if provided
    if (endpoint && !isValidUrl(endpoint)) {
      result.invalidUrls.push('S3 Endpoint');
    }

    // Set overall configuration status
    result.isConfigured = result.missingConfig.length === 0 && result.invalidUrls.length === 0;

    return result;
  } catch (_) {
    return result;
  }
};
