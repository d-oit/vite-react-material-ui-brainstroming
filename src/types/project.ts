import { z } from 'zod'

import type { Node, Edge } from '.'

export enum ProjectTemplate {
	SOFTWARE_DEVELOPMENT = 'software_development',
	MARKETING_CAMPAIGN = 'marketing_campaign',
	RESEARCH_PROJECT = 'research_project',
	BUSINESS_PLAN = 'business_plan',
	CUSTOM = 'custom',
}

export const SyncSettingsSchema = z.object({
	enableS3Sync: z.boolean(),
	syncFrequency: z.enum(['manual', 'onSave', 'interval']),
	intervalMinutes: z.number().optional(),
	lastSyncedAt: z.string().optional(),
	s3Path: z.string().optional(),
})

export type SyncSettings = z.infer<typeof SyncSettingsSchema>

export const ProjectSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
	version: z.string(),
	template: z.nativeEnum(ProjectTemplate),
	nodes: z.array(z.custom<Node>()),
	edges: z.array(z.custom<Edge>()),
	syncSettings: SyncSettingsSchema,
})

export type Project = z.infer<typeof ProjectSchema>

export interface TemplateConfig {
	nodeTypes: string[]
	defaultNodes: Node[]
	defaultEdges: Edge[]
	suggestedWorkflow: string[]
	guidance: string[]
}

export const templateConfigs: Record<ProjectTemplate, TemplateConfig> = {
	[ProjectTemplate.SOFTWARE_DEVELOPMENT]: {
		nodeTypes: ['requirement', 'feature', 'task', 'bug', 'test'],
		defaultNodes: [],
		defaultEdges: [],
		suggestedWorkflow: ['Define requirements', 'Break down into features', 'Create tasks', 'Add test cases'],
		guidance: ['Start with high-level requirements', 'Use color coding for priority', 'Link related features'],
	},
	// Add other template configurations...
	[ProjectTemplate.MARKETING_CAMPAIGN]: {
		nodeTypes: ['goal', 'strategy', 'tactic', 'metric'],
		defaultNodes: [],
		defaultEdges: [],
		suggestedWorkflow: ['Set campaign goals', 'Define strategies', 'Plan tactics', 'Establish metrics'],
		guidance: ['Focus on measurable objectives', 'Connect strategies to goals', 'Include timeline considerations'],
	},
	[ProjectTemplate.RESEARCH_PROJECT]: {
		nodeTypes: ['hypothesis', 'method', 'data', 'conclusion'],
		defaultNodes: [],
		defaultEdges: [],
		suggestedWorkflow: ['Form hypothesis', 'Design methodology', 'Plan data collection', 'Draft analysis approach'],
		guidance: ['Start with clear research questions', 'Consider variables carefully', 'Plan for data validation'],
	},
	[ProjectTemplate.BUSINESS_PLAN]: {
		nodeTypes: ['objective', 'strategy', 'resource', 'milestone'],
		defaultNodes: [],
		defaultEdges: [],
		suggestedWorkflow: ['Define business objectives', 'Outline strategies', 'Identify resources', 'Set milestones'],
		guidance: ['Include market analysis', 'Consider financial projections', 'Plan for contingencies'],
	},
	[ProjectTemplate.CUSTOM]: {
		nodeTypes: ['custom'],
		defaultNodes: [],
		defaultEdges: [],
		suggestedWorkflow: ['Define custom workflow'],
		guidance: ['Customize as needed'],
	},
}

export const DEFAULT_PROJECT_VERSION = '1.0.0'

/**
 * Creates an empty project with default values
 * @param name Project name
 * @param description Project description
 * @param template Project template
 * @returns A new empty project
 */
export function createEmptyProject(
	name: string = 'New Project',
	description: string = 'Project description',
	template: ProjectTemplate = ProjectTemplate.CUSTOM,
): Project {
	const now = new Date().toISOString()
	const id = `project-${Math.random().toString(36).substring(2, 11)}`

	return {
		id,
		name,
		description,
		createdAt: now,
		updatedAt: now,
		version: DEFAULT_PROJECT_VERSION,
		template,
		nodes: [],
		edges: [],
		syncSettings: {
			enableS3Sync: false,
			syncFrequency: 'manual',
		},
	}
}

/**
 * Validates if an object is a valid Project
 * @param project Object to validate
 * @returns True if the object is a valid Project
 */
export function isValidProject(project: unknown): project is Project {
	try {
		ProjectSchema.parse(project)
		return true
	} catch (error) {
		return false
	}
}

/**
 * Normalizes a project version string
 * @param version Version string to normalize
 * @returns Normalized version string
 */
export function normalizeProjectVersion(version: string): string {
	// Simple normalization for now
	if (!version) return DEFAULT_PROJECT_VERSION

	// Ensure it has at least major.minor.patch format
	const parts = version.split('.')
	while (parts.length < 3) {
		parts.push('0')
	}

	return parts.slice(0, 3).join('.')
}
