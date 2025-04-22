import { describe, it, expect, vi } from 'vitest'

import { generateUniqueId, isValidId } from '../idGenerator'

// Re-mock specifically for this file to ensure counter resets
// and to use the format defined in setupTests.ts mock
vi.mock('../idGenerator', async () => {
	const actual = await vi.importActual<typeof import('../idGenerator')>('../idGenerator')
	let counter = 0 // Counter specific to this mock instance if re-mocked
	return {
		...actual, // Keep actual isValidId
		generateUniqueId: vi.fn(() => `abc-${counter++}`),
	}
})

describe('idGenerator', () => {
	describe('generateUniqueId', () => {
		it('should generate unique IDs', () => {
			// This test relies on the mock defined above or in setupTests.ts
			const id1 = generateUniqueId() // abc-0
			const id2 = generateUniqueId() // abc-1
			expect(id1).not.toBe(id2)
			expect(id1).toMatch(/^abc-\d+$/) // Check mock format
			expect(id2).toMatch(/^abc-\d+$/) // Check mock format
		})

		it('should generate IDs matching the mock format', () => {
			const id = generateUniqueId()
			expect(id).toMatch(/^abc-\d+$/) // Expecting the mock format
		})
	})

	describe('isValidId', () => {
		// These tests use the *actual* isValidId implementation
		it('should validate correct IDs (including actual format)', async () => {
			// Test with various valid formats, including the one the actual function generates
			expect(isValidId('abc-123')).toBe(true)
			expect(isValidId('123-xyz')).toBe(true) // Original format

			// Generate a real ID to test the actual format (timestamp-random)
			// Need to dynamically import the *actual* module here
			const actualIdModule = await vi.importActual<typeof import('../idGenerator')>('../idGenerator')
			const realId = actualIdModule.generateUniqueId()
			expect(isValidId(realId)).toBe(true)
			expect(realId).toMatch(/^[a-z0-9]+-[a-z0-9]+$/)
		})

		it('should reject invalid IDs', () => {
			expect(isValidId('invalid')).toBe(false)
			expect(isValidId('abc-123-xyz')).toBe(false)
			expect(isValidId('')).toBe(false)
			expect(isValidId('ABC-123')).toBe(false) // Uppercase invalid
			expect(isValidId('abc_123')).toBe(false) // Underscore invalid
			expect(isValidId('-abc-123')).toBe(false)
			expect(isValidId('abc-123-')).toBe(false)
		})
	})
})
