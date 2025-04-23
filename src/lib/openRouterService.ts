import type { ChatMessage } from '@/types'

// import loggerService from '../services/LoggerService'; // Unused
import { isValidUrl, isHttpsUrl, sanitizeUrl } from '../utils/urlValidation'

interface OpenRouterResponse {
	id: string
	choices: {
		message: {
			role: string
			content: string
		}
		finish_reason: string
	}[]
}

/**
 * Validate OpenRouter API URL
 * @returns Object with validation result and error message
 */
export const validateOpenRouterApiUrl = (): { isValid: boolean; message: string } => {
	try {
		const apiUrl = import.meta.env.VITE_OPENROUTER_API_URL

		if (!apiUrl) {
			return {
				isValid: false,
				message: 'OpenRouter API URL not configured. Please set VITE_OPENROUTER_API_URL in your .env file.',
			}
		}

		if (!isValidUrl(apiUrl)) {
			return { isValid: false, message: 'Invalid OpenRouter API URL format' }
		}

		if (!isHttpsUrl(apiUrl)) {
			return { isValid: false, message: 'OpenRouter API URL must use HTTPS for security' }
		}

		return { isValid: true, message: '' }
	} catch (error) {
		return {
			isValid: false,
			message: `Error validating OpenRouter API URL: ${error instanceof Error ? error.message : String(error)}`,
		}
	}
}

/**
 * Check if OpenRouter API is configured correctly
 * @returns True if configured, false otherwise
 */
export const isOpenRouterConfigured = (): boolean => {
	const result = validateOpenRouterApiUrl()
	return result.isValid
}

// Send message to OpenRouter API
export const sendMessage = async (messages: ChatMessage[]): Promise<ChatMessage> => {
	try {
		// Validate API URL
		const validation = validateOpenRouterApiUrl()

		if (!validation.isValid) {
			throw new Error(validation.message)
		}

		const apiUrl = sanitizeUrl(import.meta.env.VITE_OPENROUTER_API_URL)

		if (!apiUrl) {
			throw new Error('OpenRouter API URL is invalid after sanitization. Please check your configuration.')
		}

		// Format messages for OpenRouter API
		const formattedMessages = messages.map((message) => ({
			role: message.role,
			content: message.content,
		}))

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				messages: formattedMessages,
				model: 'anthropic/claude-3-opus', // Default model, can be changed
				max_tokens: 1000,
			}),
		})

		if (!response.ok) {
			throw new Error(`OpenRouter API error: ${response.statusText}`)
		}

		const data: OpenRouterResponse = await response.json()

		// Create new message from response
		const newMessage: ChatMessage = {
			id: data.id,
			role: 'assistant',
			content: data.choices[0]?.message.content || 'No response from assistant',
			timestamp: new Date().toISOString(),
		}

		return newMessage
	} catch (error) {
		console.error('Error sending message to OpenRouter:', error)

		// Return error message
		return {
			id: `error-${Date.now()}`,
			role: 'assistant',
			content: 'Error: Unable to get a response from the assistant. Please try again later.',
			timestamp: new Date().toISOString(),
		}
	}
}
