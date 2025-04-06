import { Project } from '../types';

// Define a type for version info
interface VersionInfo {
  version: string;
  lastModified: Date;
}

/**
 * Service for AWS S3 operations
 * This is a browser-compatible version that loads AWS SDK dynamically only when needed
 */
export class S3Service {
  private static instance: S3Service;
  private s3: unknown = null;
  private AWS: unknown = null;
  private bucketName: string = 'do-it-brainstorming';
  private region: string = 'us-east-1';
  private _isConfigured: boolean = false;
  private _isAvailable: boolean = false;

  private constructor() {
    // Check if AWS SDK is available in the environment variables
    try {
      // @ts-expect-error - Vite specific environment variable
      this._isAvailable = !!import.meta.env.VITE_AWS_S3_ENABLED;
    } catch (_) {
      console.warn('Unable to check environment variables for S3 configuration');
      this._isAvailable = false;
    }
  }

  public static getInstance(): S3Service {
    if (!S3Service.instance) {
      S3Service.instance = new S3Service();
    }
    return S3Service.instance;
  }

  /**
   * Check if S3 service is available
   * @returns True if S3 service is available
   */
  public isS3Available(): boolean {
    return this._isAvailable;
  }

  /**
   * Configure the S3 service with credentials
   * @param accessKeyId AWS access key ID
   * @param secretAccessKey AWS secret access key
   * @param region AWS region
   * @param bucketName S3 bucket name
   */
  public async configure(
    accessKeyId: string,
    secretAccessKey: string,
    region?: string,
    bucketName?: string
  ): Promise<boolean> {
    if (!this._isAvailable) {
      console.warn('AWS S3 is not enabled in environment variables');
      return false;
    }

    try {
      // Dynamically import AWS SDK only when needed
      if (!this.AWS) {
        try {
          // Use dynamic import to load AWS SDK only when needed
          // @ts-expect-error - Dynamic import
          const AWS = await import('aws-sdk/dist/aws-sdk.js');
          this.AWS = AWS.default || AWS;
        } catch (err) {
          console.error('Failed to load AWS SDK:', err);
          return false;
        }
      }

      // @ts-expect-error - Dynamic AWS SDK
      this.AWS.config.update({
        region: region || this.region,
        // @ts-expect-error - Dynamic AWS SDK
        credentials: new this.AWS.Credentials({
          accessKeyId,
          secretAccessKey,
        }),
      });

      // @ts-expect-error - Dynamic AWS SDK
      this.s3 = new this.AWS.S3({
        region: region || this.region,
      });

      if (bucketName) {
        this.bucketName = bucketName;
      }

      if (region) {
        this.region = region;
      }

      this._isConfigured = true;
      return true;
    } catch (error) {
      console.error('Error configuring S3 service:', error);
      return false;
    }
  }

  /**
   * Upload a project to S3
   * @param project Project to upload
   * @returns S3 upload response or null if failed
   */
  public async uploadProject(project: Project): Promise<unknown> {
    if (!this._isAvailable || !this._isConfigured) {
      console.warn('S3 service is not available or not configured');
      return null;
    }

    try {
      const key = `projects/${project.id}/${project.version}.json`;
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: JSON.stringify(project),
        ContentType: 'application/json',
      };

      return await this.s3.putObject(params).promise();
    } catch (error) {
      console.error('Error uploading project to S3:', error);
      return null;
    }
  }

  /**
   * Download a project from S3
   * @param projectId Project ID
   * @param version Project version (optional)
   * @returns Project object or null if failed
   */
  public async downloadProject(projectId: string, version?: string): Promise<Project | null> {
    if (!this._isAvailable || !this._isConfigured) {
      console.warn('S3 service is not available or not configured');
      return null;
    }

    try {
      let key: string;

      if (version) {
        key = `projects/${projectId}/${version}.json`;
      } else {
        // List all versions and get the latest
        const listParams = {
          Bucket: this.bucketName,
          Prefix: `projects/${projectId}/`,
        };

        const listResponse = await this.s3.listObjectsV2(listParams).promise();

        if (!listResponse.Contents || listResponse.Contents.length === 0) {
          console.warn(`No versions found for project ${projectId}`);
          return null;
        }

        // Sort by last modified date (descending)
        const sortedObjects = listResponse.Contents.sort((a: any, b: any) => {
          return (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0);
        });

        key = sortedObjects[0].Key || '';
      }

      const params = {
        Bucket: this.bucketName,
        Key: key,
      };

      const response = await this.s3.getObject(params).promise();

      if (!response.Body) {
        console.warn('Empty response body');
        return null;
      }

      return JSON.parse(response.Body.toString());
    } catch (error) {
      console.error('Error downloading project from S3:', error);
      return null;
    }
  }

  /**
   * List all versions of a project
   * @param projectId Project ID
   * @returns Array of version information or empty array if failed
   */
  public async listProjectVersions(
    projectId: string
  ): Promise<{ version: string; lastModified: Date }[]> {
    if (!this._isAvailable || !this._isConfigured) {
      console.warn('S3 service is not available or not configured');
      return [];
    }

    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: `projects/${projectId}/`,
      };

      const response = await this.s3.listObjectsV2(params).promise();

      if (!response.Contents) {
        return [];
      }

      return response.Contents.map((item: any) => {
        const key = item.Key || '';
        const version = key.split('/').pop()?.replace('.json', '') || '';

        return {
          version,
          lastModified: item.LastModified || new Date(),
        };
      }).sort((a: any, b: any) => b.lastModified.getTime() - a.lastModified.getTime());
    } catch (error) {
      console.error('Error listing project versions from S3:', error);
      return [];
    }
  }

  /**
   * Check if the service is configured
   * @returns True if configured, false otherwise
   */
  public isConfigured(): boolean {
    return this._isConfigured && this._isAvailable;
  }
}

export default S3Service.getInstance();
