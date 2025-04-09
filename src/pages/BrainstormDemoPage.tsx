import { Box } from '@mui/material';
import React from 'react';
import type { Node, Edge } from 'reactflow';

import BrainstormPage from '../components/BrainstormFlow/BrainstormPage';
import { NodeType, EdgeType } from '../types';

/**
 * A demo page to showcase the redesigned brainstorming UI
 */
const BrainstormDemoPage: React.FC = () => {
  // Sample initial nodes and edges for demonstration
  const initialNodes: Node[] = [
    {
      id: 'node-1',
      type: NodeType.IDEA,
      position: { x: 250, y: 100 },
      data: {
        id: 'data-1',
        label: 'Main Idea',
        content: 'This is the main idea for our project',
        tags: ['important', 'core'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    {
      id: 'node-2',
      type: NodeType.TASK,
      position: { x: 100, y: 250 },
      data: {
        id: 'data-2',
        label: 'Task 1',
        content: 'Implement the core functionality',
        tags: ['task', 'development'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    {
      id: 'node-3',
      type: NodeType.NOTE,
      position: { x: 400, y: 250 },
      data: {
        id: 'data-3',
        label: 'Note',
        content: 'Remember to check the requirements',
        tags: ['note', 'reminder'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  ];

  const initialEdges: Edge[] = [
    {
      id: 'edge-1-2',
      source: 'node-1',
      target: 'node-2',
      type: EdgeType.SMOOTHSTEP,
    },
    {
      id: 'edge-1-3',
      source: 'node-1',
      target: 'node-3',
      type: EdgeType.SMOOTHSTEP,
    },
  ];

  // Handle save
  const handleSave = (nodes: Node[], edges: Edge[]) => {
    console.log('Saving brainstorm data:', { nodes, edges });
  };

  return (
    <Box sx={{ height: '100vh', width: '100vw' }}>
      <BrainstormPage
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onSave={handleSave}
        projectTitle="Redesigned UI Demo"
      />
    </Box>
  );
};

export default BrainstormDemoPage;
