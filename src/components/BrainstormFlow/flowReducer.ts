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
  | { type: 'SET_SHOW_CHAT'; show: boolean };

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
        ...(action.message && { snackbarMessage: action.message }),
        ...(action.severity && { snackbarSeverity: action.severity }),
      };
    case 'SET_DELETE_CONFIRM':
      return {
        ...state,
        deleteConfirmOpen: action.open,
        ...(action.nodeId !== undefined && { nodeToDelete: action.nodeId }),
      };
    case 'SET_SHOW_CHAT':
      return { ...state, showChat: action.show };
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
};
