import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import type { CustomNodeType, CustomEdge } from '../../components/BrainstormFlow/types'
import projectService from '../../services/ProjectService'
import { useBrainstormStore } from '../../store/brainstormStore'
import type { Project } from '../../types'
import { NodeType , EdgeType } from '../../types/enums'
import { ProjectTemplate } from '../../types/project'

// Mock projectService
vi.mock('../../services/ProjectService', () => ({
	default: {
		updateProject: vi.fn(),
		getProject: vi.fn(),
	},
}))

describe('brainstormStore', () => {
	beforeEach(() => {
		// Clear store state
		useBrainstormStore.setState({
			projectId: null,
			nodes: [],
			edges: [],
			isLoading: false,
			error: null,
			activeStep: -1,
			activeTab: 1,
			autoSave: true,
		})
		// Clear mocks
		vi.clearAllMocks()
	})

	describe('saveAllNodes', () => {
		it('should do nothing if projectId is null', async () => {
			const store = useBrainstormStore.getState()
			await vi.waitFor(async () => {
				await store.saveAllNodes()
			})

			expect(projectService.updateProject).not.toHaveBeenCalled()
			expect(store.isLoading).toBe(false)
			expect(store.error).toBeNull()
		})

		it('should save nodes and edges successfully', async () => {
			// Setup test data
			const testNode: CustomNodeType = {
				id: 'test-node',
				type: NodeType.NOTE,
				position: { x: 0, y: 0 },
				data: {
					id: 'test-node',
					type: NodeType.NOTE,
					title: 'Test Node',
					content: 'Test content',
					label: 'Test Node',
					createdAt: '2025-04-24T00:00:00.000Z',
					updatedAt: '2025-04-24T00:00:00.000Z',
					tags: [],
					color: undefined,
				},
			}

			const testEdge: CustomEdge = {
				id: 'test-edge',
				source: 'test-node',
				target: 'test-node-2',
				type: EdgeType.DEFAULT,
			}

			await vi.runOnlyPendingTimersAsync()
			await vi.waitFor(async () => {
				useBrainstormStore.setState({
					projectId: 'test-project',
					nodes: [testNode],
					edges: [testEdge],
				})
			})

			const store = useBrainstormStore.getState()
			await vi.waitFor(async () => {
				await store.saveAllNodes()
			})

			expect(projectService.updateProject).toHaveBeenCalledWith('test-project', {
				nodes: expect.arrayContaining([expect.objectContaining({ id: 'test-node' })]),
				edges: expect.arrayContaining([expect.objectContaining({ id: 'test-edge' })]),
			})
			expect(store.isLoading).toBe(false)
			expect(store.error).toBeNull()
		})

		it('should handle errors when saving', async () => {
			// Setup error case
			vi.mocked(projectService.updateProject).mockRejectedValueOnce(new Error('Save failed'))

			useBrainstormStore.setState({
				projectId: 'test-project',
				nodes: [],
				edges: [],
			})

			const store = useBrainstormStore.getState()
			await vi.waitFor(async () => {
				await store.saveAllNodes()
			})

			expect(store.isLoading).toBe(false)
			expect(store.error).toBe('Failed to save nodes')
			expect(store.isLoading).toBe(false)
		})
	})

	describe('loadNodesWithPositions', () => {
		it('should load nodes and edges successfully', async () => {
			const mockProject: Project = {
				id: 'test-project',
				name: 'Test Project',
				description: 'Test Description',
				version: '1.0.0',
				template: ProjectTemplate.CUSTOM,
				createdAt: '2025-04-24T00:00:00.000Z',
				updatedAt: '2025-04-24T00:00:00.000Z',
				syncSettings: {
					enableS3Sync: false,
					syncFrequency: 'manual',
					autoSave: true,
				},
				nodes: [{
					id: 'test-node',
					type: NodeType.NOTE,
					position: { x: 0, y: 0 },
					data: {
						id: 'test-node',
						type: NodeType.NOTE,
						title: 'Test Node',
						content: '',
						label: 'Test Node',
						createdAt: '2025-04-24T00:00:00.000Z',
						updatedAt: '2025-04-24T00:00:00.000Z',
						tags: [],
						color: undefined,
					},
				}],
				edges: [{
					id: 'test-edge',
					source: 'test-node',
					target: 'test-node-2',
					type: EdgeType.DEFAULT,
				}],
			}

			vi.mocked(projectService.getProject).mockResolvedValueOnce(mockProject)

			const store = useBrainstormStore.getState()
			await vi.waitFor(async () => {
				await store.loadNodesWithPositions('test-project')
			})

			expect(projectService.getProject).toHaveBeenCalledWith('test-project')
			expect(store.nodes).toHaveLength(1)
			expect(store.edges).toHaveLength(1)
			expect(store.projectId).toBe('test-project')
			expect(store.isLoading).toBe(false)
			expect(store.error).toBeNull()
		})

		it('should handle errors when loading', async () => {
			vi.mocked(projectService.getProject).mockRejectedValueOnce(new Error('Load failed'))

			const store = useBrainstormStore.getState()
			await vi.waitFor(async () => {
				await store.loadNodesWithPositions('test-project')
			})

			expect(store.error).toBe('Failed to load nodes')
			expect(store.isLoading).toBe(false)
			expect(store.nodes).toHaveLength(0)
			expect(store.edges).toHaveLength(0)
		})

		it('should set loading state while fetching', async () => {
			const mockProject: Project = {
				id: 'test-project',
				name: 'Test Project',
				description: 'Test Description',
				version: '1.0.0',
				template: ProjectTemplate.CUSTOM,
				createdAt: '2025-04-24T00:00:00.000Z',
				updatedAt: '2025-04-24T00:00:00.000Z',
				syncSettings: {
					enableS3Sync: false,
					syncFrequency: 'manual',
					autoSave: true,
				},
				nodes: [],
				edges: [],
			}

			vi.mocked(projectService.getProject).mockImplementationOnce(async () => {
				expect(useBrainstormStore.getState().isLoading).toBe(true)
				return mockProject
			})

			const store = useBrainstormStore.getState()
			await vi.waitFor(async () => {
				await store.loadNodesWithPositions('test-project')
			})

			expect(store.isLoading).toBe(false)
		})
	})
})
