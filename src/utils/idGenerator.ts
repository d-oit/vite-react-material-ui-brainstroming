/**
 * Generates a unique identifier using a timestamp and random string
 * @returns A unique string identifier
 */
export function generateUniqueId(): string {
	const timestamp = Date.now().toString(36)
	const randomStr = Math.random().toString(36).substring(2, 8)
	return `${timestamp}-${randomStr}`
}

/**
 * Checks if an ID is valid according to our format
 * @param id The ID to validate
 * @returns True if the ID is valid, false otherwise
 */
export function isValidId(id: string): boolean {
	const pattern = /^[a-z0-9]+-[a-z0-9]+$/
	return pattern.test(id)
}
