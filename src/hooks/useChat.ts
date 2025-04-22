import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { sendMessage } from '@/lib/openRouterService'
import type { ChatMessage } from '@/types'

export const useChat = () => {
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	// Add a user message
	const addUserMessage = useCallback(
		async (content: string): Promise<void> => {
			if (!content.trim()) return

			// Create user message
			const userMessage: ChatMessage = {
				id: uuidv4(),
				role: 'user',
				content,
				timestamp: new Date().toISOString(),
			}

			// Add user message to chat
			setMessages((prev) => [...prev, userMessage])
			setIsLoading(true)
			setError(null)

			try {
				// Send message to OpenRouter API
				const assistantMessage = await sendMessage([...messages, userMessage])

				// Add assistant message to chat
				setMessages((prev) => [...prev, assistantMessage])
			} catch (err) {
				console.error('Error in chat:', err)
				setError('Failed to get response from assistant')
			} finally {
				setIsLoading(false)
			}
		},
		[messages],
	)

	// Clear chat history
	const clearChat = useCallback(() => {
		setMessages([])
		setError(null)
	}, [])

	return {
		messages,
		isLoading,
		error,
		addUserMessage,
		clearChat,
	}
}
