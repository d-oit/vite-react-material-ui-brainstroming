import { describe, it, expect } from 'vitest';

import {
  createProjectFromTemplate,
  projectTemplates,
  softwareDevelopmentTemplate,
  marketingCampaignTemplate,
  researchProjectTemplate,
  businessPlanTemplate,
  customTemplate,
} from '../../data/projectTemplates';
import { ProjectTemplate } from '../../types/project';

describe('Project Templates', () => {
  describe('Template Definitions', () => {
    it('should define software development template correctly', () => {
      expect(softwareDevelopmentTemplate).toBeDefined();
      expect(softwareDevelopmentTemplate.name).toBe('Software Development Project');
      expect(softwareDevelopmentTemplate.template).toBe(ProjectTemplate.SOFTWARE_DEVELOPMENT);
      expect(softwareDevelopmentTemplate.nodes).toHaveLength(8);
      expect(softwareDevelopmentTemplate.edges).toHaveLength(9);
    });

    it('should define marketing campaign template correctly', () => {
      expect(marketingCampaignTemplate).toBeDefined();
      expect(marketingCampaignTemplate.name).toBe('Marketing Campaign');
      expect(marketingCampaignTemplate.template).toBe(ProjectTemplate.MARKETING_CAMPAIGN);
      expect(marketingCampaignTemplate.nodes).toHaveLength(8);
      expect(marketingCampaignTemplate.edges).toHaveLength(8);
    });

    it('should define research project template correctly', () => {
      expect(researchProjectTemplate).toBeDefined();
      expect(researchProjectTemplate.name).toBe('Research Project');
      expect(researchProjectTemplate.template).toBe(ProjectTemplate.RESEARCH_PROJECT);
      expect(researchProjectTemplate.nodes).toHaveLength(8);
      expect(researchProjectTemplate.edges).toHaveLength(8);
    });

    it('should define business plan template correctly', () => {
      expect(businessPlanTemplate).toBeDefined();
      expect(businessPlanTemplate.name).toBe('Business Plan');
      expect(businessPlanTemplate.template).toBe(ProjectTemplate.BUSINESS_PLAN);
      expect(businessPlanTemplate.nodes).toHaveLength(8);
      expect(businessPlanTemplate.edges).toHaveLength(9);
    });

    it('should define custom template correctly', () => {
      expect(customTemplate).toBeDefined();
      expect(customTemplate.name).toBe('Blank Canvas');
      expect(customTemplate.template).toBe(ProjectTemplate.CUSTOM);
      expect(customTemplate.nodes).toHaveLength(0);
      expect(customTemplate.edges).toHaveLength(0);
    });

    it('should include all templates in the projectTemplates map', () => {
      expect(Object.keys(projectTemplates)).toHaveLength(5);
      expect(projectTemplates[ProjectTemplate.SOFTWARE_DEVELOPMENT]).toBe(softwareDevelopmentTemplate);
      expect(projectTemplates[ProjectTemplate.MARKETING_CAMPAIGN]).toBe(marketingCampaignTemplate);
      expect(projectTemplates[ProjectTemplate.RESEARCH_PROJECT]).toBe(researchProjectTemplate);
      expect(projectTemplates[ProjectTemplate.BUSINESS_PLAN]).toBe(businessPlanTemplate);
      expect(projectTemplates[ProjectTemplate.CUSTOM]).toBe(customTemplate);
    });
  });

  describe('createProjectFromTemplate', () => {
    it('should create a project from a template with custom name and description', () => {
      const name = 'My Custom Project';
      const description = 'My custom description';
      const project = createProjectFromTemplate(ProjectTemplate.SOFTWARE_DEVELOPMENT, name, description);

      expect(project.id).toBeDefined();
      expect(project.name).toBe(name);
      expect(project.description).toBe(description);
      expect(project.template).toBe(ProjectTemplate.SOFTWARE_DEVELOPMENT);
      expect(project.nodes).toHaveLength(softwareDevelopmentTemplate.nodes?.length || 0);
      expect(project.edges).toHaveLength(softwareDevelopmentTemplate.edges?.length || 0);
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
      expect(project.version).toBe(1);
      expect(project.isArchived).toBe(false);
      expect(project.syncSettings).toEqual({
        enableS3Sync: false,
        syncFrequency: 'manual',
      });
    });

    it('should create a project from a custom template with empty nodes and edges', () => {
      const project = createProjectFromTemplate(ProjectTemplate.CUSTOM, 'Custom Project', 'Custom Description');

      expect(project.id).toBeDefined();
      expect(project.name).toBe('Custom Project');
      expect(project.description).toBe('Custom Description');
      expect(project.template).toBe(ProjectTemplate.CUSTOM);
      expect(project.nodes).toHaveLength(0);
      expect(project.edges).toHaveLength(0);
    });

    it('should use template name if no name is provided', () => {
      const project = createProjectFromTemplate(ProjectTemplate.MARKETING_CAMPAIGN, '', '');

      expect(project.name).toBe(marketingCampaignTemplate.name);
      expect(project.description).toBe(marketingCampaignTemplate.description);
    });
  });
});
