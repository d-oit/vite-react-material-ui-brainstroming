import { Box, IconButton, Paper, Stack, Tooltip } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import type { Connection, Edge, Node } from 'reactflow';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MarkerType,
  Position,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import CloseIcon from '@mui/icons-material/Close';

import { useI18n } from '../../contexts/I18nContext';
import { generateUniqueId } from '../../utils/idGenerator';

import type { BrainstormingProps, BrainstormNode, BrainstormSession } from './types';

const nodeTypes = {
  idea: ({ data }: { data: BrainstormNode }) => (
    <Box
      sx={{
        padding: 2,
        backgroundColor: data.color || '#fff',
        borderRadius: 1,
        border: '1px solid #ccc',
        minWidth: 150,
      }}
    >
      {data.content}
    </Box>
  ),
};

export default function ComprehensiveBrainstorm({
  projectId,
  session,
  onSave,
  onClose,
}: BrainstormingProps) {
  const { t } = useI18n();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [history, setHistory] = useState<BrainstormSession[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Convert BrainstormNodes to ReactFlow nodes
  const convertToFlowNodes = useCallback((brainstormNodes: BrainstormNode[]): Node[] => {
    return brainstormNodes.map(node => ({
      id: node.id,
      type: 'idea',
      position: node.position || { x: 0, y: 0 },
      data: node,
    }));
  }, []);

  // Convert connections to edges
  const createEdges = useCallback((brainstormNodes: BrainstormNode[]): Edge[] => {
    const edges: Edge[] = [];
    brainstormNodes.forEach(node => {
      if (node.children) {
        node.children.forEach(childId => {
          edges.push({
            id: `${node.id}-${childId}`,
            source: node.id,
            target: childId,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
          });
        });
      }
    });
    return edges;
  }, []);

  // Initialize session
  useEffect(() => {
    if (session) {
      setNodes(convertToFlowNodes(session.nodes));
      setEdges(createEdges(session.nodes));
      setHistory([session]);
      setHistoryIndex(0);
    }
  }, [session, convertToFlowNodes, createEdges]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      setEdges(eds =>
        addEdge(
          {
            ...connection,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const handleSave = useCallback(async () => {
    if (!session) return;

    const updatedNodes: BrainstormNode[] = nodes.map(node => ({
      ...(node.data as BrainstormNode),
      position: node.position,
    }));

    const updatedSession: BrainstormSession = {
      ...session,
      nodes: updatedNodes,
      modified: new Date(),
    };

    await onSave?.(updatedSession);
    setHistory(prev => [...prev.slice(0, historyIndex + 1), updatedSession]);
    setHistoryIndex(prev => prev + 1);
  }, [session, nodes, historyIndex, onSave]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevSession = history[historyIndex - 1];
      setNodes(convertToFlowNodes(prevSession.nodes));
      setEdges(createEdges(prevSession.nodes));
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex, convertToFlowNodes, createEdges]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextSession = history[historyIndex + 1];
      setNodes(convertToFlowNodes(nextSession.nodes));
      setEdges(createEdges(nextSession.nodes));
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex, convertToFlowNodes, createEdges]);

  return (
    <Paper
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 4,
          backgroundColor: 'background.paper',
          borderRadius: 1,
          padding: 1,
        }}
      >
        <Tooltip title={t('common.save')}>
          <IconButton onClick={handleSave} size="small">
            <SaveIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('common.undo')}>
          <IconButton onClick={handleUndo} disabled={historyIndex <= 0} size="small">
            <UndoIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('common.redo')}>
          <IconButton
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            size="small"
          >
            <RedoIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('common.close')}>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <Box sx={{ flexGrow: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          nodeTypes={nodeTypes}
          fitView
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </Box>
    </Paper>
  );
}
