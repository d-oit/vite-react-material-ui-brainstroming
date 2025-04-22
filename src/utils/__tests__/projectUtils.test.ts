import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { Project } from '../../types'
import { ProjectTemplate } from '../../types/project'
import { performanceTracker } from '../performanceMonitoring'
import { hasProjectChanged } from '../projectUtils'

// Mock the performance monitoring
vi.mock('../performanceMonitoring', () => ({
	performanceTracker: {
		startMeasure: vi.fn().mockReturnValue('test-metric-id'),
		endMeasure: vi.fn(),
	},
	PerformanceCategory: {
		PROCESSING: 'processing',
	},
}))

describe('projectUtils', () => {
	describe('hasProjectChanged', () => {
		beforeEach(() => {
			vi.clearAllMocks()
		})
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
		}

		it('should return false when projects are identical', () => {
			const project1 = { ...baseProject }
			const project2 = { ...baseProject }
			expect(hasProjectChanged(project1, project2)).toBe(false)

			// Verify performance monitoring was used
			expect(performanceTracker.startMeasure).toHaveBeenCalledWith('hasProjectChanged', 'processing')
			expect(performanceTracker.endMeasure).toHaveBeenCalledWith('test-metric-id')
		})

		it('should return true when one project is null', () => {
			expect(hasProjectChanged(baseProject, null)).toBe(true)
			expect(hasProjectChanged(null, baseProject)).toBe(true)
		})

		it('should return false when both projects are null', () => {
			expect(hasProjectChanged(null, null)).toBe(false)
		})

		it('should return true when nodes have changed', () => {
			const project1 = { ...baseProject }
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
			}
			expect(hasProjectChanged(project1, project2)).toBe(true)
		})

		it('should return true when edges have changed', () => {
			const project1 = { ...baseProject }
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
			}
			expect(hasProjectChanged(project1, project2)).toBe(true)
		})

		it('should return true when name has changed', () => {
			const project1 = { ...baseProject }
			const project2 = { ...baseProject, name: 'Changed Name' }
			expect(hasProjectChanged(project1, project2)).toBe(true)
		})

		it('should return true when description has changed', () => {
			const project1 = { ...baseProject }
			const project2 = { ...baseProject, description: 'Changed Description' }
			expect(hasProjectChanged(project1, project2)).toBe(true)
		})

		it('should return true when sync settings have changed', () => {
			const project1 = { ...baseProject }
			const project2 = {
				...baseProject,
				syncSettings: {
					...baseProject.syncSettings,
					enableS3Sync: true,
				},
			}
			expect(hasProjectChanged(project1, project2)).toBe(true)
		})

		it('should ignore updatedAt timestamp changes', () => {
			const project1 = { ...baseProject }
			const project2 = { ...baseProject, updatedAt: '2023-01-02T00:00:00.000Z' }
			expect(hasProjectChanged(project1, project2)).toBe(false)
		})

		it('should return true when node position has changed', () => {
			const project1 = { ...baseProject }
			const project2 = {
				...baseProject,
				nodes: [
					{
						...baseProject.nodes[0],
						position: { x: 150, y: 150 }, // Changed position
					},
				],
			}
			expect(hasProjectChanged(project1, project2)).toBe(true)
		})

		it('should return true when node data has changed', () => {
			const project1 = { ...baseProject }
			const project2 = {
				...baseProject,
				nodes: [
					{
						...baseProject.nodes[0],
						data: {
							...baseProject.nodes[0].data,
							title: 'Updated Title',
						},
					},
				],
			}
			expect(hasProjectChanged(project1, project2)).toBe(true)
		})

		it('should return true when edge source has changed', () => {
			const project1 = { ...baseProject }
			const project2 = {
				...baseProject,
				edges: [
					{
						...baseProject.edges[0],
						source: 'node3', // Changed source
					},
				],
			}
			expect(hasProjectChanged(project1, project2)).toBe(true)
		})

		it('should return true when edge target has changed', () => {
			const project1 = { ...baseProject }
			const project2 = {
				...baseProject,
				edges: [
					{
						...baseProject.edges[0],
						target: 'node3', // Changed target
					},
				],
			}
			expect(hasProjectChanged(project1, project2)).toBe(true)
		})

		it('should handle projects with empty nodes and edges', () => {
			const project1 = { ...baseProject, nodes: [], edges: [] }
			const project2 = { ...baseProject, nodes: [], edges: [] }
			expect(hasProjectChanged(project1, project2)).toBe(false)
		})

		it('should handle projects with undefined nodes or edges', () => {
			const project1 = { ...baseProject }
			const project2 = { ...baseProject }

			// @ts-ignore - Testing edge case with undefined
			delete project2.nodes

			expect(hasProjectChanged(project1, project2)).toBe(true)
		})

		it('should handle large projects efficiently', () => {
			// Create a large project with many nodes
			const largeProject1: Project = {
				...baseProject,
				nodes: Array(100)
					.fill(null)
					.map((_, index) => ({
						id: `node${index}`,
						type: 'idea',
						position: { x: index * 10, y: index * 10 },
						data: {
							id: `node${index}`,
							title: `Node ${index}`,
							content: `Content ${index}`,
							createdAt: '2023-01-01T00:00:00.000Z',
							updatedAt: '2023-01-01T00:00:00.000Z',
							type: 'idea',
						},
					})),
				edges: Array(50)
					.fill(null)
					.map((_, index) => ({
						id: `edge${index}`,
						source: `node${index}`,
						target: `node${index + 1}`,
						type: 'default',
					})),
			}

			const largeProject2 = JSON.parse(JSON.stringify(largeProject1))

			// Measure performance
			const startTime = performance.now()
			const result = hasProjectChanged(largeProject1, largeProject2)
			const endTime = performance.now()

			expect(result).toBe(false)

			// Ensure the function completes in a reasonable time (less than 100ms)
			// This is a loose threshold for CI environments
			expect(endTime - startTime).toBeLessThan(100)
		})
	})
})
