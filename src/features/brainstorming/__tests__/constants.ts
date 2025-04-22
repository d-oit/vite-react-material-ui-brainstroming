import type { BrainstormSession, NodeType } from '../types'

export const DEFAULT_PROMPTS = [
	'brainstorming.prompts.generateIdeas',
	'brainstorming.prompts.analyze',
	'brainstorming.prompts.improve',
	'brainstorming.prompts.organize',
] as const

export const TEST_NODE_TYPE: NodeType = 'idea'

export const MOCK_SESSION: BrainstormSession = {
	id: 'test-session',
	projectId: 'test-project',
	templateId: 'test-template',
	nodes: [
		{
			id: 'node-1',
			type: TEST_NODE_TYPE,
			content: 'Test Idea 1',
			position: { x: 100, y: 100 },
		},
		{
			id: 'node-2',
			type: TEST_NODE_TYPE,
			content: 'Test Idea 2',
			position: { x: 300, y: 100 },
		},
	],
	history: [],
	created: new Date('2025-01-01'),
	modified: new Date('2025-01-01'),
	isQuick: false,
}

export const MOCK_QUICK_SESSION: BrainstormSession = {
	...MOCK_SESSION,
	id: 'test-quick-session',
	nodes: [
		{
			id: 'quick-node-1',
			type: TEST_NODE_TYPE,
			content: 'Quick Idea 1',
			position: { x: 0, y: 0 },
		},
	],
	isQuick: true,
}

export const MOCK_RESPONSE_DELAY = 1000

export const TEST_PROJECT_ID = 'test-project'

export const MOCK_NODE_BASE = {
	id: 'test-id',
	type: TEST_NODE_TYPE,
	content: 'Test Content',
	position: { x: 0, y: 0 },
}
