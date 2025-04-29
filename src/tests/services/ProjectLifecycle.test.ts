import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import indexedDBService from '../../services/IndexedDBService'
import projectService from '../../services/ProjectService'
import type { Project, ProjectHistoryEntry, Node, Edge } from '../../types'
import { ProjectTemplate, type SyncSettings } from '../../types/project'

// Create mock implementation types
type ProjectWithRequiredSync = {
	id: string
	name: string
	description: string
	createdAt: string
	updatedAt: string
	version: string
	template: ProjectTemplate
	nodes: Node[]
	edges: Edge[]
	syncSettings: {
		enableS3Sync: boolean
		syncFrequency: 'manual' | 'onSave' | 'interval'
		autoSave: boolean
		intervalMinutes?: number
		lastSyncedAt?: string
		s3Path?: string
	}
}

// Mock implementation
const saveProjectMock = vi.fn().mockImplementation(
	(project: ProjectWithRequiredSync) => Promise.resolve(project.id),
)

// Mock the dependencies with proper error handling
vi.mock('../../services/IndexedDBService', () => ({
	default: {
		init: vi.fn().mockResolvedValue(true),
		saveProject: saveProjectMock,
		getProject: vi.fn(),
		getAllProjects: vi.fn(),
		deleteProject: vi.fn().mockImplementation(() => Promise.resolve()),
		archiveProject: vi.fn(),
		addProjectHistoryEntry: vi.fn().mockImplementation(() => Promise.resolve('history-id')),
		getProjectHistory: vi.fn().mockResolvedValue([]),
	},
}))

vi.mock('../../services/GitService', () => ({
	default: {
		commit: vi.fn().mockImplementation((project: Project) =>
			Promise.resolve({
				...project,
				version: '1.0.1',
			}),
		),
	},
}))

// Mock LoggerService with better error tracking
vi.mock('../../services/LoggerService', () => {
	const mockLoggerInstance = {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
		log: vi.fn(),
		configure: vi.fn(),
		getLogs: vi.fn().mockResolvedValue([]),
		clearLogs: vi.fn().mockResolvedValue(undefined),
		initialize: vi.fn().mockResolvedValue(true),
	}
	return {
		default: {
			getInstance: vi.fn(() => mockLoggerInstance),
			...mockLoggerInstance,
		},
	}
})

vi.mock('../../services/OfflineService', () => ({
	default: {
		getOnlineStatus: vi.fn().mockReturnValue(true),
		addToSyncQueue: vi.fn().mockResolvedValue(undefined),
	},
}))

vi.mock('../../services/S3Service', () => ({
	default: {
		isS3Available: vi.fn().mockReturnValue(true),
		uploadProject: vi.fn().mockResolvedValue({}),
	},
}))

