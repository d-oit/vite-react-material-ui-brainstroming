import { createProjectFromTemplate, projectTemplates } from '../data/projectTemplates'
import type { Project, ProjectHistoryEntry } from '../types'
import { ProjectTemplate } from '../types/project'
// These types are used in the Project type
// import { Node, Edge } from '../types';
import performanceMonitoring, { PerformanceCategory } from '../utils/performanceMonitoring'

import gitService from './GitService'
import indexedDBService from './IndexedDBService'
import loggerService from './LoggerService'
import offlineService from './OfflineService'
import s3Service from './S3Service'

/**
 * Service for managing projects
 */
export class ProjectService {
	private static instance: ProjectService

	private constructor() {
		// Initialize IndexedDB
		indexedDBService
			.init()
			.then((initialized) => {
				if (!initialized) {
					console.warn('IndexedDB initialization failed, some features may not work properly')
					loggerService.warn('IndexedDB initialization failed, some features may not work properly')
				} else {
					console.log('IndexedDB initialized successfully')
					loggerService.info('IndexedDB initialized successfully')
				}
			})
			.catch((error) => {
				console.error('Failed to initialize IndexedDB:', error)
				loggerService.error(
					'Failed to initialize IndexedDB',
					error instanceof Error ? error : new Error(String(error)),
				)
			})
	}

	public static getInstance(): ProjectService {
		if (!ProjectService.instance) {
			ProjectService.instance = new ProjectService()
		}
		return ProjectService.instance
	}

	/**
	 * Create a new project
	 * @param name Project name
	 * @param description Project description
	 * @param template Optional template to use
	 * @returns Promise that resolves with the newly created project
	 */
	public async createProject(
		name: string,
		description: string,
		template: ProjectTemplate = ProjectTemplate.CUSTOM,
	): Promise<Project> {
		const metricId = performanceMonitoring.startMeasure(
			'ProjectService.createProject',
			PerformanceCategory.DATA_LOADING,
			{ projectName: name, template },
		)
		try {
			// Create project from template
			const project = createProjectFromTemplate(template, name, description)

			// Handle case where createProjectFromTemplate returns undefined
			if (!project) {
				throw new Error('Failed to create project from template')
			}

			const now = project.createdAt || new Date().toISOString()
			// Save to IndexedDB
			await indexedDBService.saveProject(project)

			// Add history entry
			await indexedDBService.addProjectHistoryEntry({
				projectId: project.id,
				action: 'create',
				timestamp: now,
				details: { version: project.version },
			})

			// Create initial commit
			await gitService.commit(project, 'Initial commit')

			loggerService.info(`Project created: ${project.id} - ${project.name}`)
			return project
		} catch (error) {
			loggerService.error('Error creating project', error instanceof Error ? error : new Error(String(error)))
			throw new Error('Failed to save project')
		} finally {
			performanceMonitoring.endMeasure(metricId)
		}
	}

	/**
	 * Get all projects
	 * @param includeArchived Whether to include archived projects
	 * @param includeTemplates Whether to include template projects
	 * @returns Promise that resolves with an array of projects
	 */
	public async getProjects(includeArchived: boolean = false, includeTemplates: boolean = false): Promise<Project[]> {
		const metricId = performanceMonitoring.startMeasure(
			'ProjectService.getProjects',
			PerformanceCategory.DATA_LOADING,
			{ includeArchived, includeTemplates },
		)
		try {
			const projects = await indexedDBService.getAllProjects(includeArchived)

			// Filter out templates if not requested
			if (!includeTemplates) {
				return projects.filter((project) => !project.isTemplate)
			}

			return projects
		} catch (error) {
			loggerService.error('Error getting projects', error instanceof Error ? error : new Error(String(error)))
			return []
		} finally {
			performanceMonitoring.endMeasure(metricId)
		}
	}

	/**
	 * Get a project by ID
	 * @param id Project ID
	 * @returns Promise that resolves with the project or null if not found
	 */
	public async getProject(id: string): Promise<Project | null> {
		const metricId = performanceMonitoring.startMeasure(
			'ProjectService.getProject',
			PerformanceCategory.DATA_LOADING,
			{ projectId: id },
		)
		try {
			const project = await indexedDBService.getProject(id)

			if (project) {
				// Add history entry for viewing the project
				await indexedDBService.addProjectHistoryEntry({
					projectId: id,
					action: 'view',
					timestamp: new Date().toISOString(),
				})
			}

			return project
		} catch (error) {
			loggerService.error(
				`Error getting project ${id}`,
				error instanceof Error ? error : new Error(String(error)),
			)
			return null
		} finally {
			performanceMonitoring.endMeasure(metricId)
		}
	}

