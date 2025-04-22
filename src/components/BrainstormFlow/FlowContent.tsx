import React, { useCallback, useState } from 'react';
import { Background, ReactFlow, useReactFlow, Panel } from 'reactflow';
import type { Connection, NodeMouseHandler, ReactFlowInstance } from 'reactflow';
import { Box, IconButton } from '@mui/material';
import { FullscreenExit as FullscreenExitIcon } from '@mui/icons-material';

import { useBrainstormStore } from '../../store/brainstormStore';
import { nodeTypes } from './nodes';
import ControlsPanel from './ControlsPanel';
import { EnhancedMiniMap } from './EnhancedMiniMap';

import type { FlowContentProps } from './types';

export const FlowContent: React.FC<FlowContentProps> = ({
  flowRef,
  isFullscreen,
  showGrid,
  settings,
  toggleFullscreen,
  onSave,
  handleSettingsOpen,
  toggleGrid
}) => {
  const { fitView } = useReactFlow();
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const { nodes, edges, setNodes, setEdges } = useBrainstormStore();

  const onNodesChange = useCallback(
    (changes: any[]) => {
      setNodes(prevNodes => {
        const updatedNodes = changes.reduce((acc, change) => {
          if ('id' in change) {
            const index = acc.findIndex(node => node.id === change.id);
            if (index === -1) return acc;
            
            const updatedNode = {
              ...acc[index],
              ...change,
            };

            return [
              ...acc.slice(0, index),
              updatedNode,
              ...acc.slice(index + 1)
            ];
          }
          return acc;
        }, prevNodes);
        
        return updatedNodes;
      });
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: any[]) => {
      setEdges(prevEdges => {
        const updatedEdges = changes.reduce((acc, change) => {
          if ('id' in change) {
            const index = acc.findIndex(edge => edge.id === change.id);
