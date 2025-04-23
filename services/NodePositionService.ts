import type { CanvasElement, CanvasOverflowService } from './CanvasOverflowService'
import { SettingsService } from './SettingsService'

export interface NodePosition {
  id: string;
  x: number;
  y: number;
}

export interface DragStartEvent {
  id: string;
  initialX: number;
  initialY: number;
}

export interface DragUpdateEvent {
  id: string;
  deltaX: number;
  deltaY: number;
}

export class NodePositionService {
	private nodes: Map<string, NodePosition>
	private canvasService: CanvasOverflowService
	private settingsService: SettingsService
	private draggedNodeId: string | null = null
	private onPositionUpdate?: (nodeId: string, position: NodePosition) => void

	constructor(canvasService: CanvasOverflowService) {
		this.nodes = new Map()
		this.canvasService = canvasService
		this.settingsService = SettingsService.getInstance()
	}

	public registerNode(id: string, initialPosition: NodePosition): void {
		this.nodes.set(id, initialPosition)
		this.updateCanvasElements()
	}

	public unregisterNode(id: string): void {
		this.nodes.delete(id)
		this.updateCanvasElements()
	}

	public handleDragStart(event: DragStartEvent): void {
		this.draggedNodeId = event.id
	}

	public handleDragUpdate(event: DragUpdateEvent): void {
		if (!this.draggedNodeId || this.draggedNodeId !== event.id) {
			return
		}

		const currentPosition = this.nodes.get(event.id)
		if (!currentPosition) {
			return
		}

		const newPosition = {
			...currentPosition,
			x: currentPosition.x + event.deltaX,
			y: currentPosition.y + event.deltaY,
		}

		const settings = this.settingsService.getSetting('canvas')
		if (settings.snapToGrid) {
			newPosition.x = Math.round(newPosition.x / settings.gridSize) * settings.gridSize
			newPosition.y = Math.round(newPosition.y / settings.gridSize) * settings.gridSize
		}

		this.nodes.set(event.id, newPosition)
		this.updateCanvasElements()

		if (this.onPositionUpdate) {
			this.onPositionUpdate(event.id, newPosition)
		}
	}

	public handleDragEnd(): void {
		this.draggedNodeId = null
	}

	public setOnPositionUpdate(callback: (nodeId: string, position: NodePosition) => void): void {
		this.onPositionUpdate = callback
	}

	private updateCanvasElements(): void {
		const elements: CanvasElement[] = Array.from(this.nodes.values()).map((node) => ({
			x: node.x,
			y: node.y,
			width: 200,
			height: 100,
		}))

		this.canvasService.updateElements(elements)
	}

	public getNodePosition(id: string): NodePosition | undefined {
		return this.nodes.get(id)
	}

	public getAllNodePositions(): NodePosition[] {
		return Array.from(this.nodes.values())
	}
}
