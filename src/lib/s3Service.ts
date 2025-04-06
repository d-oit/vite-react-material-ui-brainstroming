import AWS from 'aws-sdk';

import type { Project } from '../types';
import loggerService from '../services/LoggerService';

// Initialize S3 client
const initS3Client = () => {
  // Check if S3 is configured in environment variables
  const endpoint = import.meta.env.VITE_AWS_S3_ENDPOINT;
  const region = import.meta.env.VITE_AWS_REGION || 'us-east-1';
  const bucket = import.meta.env.VITE_AWS_S3_BUCKET;

  if (!endpoint && !bucket) {
    throw new Error('S3 not configured. Please set VITE_AWS_S3_ENDPOINT and VITE_AWS_S3_BUCKET in your .env file.');
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
    throw new Error('S3 bucket not configured. Please set VITE_AWS_S3_BUCKET in your .env file.');
  }
  return bucket;
};

// Retry mechanism for S3 operations
const withRetry = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      loggerService.warn(`S3 operation failed (attempt ${attempt}/${maxRetries}): ${lastError.message}`);

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

// Progress callback type
export type ProgressCallback = (progress: number) => void;

// Upload project to S3
export const uploadProject = async (
  project: Project,
  onProgress?: ProgressCallback
): Promise<string> => {
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
      managedUpload.on('httpUploadProgress', (progress) => {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        onProgress(percentage);
      });
    }

    const result = await managedUpload.promise();

    // Upload latest version reference
    await s3.putObject({
      Bucket: bucketName,
      Key: latestKey,
      Body: JSON.stringify(project),
      ContentType: 'application/json',
    }).promise();

    // Upload metadata
    await s3.putObject({
      Bucket: bucketName,
      Key: metadataKey,
      Body: JSON.stringify(metadata),
      ContentType: 'application/json',
    }).promise();

    loggerService.info(`Project ${project.id} (v${project.version}) uploaded to S3 successfully`);
    return result.Location;
  });
};

// Download project from S3
export const downloadProject = async (
  projectId: string,
  version?: string | number,
  onProgress?: ProgressCallback
): Promise<Project> => {
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

        const latestResult = await s3.getObject(latestParams).promise();
        const project = JSON.parse(latestResult.Body?.toString() || '{}');

        if (project && project.id === projectId) {
          loggerService.info(`Downloaded latest version of project ${projectId} from S3`);
          return project;
        }
      } catch (error) {
        loggerService.warn(`No latest.json found for project ${projectId}, falling back to listing versions`);
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

      request.on('httpDownloadProgress', (progress) => {
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
export const listProjects = async (): Promise<{
  id: string;
  name: string;
  description: string;
  version: number;
  updatedAt: string;
  isArchived?: boolean;
  template?: string;
  versions: string[];
}[]> => {
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
        } catch (error) {
          loggerService.warn(`No metadata found for project ${projectId}`);
        }

        // List all versions for this project
        const versionParams = {
          Bucket: bucketName,
          Prefix: `projects/${projectId}/`,
        };

        const versionResult = await s3.listObjectsV2(versionParams).promise();
        const versions = versionResult.Contents?.filter(obj => {
          const key = obj.Key || '';
          return key.endsWith('.json') &&
                 !key.endsWith('latest.json') &&
                 !key.endsWith('metadata.json');
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

// Check if S3 is configured
export const isS3Configured = (): boolean => {
  try {
    const bucket = import.meta.env.VITE_AWS_S3_BUCKET;
    const region = import.meta.env.VITE_AWS_REGION;
    return !!bucket && !!region;
  } catch (error) {
    return false;
  }
};
