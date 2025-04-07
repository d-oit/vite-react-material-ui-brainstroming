import type { ChatMessage, NodeSuggestion, ChatSuggestion, NodeType } from '../types';

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
  public async sendMessage(messages: ChatMessage[], projectContext?: Record<string, unknown>): Promise<ChatMessage> {
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
          Authorization: `Bearer ${this.apiKey}`,
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
      const assistantMessage =
        data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

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
   * Generate node suggestions from the LLM
   * @param prompt User prompt for generating nodes
   * @param projectContext Project context to include
   * @param existingNodes Existing nodes to consider
   * @returns Chat suggestion with generated nodes
   */
  public async generateNodeSuggestions(
    prompt: string,
    projectContext?: Record<string, unknown>,
    existingNodes?: NodeSuggestion[]
  ): Promise<ChatSuggestion> {
    if (!this.apiKey) {
      throw new Error('ChatService is not configured. Call configure() first.');
    }

    // Create a system message with instructions for generating nodes
    const systemMessage = {
      role: 'system',
      content: `You are a brainstorming assistant that helps users organize their ideas into structured nodes.
      Generate 3-5 nodes based on the user's input. Each node should have a title, content, type, and optional tags.

      Available node types are: 'idea', 'task', 'note', 'resource'.

      Respond in the following JSON format only:
      {
        "nodes": [
          {
            "title": "Short title",
            "content": "Detailed content",
            "type": "idea", // One of: idea, task, note, resource
            "tags": ["tag1", "tag2"] // Optional
          },
          // More nodes...
        ]
      }

      Do not include any explanatory text outside the JSON structure.`
    };

    // Add project context if provided
    if (projectContext) {
      systemMessage.content += `\n\nHere is the current project context: ${JSON.stringify(projectContext)}`;
    }

    // Add existing nodes if provided
    if (existingNodes && existingNodes.length > 0) {
      systemMessage.content += `\n\nHere are the existing nodes to consider:\n${JSON.stringify(existingNodes)}`;
    }

    // Create user message
    const userMessage = {
      role: 'user',
      content: prompt
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'd.o.it.brainstorming',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [systemMessage, userMessage],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || '{"nodes": []}';

      try {
        // Parse the JSON response
        const parsedResponse = JSON.parse(assistantMessage);

        // Validate the response structure
        if (!parsedResponse.nodes || !Array.isArray(parsedResponse.nodes)) {
          throw new Error('Invalid response format');
        }

        // Create the chat suggestion
        const chatSuggestion: ChatSuggestion = {
          id: crypto.randomUUID(),
          nodes: parsedResponse.nodes.map((node: any) => ({
            title: node.title || 'Untitled',
            content: node.content || '',
            type: this.validateNodeType(node.type),
            tags: Array.isArray(node.tags) ? node.tags : []
          })),
          originalMessage: prompt,
          timestamp: new Date().toISOString(),
          accepted: false
        };

        return chatSuggestion;
      } catch (error) {
        console.error('Error parsing node suggestions:', error);
        throw new Error('Failed to parse node suggestions');
      }
    } catch (error) {
      console.error('Error generating node suggestions:', error);
      throw error;
    }
  }

  /**
   * Validate node type
   * @param type Node type to validate
   * @returns Valid node type
   */
  private validateNodeType(type: string): NodeType {
    const validTypes = ['idea', 'task', 'note', 'resource'];
    if (validTypes.includes(type)) {
      return type as NodeType;
    }
    return 'idea' as NodeType; // Default to idea
  }

  /**
   * Get available models from OpenRouter
   * @returns List of available models
   */
  public async getAvailableModels(): Promise<unknown[]> {
    if (!this.apiKey) {
      throw new Error('ChatService is not configured. Call configure() first.');
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
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
