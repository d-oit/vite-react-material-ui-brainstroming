import BoltIcon from '@mui/icons-material/Bolt';
import NoteIcon from '@mui/icons-material/Note';
import StorageIcon from '@mui/icons-material/Storage';
import TaskIcon from '@mui/icons-material/Task';
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import React from 'react';

import { useBrainstormStore } from '../../store/brainstormStore';

import type { NodeType } from './types';

interface FloatingControlsProps {
  position?: { x: number; y: number };
}

const nodeTypes: Array<{
  type: NodeType;
  icon: React.ReactNode;
  label: string;
}> = [
  { type: 'idea', icon: <BoltIcon />, label: 'Add Idea' },
  { type: 'task', icon: <TaskIcon />, label: 'Add Task' },
  { type: 'resource', icon: <StorageIcon />, label: 'Add Resource' },
  { type: 'note', icon: <NoteIcon />, label: 'Add Note' },
];

export const FloatingControls: React.FC<FloatingControlsProps> = ({
  position = { x: 100, y: 100 },
}) => {
  const addNode = useBrainstormStore(state => state.addNode);

  const handleAddNode = (type: NodeType) => {
    addNode({
      type,
      label: `New ${type}`,
      position: {
        x: position.x,
        y: position.y,
      },
    });
  };

  return (
    <SpeedDial
      ariaLabel="Add node"
      sx={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        zIndex: 1000, // Ensure it's above other elements
        '& .MuiSpeedDial-fab': {
          width: 56,
          height: 56,
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        },
      }}
      icon={<SpeedDialIcon />}
    >
      {nodeTypes.map(({ type, icon, label }) => (
        <SpeedDialAction
          key={type}
          icon={icon}
          tooltipTitle={label}
          onClick={() => handleAddNode(type)}
        />
      ))}
    </SpeedDial>
  );
};
