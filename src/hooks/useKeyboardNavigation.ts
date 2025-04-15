import type { RefObject } from 'react';
import { useCallback, useEffect } from 'react';

import type { Node } from '../types/models';

interface NodeElement extends HTMLElement {
  dataset: {
    nodeId?: string;
    nodeType?: string;
    nodeTitle?: string;
  };
}

export const useKeyboardNavigation = (
  containerRef: RefObject<HTMLDivElement>,
  nodes: Node[],
  onNodeSelect?: (nodeId: string) => void
) => {
  const findNodeElements = useCallback(() => {
    if (containerRef.current === null) return [];
    return Array.from(containerRef.current.querySelectorAll<NodeElement>('.react-flow__node'));
  }, []);

  const updateNodeSelection = useCallback(
    (nodeElement: NodeElement) => {
      const nodeId = nodeElement.dataset.nodeId;
      if (typeof nodeId !== 'string' || nodeId.length === 0) return;

      // Update ARIA attributes
      findNodeElements().forEach(el => {
        el.setAttribute('aria-selected', 'false');
        el.setAttribute('tabindex', '-1');
      });

      nodeElement.setAttribute('aria-selected', 'true');
      nodeElement.setAttribute('tabindex', '0');
      nodeElement.focus();

      // Smooth scroll into view
      nodeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // Announce to screen readers
      const title =
        typeof nodeElement.dataset.nodeTitle === 'string'
          ? nodeElement.dataset.nodeTitle
          : 'Untitled node';
      const type =
        typeof nodeElement.dataset.nodeType === 'string'
          ? nodeElement.dataset.nodeType
          : 'unknown type';
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.textContent = `Selected ${type} node: ${title}`;
      containerRef.current?.appendChild(announcement);
      setTimeout(() => announcement.remove(), 1000);

      // Trigger callback
      onNodeSelect?.(nodeId);
    },
    [containerRef, onNodeSelect, findNodeElements] // Added findNodeElements dependency
  );

  const handleKeyboardNavigation = useCallback(
    (e: KeyboardEvent) => {
      const nodeElements = findNodeElements();
      if (nodeElements.length === 0) return;

      const currentElement = document.activeElement as NodeElement;
      const currentIndex = nodeElements.findIndex(el => el === currentElement);
      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
          nextIndex = Math.min(currentIndex + 1, nodeElements.length - 1);
          break;
        case 'ArrowLeft':
          nextIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'ArrowUp':
          // Simplified logic for example, might need adjustment based on layout
          nextIndex = Math.max(currentIndex - 1, 0); // Adjust based on visual layout if needed
          break;
        case 'ArrowDown':
          // Simplified logic for example, might need adjustment based on layout
          nextIndex = Math.min(currentIndex + 1, nodeElements.length - 1); // Adjust based on visual layout if needed
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = nodeElements.length - 1;
          break;
        case ' ':
        case 'Enter':
          if (
            typeof currentIndex === 'number' &&
            currentIndex >= 0 &&
            currentIndex < nodeElements.length
          ) {
            e.preventDefault();
            updateNodeSelection(nodeElements[currentIndex]);
          }
          return;
        default:
          return;
      }

      if (
        typeof nextIndex === 'number' &&
        typeof currentIndex === 'number' &&
        nextIndex !== currentIndex &&
        nextIndex >= 0 &&
        nextIndex < nodeElements.length
      ) {
        e.preventDefault();
        updateNodeSelection(nodeElements[nextIndex]);
      }
    },
    [findNodeElements, updateNodeSelection]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;

    // Set up initial accessibility attributes
    findNodeElements().forEach((nodeElement, index) => {
      const node = nodes.find(n => n.id === nodeElement.dataset.nodeId);
      if (node) {
        nodeElement.setAttribute('role', 'button');
        nodeElement.setAttribute('aria-selected', 'false');
        nodeElement.setAttribute('tabindex', index === 0 ? '0' : '-1');
        nodeElement.dataset.nodeType = node.type;
        nodeElement.dataset.nodeTitle = node.data.title;
        nodeElement.setAttribute('aria-label', `${node.type} node: ${node.data.title}`);
      }
    });

    container.addEventListener('keydown', handleKeyboardNavigation);
    return () => container.removeEventListener('keydown', handleKeyboardNavigation);
  }, [containerRef, nodes, findNodeElements, handleKeyboardNavigation]);

  // Return the function needed by the component
  return { updateNodeSelection }; // Added return statement
};
