import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';

const NODE_WIDTH = 250;
const NODE_HEIGHT = 150;
const HORIZONTAL_SPACING = 100;
const VERTICAL_SPACING = 100;

type LayoutDirection = 'TB' | 'LR';
type LayoutAlign = 'UL' | 'DL' | 'UR' | 'DR';
type LayoutRanker = 'network-simplex' | 'tight-tree' | 'longest-path';

interface LayoutOptions {
  direction?: LayoutDirection;
  align?: LayoutAlign;
  ranker?: LayoutRanker;
  nodesep?: number;
  edgesep?: number;
  ranksep?: number;
}

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): LayoutResult {
  const {
    direction = 'TB',
    align = 'UL',
    ranker = 'network-simplex',
    nodesep = HORIZONTAL_SPACING,
    edgesep = 10,
    ranksep = VERTICAL_SPACING,
  } = options;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  dagreGraph.setGraph({
    rankdir: direction,
    align,
    ranker,
    nodesep,
    edgesep,
    ranksep,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return {
    nodes: layoutedNodes,
    edges,
  };
}
