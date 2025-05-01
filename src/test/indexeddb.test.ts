import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { mockIndexedDB } from './test-utils'

describe('IndexedDB Mock', () => {
	let cleanup: () => void

	beforeEach(() => {
		cleanup = mockIndexedDB()
	})

	afterEach(() => {
		cleanup()
	})

	it('should mock opening a database', () => {
		return new Promise<void>((resolve, reject) => {
			const request = window.indexedDB.open('testDB', 1)

			request.onerror = () => {
				reject(request.error)
			}

			request.onsuccess = () => {
				const db = request.result
				expect(db.name).toBe('testDB')
				expect(db.version).toBe(1)
				db.close()
				resolve()
			}
		})
	})

	it('should mock deleting a database', () => {
		return new Promise<void>((resolve, reject) => {
			const request = window.indexedDB.deleteDatabase('testDB')

			request.onerror = () => {
				reject(request.error)
			}

			request.onsuccess = () => {
				expect(request.result).toBeNull()
				resolve()
			}
		})
	})

	it('should implement the cmp method', () => {
		expect(window.indexedDB.cmp(1, 2)).toBe(-1)
		expect(window.indexedDB.cmp(2, 1)).toBe(1)
		expect(window.indexedDB.cmp(1, 1)).toBe(0)
	})

	it('should implement the databases method', async () => {
		const databases = await window.indexedDB.databases()
		expect(Array.isArray(databases)).toBe(true)
	})
})