import { SmartToy as SmartToyIcon, Close as CloseIcon } from '@mui/icons-material';
import {
  Box,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Fab,
  // IconButton, // Unused
  // Menu, // Unused
  // MenuItem, // Unused
  // ListItemIcon, // Unused
  // ListItemText, // Unused
  Tooltip,
  Paper,
  // Typography, // Unused
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import type {
  Node as FlowNode,
  NodeTypes,
  Connection,
  ReactFlowInstance,
  XYPosition,
  OnNodesChange,
  OnEdgesChange,
  Background as ReactFlowBackground,
  BackgroundVariant,
} from 'reactflow';
import { ReactFlowProvider } from 'reactflow';

import { useI18n } from '../../contexts/I18nContext';
import { useSettings } from '../../contexts/SettingsContext';
import loggerService from '../../services/LoggerService';
import { MetricCategory, performanceTracker } from '../../utils/performanceTracker';
import type { NodeData, Node, Edge } from '../../types';
import { NodeType, EdgeType } from '../../types';
// Import performance monitoring utilities
// Performance monitoring is disabled for now but will be used in future optimizations
import { MemoizedChatPanel } from '../Chat/ChatPanel';

// Import components needed for the flow
import AccessibilityPanel from './AccessibilityPanel';
import EdgeStyleDialog from './EdgeStyleDialog';
import EditableNode from './EditableNode';
import EnhancedControls from './EnhancedControls';
import EnhancedControlsPanel from './EnhancedControlsPanel';
import EnhancedMiniMap from './EnhancedMiniMap';
import EnhancedZoomControls from './EnhancedZoomControls';
import FlowContextMenuHandler from './FlowContextMenuHandler';
import KeyboardShortcutsDialog from './KeyboardShortcutsDialog';
import KeyboardShortcutsHandler from './KeyboardShortcutsHandler';
import KeyboardShortcutsOverlay from './KeyboardShortcutsOverlay';
import LinkedNodesHighlight from './LinkedNodesHighlight';
import MobileControls from './MobileControls';
import NodeStyleDialog from './NodeStyleDialog';
import ResponsiveNodeEditDialog from './ResponsiveNodeEditDialog';

// Lazy load React Flow components and CSS with preloading hints
const ReactFlowModule = lazy(async () => {
  // Add preload hints for better performance
  const cssLink = document.createElement('link');
  cssLink.rel = 'preload';
  cssLink.as = 'style';
  cssLink.href = 'reactflow/dist/style.css';
  document.head.appendChild(cssLink);

  return Promise.all([import('reactflow'), import('reactflow/dist/style.css')]).then(
    ([module]) => ({ default: module.default })
  );
});

// Lazy load the ReactFlow components
const ReactFlowComponentsLoader = lazy(() =>
  import('reactflow').then(module => ({
    default: (props: { children: (components: any) => React.ReactNode }) => {
      const { children } = props;
      const components = {
        default: {
          Background: module.Background,
          Controls: module.Controls,
          MiniMap: module.MiniMap,
          useNodesState: module.useNodesState,
          useEdgesState: module.useEdgesState,
          addEdge: module.addEdge,
          useReactFlow: module.useReactFlow,
          ReactFlowProvider: module.ReactFlowProvider,
        },
      };
      return <>{children(components)}</>;
    },
  }))
);

// Create a component that will render the children function with the ReactFlow components
interface ReactFlowComponentsProps {
  children: (components: {
    default: {
      Background: typeof ReactFlowBackground;
      Controls: typeof import('reactflow').Controls;
      MiniMap: typeof import('reactflow').MiniMap;
      useReactFlow: typeof import('reactflow').useReactFlow;
      ReactFlowProvider: typeof import('reactflow').ReactFlowProvider;
    };
  }) => React.ReactNode;
}

const ReactFlowComponents = ({ children }: ReactFlowComponentsProps) => (
  <ReactFlowComponentsLoader>
    {components => children(components as Parameters<ReactFlowComponentsProps['children']>[0])}
  </ReactFlowComponentsLoader>
);

// Define custom node types
const nodeTypes: NodeTypes = {
  [NodeType.IDEA]: EditableNode,
  [NodeType.TASK]: EditableNode,
  [NodeType.NOTE]: EditableNode,
  [NodeType.RESOURCE]: EditableNode,
};

interface EnhancedBrainstormFlowProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  readOnly?: boolean;
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
}

// This is the main component that will be exported
const EnhancedBrainstormFlow = React.memo((props: EnhancedBrainstormFlowProps) => {
  return (
    <ReactFlowProvider>
      <FlowContent {...props} />
    </ReactFlowProvider>
  );
});

export { EnhancedBrainstormFlow };

