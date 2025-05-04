import { Node as ReactFlowNode } from 'reactflow'

interface S3SyncSettings {
	autoSync: boolean
	interval?: number
	retryAttempts?: number
}

interface ProjectData {
	nodes: ReactFlowNode[]
	edges: Edge[]
	metadata: {
		lastModified: string
		version: string
	}
}

declare module '../../hooks/useKeyboardNavigation' {
	export function useKeyboardNavigation(
		containerRef: React.RefObject<HTMLDivElement>,
		nodes: ReactFlowNode[],
		onNodeSelect?: (nodeId: string) => void,
	): { updateNodeSelection: (nodeElement: HTMLElement) => void }
}

declare module '../../hooks/useFocusManagement' {
	export function useFocusManagement(props: {
		containerRef: React.RefObject<HTMLDivElement>
		nodes: ReactFlowNode[]
		onFocusChange?: (nodeId: string | null) => void
	}): {
		lastFocusedNodeId: string | null
		announceFocusChange: (message: string) => void
	}
}

declare module '../../hooks/useS3Sync' {
	export function useS3Sync(props: {
		projectId: string
		syncSettings?: S3SyncSettings
		data: ProjectData
	}): {
		sync: () => Promise<void>
		syncStatus: 'idle' | 'syncing' | 'success' | 'error'
		lastSyncTime: string | null
	}
}