	/**
	 * Save a project directly
	 * @param project Project to save
	 * @returns Promise that resolves with the saved project
	 */
	public async saveProject(project: Project): Promise<Project> {
		const metricId = performanceMonitoring.startMeasure(
			'ProjectService.saveProject',
			PerformanceCategory.DATA_LOADING,
			{ projectId: project.id },
		)

		try {
			// Ensure updatedAt is set
			const projectToSave = {
				...project,
				updatedAt: new Date().toISOString(),
			}

			// Save to IndexedDB
			await indexedDBService.saveProject(projectToSave)

			// Add history entry
			await indexedDBService.addProjectHistoryEntry({
				projectId: projectToSave.id,
				action: 'save',
				timestamp: projectToSave.updatedAt,
				details: { version: projectToSave.version },
			})

			loggerService.info(`Project saved: ${projectToSave.id} - ${projectToSave.name}`)
			return projectToSave
		} catch (error) {
			loggerService.error('Error saving project', error instanceof Error ? error : new Error(String(error)))
			throw new Error('Failed to save project')
		} finally {
			performanceMonitoring.endMeasure(metricId)
		}
	}

	/**
	 * Update a project
	 * @param projectOrId Project or project ID to update
	 * @param updates Optional partial project updates (when providing ID as first parameter)
	 * @returns Promise that resolves with the updated project
	 */
	public async updateProject(projectOrId: Project | string, updates?: Partial<Project>): Promise<Project> {
		// Determine if we're updating with a full project object or just specific fields
		let projectId: string
		let projectToUpdate: Project | null

		if (typeof projectOrId === 'string') {
			// We have an ID and partial updates
			projectId = projectOrId
			if (!updates) {
				throw new Error('When providing a project ID, updates must be specified')
			}
		} else {
			// We have a full project object
			projectId = projectOrId.id
			updates = projectOrId // Use the full project as updates
		}

		const metricId = performanceMonitoring.startMeasure(
			'ProjectService.updateProject',
			PerformanceCategory.DATA_LOADING,
			{ projectId },
		)

		try {
			// Get the existing project
			projectToUpdate = await indexedDBService.getProject(projectId)

			if (!projectToUpdate) {
				throw new Error(`Project with ID ${projectId} not found`)
			}

			// Create the updated project by merging existing with updates
			const updatedProject = {
				...projectToUpdate,
				...updates,
				updatedAt: new Date().toISOString(),
			}

			await indexedDBService.saveProject(updatedProject)

			// Add history entry
			await indexedDBService.addProjectHistoryEntry({
				projectId: updatedProject.id,
				action: 'update',
				timestamp: updatedProject.updatedAt,
				details: { version: updatedProject.version },
			})

			loggerService.info(`Project updated: ${updatedProject.id} - ${updatedProject.name}`)
			return updatedProject
		} catch (error) {
			loggerService.error('Error updating project', error instanceof Error ? error : new Error(String(error)))
			throw new Error('Failed to update project')
		} finally {
			performanceMonitoring.endMeasure(metricId)
		}
	}

	/**
	 * Delete a project
	 * @param id Project ID
	 * @returns Promise that resolves when the project is deleted
	 */
	public async deleteProject(id: string): Promise<void> {
		const metricId = performanceMonitoring.startMeasure(
			'ProjectService.deleteProject',
			PerformanceCategory.DATA_LOADING,
			{ projectId: id },
		)
		try {
			// Get the project first for history logging
			const project = await indexedDBService.getProject(id)

			if (!project) {
				throw new Error(`Project with ID ${id} not found`)
			}

			// Delete the project
			await indexedDBService.deleteProject(id)

			// Add history entry
			await indexedDBService.addProjectHistoryEntry({
				projectId: id,
				action: 'delete',
				timestamp: new Date().toISOString(),
				details: {
					projectName: project.name,
					version: project.version,
				},
			})

			loggerService.info(`Project deleted: ${id} - ${project.name}`)
		} catch (error) {
			loggerService.error('Error deleting project', error instanceof Error ? error : new Error(String(error)))
			throw new Error('Failed to delete project')
		} finally {
			performanceMonitoring.endMeasure(metricId)
		}
	}

	/**
	 * Archive or unarchive a project
	 * @param id Project ID
	 * @param archive Whether to archive (true) or unarchive (false)
	 * @returns Promise that resolves with the updated project
	 */
	public async archiveProject(id: string, archive: boolean): Promise<Project> {
		const metricId = performanceMonitoring.startMeasure(
			'ProjectService.archiveProject',
			PerformanceCategory.DATA_LOADING,
			{ projectId: id, archive },
		)
		try {
			const updatedProject = await indexedDBService.archiveProject(id, archive)

			// Add history entry
			await indexedDBService.addProjectHistoryEntry({
				projectId: id,
				action: archive ? 'archive' : 'unarchive',
				timestamp: new Date().toISOString(),
			})

			loggerService.info(`Project ${archive ? 'archived' : 'unarchived'}: ${id} - ${updatedProject.name}`)
			return updatedProject
		} catch (error) {
			loggerService.error(
				`Error ${archive ? 'archiving' : 'unarchiving'} project`,
				error instanceof Error ? error : new Error(String(error)),
			)
			throw new Error(`Failed to ${archive ? 'archive' : 'unarchive'} project`)
		} finally {
			performanceMonitoring.endMeasure(metricId)
		}
	}

