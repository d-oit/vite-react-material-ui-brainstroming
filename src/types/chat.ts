import type { NodeData, NodeType } from './index';

/**
 * Chat message structure
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

/**
 * Structure for a node suggestion from the chat
 */
export interface NodeSuggestion {
  title: string;
  content: string;
  type: NodeType;
  tags?: string[];
}

/**
 * Structure for a complete set of node suggestions from the chat
 */
export interface ChatSuggestion {
  id: string;
  nodes: NodeSuggestion[];
  originalMessage: string;
  timestamp: string;
  accepted: boolean;
}

/**
 * Create a node suggestion from node data
 */
export function createNodeSuggestionFromNodeData(
  nodeData: NodeData,
  type: NodeType
): NodeSuggestion {
  return {
    title: nodeData.title || nodeData.label || '',
    content: nodeData.content || '',
    type,
    tags: nodeData.tags || [],
  };
}

/**
 * Create a node data from node suggestion
 */
export function createNodeDataFromSuggestion(suggestion: NodeSuggestion): NodeData {
  return {
    id: crypto.randomUUID(),
    title: suggestion.title,
    content: suggestion.content,
    tags: suggestion.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    label: suggestion.title, // For backward compatibility
  };
}
