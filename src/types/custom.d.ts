declare module '../../hooks/useKeyboardNavigation' {
  export function useKeyboardNavigation(
    containerRef: React.RefObject<HTMLDivElement>,
    nodes: any[],
    onNodeSelect?: (nodeId: string) => void
  ): { updateNodeSelection: (nodeElement: HTMLElement) => void };
}

declare module '../../hooks/useFocusManagement' {
  export function useFocusManagement(props: {
    containerRef: React.RefObject<HTMLDivElement>;
    nodes: any[];
    onFocusChange?: (nodeId: string | null) => void;
  }): { lastFocusedNodeId: string | null; announceFocusChange: (message: string) => void };
}

declare module '../../hooks/useS3Sync' {
  export function useS3Sync(props: { projectId: string; syncSettings?: any; data: any }): {
    sync: () => Promise<void>;
    syncStatus: 'idle' | 'syncing' | 'success' | 'error';
    lastSyncTime: string | null;
  };
}