// This is the inner component that uses the ReactFlow hooks
// Split into smaller components for better maintainability
// These components will be used in future implementations

const FlowContent = React.memo(({
  initialNodes = [],
  initialEdges = [],
  onSave,
  readOnly = false,
  onNodesChange: externalNodesChange,
  onEdgesChange: externalEdgesChange,
}: EnhancedBrainstormFlowProps) => {
  const theme = useTheme();
  const { t } = useI18n();
  const { settings, updateSettings } = useSettings();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // State for nodes and edges
  const [nodes, setNodes] = useState<Node[]>(
    initialNodes !== undefined && initialNodes !== null ? initialNodes : []
  );
  const [edges, setEdges] = useState<Edge[]>(
    initialEdges !== undefined && initialEdges !== null ? initialEdges : []
  );

  // State for node editing and styling
  const [nodeEditOpen, setNodeEditOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // State for snackbar notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');

  // State for accessibility panel and keyboard shortcuts dialog
  const [accessibilityPanelOpen, setAccessibilityPanelOpen] = useState(false);
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
  const [keyboardShortcutsOverlayOpen, setKeyboardShortcutsOverlayOpen] = useState(false);

  // State for node and edge styling
  const [nodeStyleDialogOpen, setNodeStyleDialogOpen] = useState(false);
  const [edgeStyleDialogOpen, setEdgeStyleDialogOpen] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  // State for enhanced controls
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // State for linked nodes highlight
  const [linkedNodeIds, setLinkedNodeIds] = useState<string[]>([]);
  const [nodePositions, setNodePositions] = useState<
    Record<string, { x: number; y: number; width: number; height: number }>
  >({});

  // Update node positions for linked nodes highlight
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      // Get the current viewport
      const viewport = reactFlowInstance.getViewport();

      // Calculate node positions in the viewport
      const positions: Record<string, { x: number; y: number; width: number; height: number }> = {};

      nodes.forEach(node => {
        const element = document.querySelector(`[data-id="${node.id}"]`);
        if (element) {
          const rect = element.getBoundingClientRect();
          positions[node.id] = {
            x: node.position.x * viewport.zoom + viewport.x,
            y: node.position.y * viewport.zoom + viewport.y,
            width: rect.width,
            height: rect.height,
          };
        }
      });

      // Update node positions
      setNodePositions(positions);
    }
  }, [reactFlowInstance, nodes]);

  // State for delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null);

  // State for chat panel
  const [showChat, setShowChat] = useState(false);

  // ReactFlow hooks will be used in future optimizations

  // References to ReactFlow functions
  const [fitView, setFitView] = useState<
    ((params?: { padding?: number; includeHiddenNodes?: boolean }) => void) | null
  >(null);
  const [zoomIn, setZoomIn] = useState<(() => void) | null>(null);
  const [zoomOut, setZoomOut] = useState<(() => void) | null>(null);

  // Handle nodes change with external callback
  const handleNodesChange: OnNodesChange = useCallback(
    changes => {
      if (!changes?.length) return;
      const updatedNodes = nodes.map(node => {
        const positionChange = changes.find(
          change => 'id' in change && change.id === node.id && change.type === 'position'
        ) as { id: string; type: 'position'; position: XYPosition } | undefined;

        if (positionChange) {
          return {
            ...node,
            position: positionChange.position,
          };
        }
        return node;
      });

      if (externalNodesChange) {
        externalNodesChange(updatedNodes);
      }
    },
    [nodes, externalNodesChange]
  );

  // Handle edges change with external callback
  const handleEdgesChange: OnEdgesChange = useCallback(
    changes => {
      const removedEdgeIds = changes
        .filter(
          (change): change is { id: string; type: 'remove' } =>
            'id' in change && change.type === 'remove'
        )
        .map(change => change.id);

      const updatedEdges = edges.filter(edge => !removedEdgeIds.includes(edge.id));

      if (externalEdgesChange) {
        externalEdgesChange(updatedEdges);
      }
    },
    [edges, externalEdgesChange]
  );

  // Connect nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      // Validate connection
      if (!connection.source || !connection.target) {
        console.warn('Invalid connection attempt:', connection);
        return;
      }

      // Check if connection already exists
      const connectionExists = edges.some(
        edge => edge.source === connection.source && edge.target === connection.target
      );

      if (connectionExists) {
        showSnackbar(t('brainstorm.edgeAlreadyExists') || 'Connection already exists', 'info');
        return;
      }

      // Create new edge with unique ID and animation
      const newEdge: Edge = {
        id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        type: EdgeType.SMOOTHSTEP,
        animated: true, // Add animation to make it more visible
      };

      // Add the new edge to the edges array
      // Fallback if addEdge is not available yet
      const updatedEdges = [...edges, newEdge];
      setEdges(updatedEdges);

      if (externalEdgesChange) {
        externalEdgesChange(updatedEdges);
      }

      showSnackbar(t('brainstorm.edgeCreated') || 'Connection created', 'success');
    },
    [edges, setEdges, externalEdgesChange, t]
  );

  // Handle node click
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: FlowNode) => {
      if (readOnly) return;

      const selectedNode = nodes.find(n => n.id === node.id);
      if (selectedNode) {
        setSelectedNode(selectedNode);
        setNodeEditOpen(true);
      }
    },
    [nodes, readOnly]
  );

  // Handle node click from data (used in node data)
  const handleNodeClick = useCallback(
    (id: string) => {
      if (readOnly) return;

      const selectedNode = nodes.find(n => n.id === id);
      if (selectedNode) {
        setSelectedNode(selectedNode);
        setNodeEditOpen(true);
      }
    },
    [nodes, readOnly]
  );

  // Handle node edit
  const handleNodeEdit = useCallback(
    (nodeId: string, newData: { label: string; content: string; tags?: string[] }) => {
      if (!nodeId) return;
      const updatedNodes = nodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newData.label,
              content: newData.content,
              tags: newData.tags || [],
              updatedAt: new Date().toISOString(),
              onEdit: node.data.onEdit,
              onDelete: node.data.onDelete,
            },
          };
        }
        return node;
      });

      setNodes(updatedNodes);
      setNodeEditOpen(false);
      setSelectedNode(null);

      if (externalNodesChange) {
        externalNodesChange(updatedNodes as Node[]);
      }

      showSnackbar(t('brainstorm.nodeUpdated'), 'success');
    },
    [nodes, setNodes, externalNodesChange, t]
  );

  // Handle node delete
  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      try {
        // Find the node to be deleted (for logging)
        const nodeToDelete = nodes.find(node => node.id === nodeId);

        // Find all connected edges
        const connectedEdges = edges.filter(
          edge => edge.source === nodeId || edge.target === nodeId
        );
        const connectedEdgeIds = connectedEdges.map(edge => edge.id);

        // Filter out the node and its connected edges
        const updatedNodes = nodes.filter(node => node.id !== nodeId);
        const updatedEdges = edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);

        // Log the deletion
        loggerService.info(
          `Deleting node ${nodeId} with ${connectedEdgeIds.length} connected edges`,
          {
            nodeType: nodeToDelete?.type,
            connectedEdgeIds,
          }
        );

        // Update state
        setNodes(updatedNodes);
        setEdges(updatedEdges);
        setNodeEditOpen(false);
        setSelectedNode(null);

        // Notify external handlers
        if (externalNodesChange) {
          externalNodesChange(updatedNodes as Node[]);
        }

        if (externalEdgesChange) {
          externalEdgesChange(updatedEdges as Edge[]);
        }

        // Show success message
        showSnackbar(
          connectedEdgeIds.length > 0
            ? t('brainstorm.nodeAndEdgesDeleted', { count: connectedEdgeIds.length.toString() })
            : t('brainstorm.nodeDeleted'),
          'info'
        );
      } catch (error) {
        // Log and show error
        loggerService.error(
          'Error deleting node',
          error instanceof Error ? error : new Error(String(error))
        );
        showSnackbar(t('brainstorm.errorDeletingNode'), 'error');
      }
    },
    [nodes, edges, setNodes, setEdges, externalNodesChange, externalEdgesChange, t]
  );

  // Handle node delete request
  const handleNodeDeleteRequest = useCallback(
    (nodeId: string, event?: React.MouseEvent) => {
      event?.stopPropagation(); // Prevent node selection

      // Log the delete request
      loggerService.info(`Node deletion requested for node ${nodeId}`);

      // Check if skipDeleteConfirmation is enabled in settings
      const skipConfirmation =
        process.env.VITE_SKIP_DELETE_CONFIRMATION === 'true' ||
        Boolean(settings.skipDeleteConfirmation);

      if (skipConfirmation) {
        handleNodeDelete(nodeId);
      } else {
        setNodeToDelete(nodeId);
        setDeleteConfirmOpen(true);
      }
    },
    [settings, handleNodeDelete]
  );

  // Process nodes to add event handlers
  const processNodes = useCallback(
    (nodesToProcess: Node[]): Node[] => {
      const metricId = performanceTracker.startMeasure(
        'ProcessNodes',
        MetricCategory.RENDER,
        { nodeCount: nodesToProcess.length }
      );

      const result = nodesToProcess.map(node => ({
        ...node,
        data: {
          ...node.data,
          onEdit: (id: string) => {
            const selectedNode = nodes.find(n => n.id === id);
            if (selectedNode) {
              setSelectedNode(selectedNode);
              setNodeEditOpen(true);
            }
          },
          onDelete: handleNodeDeleteRequest,
          // Add handler for direct editing
          onSaveDirectEdit: (id: string, newData: { label: string; content: string }) => {
            const updatedNodes = nodes.map(n => {
              if (n.id === id) {
                return {
                  ...n,
                  data: {
                    ...n.data,
                    label: newData.label,
                    content: newData.content,
                    updatedAt: new Date().toISOString(),
                  },
                };
              }
              return n;
            });

            setNodes(updatedNodes);

            if (externalNodesChange) {
              externalNodesChange(updatedNodes as Node[]);
            }

            // Log the update
            loggerService.info('Node directly edited', {
              nodeId: id,
              newLabel: newData.label,
              contentLength: newData.content.length,
            });
          },
        },
      }));

      performanceTracker.endMeasure(metricId);
      return result;
    },
    [nodes, handleNodeDeleteRequest, setNodes, externalNodesChange]
  );

  // Add a new node
  const addNode = useCallback(
    (type: NodeType) => {
      if (readOnly === true || reactFlowInstance === null) return;

      // Get the center position of the viewport
      const { x, y, zoom } = reactFlowInstance.getViewport();
      const centerX = reactFlowWrapper.current
        ? reactFlowWrapper.current.offsetWidth / 2 / zoom - x / zoom
        : 0;
      const centerY = reactFlowWrapper.current
        ? reactFlowWrapper.current.offsetHeight / 2 / zoom - y / zoom
        : 0;

      // Add some random offset to avoid stacking
      const position: XYPosition = {
        x: centerX + Math.random() * 100 - 50,
        y: centerY + Math.random() * 100 - 50,
      };

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type,
        position,
        data: {
          id: `data-${Date.now()}`,
          label: t(`brainstorm.defaultLabels.${type}`),
          content: '',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          title: '',
        },
      };

      // Process the node to add event handlers
      const processedNode = processNodes([newNode])[0];
      const updatedNodes = [...nodes, processedNode];
      setNodes(updatedNodes);

      if (externalNodesChange) {
        externalNodesChange(updatedNodes as Node[]);
      }

      // Select the new node for editing
      setSelectedNode(processedNode as Node);
      setNodeEditOpen(true);

      showSnackbar(t('brainstorm.nodeCreated'), 'success');
    },
    [reactFlowInstance, nodes, setNodes, externalNodesChange, readOnly, t, processNodes]
  );

  // Save the flow
  const saveFlow = useCallback(() => {
    if (onSave) {
      const metricId = performanceTracker.startMeasure(
        'SaveFlow',
        MetricCategory.INTERACTION,
        { nodeCount: nodes.length, edgeCount: edges.length }
      );

      onSave(nodes as Node[], edges as Edge[]);
      showSnackbar(t('brainstorm.flowSaved'), 'success');

      performanceTracker.endMeasure(metricId);
    }
  }, [nodes, edges, onSave, t]);

  // Show snackbar message
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  /**
   * Handle adding nodes from chat
   */
  const handleAddNodesFromChat = useCallback(
    (nodeDatas: NodeData[]) => {
      if (reactFlowInstance === null || !Array.isArray(nodeDatas) || nodeDatas.length === 0) return;

      // Get the current viewport
      const { x, y, zoom } = reactFlowInstance.getViewport();

      // Calculate viewport center and spacing
      const viewportDimensions = reactFlowInstance.getViewport();
      const spacing = 250 * viewportDimensions.zoom;
      // Create new nodes from the node data
      const newNodes: Node[] = nodeDatas.map((nodeData, index) => {
        // Position nodes in a grid-like pattern with zoom-adjusted spacing
        const position = {
          x: (-x + spacing * (index % 3)) / zoom,
          y: (-y + spacing * Math.floor(index / 3)) / zoom,
        };

        return {
          id: nodeData.id,
          type:
            nodeData.type !== undefined && nodeData.type !== null
              ? (nodeData.type as NodeType)
              : NodeType.IDEA,
          position,
          data: {
            ...nodeData,
            // We need to use the current handleNodeClick function
            // eslint-disable-next-line react-hooks/exhaustive-deps
            onEdit: (id: string) => handleNodeClick(id),
            onDelete: (id: string) => {
              if (id) {
                setNodeToDelete(id);
                setDeleteConfirmOpen(true);
              }
            },
          },
        };
      });

      // Add the new nodes to the flow
      setNodes(nodes => [...nodes, ...newNodes]);

      // Notify about the change
      if (externalNodesChange) {
        externalNodesChange([...nodes, ...newNodes]);
      }

      // Show success message
      showSnackbar(t('brainstorm.nodesAdded', { count: String(newNodes.length) }), 'success');

      // Fit the view to include the new nodes
      setTimeout(() => {
        fitView?.({ padding: 0.2, includeHiddenNodes: false });
      }, 100);
    },
    [reactFlowInstance, nodes, setNodes, externalNodesChange, t, fitView, handleNodeClick]
  );

  // Expose zoom functions to parent
  useEffect(() => {
    if (zoomIn && zoomOut && fitView) {
      window.brainstormFlowApi = {
        zoomIn: zoomIn,
        zoomOut: zoomOut,
        fitView: () => fitView({ padding: 0.2 }),
        addNode: (type?: NodeType) =>
          addNode(type !== undefined && type !== null ? type : NodeType.IDEA),
        saveFlow,
      };
    }

    return () => {
      window.brainstormFlowApi = undefined;
    };
  }, [zoomIn, zoomOut, fitView, addNode, saveFlow]);

  // Process initial nodes to add event handlers
  useEffect(() => {
    if (initialNodes.length > 0 && Array.isArray(initialNodes)) {
      const metricId = performanceTracker.startMeasure(
        'ProcessInitialNodes',
        MetricCategory.RENDER,
        { nodeCount: initialNodes.length }
      );

      const processedNodes = processNodes(initialNodes);
      setNodes(processedNodes);

      performanceTracker.endMeasure(metricId);
    }
  }, [initialNodes, processNodes, setNodes]);

  // Auto-fit view on initial load
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0 && fitView) {
      setTimeout(() => {
        fitView({ padding: 0.2 });
      }, 200);
    }
  }, [reactFlowInstance, fitView, nodes.length]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (reactFlowInstance && nodes.length > 0 && fitView) {
        const metricId = performanceTracker.startMeasure(
          'ResizeViewFit',
          MetricCategory.INTERACTION
        );

        setTimeout(() => {
          fitView({ padding: 0.2 });
          performanceTracker.endMeasure(metricId);
        }, 200);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [reactFlowInstance, fitView, nodes.length]);

  return (
    <Box
      ref={reactFlowWrapper}
      sx={{
        height: '100%',
        width: '100%',
        position: 'relative',
      }}
    >
      <Suspense
        fallback={
          <Box
            sx={{
              height: '100%',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Loading Flow Editor...
          </Box>
        }
      >
        <ReactFlowComponents>
          {(components: {
            default: {
              Background: typeof import('reactflow').Background;
              Controls: typeof import('reactflow').Controls;
              MiniMap: typeof import('reactflow').MiniMap;
              useReactFlow: typeof import('reactflow').useReactFlow;
            };
          }) => {
            // Create an inner component to properly handle React Flow hooks
            const FlowInner = () => {
              const { Background, Controls, MiniMap, useReactFlow } = components.default;

              // Get ReactFlow instance methods
              const flowInstance = useReactFlow();

              // Initialize control functions on mount
              useEffect(() => {
                if (!isInitialized.current && Boolean(flowInstance)) {
                  isInitialized.current = true;
                  setFitView(() => flowInstance.fitView);
                  setZoomIn(() => flowInstance.zoomIn);
                  setZoomOut(() => flowInstance.zoomOut);
                }
              }, [flowInstance]);

              return (
                <ReactFlowProvider>
                  <ReactFlowModule
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={handleEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onInit={setReactFlowInstance}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-right"
                    minZoom={0.1}
                    maxZoom={4}
                    defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                    proOptions={{ hideAttribution: true }}
                    snapToGrid={!isMobile}
                    snapGrid={[15, 15]}
                    deleteKeyCode={['Backspace', 'Delete']}
                    multiSelectionKeyCode={['Control', 'Meta']}
                    selectionKeyCode={['Shift']}
                    connectionMode={'loose' as any}
                    connectionLineStyle={{ stroke: '#2196f3', strokeWidth: 3 }}
                    connectionLineType={'smoothstep' as any}
                    zoomOnScroll={true}
                    panOnScroll={true}
                    panOnDrag={!isMobile}
                    onNodeContextMenu={(event, node) => {
                      if (readOnly) return;
                      event.preventDefault();
                      const nodeData = nodes.find(n => n.id === node.id);
                      if (nodeData) {
                        // The FlowContextMenuHandler will handle this event
                      }
                    }}
                    onEdgeContextMenu={(event, edge) => {
                      if (readOnly) return;
                      event.preventDefault();
                      const edgeData = edges.find(e => e.id === edge.id);
                      if (edgeData) {
                        // The FlowContextMenuHandler will handle this event
                      }
                    }}
                    onPaneContextMenu={event => {
                      if (readOnly) return;
                      event.preventDefault();
                      // The FlowContextMenuHandler will handle this event
                    }}
                  >
                    {/* Controls - different for mobile and desktop */}
                    {isMobile ? (
                      <MobileControls
                        onZoomIn={() => reactFlowInstance?.zoomIn()}
                        onZoomOut={() => reactFlowInstance?.zoomOut()}
                        onFitView={() => reactFlowInstance?.fitView({ padding: 0.2 })}
                        onToggleGrid={() => console.log('Toggle grid')}
                        onUndo={() => console.log('Undo')}
                        onRedo={() => console.log('Redo')}
                        onSave={saveFlow}
                        onAddNode={addNode}
                        readOnly={readOnly}
                      />
                    ) : (
                      <EnhancedControls
                        onZoomIn={() => reactFlowInstance?.zoomIn()}
                        onZoomOut={() => reactFlowInstance?.zoomOut()}
                        onFitView={() => reactFlowInstance?.fitView({ padding: 0.2 })}
                        onToggleGrid={() => console.log('Toggle grid')}
                        onUndo={() => console.log('Undo')}
                        onRedo={() => console.log('Redo')}
                        onSave={saveFlow}
                        onAccessibility={() => setAccessibilityPanelOpen(true)}
                        position="bottom-right"
                      />
                    )}
                    <Background
                      color={theme.palette.mode === 'dark' ? '#555' : '#aaa'}
                      gap={isMobile ? 15 : 20}
                      size={isMobile ? 0.5 : 1}
                      variant={'dots' as BackgroundVariant}
                    />

                    {/* Context Menu Handler */}
                    <FlowContextMenuHandler
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={setNodes}
                      onEdgesChange={setEdges}
                      onNodeEdit={node => {
                        setSelectedNode(node);
                        setNodeEditOpen(true);
                      }}
                      onNodeDelete={node => handleNodeDeleteRequest(node.id)}
                      onNodeStyle={node => {
                        setSelectedNode(node);
                        // Node styling will be implemented in future updates
                        console.log('Style node:', node);
                      }}
                      onAddChildNode={node => {
                        // Process the node to add event handlers
                        const childNode: Node = {
                          id: `node-${Date.now()}`,
                          type: node.type,
                          position: {
                            x: node.position.x + 150,
                            y: node.position.y + 100,
                          },
                          data: {
                            id: `data-${Date.now()}`,
                            label: `Child of ${node.data.label}`,
                            content: '',
                            tags: [],
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            title: '',
                            onEdit: (id: string) => {
                              const selectedNode = nodes.find(n => n.id === id);
                              if (selectedNode) {
                                setSelectedNode(selectedNode);
                                setNodeEditOpen(true);
                              }
                            },
                            onDelete: (id: string) => {
                              setNodeToDelete(id);
                              setDeleteConfirmOpen(true);
                            },
                          },
                        };

                        const childEdge: Edge = {
                          id: `edge-${Date.now()}`,
                          source: node.id,
                          target: childNode.id,
                          type: EdgeType.SMOOTHSTEP,
                          animated: false,
                        };

                        setNodes([...nodes, childNode]);
                        setEdges([...edges, childEdge]);
                      }}
                      onLinkNodeToChat={node => {
                        // This would be implemented when chat integration is added
                        console.log('Link node to chat:', node);
                      }}
                      readOnly={readOnly}
                    />

                    {!isMobile && (
                      <MiniMap
                        nodeStrokeWidth={3}
                        zoomable
                        pannable
                        position="bottom-left"
                        style={{
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? theme.palette.grey[900]
                              : theme.palette.grey[100],
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      />
                    )}

                    {!isMobile && !readOnly && (
                      <Controls
                        position="bottom-right"
                        showInteractive={false}
                        style={{
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? theme.palette.grey[900]
                              : theme.palette.grey[100],
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      />
                    )}
                  </ReactFlowModule>
                </ReactFlowProvider>
              );
            };

            return <FlowInner />;
          }}
        </ReactFlowComponents>
      </Suspense>

      {/* Chat Panel - Repositioned to avoid overlaps */}
      <Box
        sx={{
          position: 'absolute',
          right: 16,
          bottom: 80, // Increased to avoid overlap with controls
          width: showChat ? { xs: '90vw', sm: 350 } : 'auto',
          height: showChat ? { xs: '60vh', sm: 450 } : 'auto', // Reduced height to avoid overlaps
          maxWidth: showChat ? { xs: 'calc(100vw - 32px)', sm: 350 } : 'auto',
          maxHeight: showChat ? { xs: 'calc(100vh - 160px)', sm: 450 } : 'auto', // Increased bottom margin
          transition: 'all 0.3s ease',
          zIndex: 950, // Increased to be above other elements but below FABs
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {showChat ? (
          <Paper
            elevation={4}
            sx={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 2,
              position: 'relative',
              boxShadow: theme =>
                `0 8px 24px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)'}`,
            }}
          >
            <Button
              size="small"
              color="primary"
              variant="contained"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                minWidth: 0,
                width: 32,
                height: 32,
                borderRadius: '50%',
                zIndex: 10,
                boxShadow: 2,
              }}
              onClick={() => setShowChat(false)}
            >
              <CloseIcon fontSize="small" />
            </Button>
            <MemoizedChatPanel
              onAddNodes={handleAddNodesFromChat}
              projectContext={{
                nodeCount: nodes.length,
                edgeCount: edges.length,
                nodeTypes: Object.keys(NodeType),
              }}
            />
          </Paper>
        ) : (
          <Tooltip title={t('chat.openChat') || 'Open AI Chat Assistant'}>
            <Fab
              color="primary"
              onClick={() => setShowChat(true)}
              sx={{
                boxShadow: theme =>
                  `0 4px 12px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)'}`,
                '&:hover': {
                  boxShadow: theme =>
                    `0 6px 16px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)'}`,
                },
                transition: 'all 0.3s ease',
              }}
              aria-label={t('chat.openChat') || 'Open AI Chat Assistant'}
            >
              <SmartToyIcon />
            </Fab>
          </Tooltip>
        )}
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">{t('brainstorm.confirmDelete')}</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {t('brainstorm.confirmDeleteMessage')}
          </DialogContentText>

          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={e => {
                    // Update the skipDeleteConfirmation setting
                    if (e.target.checked) {
                      updateSettings({
                        ...settings,
                        skipDeleteConfirmation: true,
                      });

                      // Log the setting change
                      loggerService.info('User enabled skipDeleteConfirmation setting');
                    }
                  }}
                  color="primary"
                />
              }
              label={t('brainstorm.dontAskAgain')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} aria-label={t('common.cancel')}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => {
              if (nodeToDelete) {
                handleNodeDelete(nodeToDelete);
                setNodeToDelete(null);
              }
              setDeleteConfirmOpen(false);
            }}
            color="error"
            variant="contained"
            aria-label={t('common.delete')}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Node edit dialog - Responsive version */}
      <ResponsiveNodeEditDialog
        open={nodeEditOpen}
        onClose={() => {
          setNodeEditOpen(false);
          setSelectedNode(null);
        }}
        node={selectedNode}
        onSave={handleNodeEdit}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Keyboard Shortcuts Handler */}
      <KeyboardShortcutsHandler
        onZoomIn={() => reactFlowInstance?.zoomIn()}
        onZoomOut={() => reactFlowInstance?.zoomOut()}
        onFitView={() => reactFlowInstance?.fitView({ padding: 0.2 })}
        onAddNode={() => addNode(NodeType.IDEA)}
        onSave={saveFlow}
        onUndo={() => console.log('Undo')}
        onRedo={() => console.log('Redo')}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        onDelete={() => {
          if (selectedNode) {
            handleNodeDeleteRequest(selectedNode.id);
          }
        }}
        onEscape={() => {
          if (keyboardShortcutsOverlayOpen) {
            setKeyboardShortcutsOverlayOpen(false);
          } else {
            setKeyboardShortcutsOpen(true);
          }
        }}
        disabled={readOnly}
      />

      {/* Accessibility Panel */}
      <AccessibilityPanel
        open={accessibilityPanelOpen}
        onClose={() => setAccessibilityPanelOpen(false)}
        nodes={nodes}
        onNodeSelect={nodeId => {
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            setSelectedNode(node);
            // Center the view on the selected node
            reactFlowInstance?.fitView({
              padding: 0.5,
              includeHiddenNodes: false,
              nodes: [node],
            });
          }
        }}
        onNodeEdit={nodeId => {
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            setSelectedNode(node);
            setNodeEditOpen(true);
          }
        }}
        onNodeDelete={nodeId => handleNodeDeleteRequest(nodeId)}
        onAddNode={addNode}
        onZoomIn={() => reactFlowInstance?.zoomIn()}
        onZoomOut={() => reactFlowInstance?.zoomOut()}
        onFitView={() => reactFlowInstance?.fitView({ padding: 0.2 })}
        selectedNodeId={selectedNode?.id || null}
        readOnly={readOnly}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={keyboardShortcutsOpen}
        onClose={() => setKeyboardShortcutsOpen(false)}
      />

      {/* Keyboard Shortcuts Overlay */}
      <KeyboardShortcutsOverlay
        open={keyboardShortcutsOverlayOpen}
        onClose={() => setKeyboardShortcutsOverlayOpen(false)}
      />

      {/* Node Style Dialog */}
      <NodeStyleDialog
        open={nodeStyleDialogOpen}
        onClose={() => setNodeStyleDialogOpen(false)}
        node={selectedNode}
        onSave={(nodeId, style) => {
          const updatedNodes = nodes.map(node => {
            if (node.id === nodeId) {
              return {
                ...node,
                style: { ...node.style, ...style },
              };
            }
            return node;
          });

          if (externalNodesChange) {
            externalNodesChange(updatedNodes);
          }

          setNodeStyleDialogOpen(false);
          setSnackbarMessage(t('flow.nodeStyleUpdated') || 'Node style updated');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        }}
      />

      {/* Edge Style Dialog */}
      <EdgeStyleDialog
        open={edgeStyleDialogOpen}
        onClose={() => setEdgeStyleDialogOpen(false)}
        edge={selectedEdge}
        onSave={(edgeId, style) => {
          const updatedEdges = edges.map(edge => {
            if (edge.id === edgeId) {
              return {
                ...edge,
                style: { ...edge.style, ...style },
                animated: style.animated,
                label: style.label,
                type: style.type as EdgeType | undefined,
              };
            }
            return edge;
          });

          if (externalEdgesChange) {
            externalEdgesChange(updatedEdges as Edge[]);
          }

          setEdgeStyleDialogOpen(false);
          setSnackbarMessage(t('flow.edgeStyleUpdated') || 'Edge style updated');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        }}
      />

      {/* Enhanced Mini Map - Repositioned to avoid overlaps */}
      {showMiniMap && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 80, // Increased to avoid overlap with controls
            left: 20,
            zIndex: 5,
            width: 200,
            height: 150,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 8, // Increased for better visual appearance
            overflow: 'hidden',
            boxShadow: theme.shadows[3],
          }}
        >
          <EnhancedMiniMap
            nodes={nodes}
            edges={edges}
            onNodeClick={(nodeId: string) => {
              const node = nodes.find(n => n.id === nodeId);
              if (node) {
                setSelectedNode(node);
                // Center the view on the selected node
                reactFlowInstance?.fitView({
                  padding: 0.5,
                  includeHiddenNodes: false,
                  nodes: [node],
                });
              }
            }}
          />
        </Box>
      )}

      {/* Enhanced Zoom Controls */}
      <EnhancedZoomControls
        zoomIn={() => reactFlowInstance?.zoomIn()}
        zoomOut={() => reactFlowInstance?.zoomOut()}
        fitView={() => reactFlowInstance?.fitView({ padding: 0.2 })}
        zoomLevel={zoomLevel}
        onZoomChange={(zoom: number) => {
          setZoomLevel(zoom);
          reactFlowInstance?.zoomTo(zoom);
        }}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        showMiniMap={showMiniMap}
        onToggleMiniMap={() => setShowMiniMap(!showMiniMap)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />

      {/* Linked Nodes Highlight */}
      <LinkedNodesHighlight
        nodes={nodes}
        edges={edges}
        linkedNodeIds={linkedNodeIds}
        nodePositions={nodePositions}
        onHighlightComplete={() => setLinkedNodeIds([])}
      />

      {/* Enhanced Controls Panel */}
      <EnhancedControlsPanel
        onAddNode={() => addNode(NodeType.IDEA)}
        onDelete={() => {
          if (selectedNode) {
            handleNodeDeleteRequest(selectedNode.id);
          }
        }}
        onSave={saveFlow}
        onUndo={() => console.log('Undo')}
        onRedo={() => console.log('Redo')}
        onCopy={() => console.log('Copy')}
        onPaste={() => console.log('Paste')}
        onCut={() => console.log('Cut')}
        onOpenNodeStyle={() => {
          if (selectedNode) {
            setNodeStyleDialogOpen(true);
          } else {
            setSnackbarMessage(t('flow.selectNodeFirst') || 'Please select a node first');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
          }
        }}
        onOpenEdgeStyle={() => {
          // Find if there's a selected edge
          const selectedEdges = edges.filter(edge => edge.selected);
          if (selectedEdges.length > 0) {
            setSelectedEdge(selectedEdges[0]);
            setEdgeStyleDialogOpen(true);
          } else {
            setSnackbarMessage(t('flow.selectEdgeFirst') || 'Please select an edge first');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
          }
        }}
        onOpenSettings={() => {
          // Open settings dialog
          console.log('Open settings');
        }}
        hasSelection={!!selectedNode}
        canUndo={false}
        canRedo={false}
        hasCopiedItems={false}
      />
    </Box>
  );
});



// Add type definition for the global API
declare global {
  interface Window {
    brainstormFlowApi?: {
      zoomIn: () => void;
      zoomOut: () => void;
      fitView: () => void;
      addNode: (type?: NodeType) => void;
      saveFlow: () => void;
    };
  }
}

// Export the component with performance monitoring
export default EnhancedBrainstormFlow;
