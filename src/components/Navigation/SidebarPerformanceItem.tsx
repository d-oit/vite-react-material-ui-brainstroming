import { Speed as SpeedIcon } from '@mui/icons-material';
import { ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import React, { useState } from 'react';

import PerformanceProfiler from '../PerformanceProfiler';

const SidebarPerformanceItem: React.FC = () => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton onClick={handleOpen}>
          <ListItemIcon>
            <SpeedIcon />
          </ListItemIcon>
          <ListItemText primary="Performance Monitor" />
        </ListItemButton>
      </ListItem>

      {/* Performance Profiler Dialog */}
      {open && <PerformanceProfiler open={open} onClose={handleClose} />}
    </>
  );
};

export default SidebarPerformanceItem;
