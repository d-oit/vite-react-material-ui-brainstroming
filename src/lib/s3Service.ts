import AWS from 'aws-sdk';
import { Project } from '@/types';

// Initialize S3 client
const initS3Client = () => {
  const endpoint = import.meta.env.VITE_S3_ENDPOINT;
  
  if (!endpoint) {
    throw new Error('S3 endpoint not configured. Please set VITE_S3_ENDPOINT in your .env file.');
  }

  return new AWS.S3({
    endpoint,
    region: 'us-east-1', // Default region, can be overridden in .env
    s3ForcePathStyle: true, // Needed for some S3-compatible services
    signatureVersion: 'v4',
  });
};

// Upload project to S3
export const uploadProject = async (project: Project): Promise<string> => {
  try {
    const s3 = initS3Client();
    const bucketName = 'doit-brainstorming-projects';
    const key = `projects/${project.id}/${project.version}.json`;
    
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(project),
      ContentType: 'application/json',
    };
    
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error('Error uploading project to S3:', error);
    throw error;
  }
};

// Download project from S3
export const downloadProject = async (projectId: string, version?: string): Promise<Project> => {
  try {
    const s3 = initS3Client();
    const bucketName = 'doit-brainstorming-projects';
    
    // If version is not specified, get the latest version
    let key: string;
    
    if (version) {
      key = `projects/${projectId}/${version}.json`;
    } else {
      // List all versions and get the latest one
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
    
    const result = await s3.getObject(params).promise();
    return JSON.parse(result.Body?.toString() || '{}');
  } catch (error) {
    console.error('Error downloading project from S3:', error);
    throw error;
  }
};

// List all projects in S3
export const listProjects = async (): Promise<{ id: string; versions: string[] }[]> => {
  try {
    const s3 = initS3Client();
    const bucketName = 'doit-brainstorming-projects';
    
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
      result.CommonPrefixes.map(async (prefix) => {
        const projectId = prefix.Prefix?.split('/')[1] || '';
        
        // Get all versions for this project
        const versionsParams = {
          Bucket: bucketName,
          Prefix: `projects/${projectId}/`,
        };
        
        const versionsResult = await s3.listObjectsV2(versionsParams).promise();
        
        const versions = versionsResult.Contents?.map((object) => {
          const key = object.Key || '';
          return key.split('/').pop()?.replace('.json', '') || '';
        }) || [];
        
        return {
          id: projectId,
          versions,
        };
      })
    );
    
    return projects;
  } catch (error) {
    console.error('Error listing projects from S3:', error);
    throw error;
  }
};
