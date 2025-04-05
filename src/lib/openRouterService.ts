import { ChatMessage } from '@/types';

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

// Send message to OpenRouter API
export const sendMessage = async (messages: ChatMessage[]): Promise<ChatMessage> => {
  try {
    const apiUrl = import.meta.env.VITE_OPENROUTER_API_URL;
    
    if (!apiUrl) {
      throw new Error('OpenRouter API URL not configured. Please set VITE_OPENROUTER_API_URL in your .env file.');
    }
    
    // Format messages for OpenRouter API
    const formattedMessages = messages.map(message => ({
      role: message.role,
      content: message.content,
    }));
    
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
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }
    
    const data: OpenRouterResponse = await response.json();
    
    // Create new message from response
    const newMessage: ChatMessage = {
      id: data.id,
      role: 'assistant',
      content: data.choices[0]?.message.content || 'No response from assistant',
      timestamp: new Date().toISOString(),
    };
    
    return newMessage;
  } catch (error) {
    console.error('Error sending message to OpenRouter:', error);
    
    // Return error message
    return {
      id: `error-${Date.now()}`,
      role: 'assistant',
      content: `Error: Unable to get a response from the assistant. Please try again later.`,
      timestamp: new Date().toISOString(),
    };
  }
};