describe('Project Lifecycle Management', () => {
	const mockProject: ProjectWithRequiredSync = {
		id: 'test-project-id',
		name: 'Test Project',
		description: 'A test project',
		createdAt: '2023-01-01T00:00:00.000Z',
		updatedAt: '2023-01-01T00:00:00.000Z',
		version: '1.0.0',
		template: ProjectTemplate.CUSTOM,
		nodes: [],
		edges: [],
		syncSettings: {
			enableS3Sync: false,
			syncFrequency: 'manual',
			autoSave: true,
		},
	}

	beforeEach(() => {
		vi.clearAllMocks()
		// Reset IndexedDB mock implementations
		vi.mocked(indexedDBService.getProject).mockReset()
		saveProjectMock.mockClear()
		vi.mocked(indexedDBService.getAllProjects).mockResolvedValue([])
		vi.mocked(indexedDBService.deleteProject).mockResolvedValue()
	})

	afterEach(() => {
		vi.resetAllMocks()
	})

	describe('createProject', () => {
		it('should create a new project successfully', async () => {
			const projectName = 'New Project'
			const projectDescription = 'A new project description'
			const mockUUID = 'new-project-id'
			const originalRandomUUID = crypto.randomUUID
			crypto.randomUUID = vi.fn().mockReturnValue(mockUUID)

			const result = await projectService.createProject(projectName, projectDescription)

			expect(result).toEqual(
				expect.objectContaining({
					id: mockUUID,
					name: projectName,
					description: projectDescription,
					template: ProjectTemplate.CUSTOM,
					syncSettings: expect.objectContaining({
						autoSave: true,
					}),
				}),
			)

			expect(saveProjectMock).toHaveBeenCalledTimes(1)
			expect(indexedDBService.addProjectHistoryEntry).toHaveBeenCalledWith(
				expect.objectContaining({
					projectId: mockUUID,
					action: 'create',
				}),
			)

			crypto.randomUUID = originalRandomUUID
		})

		it('should handle IndexedDB errors during project creation', async () => {
			saveProjectMock.mockRejectedValueOnce(new Error('DB Error'))
			const projectName = 'Failed Project'
			const projectDescription = 'This project should fail to save'

			await expect(projectService.createProject(projectName, projectDescription))
				.rejects.toThrow('Failed to create project')
		})
	})

	describe('getProjects', () => {
		it('should get all non-archived projects by default', async () => {
			const mockProjects = [mockProject]
			vi.mocked(indexedDBService.getAllProjects).mockResolvedValue(mockProjects)

			const result = await projectService.getProjects()

			expect(result).toEqual(mockProjects)
			expect(indexedDBService.getAllProjects).toHaveBeenCalledWith(false)
		})

		it('should handle IndexedDB errors when fetching projects', async () => {
			vi.mocked(indexedDBService.getAllProjects).mockRejectedValueOnce(new Error('DB Error'))

			await expect(projectService.getProjects())
				.rejects.toThrow('Failed to fetch projects')
		})
	})

	describe('getProject', () => {
		it('should get a project by ID and record view history', async () => {
			vi.mocked(indexedDBService.getProject).mockResolvedValue(mockProject)

			const result = await projectService.getProject('test-project-id')

			expect(result).toEqual(mockProject)
			expect(indexedDBService.getProject).toHaveBeenCalledWith('test-project-id')
			expect(indexedDBService.addProjectHistoryEntry).toHaveBeenCalledWith(
				expect.objectContaining({
					projectId: 'test-project-id',
					action: 'view',
				}),
			)
		})

		it('should return null for non-existent project', async () => {
			vi.mocked(indexedDBService.getProject).mockResolvedValue(null)

			const result = await projectService.getProject('non-existent-id')

			expect(result).toBeNull()
			expect(indexedDBService.addProjectHistoryEntry).not.toHaveBeenCalled()
		})

		it('should handle IndexedDB errors when fetching a project', async () => {
			vi.mocked(indexedDBService.getProject).mockRejectedValueOnce(new Error('DB Error'))

			await expect(projectService.getProject('test-project-id'))
				.rejects.toThrow('Failed to fetch project')
		})
	})

	describe('updateProject', () => {
		it('should update an existing project', async () => {
			const updatedProject: ProjectWithRequiredSync = {
				...mockProject,
				name: 'Updated Project Name',
			}
			vi.mocked(indexedDBService.getProject).mockResolvedValue(mockProject)
			saveProjectMock.mockResolvedValueOnce(updatedProject.id)

			const result = await projectService.updateProject(updatedProject)

			expect(result).toEqual(expect.objectContaining({
				id: mockProject.id,
				name: 'Updated Project Name',
			}))
			expect(saveProjectMock).toHaveBeenCalledTimes(1)
			expect(indexedDBService.addProjectHistoryEntry).toHaveBeenCalledWith(
				expect.objectContaining({
					projectId: mockProject.id,
					action: 'update',
				}),
			)
		})

		it('should handle non-existent project update attempts', async () => {
			vi.mocked(indexedDBService.getProject).mockResolvedValue(null)

			await expect(projectService.updateProject(mockProject))
				.rejects.toThrow('Project not found')
		})
	})

	describe('deleteProject', () => {
		it('should delete an existing project', async () => {
			vi.mocked(indexedDBService.getProject).mockResolvedValue(mockProject)

			await projectService.deleteProject('test-project-id')

			expect(indexedDBService.deleteProject).toHaveBeenCalledWith('test-project-id')
			expect(indexedDBService.addProjectHistoryEntry).toHaveBeenCalledWith(
				expect.objectContaining({
					projectId: 'test-project-id',
					action: 'delete',
				}),
			)
		})

		it('should handle attempts to delete non-existent projects', async () => {
			vi.mocked(indexedDBService.getProject).mockResolvedValue(null)

			await expect(projectService.deleteProject('non-existent-id'))
				.rejects.toThrow('Project not found')
		})
	})

	describe('archiveProject', () => {
		it('should archive an existing project', async () => {
			const archivedProject: ProjectWithRequiredSync = {
				...mockProject,
				syncSettings: {
					...mockProject.syncSettings,
					lastSyncedAt: expect.any(String),
				},
			}
			vi.mocked(indexedDBService.archiveProject).mockResolvedValue(archivedProject)

			const result = await projectService.archiveProject('test-project-id', true)

			expect(result).toEqual(archivedProject)
			expect(indexedDBService.archiveProject).toHaveBeenCalledWith('test-project-id', true)
			expect(indexedDBService.addProjectHistoryEntry).toHaveBeenCalledWith(
				expect.objectContaining({
					projectId: 'test-project-id',
					action: 'archive',
				}),
			)
		})

		it('should handle archive operations on non-existent projects', async () => {
			vi.mocked(indexedDBService.archiveProject).mockResolvedValue(null)

			await expect(projectService.archiveProject('non-existent-id', true))
				.rejects.toThrow('Project not found')
		})
	})
})
