import { NodeType } from '../../../types/enums'

import CustomNodeComponent from './CustomNode'

export const nodeTypes = {
	[NodeType.IDEA]: CustomNodeComponent,
	[NodeType.TASK]: CustomNodeComponent,
	[NodeType.RESOURCE]: CustomNodeComponent,
	[NodeType.NOTE]: CustomNodeComponent,
} as const
