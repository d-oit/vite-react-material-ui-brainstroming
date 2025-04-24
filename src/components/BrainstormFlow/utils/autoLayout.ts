import dagre from 'dagre';
import { Edge } from 'reactflow';
import { NodeType } from '../../../types/enums';
import type { CustomNodeType } from '../types';

interface LayoutOptions {
  direction?: 'TB' | 'LR';
  spacing?: number;
}

const DEFAULT_OPTIONS: LayoutOptions = {
  direction: 'TB',
  spacing: 50,
};

export const getLayoutedElements = (
  nodes: CustomNodeType[],
  edges: Edge[],
  options: LayoutOptions = DEFAULT_OPTIONS,
) => {
  const { direction = 'TB', spacing = 50 } = options;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, ranksep: spacing, nodesep: spacing });

  // Add nodes to dagre
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: 150, // Default width
      height: 50, // Default height
    });
  });

  // Add edges to dagre
  edges.forEach((edge) => {
    if (edge.source && edge.target) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Retrieve positions while preserving node type and data
  const layoutedNodes: CustomNodeType[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 75, // half of default width
        y: nodeWithPosition.y - 25, // half of default height
      },
      type: node.type || NodeType.IDEA, // Ensure node type is preserved
    };
  });

  return {
    nodes: layoutedNodes,
    edges,
  };
};
