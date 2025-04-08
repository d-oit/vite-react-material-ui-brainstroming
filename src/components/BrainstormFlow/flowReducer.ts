import type { Node, Edge } from '../../types';

export interface FlowState {
  nodes: Node[];
  edges: Edge[];
  nodeEditOpen: boolean;
  selectedNode: Node | null;
  snackbarOpen: boolean;
  snackbarMessage: string;
  snackbarSeverity: 'success' | 'error' | 'info';
  deleteConfirmOpen: boolean;
  nodeToDelete: string | null;
  showChat: boolean;

  // Context menu states
  nodeContextMenuOpen: boolean;
  nodeContextMenuPosition: { x: number; y: number } | null;
  nodeContextMenuNode: Node | null;

  edgeContextMenuOpen: boolean;
  edgeContextMenuPosition: { x: number; y: number } | null;
  edgeContextMenuEdge: Edge | null;

  canvasContextMenuOpen: boolean;
  canvasContextMenuPosition: { x: number; y: number } | null;

  // Undo/Redo states
  undoStack: Array<{ nodes: Node[]; edges: Edge[] }>;
  redoStack: Array<{ nodes: Node[]; edges: Edge[] }>;

  // Grid state
  showGrid: boolean;

  // Clipboard state
  clipboard: { nodes: Node[]; edges: Edge[] } | null;
}

