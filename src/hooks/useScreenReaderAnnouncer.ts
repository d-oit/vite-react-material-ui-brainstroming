import { useState, useCallback } from 'react'

interface UseScreenReaderAnnouncerOptions {
	maxMessages?: number
	politeness?: 'polite' | 'assertive'
}

/**
 * A hook that manages screen reader announcements.
 *
 * @param options - Configuration options
 * @returns An object with the current messages and functions to announce and clear messages
 */
export function useScreenReaderAnnouncer(options: UseScreenReaderAnnouncerOptions = {}) {
	const { maxMessages = 5, politeness = 'polite' } = options
	const [messages, setMessages] = useState<string[]>([])

	/**
	 * Announce a message to screen readers
	 *
	 * @param message - The message to announce
	 * @param priority - If true, uses 'assertive' politeness, otherwise uses the default politeness
	 */
	const announce = useCallback(
		(message: string, priority = false) => {
			if (!message) return

			setMessages((prevMessages) => {
				// Add new message to the end of the array
				const newMessages = [...prevMessages, message]

				// Limit the number of messages
				return newMessages.slice(-maxMessages)
			})

			// If the message is a priority, log it to the console as well
			if (priority) {
				console.log(`[Screen Reader Announcement] ${message}`)
			}
		},
		[maxMessages],
	)

	/**
	 * Clear all messages
	 */
	const clearMessages = useCallback(() => {
		setMessages([])
	}, [])

	return {
		messages,
		announce,
		clearMessages,
		politeness,
	}
}

export default useScreenReaderAnnouncer