	/**
	 * Save a project with a commit
	 * @param project Project to save
	 * @param commitMessage Commit message
	 * @returns Promise that resolves with the updated project
	 */
	public async saveProjectWithCommit(project: Project, commitMessage: string): Promise<Project> {
		try {
			// First update the project
			const updatedProject = await this.updateProject(project)

			// Then create a commit
			const committedProject = await gitService.commit(updatedProject, commitMessage)

			// Update the project with the new version
			const finalProject = await this.updateProject(committedProject)

			// Add history entry for the commit
			await indexedDBService.addProjectHistoryEntry({
				projectId: project.id,
				action: 'update',
				timestamp: new Date().toISOString(),
				details: {
					version: finalProject.version,
					commitMessage,
				},
			})

			return finalProject
		} catch (error) {
			loggerService.error(
				'Error saving project with commit',
				error instanceof Error ? error : new Error(String(error)),
			)
			throw new Error('Failed to save project with commit')
		}
	}

	/**
	 * Sync a project to AWS S3
	 * @param projectId Project ID
	 * @returns Promise that resolves with success status
	 */
	public async syncToS3(projectId: string): Promise<boolean> {
		// Check if S3 is available
		if (!s3Service.isS3Available()) {
			loggerService.warn('S3 service is not available. Enable it in .env file with VITE_AWS_S3_ENABLED=true')
			return false
		}

		try {
			const project = await this.getProject(projectId)

			if (!project) {
				throw new Error(`Project with ID ${projectId} not found`)
			}

			const result = await s3Service.uploadProject(project)

			if (result !== null) {
				// Add history entry for the S3 sync
				await indexedDBService.addProjectHistoryEntry({
					projectId,
					action: 'export',
					timestamp: new Date().toISOString(),
					details: {
						destination: 'S3',
						version: project.version,
					},
				})

				loggerService.info(`Project synced to S3: ${projectId} - ${project.name}`)
				return true
			}

			return false
		} catch (error) {
			loggerService.error('Error syncing to S3', error instanceof Error ? error : new Error(String(error)))
			return false
		}
	}

	/**
	 * Get available project templates
	 * @returns Array of project templates
	 */
	public getProjectTemplates(): Project[] {
		return Object.values(projectTemplates).map((template) => {
			// Create a properly typed Project object
			const project = {
				id: `template-${template.template}`,
				name: template.name || 'Unnamed Template',
				description: template.description || '',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				version: '1.0.0', // Version must be a string according to the schema
				nodes: template.nodes || [],
				edges: template.edges || [],
				isTemplate: true, // This is not in the Project type but used in the app
				template: template.template || ProjectTemplate.CUSTOM, // Ensure template is never undefined
				syncSettings: {
					enableS3Sync: false,
					syncFrequency: 'manual',
				},
			}
			// Use type assertion to handle the isTemplate property
			return project as Project
		})
	}

	/**
	 * Get project history
	 * @param id Project ID
	 * @param limit Maximum number of entries to return
	 * @returns Promise that resolves with an array of history entries
	 */
	public async getProjectHistory(id: string, limit = 100): Promise<ProjectHistoryEntry[]> {
		const metricId = performanceMonitoring.startMeasure(
			'ProjectService.getProjectHistory',
			PerformanceCategory.DATA_LOADING,
			{ projectId: id, limit },
		)
		try {
			return await indexedDBService.getProjectHistory(id, limit)
		} catch (error) {
			loggerService.error(
				'Error getting project history',
				error instanceof Error ? error : new Error(String(error)),
			)
			return []
		} finally {
			performanceMonitoring.endMeasure(metricId)
		}
	}

	/**
	 * Create a project with offline support
	 * @param name Project name
	 * @param description Project description
	 * @param template Optional template to use
	 * @returns Promise that resolves with the newly created project
	 */
	public async createProjectWithOfflineSupport(
		name: string,
		description: string,
		template: ProjectTemplate = ProjectTemplate.CUSTOM,
	): Promise<Project> {
		try {
			// Create the project locally
			const project = await this.createProject(name, description, template)

			// If offline, queue for sync when back online
			if (!offlineService.getOnlineStatus()) {
				offlineService.addToSyncQueue(async () => {
					// When back online, we might need to sync with a backend
					// For now, just log the operation
					loggerService.info(`Project ${project.id} created while offline, now synced`)
				})
			}

			return project
		} catch (error) {
			loggerService.error(
				'Error creating project with offline support',
				error instanceof Error ? error : new Error(String(error)),
			)
			throw error
		}
	}
}

export default ProjectService.getInstance()