export type FlowAction =
  | { type: 'SET_NODES'; nodes: Node[] }
  | { type: 'SET_EDGES'; edges: Edge[] }
  | { type: 'SET_SELECTED_NODE'; node: Node | null }
  | { type: 'SET_NODE_EDIT_OPEN'; open: boolean }
  | {
      type: 'SET_SNACKBAR';
      open: boolean;
      message?: string;
      severity?: 'success' | 'error' | 'info';
    }
  | { type: 'SET_DELETE_CONFIRM'; open: boolean; nodeId?: string | null }
  | { type: 'SET_SHOW_CHAT'; show: boolean }

  // Context menu actions
  | { type: 'OPEN_NODE_CONTEXT_MENU'; node: Node; position: { x: number; y: number } }
  | { type: 'CLOSE_NODE_CONTEXT_MENU' }
  | { type: 'OPEN_EDGE_CONTEXT_MENU'; edge: Edge; position: { x: number; y: number } }
  | { type: 'CLOSE_EDGE_CONTEXT_MENU' }
  | { type: 'OPEN_CANVAS_CONTEXT_MENU'; position: { x: number; y: number } }
  | { type: 'CLOSE_CANVAS_CONTEXT_MENU' }

  // Undo/Redo actions
  | { type: 'PUSH_UNDO_STACK'; state: { nodes: Node[]; edges: Edge[] } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR_REDO_STACK' }

  // Grid actions
  | { type: 'TOGGLE_GRID' }

  // Clipboard actions
  | { type: 'COPY_TO_CLIPBOARD'; nodes: Node[]; edges: Edge[] }
  | { type: 'PASTE_FROM_CLIPBOARD'; position: { x: number; y: number } };

export const flowReducer = (state: FlowState, action: FlowAction): FlowState => {
  switch (action.type) {
    case 'SET_NODES':
      return { ...state, nodes: action.nodes };
    case 'SET_EDGES':
      return { ...state, edges: action.edges };
    case 'SET_SELECTED_NODE':
      return { ...state, selectedNode: action.node };
    case 'SET_NODE_EDIT_OPEN':
      return { ...state, nodeEditOpen: action.open };
    case 'SET_SNACKBAR':
      return {
        ...state,
        snackbarOpen: action.open,
        ...(action.message !== undefined && action.message !== null && action.message !== ''
          ? { snackbarMessage: action.message }
          : {}),
        ...(action.severity !== undefined ? { snackbarSeverity: action.severity } : {}),
      };
    case 'SET_DELETE_CONFIRM':
      return {
        ...state,
        deleteConfirmOpen: action.open,
        ...(action.nodeId !== undefined && { nodeToDelete: action.nodeId }),
      };
    case 'SET_SHOW_CHAT':
      return { ...state, showChat: action.show };

    // Context menu cases
    case 'OPEN_NODE_CONTEXT_MENU':
      return {
        ...state,
        nodeContextMenuOpen: true,
        nodeContextMenuPosition: action.position,
        nodeContextMenuNode: action.node,
        // Close other context menus
        edgeContextMenuOpen: false,
        canvasContextMenuOpen: false,
      };
    case 'CLOSE_NODE_CONTEXT_MENU':
      return {
        ...state,
        nodeContextMenuOpen: false,
        nodeContextMenuPosition: null,
      };
    case 'OPEN_EDGE_CONTEXT_MENU':
      return {
        ...state,
        edgeContextMenuOpen: true,
        edgeContextMenuPosition: action.position,
        edgeContextMenuEdge: action.edge,
        // Close other context menus
        nodeContextMenuOpen: false,
        canvasContextMenuOpen: false,
      };
    case 'CLOSE_EDGE_CONTEXT_MENU':
      return {
        ...state,
        edgeContextMenuOpen: false,
        edgeContextMenuPosition: null,
      };
    case 'OPEN_CANVAS_CONTEXT_MENU':
      return {
        ...state,
        canvasContextMenuOpen: true,
        canvasContextMenuPosition: action.position,
        // Close other context menus
        nodeContextMenuOpen: false,
        edgeContextMenuOpen: false,
      };
    case 'CLOSE_CANVAS_CONTEXT_MENU':
      return {
        ...state,
        canvasContextMenuOpen: false,
        canvasContextMenuPosition: null,
      };

    // Undo/Redo cases
    case 'PUSH_UNDO_STACK':
      return {
        ...state,
        undoStack: [...state.undoStack, action.state],
        // Clear redo stack when a new action is performed
        redoStack: [],
      };
    case 'UNDO':
      if (state.undoStack.length === 0) return state;

      // Use block scoping to avoid variable name collisions
      {
        const lastState = state.undoStack[state.undoStack.length - 1];
        const newUndoStack = state.undoStack.slice(0, -1);

        return {
          ...state,
          nodes: lastState.nodes,
          edges: lastState.edges,
          undoStack: newUndoStack,
          redoStack: [...state.redoStack, { nodes: state.nodes, edges: state.edges }],
        };
      }
    case 'REDO':
      if (state.redoStack.length === 0) return state;

      // Use block scoping to avoid variable name collisions
      {
        const nextState = state.redoStack[state.redoStack.length - 1];
        const newRedoStack = state.redoStack.slice(0, -1);

        return {
          ...state,
          nodes: nextState.nodes,
          edges: nextState.edges,
          undoStack: [...state.undoStack, { nodes: state.nodes, edges: state.edges }],
          redoStack: newRedoStack,
        };
      }
    case 'CLEAR_REDO_STACK':
      return {
        ...state,
        redoStack: [],
      };

    // Grid cases
    case 'TOGGLE_GRID':
      return {
        ...state,
        showGrid: !state.showGrid,
      };

    // Clipboard cases
    case 'COPY_TO_CLIPBOARD':
      return {
        ...state,
        clipboard: {
          nodes: action.nodes,
          edges: action.edges,
        },
      };
    case 'PASTE_FROM_CLIPBOARD':
      if (!state.clipboard) return state;

      // Generate new IDs for pasted nodes and edges
      {
        const nodeIdMap = new Map<string, string>();
        const newNodes = state.clipboard.nodes.map(node => {
          const newId = `${node.id}-copy-${Date.now()}`;
          nodeIdMap.set(node.id, newId);

          return {
            ...node,
            id: newId,
            position: {
              x:
                node.position.x +
                (action.position.x - (state.clipboard?.nodes[0]?.position.x ?? 0)),
              y:
                node.position.y +
                (action.position.y - (state.clipboard?.nodes[0]?.position.y ?? 0)),
            },
          };
        });

        const newEdges = state.clipboard.edges
          .filter(edge => nodeIdMap.has(edge.source) && nodeIdMap.has(edge.target))
          .map(edge => ({
            ...edge,
            id: `${edge.id}-copy-${Date.now()}`,
            source: nodeIdMap.get(edge.source) ?? '',
            target: nodeIdMap.get(edge.target) ?? '',
          }));

        return {
          ...state,
          nodes: [...state.nodes, ...newNodes],
          edges: [...state.edges, ...newEdges],
        };
      }

    default:
      return state;
  }
};

export const initialFlowState: FlowState = {
  nodes: [],
  edges: [],
  nodeEditOpen: false,
  selectedNode: null,
  snackbarOpen: false,
  snackbarMessage: '',
  snackbarSeverity: 'info',
  deleteConfirmOpen: false,
  nodeToDelete: null,
  showChat: false,

  // Context menu states
  nodeContextMenuOpen: false,
  nodeContextMenuPosition: null,
  nodeContextMenuNode: null,

  edgeContextMenuOpen: false,
  edgeContextMenuPosition: null,
  edgeContextMenuEdge: null,

  canvasContextMenuOpen: false,
  canvasContextMenuPosition: null,

  // Undo/Redo states
  undoStack: [],
  redoStack: [],

  // Grid state
  showGrid: true,

  // Clipboard state
  clipboard: null,
};
