import { useEffect } from 'react';
import { ReactFlowInstance, useReactFlow } from 'reactflow';
import { getLayoutedElements } from '../utils/autoLayout';

interface UseKeyboardShortcutsProps {
  reactFlowInstance: ReactFlowInstance | null;
  saveCurrentState: () => void;
  removeNode: (id: string) => void;
  nodeSpacing: number;
}

export const useKeyboardShortcuts = ({
  reactFlowInstance,
  saveCurrentState,
  removeNode,
  nodeSpacing,
}: UseKeyboardShortcutsProps) => {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Save - Ctrl+S
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        saveCurrentState();
      }
      
      // Auto-layout - Ctrl+L
      if (event.ctrlKey && event.key === 'l') {
        event.preventDefault();
        if (reactFlowInstance) {
          const { nodes, edges } = getLayoutedElements(
            getNodes(),
            getEdges(),
            'TB',
            nodeSpacing
          );
          setNodes(nodes);
          setEdges(edges);
          setTimeout(() => reactFlowInstance.fitView(), 50);
        }
      }

      // Delete - Del
      if (event.key === 'Delete') {
        const selectedNodes = getNodes().filter(node => node.selected);
        selectedNodes.forEach(node => removeNode(node.id));
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [reactFlowInstance, getNodes, getEdges, setNodes, setEdges, removeNode, saveCurrentState, nodeSpacing]);
};
