import { expect } from 'vitest'

import type { BrainstormSession, BrainstormNode } from '../types'

interface CustomMatchers<R = unknown> {
	toBeValidSession(): R
	toContainNode(node: Partial<BrainstormNode>): R
}

declare module 'vitest' {
	interface Assertion extends CustomMatchers {}
	interface AsymmetricMatchersContaining extends CustomMatchers {}
}

const toBeValidSession = function (received: Partial<BrainstormSession>) {
	const requiredFields = ['nodes', 'isQuick']
	const hasRequiredFields = requiredFields.every((field) => field in received)

	return {
		message: () =>
			hasRequiredFields
				? 'Expected session not to have required fields'
				: `Expected session to have required fields: ${requiredFields.join(', ')}`,
		pass: hasRequiredFields,
	}
}

const toContainNode = function (received: Partial<BrainstormSession>, node: Partial<BrainstormNode>) {
	const nodes = received.nodes || []
	const hasNode = nodes.some((n) =>
		Object.entries(node).every(([key, value]) => n[key as keyof BrainstormNode] === value),
	)

	return {
		message: () =>
			hasNode
				? `Expected session not to contain node matching ${JSON.stringify(node)}`
				: `Expected session to contain node matching ${JSON.stringify(node)}`,
		pass: hasNode,
	}
}

expect.extend({
	toBeValidSession,
	toContainNode,
})
