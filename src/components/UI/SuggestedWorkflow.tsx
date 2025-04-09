import { Box, Typography, Stepper, Step, StepLabel, Paper, useTheme } from '@mui/material';
import React from 'react';

interface WorkflowStep {
  label: string;
  completed?: boolean;
  optional?: boolean;
}

interface SuggestedWorkflowProps {
  title?: string;
  steps: WorkflowStep[];
  activeStep?: number;
}

/**
 * A component for displaying a suggested workflow with clear steps
 */
const SuggestedWorkflow: React.FC<SuggestedWorkflowProps> = ({
  title = 'Suggested workflow',
  steps,
  activeStep = -1,
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 2,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
        {title}
      </Typography>
      
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{
          mt: 2,
          '& .MuiStepConnector-line': {
            minHeight: 12,
          },
        }}
      >
        {steps.map((step, index) => (
          <Step key={index} completed={step.completed}>
            <StepLabel optional={step.optional ? <Typography variant="caption">Optional</Typography> : undefined}>
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Paper>
  );
};

export default SuggestedWorkflow;
