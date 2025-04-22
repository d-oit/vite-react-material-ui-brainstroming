import { describe, it, expect, vi } from 'vitest'

import type { Project } from '../../types'
import { ProjectTemplate } from '../../types/project'
import { hasProjectChanged } from '../../utils/projectUtils'

// Mock the s3Service
vi.mock('../../lib/s3Service', () => ({
	uploadProject: vi.fn().mockResolvedValue(undefined),
	downloadProject: vi.fn().mockResolvedValue(null),
}))

// We're only testing the hasProjectChanged function directly
// No need to mock services for this simplified test

describe('Project change detection', () => {
	const baseProject: Project = {
		id: 'test-id',
		name: 'Test Project',
		description: 'Test Description',
		createdAt: '2023-01-01T00:00:00.000Z',
		updatedAt: '2023-01-01T00:00:00.000Z',
		version: '1.0.0',
		template: ProjectTemplate.CUSTOM,
		nodes: [],
		edges: [],
		syncSettings: {
			enableS3Sync: false,
			syncFrequency: 'manual',
			intervalMinutes: 30,
		},
	}

	it('should detect no changes when projects are identical', () => {
		const project1 = { ...baseProject }
		const project2 = { ...baseProject }
		expect(hasProjectChanged(project1, project2)).toBe(false)
	})

	it('should detect changes when name is modified', () => {
		const project1 = { ...baseProject }
		const project2 = { ...baseProject, name: 'Modified Name' }
		expect(hasProjectChanged(project1, project2)).toBe(true)
	})

	it('should detect changes when nodes are added', () => {
		const project1 = { ...baseProject }
		const project2 = {
			...baseProject,
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
		}
		expect(hasProjectChanged(project1, project2)).toBe(true)
	})

	it('should ignore updatedAt timestamp changes', () => {
		const project1 = { ...baseProject }
		const project2 = { ...baseProject, updatedAt: '2023-01-02T00:00:00.000Z' }
		expect(hasProjectChanged(project1, project2)).toBe(false)
	})
})
