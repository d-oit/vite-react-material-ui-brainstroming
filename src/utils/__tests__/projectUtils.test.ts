import { describe, it, expect } from 'vitest';
import { hasProjectChanged } from '../projectUtils';
import type { Project } from '../../types';
import { ProjectTemplate } from '../../types/project';

describe('projectUtils', () => {
  describe('hasProjectChanged', () => {
    const baseProject: Project = {
      id: 'test-id',
      name: 'Test Project',
      description: 'Test Description',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      version: '1.0.0',
      template: ProjectTemplate.CUSTOM,
      nodes: [
        {
          id: 'node1',
          type: 'idea',
          position: { x: 100, y: 100 },
          data: {
            id: 'node1',
            title: 'Node 1',
            content: 'Content 1',
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            type: 'idea',
          },
        },
      ],
      edges: [
        {
          id: 'edge1',
          source: 'node1',
          target: 'node2',
          type: 'default',
        },
      ],
      syncSettings: {
        enableS3Sync: false,
        syncFrequency: 'manual',
        intervalMinutes: 30,
      },
    };

    it('should return false when projects are identical', () => {
      const project1 = { ...baseProject };
      const project2 = { ...baseProject };
      expect(hasProjectChanged(project1, project2)).toBe(false);
    });

    it('should return true when one project is null', () => {
      expect(hasProjectChanged(baseProject, null)).toBe(true);
      expect(hasProjectChanged(null, baseProject)).toBe(true);
    });

    it('should return false when both projects are null', () => {
      expect(hasProjectChanged(null, null)).toBe(false);
    });

    it('should return true when nodes have changed', () => {
      const project1 = { ...baseProject };
      const project2 = {
        ...baseProject,
        nodes: [
          ...baseProject.nodes,
          {
            id: 'node2',
            type: 'task',
            position: { x: 200, y: 200 },
            data: {
              id: 'node2',
              title: 'Node 2',
              content: 'Content 2',
              createdAt: '2023-01-01T00:00:00.000Z',
              updatedAt: '2023-01-01T00:00:00.000Z',
              type: 'task',
            },
          },
        ],
      };
      expect(hasProjectChanged(project1, project2)).toBe(true);
    });

    it('should return true when edges have changed', () => {
      const project1 = { ...baseProject };
      const project2 = {
        ...baseProject,
        edges: [
          ...baseProject.edges,
          {
            id: 'edge2',
            source: 'node2',
            target: 'node3',
            type: 'default',
          },
        ],
      };
      expect(hasProjectChanged(project1, project2)).toBe(true);
    });

    it('should return true when name has changed', () => {
      const project1 = { ...baseProject };
      const project2 = { ...baseProject, name: 'Changed Name' };
      expect(hasProjectChanged(project1, project2)).toBe(true);
    });

    it('should return true when description has changed', () => {
      const project1 = { ...baseProject };
      const project2 = { ...baseProject, description: 'Changed Description' };
      expect(hasProjectChanged(project1, project2)).toBe(true);
    });

    it('should return true when sync settings have changed', () => {
      const project1 = { ...baseProject };
      const project2 = {
        ...baseProject,
        syncSettings: {
          ...baseProject.syncSettings,
          enableS3Sync: true,
        },
      };
      expect(hasProjectChanged(project1, project2)).toBe(true);
    });

    it('should ignore updatedAt timestamp changes', () => {
      const project1 = { ...baseProject };
      const project2 = { ...baseProject, updatedAt: '2023-01-02T00:00:00.000Z' };
      expect(hasProjectChanged(project1, project2)).toBe(false);
    });
  });
});
