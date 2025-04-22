import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import indexedDBService from '../../services/IndexedDBService'
import projectService from '../../services/ProjectService'
// Import project-specific types including Node, Edge
import type { Project, ProjectHistoryEntry, Node, Edge } from '../../types'
// Import ProjectTemplate enum and SyncSettings type
import { ProjectTemplate, type SyncSettings } from '../../types/project'

// Mock the dependencies
vi.mock('../../services/IndexedDBService', () => ({
	default: {
		init: vi.fn().mockResolvedValue(true),
		saveProject: vi.fn().mockImplementation((project: Project) => Promise.resolve(project.id)),
		getProject: vi.fn(),
		getAllProjects: vi.fn(),
		deleteProject: vi.fn(),
		archiveProject: vi.fn(),
		addProjectHistoryEntry: vi.fn().mockImplementation(() => Promise.resolve('history-id')),
		getProjectHistory: vi.fn(),
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

// Mock LoggerService to provide getInstance and the logging methods
vi.mock('../../services/LoggerService', () => {
	const mockLoggerInstance = {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(), // Add other methods if needed by the code under test
		log: vi.fn(),
		configure: vi.fn(),
		getLogs: vi.fn().mockResolvedValue([]),
		clearLogs: vi.fn().mockResolvedValue(undefined),
		initialize: vi.fn().mockResolvedValue(true),
	}
	return {
		default: {
			getInstance: vi.fn(() => mockLoggerInstance),
			// Also keep the direct methods if they are used directly anywhere
			info: mockLoggerInstance.info,
			error: mockLoggerInstance.error,
			warn: mockLoggerInstance.warn,
			debug: mockLoggerInstance.debug,
			log: mockLoggerInstance.log,
			configure: mockLoggerInstance.configure,
			getLogs: mockLoggerInstance.getLogs,
			clearLogs: mockLoggerInstance.clearLogs,
			initialize: mockLoggerInstance.initialize,
		},
		// Export the class mock if needed (though getInstance is usually sufficient)
		LoggerService: vi.fn(() => mockLoggerInstance),
	}
})

vi.mock('../../services/OfflineService', () => ({
	default: {
		getOnlineStatus: vi.fn().mockReturnValue(true),
		addToSyncQueue: vi.fn(),
	},
}))

vi.mock('../../services/S3Service', () => ({
	default: {
		isS3Available: vi.fn().mockReturnValue(true),
		uploadProject: vi.fn().mockResolvedValue({}),
	},
}))

describe('Project Lifecycle Management', () => {
	// Correct mockProject structure and types
	const mockProject: Project = {
		id: 'test-project-id',
		name: 'Test Project',
		description: 'A test project',
		createdAt: '2023-01-01T00:00:00.000Z',
		updatedAt: '2023-01-01T00:00:00.000Z',
		version: '1.0.0',
		template: ProjectTemplate.CUSTOM, // Use enum value
		nodes: [] as Node[], // Use project's Node type
		edges: [] as Edge[], // Use project's Edge type
		syncSettings: {
			// Use correct SyncSettings structure
			enableS3Sync: false, // Correct property name
			syncFrequency: 'manual',
			// s3Bucket and s3Region might not be needed if enableS3Sync is false
		},
		// isArchived and archivedAt are likely not base properties
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.resetAllMocks()
	})

	describe('createProject', () => {
		it('should create a new project', async () => {
			// Setup
			const projectName = 'New Project'
			const projectDescription = 'A new project description'

			// Mock crypto.randomUUID
			const originalRandomUUID = crypto.randomUUID
			crypto.randomUUID = vi.fn().mockReturnValue('new-project-id')

			// Execute
			const result = await projectService.createProject(projectName, projectDescription)

			// Verify
			expect(result).toEqual(
				expect.objectContaining({
					id: 'new-project-id',
					name: projectName,
					description: projectDescription,
					isArchived: false,
				}),
			)

			expect(indexedDBService.saveProject).toHaveBeenCalledTimes(1)
			expect(indexedDBService.addProjectHistoryEntry).toHaveBeenCalledTimes(1)
			expect(indexedDBService.addProjectHistoryEntry).toHaveBeenCalledWith(
				expect.objectContaining({
					projectId: 'new-project-id',
					action: 'create',
				}),
			)

			// Restore original function
			crypto.randomUUID = originalRandomUUID
		})
	})

	describe('getProjects', () => {
		it('should get all non-archived projects by default', async () => {
			// Setup
			const mockProjects = [mockProject]
			vi.mocked(indexedDBService.getAllProjects).mockResolvedValue(mockProjects)

			// Execute
			const result = await projectService.getProjects()

			// Verify
			expect(result).toEqual(mockProjects)
			expect(indexedDBService.getAllProjects).toHaveBeenCalledWith(false)
		})

		it('should get all projects including archived when specified', async () => {
			// Setup
			const mockProjects = [mockProject]
			vi.mocked(indexedDBService.getAllProjects).mockResolvedValue(mockProjects)

			// Execute
			const result = await projectService.getProjects(true)

			// Verify
			expect(result).toEqual(mockProjects)
			expect(indexedDBService.getAllProjects).toHaveBeenCalledWith(true)
		})
	})

	describe('getProject', () => {
		it('should get a project by ID and record view history', async () => {
			// Setup
			vi.mocked(indexedDBService.getProject).mockResolvedValue(mockProject)

			// Execute
			const result = await projectService.getProject('test-project-id')

			// Verify
			expect(result).toEqual(mockProject)
			expect(indexedDBService.getProject).toHaveBeenCalledWith('test-project-id')
			expect(indexedDBService.addProjectHistoryEntry).toHaveBeenCalledWith(
				expect.objectContaining({
					projectId: 'test-project-id',
					action: 'view',
				}),
			)
		})

		it('should return null if project not found', async () => {
			// Setup
			vi.mocked(indexedDBService.getProject).mockResolvedValue(null)

			// Execute
			const result = await projectService.getProject('non-existent-id')

			// Verify
			expect(result).toBeNull()
			expect(indexedDBService.getProject).toHaveBeenCalledWith('non-existent-id')
			expect(indexedDBService.addProjectHistoryEntry).not.toHaveBeenCalled()
		})
	})

	describe('updateProject', () => {
		it('should update an existing project', async () => {
			// Setup
			const updatedProject = {
				...mockProject,
				name: 'Updated Project Name',
			}
			vi.mocked(indexedDBService.getProject).mockResolvedValue(mockProject)

			// Execute
			const result = await projectService.updateProject(updatedProject)

			// Verify
			expect(result).toEqual(
				expect.objectContaining({
					id: mockProject.id,
					name: 'Updated Project Name',
				}),
			)
			expect(indexedDBService.saveProject).toHaveBeenCalledTimes(1)
			expect(indexedDBService.addProjectHistoryEntry).toHaveBeenCalledWith(
				expect.objectContaining({
					projectId: mockProject.id,
					action: 'update',
				}),
			)
		})

		it('should throw an error if project does not exist', async () => {
			// Setup
			vi.mocked(indexedDBService.getProject).mockResolvedValue(null)

			// Execute & Verify
			await expect(projectService.updateProject(mockProject)).rejects.toThrow()
			expect(indexedDBService.saveProject).not.toHaveBeenCalled()
			expect(indexedDBService.addProjectHistoryEntry).not.toHaveBeenCalled()
		})
	})

	describe('deleteProject', () => {
		it('should delete an existing project', async () => {
			// Setup
			vi.mocked(indexedDBService.getProject).mockResolvedValue(mockProject)

			// Execute
			await projectService.deleteProject('test-project-id')

			// Verify
			expect(indexedDBService.deleteProject).toHaveBeenCalledWith('test-project-id')
			expect(indexedDBService.addProjectHistoryEntry).toHaveBeenCalledWith(
				expect.objectContaining({
					projectId: 'test-project-id',
					action: 'delete',
				}),
			)
		})

		it('should throw an error if project does not exist', async () => {
			// Setup
			vi.mocked(indexedDBService.getProject).mockResolvedValue(null)

			// Execute & Verify
			await expect(projectService.deleteProject('non-existent-id')).rejects.toThrow()
			expect(indexedDBService.deleteProject).not.toHaveBeenCalled()
			expect(indexedDBService.addProjectHistoryEntry).not.toHaveBeenCalled()
		})
	})

	describe('archiveProject', () => {
		it('should archive an existing project', async () => {
			// Setup
			const archivedProject = {
				...mockProject,
				isArchived: true,
				archivedAt: '2023-01-02T00:00:00.000Z',
			}
			vi.mocked(indexedDBService.archiveProject).mockResolvedValue(archivedProject)

			// Execute
			const result = await projectService.archiveProject('test-project-id', true)

			// Verify
			expect(result).toEqual(archivedProject)
			expect(indexedDBService.archiveProject).toHaveBeenCalledWith('test-project-id', true)
			expect(indexedDBService.addProjectHistoryEntry).toHaveBeenCalledWith(
				expect.objectContaining({
					projectId: 'test-project-id',
					action: 'archive',
				}),
			)
		})

		it('should unarchive an existing project', async () => {
			// Setup
			const unarchivedProject = {
				...mockProject,
				isArchived: false,
				archivedAt: undefined,
			}
			vi.mocked(indexedDBService.archiveProject).mockResolvedValue(unarchivedProject)

			// Execute
			const result = await projectService.archiveProject('test-project-id', false)

			// Verify
			expect(result).toEqual(unarchivedProject)
			expect(indexedDBService.archiveProject).toHaveBeenCalledWith('test-project-id', false)
			expect(indexedDBService.addProjectHistoryEntry).toHaveBeenCalledWith(
				expect.objectContaining({
					projectId: 'test-project-id',
					action: 'unarchive',
				}),
			)
		})
	})

	describe('getProjectHistory', () => {
		it('should get project history entries', async () => {
			// Setup
			const mockHistory: ProjectHistoryEntry[] = [
				{
					id: 'history-1',
					projectId: 'test-project-id',
					action: 'create',
					timestamp: '2023-01-01T00:00:00.000Z',
				},
				{
					id: 'history-2',
					projectId: 'test-project-id',
					action: 'update',
					timestamp: '2023-01-02T00:00:00.000Z',
				},
			]
			vi.mocked(indexedDBService.getProjectHistory).mockResolvedValue(mockHistory)

			// Execute
			const result = await projectService.getProjectHistory('test-project-id')

			// Verify
			expect(result).toEqual(mockHistory)
			expect(indexedDBService.getProjectHistory).toHaveBeenCalledWith('test-project-id', 100)
		})

		it('should get project history with custom limit', async () => {
			// Setup
			const mockHistory: ProjectHistoryEntry[] = [
				{
					id: 'history-1',
					projectId: 'test-project-id',
					action: 'create',
					timestamp: '2023-01-01T00:00:00.000Z',
				},
			]
			vi.mocked(indexedDBService.getProjectHistory).mockResolvedValue(mockHistory)

			// Execute
			const result = await projectService.getProjectHistory('test-project-id', 10)

			// Verify
			expect(result).toEqual(mockHistory)
			expect(indexedDBService.getProjectHistory).toHaveBeenCalledWith('test-project-id', 10)
		})
	})
})
