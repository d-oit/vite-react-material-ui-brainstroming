import { ChatMessage } from '../types';

/**
 * Service for handling LLM chat functionality
 */
export class ChatService {
  private static instance: ChatService;
  private apiKey: string | null = null;
  private apiUrl: string = 'https://openrouter.ai/api/v1/chat/completions';
  private model: string = 'anthropic/claude-3-opus';

  private constructor() {
    // Initialize if needed
  }

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * Configure the chat service
   * @param apiKey OpenRouter API key
   * @param model Model to use (optional)
   */
  public configure(apiKey: string, model?: string): void {
    this.apiKey = apiKey;
    if (model) {
      this.model = model;
    }
  }

  /**
   * Send a message to the LLM
   * @param messages Chat history
   * @param projectContext Project context to include
   * @returns LLM response
   */
  public async sendMessage(
    messages: ChatMessage[],
    projectContext?: any
  ): Promise<ChatMessage> {
    if (!this.apiKey) {
      throw new Error('ChatService is not configured. Call configure() first.');
    }

    // Format messages for OpenRouter API
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add project context as system message if provided
    if (projectContext) {
      formattedMessages.unshift({
        role: 'system',
        content: `You are a helpful brainstorming assistant. Here is the current project context: ${JSON.stringify(projectContext)}`,
      });
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'd.o.it.brainstorming',
        },
        body: JSON.stringify({
          model: this.model,
          messages: formattedMessages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      throw error;
    }
  }

  /**
   * Get available models from OpenRouter
   * @returns List of available models
   */
  public async getAvailableModels(): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('ChatService is not configured. Call configure() first.');
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'd.o.it.brainstorming',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }
}

export default ChatService.getInstance();
