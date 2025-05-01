import { describe, it, expect, vi, beforeEach } from 'vitest'

import indexedDBService from '../../services/IndexedDBService'
import projectService from '../../services/ProjectService'
import type { Project } from '../../types'
import { ProjectTemplate, createEmptyProject } from '../../types/project'

// Mock dependencies before imports
vi.mock('../../services/GitService')
vi.mock('../../services/LoggerService')
vi.mock('../../services/IndexedDBService', () => ({
	default: {
		init: vi.fn().mockResolvedValue(true),
		saveProject: vi.fn(),
		getProject: vi.fn(),
		getAllProjects: vi.fn(),
		deleteProject: vi.fn(),
		archiveProject: vi.fn(),
		addProjectHistoryEntry: vi.fn(),
		getProjectHistory: vi.fn(),
	},
}))

const createMockProject = (id: string, name: string): Project => {
	const project = createEmptyProject(name, `Description for ${name}`, ProjectTemplate.CUSTOM)
	return {
		...project,
		id,
		createdAt: '2023-01-01T00:00:00.000Z',
		updatedAt: '2023-01-01T00:00:00.000Z',
	}
}

describe('Project Lifecycle Management', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(indexedDBService.init).mockResolvedValue(true)
		vi.mocked(indexedDBService.saveProject).mockImplementation((project) => Promise.resolve(project.id))
		vi.mocked(indexedDBService.getAllProjects).mockResolvedValue([])
		vi.mocked(indexedDBService.deleteProject).mockResolvedValue(undefined)
		vi.mocked(indexedDBService.archiveProject).mockImplementation(async (id) => createMockProject(id, 'Archived Project'))
		vi.mocked(indexedDBService.addProjectHistoryEntry).mockResolvedValue('history-id')
		vi.mocked(indexedDBService.getProjectHistory).mockResolvedValue([])
	})

	it('should create a new project successfully', async () => {
		const result = await projectService.createProject('New Project', 'Test Description')
		expect(result).toEqual(expect.objectContaining({
			name: 'New Project',
			description: 'Test Description',
			template: ProjectTemplate.CUSTOM,
		}))
		expect(vi.mocked(indexedDBService.saveProject)).toHaveBeenCalled()
		expect(vi.mocked(indexedDBService.addProjectHistoryEntry)).toHaveBeenCalledWith(
			expect.objectContaining({
				projectId: expect.any(String),
				action: 'create',
			}),
		)
	})

	it('should get all non-archived projects by default', async () => {
		const mockProjects = [
			createMockProject('1', 'Test Project 1'),
			createMockProject('2', 'Test Project 2'),
		]
		vi.mocked(indexedDBService.getAllProjects).mockResolvedValueOnce(mockProjects)

		const result = await projectService.getProjects()

		expect(result).toEqual(mockProjects)
		expect(vi.mocked(indexedDBService.getAllProjects)).toHaveBeenCalledWith(false)
	})

	it('should delete an existing project', async () => {
		const projectId = 'test-project-id'
		const mockProject = createMockProject(projectId, 'Test Project')
		vi.mocked(indexedDBService.getProject).mockResolvedValueOnce(mockProject)

		await projectService.deleteProject(projectId)

		expect(vi.mocked(indexedDBService.deleteProject)).toHaveBeenCalledWith(projectId)
		expect(vi.mocked(indexedDBService.addProjectHistoryEntry)).toHaveBeenCalledWith(
			expect.objectContaining({
				projectId,
				action: 'delete',
			}),
		)
	})

	it('should handle errors gracefully', async () => {
		vi.mocked(indexedDBService.saveProject).mockRejectedValueOnce(new Error('DB Error'))

		await expect(projectService.createProject('Failed Project', 'Test'))
			.rejects.toThrow('Failed to save project')
	})
})
