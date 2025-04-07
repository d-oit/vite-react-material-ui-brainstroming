import { RefObject, useCallback, useEffect, useRef } from 'react';

import type { Node } from '../types/models';

interface UseFocusManagementProps {
  containerRef: RefObject<HTMLDivElement>;
  nodes: Node[];
  onFocusChange?: (nodeId: string | null) => void;
}

export const useFocusManagement = ({
  containerRef,
  nodes,
  onFocusChange,
}: UseFocusManagementProps) => {
  const lastFocusedNodeRef = useRef<string | null>(null);

  const announceFocusChange = useCallback(
    (message: string) => {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('class', 'sr-only');
      announcement.textContent = message;

      const container = containerRef.current;
      if (container) {
        container.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
      }
    },
    [containerRef]
  );

  const handleFocusIn = useCallback(
    (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      const nodeId = target.getAttribute('data-node-id');

      if (typeof nodeId === 'string' && nodeId.length > 0) {
        const node = nodes.find((n: Node) => n.id === nodeId);
        if (node) {
          lastFocusedNodeRef.current = nodeId;
          onFocusChange?.(nodeId);

          const title = node.data.title || 'Untitled';
          const type = node.type;
          announceFocusChange(`Focused on ${type} node: ${title}`);

          // Update ARIA attributes
          const allNodes = containerRef.current?.querySelectorAll('[data-node-id]');
          allNodes?.forEach((el: Element) => {
            el.setAttribute('aria-selected', 'false');
            el.setAttribute('tabindex', '-1');
          });

          target.setAttribute('aria-selected', 'true');
          target.setAttribute('tabindex', '0');
        }
      }
    },
    [nodes, onFocusChange, announceFocusChange, containerRef]
  );

  const handleFocusOut = useCallback(
    (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      const relatedTarget = event.relatedTarget as HTMLElement | null;

      // Only clear focus if moving outside the flow container
      const container = containerRef.current;
      const isOutsideContainer = !container || !container.contains(relatedTarget);

      if (isOutsideContainer) {
        target.setAttribute('aria-selected', 'false');
        lastFocusedNodeRef.current = null;
        onFocusChange?.(null);
      }
    },
    [containerRef, onFocusChange]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set up initial accessibility attributes
    nodes.forEach((node: Node, index: number) => {
      const element = container.querySelector(`[data-node-id="${node.id}"]`);
      if (element) {
        element.setAttribute('role', 'button');
        element.setAttribute('aria-selected', 'false');
        element.setAttribute('tabindex', index === 0 ? '0' : '-1');
        element.setAttribute('aria-label', `${node.type} node: ${node.data.title || 'Untitled'}`);
      }
    });

    container.addEventListener('focusin', handleFocusIn);
    container.addEventListener('focusout', handleFocusOut);

    return () => {
      container.removeEventListener('focusin', handleFocusIn);
      container.removeEventListener('focusout', handleFocusOut);
    };
  }, [containerRef, nodes, handleFocusIn, handleFocusOut]);

  return {
    lastFocusedNodeId: lastFocusedNodeRef.current,
    announceFocusChange,
  };
};
