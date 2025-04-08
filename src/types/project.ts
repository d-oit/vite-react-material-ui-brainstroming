import { z } from 'zod';

import type { Node, Edge } from '.';

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
});

export type SyncSettings = z.infer<typeof SyncSettingsSchema>;

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
});

export type Project = z.infer<typeof ProjectSchema>;

export interface TemplateConfig {
  nodeTypes: string[];
  defaultNodes: Node[];
  defaultEdges: Edge[];
  suggestedWorkflow: string[];
  guidance: string[];
}

export const templateConfigs: Record<ProjectTemplate, TemplateConfig> = {
  [ProjectTemplate.SOFTWARE_DEVELOPMENT]: {
    nodeTypes: ['requirement', 'feature', 'task', 'bug', 'test'],
    defaultNodes: [],
    defaultEdges: [],
    suggestedWorkflow: [
      'Define requirements',
      'Break down into features',
      'Create tasks',
      'Add test cases',
    ],
    guidance: [
      'Start with high-level requirements',
      'Use color coding for priority',
      'Link related features',
    ],
  },
  // Add other template configurations...
  [ProjectTemplate.MARKETING_CAMPAIGN]: {
    nodeTypes: ['goal', 'strategy', 'tactic', 'metric'],
    defaultNodes: [],
    defaultEdges: [],
    suggestedWorkflow: [
      'Set campaign goals',
      'Define strategies',
      'Plan tactics',
      'Establish metrics',
    ],
    guidance: [
      'Focus on measurable objectives',
      'Connect strategies to goals',
      'Include timeline considerations',
    ],
  },
  [ProjectTemplate.RESEARCH_PROJECT]: {
    nodeTypes: ['hypothesis', 'method', 'data', 'conclusion'],
    defaultNodes: [],
    defaultEdges: [],
    suggestedWorkflow: [
      'Form hypothesis',
      'Design methodology',
      'Plan data collection',
      'Draft analysis approach',
    ],
    guidance: [
      'Start with clear research questions',
      'Consider variables carefully',
      'Plan for data validation',
    ],
  },
  [ProjectTemplate.BUSINESS_PLAN]: {
    nodeTypes: ['objective', 'strategy', 'resource', 'milestone'],
    defaultNodes: [],
    defaultEdges: [],
    suggestedWorkflow: [
      'Define business objectives',
      'Outline strategies',
      'Identify resources',
      'Set milestones',
    ],
    guidance: [
      'Include market analysis',
      'Consider financial projections',
      'Plan for contingencies',
    ],
  },
  [ProjectTemplate.CUSTOM]: {
    nodeTypes: ['custom'],
    defaultNodes: [],
    defaultEdges: [],
    suggestedWorkflow: ['Define custom workflow'],
    guidance: ['Customize as needed'],
  },
};
