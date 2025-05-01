import { act } from '@testing-library/react'
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
		vi.useFakeTimers()
		// Clear store state
		act(() => {
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
		})
		// Clear mocks
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.useRealTimers()
		// Reset store state and cleanup to prevent memory leaks
		act(() => {
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
			// Ensure zustand store is properly reset
			useBrainstormStore.destroy()
		})
		// Clear all timers, mocks, and modules to prevent EMFILE errors
		vi.clearAllTimers()
		vi.clearAllMocks()
		vi.resetModules()
	})

	describe('saveAllNodes', () => {
		it('should do nothing if projectId is null', async () => {
			const store = useBrainstormStore.getState()
			await store.saveAllNodes()

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

			act(() => {
				useBrainstormStore.setState({
					projectId: 'test-project',
					nodes: [testNode],
					edges: [testEdge],
				})
			})

			const store = useBrainstormStore.getState()
			await act(async () => {
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
			const store = useBrainstormStore.getState()

			// Set up initial state
			await act(async () => {
				useBrainstormStore.setState({
					projectId: 'test-project',
					nodes: [],
					edges: [],
					error: null,
					isLoading: false,
				})
			})

			// Setup error case
			vi.mocked(projectService.updateProject).mockRejectedValueOnce(new Error('Save failed'))

			let isLoadingDuringSave = false
			const unsubscribe = useBrainstormStore.subscribe((state) => {
				if (state.isLoading) {
					isLoadingDuringSave = true
				}
			})

			// Set up error mock
			vi.spyOn(projectService, 'updateProject').mockRejectedValueOnce(new Error('Save failed'))

			await act(async () => {
				try {
					await store.saveAllNodes()
				} catch (error) {
					// Error should be caught and handled by store
				}
			})

			// Get store state after error
			const finalState = useBrainstormStore.getState()

			// Verify loading and error states
			expect(isLoadingDuringSave).toBe(true)
			expect(finalState.isLoading).toBe(false)
			expect(finalState.error).toBe('Failed to save nodes')

			unsubscribe()

			expect(projectService.updateProject).toHaveBeenCalledTimes(1)
			expect(projectService.updateProject).toHaveBeenCalledWith('test-project', {
				nodes: [],
				edges: [],
			})
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
			let isLoadingDuringFetch = false
			let errorOccurred = false

			const unsubscribe = useBrainstormStore.subscribe((state) => {
				if (state.isLoading) {
					isLoadingDuringFetch = true
				}
				if (state.error === 'Failed to load nodes') {
					errorOccurred = true
				}
			})

			await store.loadNodesWithPositions('test-project')

			unsubscribe()

			const finalState = useBrainstormStore.getState()
			expect(isLoadingDuringFetch).toBe(true)
			expect(errorOccurred).toBe(false)
			expect(finalState.isLoading).toBe(false)
			expect(projectService.getProject).toHaveBeenCalledWith('test-project')
			expect(finalState.nodes).toHaveLength(1)
			expect(finalState.edges).toHaveLength(1)
			expect(finalState.projectId).toBe('test-project')
			expect(finalState.error).toBeNull()
		})

		it('should handle errors when loading', async () => {
			vi.mocked(projectService.getProject).mockRejectedValueOnce(new Error('Load failed'))

			let isLoadingDuringError = false
			let errorOccurred = false

			const unsubscribe = useBrainstormStore.subscribe((state) => {
				if (state.isLoading) {
					isLoadingDuringError = true
				}
				if (state.error === 'Failed to load nodes') {
					errorOccurred = true
				}
			})

			const store = useBrainstormStore.getState()
			await act(async () => {
				await store.loadNodesWithPositions('test-project')
			})

			unsubscribe()

			expect(isLoadingDuringError).toBe(true)
			expect(errorOccurred).toBe(true)

			const finalState = useBrainstormStore.getState()
			expect(finalState.error).toBe('Failed to load nodes')
			expect(finalState.isLoading).toBe(false)
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
			await act(async () => {
				await store.loadNodesWithPositions('test-project')
			})

			const finalState = useBrainstormStore.getState()
			expect(finalState.isLoading).toBe(false)
		})
	})
})
