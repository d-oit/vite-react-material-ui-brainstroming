import AWS from 'aws-sdk';
import { Project } from '../types';

/**
 * Service for AWS S3 operations
 */
export class S3Service {
  private static instance: S3Service;
  private s3: AWS.S3;
  private bucketName: string = 'do-it-brainstorming';
  private region: string = 'us-east-1';
  private isConfigured: boolean = false;

  private constructor() {
    // Initialize S3 client
    this.s3 = new AWS.S3({
      region: this.region,
      // Credentials will be set later
    });
  }

  public static getInstance(): S3Service {
    if (!S3Service.instance) {
      S3Service.instance = new S3Service();
    }
    return S3Service.instance;
  }

  /**
   * Configure the S3 service with credentials
   * @param accessKeyId AWS access key ID
   * @param secretAccessKey AWS secret access key
   * @param region AWS region
   * @param bucketName S3 bucket name
   */
  public configure(
    accessKeyId: string,
    secretAccessKey: string,
    region?: string,
    bucketName?: string
  ): void {
    AWS.config.update({
      region: region || this.region,
      credentials: new AWS.Credentials({
        accessKeyId,
        secretAccessKey,
      }),
    });

    this.s3 = new AWS.S3({
      region: region || this.region,
    });

    if (bucketName) {
      this.bucketName = bucketName;
    }

    if (region) {
      this.region = region;
    }

    this.isConfigured = true;
  }

  /**
   * Upload a project to S3
   * @param project Project to upload
   * @returns S3 upload response
   */
  public async uploadProject(project: Project): Promise<AWS.S3.PutObjectOutput> {
    this.checkConfiguration();

    const key = `projects/${project.id}/${project.version}.json`;
    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: key,
      Body: JSON.stringify(project),
      ContentType: 'application/json',
    };

    return this.s3.putObject(params).promise();
  }

  /**
   * Download a project from S3
   * @param projectId Project ID
   * @param version Project version (optional)
   * @returns Project object
   */
  public async downloadProject(projectId: string, version?: string): Promise<Project> {
    this.checkConfiguration();

    let key: string;
    
    if (version) {
      key = `projects/${projectId}/${version}.json`;
    } else {
      // List all versions and get the latest
      const listParams: AWS.S3.ListObjectsV2Request = {
        Bucket: this.bucketName,
        Prefix: `projects/${projectId}/`,
      };
      
      const listResponse = await this.s3.listObjectsV2(listParams).promise();
      
      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        throw new Error(`No versions found for project ${projectId}`);
      }
      
      // Sort by last modified date (descending)
      const sortedObjects = listResponse.Contents.sort((a, b) => {
        return (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0);
      });
      
      key = sortedObjects[0].Key || '';
    }
    
    const params: AWS.S3.GetObjectRequest = {
      Bucket: this.bucketName,
      Key: key,
    };
    
    const response = await this.s3.getObject(params).promise();
    
    if (!response.Body) {
      throw new Error('Empty response body');
    }
    
    return JSON.parse(response.Body.toString());
  }

  /**
   * List all versions of a project
   * @param projectId Project ID
   * @returns Array of version information
   */
  public async listProjectVersions(projectId: string): Promise<{ version: string, lastModified: Date }[]> {
    this.checkConfiguration();
    
    const params: AWS.S3.ListObjectsV2Request = {
      Bucket: this.bucketName,
      Prefix: `projects/${projectId}/`,
    };
    
    const response = await this.s3.listObjectsV2(params).promise();
    
    if (!response.Contents) {
      return [];
    }
    
    return response.Contents.map(item => {
      const key = item.Key || '';
      const version = key.split('/').pop()?.replace('.json', '') || '';
      
      return {
        version,
        lastModified: item.LastModified || new Date(),
      };
    }).sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }

  /**
   * Check if the service is configured
   * @throws Error if not configured
   */
  private checkConfiguration(): void {
    if (!this.isConfigured) {
      throw new Error('S3Service is not configured. Call configure() first.');
    }
  }
}

export default S3Service.getInstance();
