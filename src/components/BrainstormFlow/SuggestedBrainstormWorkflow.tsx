import React from 'react';

import { useI18n } from '../../contexts/I18nContext';
import SuggestedWorkflow from '../UI/SuggestedWorkflow';

interface SuggestedBrainstormWorkflowProps {
  activeStep?: number;
}

/**
 * A component that displays the suggested workflow for brainstorming
 */
const SuggestedBrainstormWorkflow: React.FC<SuggestedBrainstormWorkflowProps> = ({
  activeStep = -1,
}) => {
  const { t } = useI18n();

  // Define the workflow steps
  const workflowSteps = [
    {
      label: t('brainstorm.workflow.defineRequirements') || 'Define requirements',
      completed: activeStep > 0,
    },
    {
      label: t('brainstorm.workflow.breakDownIntoFeatures') || 'Break down into features',
      completed: activeStep > 1,
    },
    {
      label: t('brainstorm.workflow.createTasks') || 'Create tasks',
      completed: activeStep > 2,
    },
    {
      label: t('brainstorm.workflow.addTestCases') || 'Add test cases',
      completed: activeStep > 3,
    },
  ];

  return (
    <SuggestedWorkflow
      title={t('brainstorm.suggestedWorkflow') || 'Suggested workflow'}
      steps={workflowSteps}
      activeStep={activeStep}
    />
  );
};

export default SuggestedBrainstormWorkflow;
