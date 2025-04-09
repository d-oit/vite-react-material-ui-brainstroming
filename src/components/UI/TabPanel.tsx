import { Box } from '@mui/material';
import React from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  id: string;
  ariaLabelledBy: string;
}

/**
 * A component for tab panels with proper accessibility attributes
 */
const TabPanel: React.FC<TabPanelProps> = ({
  children,
  value,
  index,
  id,
  ariaLabelledBy,
  ...other
}) => {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={id}
      aria-labelledby={ariaLabelledBy}
      aria-hidden={value !== index}
      sx={{
        height: '100%',
        overflow: 'auto',
        display: value === index ? 'block' : 'none',
      }}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%', p: 2 }} tabIndex={value === index ? 0 : -1}>
          {children}
        </Box>
      )}
    </Box>
  );
};

export default TabPanel;
