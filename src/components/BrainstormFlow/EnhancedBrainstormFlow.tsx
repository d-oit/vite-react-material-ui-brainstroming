import React, { useCallback, useRef, useState } from 'react';
import type { ReactFlowInstance, Connection, NodeChange, EdgeChange } from 'reactflow';
import ReactFlow, {
  Background,
  Panel,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './EnhancedBrainstormFlow.css';

import { Box, IconButton, Menu, MenuItem, Typography, Divider, Slider } from '@mui/material';
import { FullscreenExit as FullscreenExitIcon } from '@mui/icons-material';

import LLMChatPanel from '../../features/brainstorming/LLMChatPanel';
import { useBrainstormStore } from '../../store/brainstormStore';
import DeleteConfirmationDialog from '../DeleteConfirmationDialog';
import { useSettings } from '../../contexts/SettingsContext';

import { FloatingControls } from './FloatingControls';
import NodeEditDialog from './NodeEditDialog';
import CustomNode from './nodes/CustomNode';
import type { CustomNode as CustomNodeType, CustomEdge } from './types';
import EnhancedControls from './EnhancedControls';
import { EnhancedMiniMap } from './EnhancedMiniMap';

const nodeTypes = {
  idea: CustomNode,
  task: CustomNode,
  resource: CustomNode,
  note: CustomNode,
};

interface EnhancedBrainstormFlowProps {
  initialNodes: CustomNodeType[];
  initialEdges: CustomEdge[];
  onSave?: (nodes: CustomNodeType[], edges: CustomEdge[]) => void;
}

export const EnhancedBrainstormFlow: React.FC<EnhancedBrainstormFlowProps> = ({
  initialNodes,
  initialEdges,
  onSave,
}) => {
  const flowRef = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);
  const { nodes, edges, setNodes, setEdges } = useBrainstormStore();

  const [mousePosition, setMousePosition] = React.useState({ x: 100, y: 100 });
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showChatPanel, setShowChatPanel] = React.useState(false);
  const [selectedNode, setSelectedNode] = React.useState<CustomNodeType | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<HTMLElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const { settings } = useSettings();

  // Settings menu handlers
  const handleSettingsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
    // Update zoom level when opening settings
    if (reactFlowInstance) {
      setZoomLevel(reactFlowInstance.getZoom());
    }
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleZoomChange = (_event: Event, newValue: number | number[]) => {
    const zoom = Array.isArray(newValue) ? newValue[0] : newValue;
    setZoomLevel(zoom);
    if (reactFlowInstance) {
      reactFlowInstance.setZoom(zoom);
    }
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes(currentNodes => applyNodeChanges(changes, currentNodes) as CustomNodeType[]);
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges(currentEdges => applyEdgeChanges(changes, currentEdges) as CustomEdge[]);
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(currentEdges => addEdge(connection, currentEdges) as CustomEdge[]);
    },
    [setEdges]
  );

  // Track mouse position for new node placement
  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (reactFlowInstance) {
        const bounds = flowRef.current?.getBoundingClientRect();
        if (bounds) {
          const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
          });
          setMousePosition(position);
        }
      }
    },
    [reactFlowInstance]
  );

  // Save changes when needed
  const handleSave = useCallback(() => {
    if (onSave && reactFlowInstance) {
      const currentNodes = reactFlowInstance.getNodes() as CustomNodeType[];
      const currentEdges = reactFlowInstance.getEdges() as CustomEdge[];
      onSave(currentNodes, currentEdges);
    }
  }, [onSave, reactFlowInstance]);

  // Initialize flow with props
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Track previous state to detect changes
  const prevNodesRef = React.useRef<string>(JSON.stringify(initialNodes));
  const prevEdgesRef = React.useRef<string>(JSON.stringify(initialEdges));

  // Auto-save only when there are actual changes
  React.useEffect(() => {
    const currentNodesJSON = JSON.stringify(nodes);
    const currentEdgesJSON = JSON.stringify(edges);

    // Check if nodes or edges have changed
    const nodesChanged = currentNodesJSON !== prevNodesRef.current;
    const edgesChanged = currentEdgesJSON !== prevEdgesRef.current;

    // Only save if there are actual changes
    if (nodesChanged || edgesChanged) {
      handleSave();

      // Update previous state references
      prevNodesRef.current = currentNodesJSON;
      prevEdgesRef.current = currentEdgesJSON;
    }
  }, [nodes, edges, handleSave]);

  // Handle node click for editing
  const handleNodeClick = useCallback((event: React.MouseEvent, node: CustomNodeType) => {
    setSelectedNode(node);
    setShowEditDialog(true);
  }, []);

  // Handle node delete
  const handleNodeDelete = useCallback((node: CustomNodeType) => {
    // Ensure we have the correct node data
    if (!node?.id) return;

    // Set the selected node and show the delete dialog
    setSelectedNode(node);
    setShowDeleteDialog(true);
  }, []);

  // Handle chat panel open
  const handleChatOpen = useCallback((node: CustomNodeType) => {
    setSelectedNode(node);
    setShowChatPanel(true);
  }, []);

  // Handle dialog close
  const handleCloseEditDialog = useCallback(() => {
    setShowEditDialog(false);
    setSelectedNode(null);
  }, []);

  // Handle delete confirmation
  const handleConfirmDelete = useCallback(() => {
    if (selectedNode) {
      // Remove the node from the flow
      setNodes(nodes => nodes.filter(n => n.id !== selectedNode.id));

      // Close the dialog and reset selected node
      setShowDeleteDialog(false);
      setSelectedNode(null);

      // Log the deletion for debugging
      console.log(`Node ${selectedNode.id} deleted successfully`);
    }
  }, [selectedNode, setNodes]);

  // Handle delete dialog close
  const handleCloseDeleteDialog = useCallback(() => {
    setShowDeleteDialog(false);
    setSelectedNode(null);
  }, []);

  // Handle chat panel close
  const handleCloseChatPanel = useCallback(() => {
    setShowChatPanel(false);
    setSelectedNode(null);
  }, []);

  // Handle node update
  const handleNodeUpdate = useCallback(
    (nodeId: string, data: any) => {
      setNodes(nodes =>
        nodes.map(node =>
          node.id === nodeId
            ? {
              ...node,
              data: {
                ...node.data,
                ...data,
              },
            }
            : node
        )
      );
      setShowEditDialog(false);
      setSelectedNode(null);
    },
    [setNodes]
  );

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);

    // Use document.body for fullscreen to ensure the entire page is included
    try {
      if (newFullscreenState) {
        // First set our state, then try browser fullscreen API
        if (document.documentElement.requestFullscreen) {
          void document.documentElement.requestFullscreen();
        }
      } else {
        // Exit browser fullscreen if active
        if (document.fullscreenElement && document.exitFullscreen) {
          void document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error('Error with fullscreen API:', err);
      // Fallback to CSS-only fullscreen if browser API fails
    }
  }, [isFullscreen]);

  // Fit view to ensure all nodes are visible
  const fitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
  }, [reactFlowInstance]);

  // Use effect to force re-render when component mounts
  React.useEffect(() => {
    fitView();
  }, [fitView]);

  // Add fullscreen change event listener
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      // Update our state when browser fullscreen changes
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div
      ref={flowRef}
      className={`flow-container ${isFullscreen ? 'fullscreen' : ''}`}
      onMouseMove={onMouseMove}
      data-testid="enhanced-brainstorm-flow"
    >
      {/* Mobile fullscreen close button */}
      {isFullscreen && (
        <Box className="mobile-close-button">
          <IconButton
            onClick={toggleFullscreen}
            size="large"
            color="primary"
            aria-label="Exit fullscreen"
            data-testid="exit-fullscreen-button"
          >
            <FullscreenExitIcon />
          </IconButton>
        </Box>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        attributionPosition="bottom-left"
        draggable={true}
        selectionOnDrag={true}
        panOnDrag={true}
        zoomOnScroll={true}
        panOnScroll={false}
      >
        {showGrid && <Background />}

        {/* Controls directly in the top-right corner */}
        <div className="flow-controls">
          <button type="button" className="flow-controls-button" onClick={handleSettingsOpen} title="Settings">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="none" d="M0 0h24v24H0z" /><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" /></svg>
          </button>
          <button type="button" className="flow-controls-button" onClick={() => setShowGrid(!showGrid)} title={showGrid ? "Hide Grid" : "Show Grid"}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="none" d="M0 0h24v24H0z" /><path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 20H4v-4h4v4zm0-6H4v-4h4v4zm0-6H4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4z" /></svg>
          </button>
          <button type="button" className="flow-controls-button" onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="none" d="M0 0h24v24H0z" /><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="none" d="M0 0h24v24H0z" /><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
            )}
          </button>
          <button type="button" className="flow-controls-button" onClick={() => reactFlowInstance?.zoomOut()} title="Zoom Out">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="none" d="M0 0h24v24H0z" /><path d="M19 13H5v-2h14v2z" /></svg>
          </button>
          <button type="button" className="flow-controls-button" onClick={() => reactFlowInstance?.zoomIn()} title="Zoom In">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="none" d="M0 0h24v24H0z" /><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
          </button>
        </div>

        {/* Enhanced MiniMap positioned at the bottom-right, under the controls */}
        <Panel position="bottom-right">
          <EnhancedMiniMap
            nodes={nodes}
            edges={edges}
            onNodeClick={(nodeId) => {
              const node = nodes.find(n => n.id === nodeId);
              if (node) handleNodeClick({} as React.MouseEvent, node);
            }}
            onZoomIn={() => reactFlowInstance?.zoomIn()}
            onZoomOut={() => reactFlowInstance?.zoomOut()}
            onFitView={fitView}
            position="bottom-right"
          />
        </Panel>
      </ReactFlow>
      <FloatingControls position={mousePosition} />

      {/* Node Edit Dialog */}
      {showEditDialog && selectedNode && (
        <NodeEditDialog
          open={showEditDialog}
          onClose={handleCloseEditDialog}
          initialData={selectedNode.data}
          initialType={selectedNode.type}
          onSave={(data, type) => handleNodeUpdate(selectedNode.id, { ...data, type })}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedNode && (
        <DeleteConfirmationDialog
          open={showDeleteDialog}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Chat Panel */}
      {showChatPanel && selectedNode && (
        <LLMChatPanel
          open={showChatPanel}
          onClose={handleCloseChatPanel}
          projectId={selectedNode.id}
          session={{ id: 'flow-chat', projectId: selectedNode.id, nodes: [] }}
          onInsightGenerated={() => { }}
        />
      )}

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={handleSettingsClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 280, p: 2 }
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Zoom Level: {Math.round(zoomLevel * 100)}%
        </Typography>
        <Box sx={{ px: 1, mb: 2 }}>
          <Slider
            value={zoomLevel}
            onChange={handleZoomChange}
            min={0.1}
            max={2}
            step={0.1}
            marks={[
              { value: 0.5, label: '50%' },
              { value: 1, label: '100%' },
              { value: 1.5, label: '150%' },
            ]}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
          />
        </Box>

        <Divider sx={{ my: 1 }} />

        <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
          Keyboard Shortcuts
        </Typography>
        <MenuItem dense sx={{ py: 0.5 }}>
          <Typography variant="body2">Ctrl + +: Zoom In</Typography>
        </MenuItem>
        <MenuItem dense sx={{ py: 0.5 }}>
          <Typography variant="body2">Ctrl + -: Zoom Out</Typography>
        </MenuItem>
        <MenuItem dense sx={{ py: 0.5 }}>
          <Typography variant="body2">Ctrl + 0: Fit View</Typography>
        </MenuItem>
        <MenuItem dense sx={{ py: 0.5 }}>
          <Typography variant="body2">F: Fullscreen</Typography>
        </MenuItem>
        <MenuItem dense sx={{ py: 0.5 }}>
          <Typography variant="body2">Delete: Remove Selected</Typography>
        </MenuItem>
      </Menu>
    </div>
  );
};
