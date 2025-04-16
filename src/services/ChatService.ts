import type { ChatMessage, NodeSuggestion, ChatSuggestion, NodeType } from '../types';

/**
 * Service for handling LLM chat functionality
 */
export class ChatService {
  private static instance: ChatService;
  private apiKey: string | null = null;
  private apiUrl: string = 'https://openrouter.ai/api/v1/chat/completions';
  private model: string = 'anthropic/claude-3-opus';

  protected constructor() {
    // Initialize if needed
  }

  public static getInstance(): ChatService {
    if (ChatService.instance === null || ChatService.instance === undefined) {
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
   * Generate a unique ID - extracted for testability
   * @returns A unique ID string
   */
  protected generateId(): string {
    return crypto.randomUUID();
  }

  /**
   * Get the current timestamp - extracted for testability
   * @returns ISO timestamp string
   */
  protected getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Send a message to the LLM and get a response
   *
   * This function handles communication with the OpenRouter API to send user messages
   * and receive AI responses. It formats the chat history and project context into
   * the format expected by the API, handles the API call, and processes the response.
   *
   * The function includes error handling for network issues, API errors, and response
   * validation. It also adds project context as a system message to provide the AI
   * with relevant information about the current project.
   *
   * @param messages - Array of ChatMessage objects representing the chat history
   * @param projectContext - Optional context about the current project to help the AI generate relevant responses
   * @returns Promise<ChatMessage> - A promise that resolves to a ChatMessage containing the AI's response
   * @throws Error if the API key is not configured or if there's an API error
   */
  public async sendMessage(
    messages: ChatMessage[],
    projectContext?: Record<string, unknown>
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
        const errorData = (await response.json()) as { error?: { message?: string } };
        throw new Error(`API error: ${errorData.error?.message ?? response.statusText}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const assistantMessage =
        data.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.';

      // Create a timestamp string that's safe for testing
      const timestamp = this.getTimestamp();

      return {
        id: this.generateId(),
        role: 'assistant',
        content: assistantMessage,
        timestamp,
      };
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      throw error;
    }
  }

  /**
   * Generate node suggestions based on a user prompt
   *
   * This function uses the OpenRouter API to generate structured node suggestions
   * for brainstorming based on the user's input. It formats the response as a
   * ChatSuggestion object containing NodeSuggestion objects that can be displayed
   * to the user and converted to actual nodes in the brainstorming canvas.
   *
   * The function handles error cases, including API errors, parsing errors, and
   * validation of the response format. It also includes context about the current
   * project and existing nodes to help the AI generate more relevant suggestions.
   *
   * @param prompt - The user's text prompt describing what nodes to generate
   * @param projectContext - Optional context about the current project (node count, types, etc.)
   * @param existingNodes - Optional array of existing nodes to consider for context
   * @returns Promise<ChatSuggestion> - A promise that resolves to a ChatSuggestion object
   * @throws Error if the API key is not configured or if there's an API error
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

      Do not include any explanatory text outside the JSON structure.`,
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
      content: prompt,
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
        const errorData = (await response.json()) as { error?: { message?: string } };
        throw new Error(`API error: ${errorData.error?.message ?? response.statusText}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const assistantMessage = data.choices?.[0]?.message?.content ?? '{"nodes": []}';

      let parsedResponse;
      try {
        // Parse the JSON response
        parsedResponse = JSON.parse(assistantMessage);
      } catch (error) {
        console.error('Error parsing node suggestions:', error);
        throw new Error('Failed to parse node suggestions');
      }

      // Validate the response structure
      const isValidResponse = (value: unknown): value is { nodes: unknown[] } => {
        return (
          value !== null &&
          typeof value === 'object' &&
          'nodes' in value &&
          Array.isArray((value as { nodes?: unknown[] }).nodes)
        );
      };

      if (!isValidResponse(parsedResponse)) {
        throw new Error('Invalid response format');
      }

      const nodeArray = parsedResponse.nodes as Array<{
        title?: string;
        content?: string;
        type?: string;
        tags?: string[];
      }>;

      const chatSuggestion: ChatSuggestion = {
        id: this.generateId(),
        nodes: nodeArray.map(node => ({
          title: node.title || 'Untitled',
          content: node.content || '',
          type: this.validateNodeType(node.type || ''),
          tags: Array.isArray(node.tags) ? node.tags : [],
        })),
        originalMessage: prompt,
        timestamp: this.getTimestamp(),
        accepted: false,
      };

      return chatSuggestion;
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
        const errorData = (await response.json()) as { error?: { message?: string } };
        throw new Error(`API error: ${errorData.error?.message ?? response.statusText}`);
      }

      const data = (await response.json()) as { data?: unknown[] };
      return data.data ?? [];
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }
}

export default ChatService.getInstance();
