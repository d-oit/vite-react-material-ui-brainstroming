import { Box, Divider, Typography } from '@mui/material';
import { useState } from 'react';

import { navigationItems } from '../../config/navigationConfig';
import { NavigationProvider } from '../../contexts/NavigationContext';
import NavigationContainer from '../Navigation/NavigationContainer';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  width?: number;
}

export const Drawer = ({ open, onClose }: DrawerProps) => {
  const [drawerHeaderId] = useState(`drawer-header-${Math.random().toString(36).substring(2, 9)}`);

  return (
    <NavigationProvider initialItems={navigationItems}>
      <NavigationContainer open={open} onClose={onClose} ariaLabelledby={drawerHeaderId}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" component="div" id={drawerHeaderId}>
            d.o.it.brainstorming
          </Typography>
          <Typography variant="caption" color="text.secondary">
            v{import.meta.env.VITE_PROJECT_VERSION ? import.meta.env.VITE_PROJECT_VERSION : '0.1.0'}
          </Typography>
        </Box>
        <Divider />
      </NavigationContainer>
    </NavigationProvider>
  );
};
