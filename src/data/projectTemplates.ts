import { NodeType } from '../types/enums';
import { ProjectTemplate } from '../types/project';
import type { Project, Node, Edge } from '../types';

// Helper function to create a template node
function createTemplateNode(
  id: string,
  type: NodeType,
  label: string,
  content: string,
  position: { x: number; y: number },
  tags: string[] = []
): Node {
  return {
    id,
    type,
    position,
    data: {
      label,
      content,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

// Helper function to create a template edge
function createTemplateEdge(id: string, source: string, target: string, label?: string): Edge {
  return {
    id,
    source,
    target,
    label,
    animated: false,
  };
}

// Software Development Template
export const softwareDevelopmentTemplate: Partial<Project> = {
  name: 'Software Development Project',
  description: 'A template for planning and tracking software development projects',
  template: ProjectTemplate.SOFTWARE_DEVELOPMENT,
  isTemplate: true,
  nodes: [
    createTemplateNode(
      'node-1',
      NodeType.IDEA,
      'Project Overview',
      'Define the main goals and scope of the software project.',
      { x: 250, y: 50 },
      ['overview', 'planning']
    ),
    createTemplateNode(
      'node-2',
      NodeType.TASK,
      'Requirements',
      'List all functional and non-functional requirements.',
      { x: 100, y: 200 },
      ['planning', 'requirements']
    ),
    createTemplateNode(
      'node-3',
      NodeType.TASK,
      'Design',
      'Create system architecture and component designs.',
      { x: 250, y: 200 },
      ['planning', 'design']
    ),
    createTemplateNode(
      'node-4',
      NodeType.TASK,
      'Implementation',
      'Code development tasks and milestones.',
      { x: 400, y: 200 },
      ['development', 'coding']
    ),
    createTemplateNode(
      'node-5',
      NodeType.TASK,
      'Testing',
      'Test plans, test cases, and QA processes.',
      { x: 175, y: 350 },
      ['qa', 'testing']
    ),
    createTemplateNode(
      'node-6',
      NodeType.TASK,
      'Deployment',
      'Deployment plans and procedures.',
      { x: 325, y: 350 },
      ['operations', 'deployment']
    ),
    createTemplateNode(
      'node-7',
      NodeType.RESOURCE,
      'Resources',
      'Team members, tools, and external resources needed.',
      { x: 550, y: 125 },
      ['resources', 'team']
    ),
    createTemplateNode(
      'node-8',
      NodeType.NOTE,
      'Project Notes',
      'Important notes and considerations for the project.',
      { x: 550, y: 275 },
      ['notes', 'documentation']
    ),
  ],
  edges: [
    createTemplateEdge('edge-1', 'node-1', 'node-2', 'defines'),
    createTemplateEdge('edge-2', 'node-1', 'node-3', 'guides'),
    createTemplateEdge('edge-3', 'node-1', 'node-4', 'directs'),
    createTemplateEdge('edge-4', 'node-2', 'node-3', 'informs'),
    createTemplateEdge('edge-5', 'node-3', 'node-4', 'implements'),
    createTemplateEdge('edge-6', 'node-4', 'node-5', 'verifies'),
    createTemplateEdge('edge-7', 'node-5', 'node-6', 'enables'),
    createTemplateEdge('edge-8', 'node-7', 'node-2', 'supports'),
    createTemplateEdge('edge-9', 'node-7', 'node-4', 'enables'),
  ],
};

// Marketing Campaign Template
export const marketingCampaignTemplate: Partial<Project> = {
  name: 'Marketing Campaign',
  description: 'A template for planning and executing marketing campaigns',
  template: ProjectTemplate.MARKETING_CAMPAIGN,
  isTemplate: true,
  nodes: [
    createTemplateNode(
      'node-1',
      NodeType.IDEA,
      'Campaign Overview',
      'Define the main goals, target audience, and key messages of the campaign.',
      { x: 250, y: 50 },
      ['overview', 'planning']
    ),
    createTemplateNode(
      'node-2',
      NodeType.TASK,
      'Market Research',
      'Research target audience, competitors, and market trends.',
      { x: 100, y: 200 },
      ['research', 'planning']
    ),
    createTemplateNode(
      'node-3',
      NodeType.TASK,
      'Content Creation',
      'Create content for various channels (social media, blog, email, etc.).',
      { x: 250, y: 200 },
      ['content', 'creation']
    ),
    createTemplateNode(
      'node-4',
      NodeType.TASK,
      'Channel Strategy',
      'Define which channels to use and how to distribute content.',
      { x: 400, y: 200 },
      ['strategy', 'channels']
    ),
    createTemplateNode(
      'node-5',
      NodeType.TASK,
      'Campaign Execution',
      'Launch and manage the campaign across all channels.',
      { x: 250, y: 350 },
      ['execution', 'management']
    ),
    createTemplateNode(
      'node-6',
      NodeType.TASK,
      'Analytics & Reporting',
      'Track KPIs and measure campaign performance.',
      { x: 400, y: 350 },
      ['analytics', 'reporting']
    ),
    createTemplateNode(
      'node-7',
      NodeType.RESOURCE,
      'Budget & Resources',
      'Allocate budget and resources for the campaign.',
      { x: 100, y: 350 },
      ['budget', 'resources']
    ),
    createTemplateNode(
      'node-8',
      NodeType.NOTE,
      'Campaign Notes',
      'Important notes and considerations for the campaign.',
      { x: 550, y: 200 },
      ['notes', 'documentation']
    ),
  ],
  edges: [
    createTemplateEdge('edge-1', 'node-1', 'node-2', 'informs'),
    createTemplateEdge('edge-2', 'node-1', 'node-3', 'guides'),
    createTemplateEdge('edge-3', 'node-1', 'node-4', 'directs'),
    createTemplateEdge('edge-4', 'node-2', 'node-3', 'informs'),
    createTemplateEdge('edge-5', 'node-3', 'node-5', 'feeds'),
    createTemplateEdge('edge-6', 'node-4', 'node-5', 'structures'),
    createTemplateEdge('edge-7', 'node-5', 'node-6', 'measures'),
    createTemplateEdge('edge-8', 'node-7', 'node-5', 'enables'),
  ],
};

// Research Project Template
export const researchProjectTemplate: Partial<Project> = {
  name: 'Research Project',
  description: 'A template for planning and conducting research projects',
  template: ProjectTemplate.RESEARCH_PROJECT,
  isTemplate: true,
  nodes: [
    createTemplateNode(
      'node-1',
      NodeType.IDEA,
      'Research Question',
      'Define the main research question or hypothesis.',
      { x: 250, y: 50 },
      ['question', 'hypothesis']
    ),
    createTemplateNode(
      'node-2',
      NodeType.TASK,
      'Literature Review',
      'Review existing research and literature on the topic.',
      { x: 100, y: 200 },
      ['literature', 'review']
    ),
    createTemplateNode(
      'node-3',
      NodeType.TASK,
      'Methodology',
      'Define research methodology, data collection methods, and analysis approach.',
      { x: 250, y: 200 },
      ['methodology', 'planning']
    ),
    createTemplateNode(
      'node-4',
      NodeType.TASK,
      'Data Collection',
      'Collect data through experiments, surveys, interviews, etc.',
      { x: 400, y: 200 },
      ['data', 'collection']
    ),
    createTemplateNode(
      'node-5',
      NodeType.TASK,
      'Data Analysis',
      'Analyze collected data using appropriate methods.',
      { x: 175, y: 350 },
      ['analysis', 'data']
    ),
    createTemplateNode(
      'node-6',
      NodeType.TASK,
      'Findings & Conclusions',
      'Summarize findings and draw conclusions.',
      { x: 325, y: 350 },
      ['findings', 'conclusions']
    ),
    createTemplateNode(
      'node-7',
      NodeType.RESOURCE,
      'Resources',
      'Equipment, tools, and resources needed for the research.',
      { x: 550, y: 125 },
      ['resources', 'equipment']
    ),
    createTemplateNode(
      'node-8',
      NodeType.NOTE,
      'Research Notes',
      'Important notes and considerations for the research.',
      { x: 550, y: 275 },
      ['notes', 'documentation']
    ),
  ],
  edges: [
    createTemplateEdge('edge-1', 'node-1', 'node-2', 'guides'),
    createTemplateEdge('edge-2', 'node-1', 'node-3', 'determines'),
    createTemplateEdge('edge-3', 'node-2', 'node-3', 'informs'),
    createTemplateEdge('edge-4', 'node-3', 'node-4', 'directs'),
    createTemplateEdge('edge-5', 'node-4', 'node-5', 'provides data for'),
    createTemplateEdge('edge-6', 'node-5', 'node-6', 'leads to'),
    createTemplateEdge('edge-7', 'node-7', 'node-4', 'enables'),
    createTemplateEdge('edge-8', 'node-6', 'node-1', 'answers'),
  ],
};

// Business Plan Template
export const businessPlanTemplate: Partial<Project> = {
  name: 'Business Plan',
  description: 'A template for creating a comprehensive business plan',
  template: ProjectTemplate.BUSINESS_PLAN,
  isTemplate: true,
  nodes: [
    createTemplateNode(
      'node-1',
      NodeType.IDEA,
      'Executive Summary',
      'Brief overview of the business plan and key points.',
      { x: 250, y: 50 },
      ['summary', 'overview']
    ),
    createTemplateNode(
      'node-2',
      NodeType.TASK,
      'Company Description',
      'Detailed description of the company, mission, vision, and values.',
      { x: 100, y: 200 },
      ['company', 'description']
    ),
    createTemplateNode(
      'node-3',
      NodeType.TASK,
      'Market Analysis',
      'Analysis of the market, industry trends, and competition.',
      { x: 250, y: 200 },
      ['market', 'analysis']
    ),
    createTemplateNode(
      'node-4',
      NodeType.TASK,
      'Products/Services',
      'Description of products or services offered.',
      { x: 400, y: 200 },
      ['products', 'services']
    ),
    createTemplateNode(
      'node-5',
      NodeType.TASK,
      'Marketing Strategy',
      'Marketing and sales strategy to reach target customers.',
      { x: 100, y: 350 },
      ['marketing', 'strategy']
    ),
    createTemplateNode(
      'node-6',
      NodeType.TASK,
      'Operations Plan',
      'Day-to-day operations, facilities, equipment, and processes.',
      { x: 250, y: 350 },
      ['operations', 'plan']
    ),
    createTemplateNode(
      'node-7',
      NodeType.TASK,
      'Financial Projections',
      'Financial forecasts, budgets, and funding requirements.',
      { x: 400, y: 350 },
      ['financial', 'projections']
    ),
    createTemplateNode(
      'node-8',
      NodeType.RESOURCE,
      'Management Team',
      'Key team members, roles, and responsibilities.',
      { x: 550, y: 200 },
      ['team', 'management']
    ),
  ],
  edges: [
    createTemplateEdge('edge-1', 'node-1', 'node-2', 'summarizes'),
    createTemplateEdge('edge-2', 'node-1', 'node-3', 'highlights'),
    createTemplateEdge('edge-3', 'node-1', 'node-7', 'previews'),
    createTemplateEdge('edge-4', 'node-3', 'node-5', 'informs'),
    createTemplateEdge('edge-5', 'node-4', 'node-5', 'promotes'),
    createTemplateEdge('edge-6', 'node-4', 'node-6', 'requires'),
    createTemplateEdge('edge-7', 'node-5', 'node-7', 'impacts'),
    createTemplateEdge('edge-8', 'node-6', 'node-7', 'affects'),
    createTemplateEdge('edge-9', 'node-8', 'node-6', 'manages'),
  ],
};

// Custom/Blank Template
export const customTemplate: Partial<Project> = {
  name: 'Blank Canvas',
  description: 'Start with a clean slate for any type of brainstorming session',
  template: ProjectTemplate.CUSTOM,
  isTemplate: true,
  nodes: [],
  edges: [],
};

// Map of all templates
export const projectTemplates: Record<ProjectTemplate, Partial<Project>> = {
  [ProjectTemplate.SOFTWARE_DEVELOPMENT]: softwareDevelopmentTemplate,
  [ProjectTemplate.MARKETING_CAMPAIGN]: marketingCampaignTemplate,
  [ProjectTemplate.RESEARCH_PROJECT]: researchProjectTemplate,
  [ProjectTemplate.BUSINESS_PLAN]: businessPlanTemplate,
  [ProjectTemplate.CUSTOM]: customTemplate,
};

// Function to create a new project from a template
export function createProjectFromTemplate(
  templateType: ProjectTemplate,
  name: string,
  description: string
): Project {
  const template = projectTemplates[templateType];
  const now = new Date().toISOString();
  
  return {
    id: crypto.randomUUID(),
    name: name || template.name || 'New Project',
    description: description || template.description || '',
    nodes: template.nodes || [],
    edges: template.edges || [],
    createdAt: now,
    updatedAt: now,
    version: 1,
    isArchived: false,
    template: templateType,
    syncSettings: {
      enableS3Sync: false,
      syncFrequency: 'manual',
    },
  };
}
