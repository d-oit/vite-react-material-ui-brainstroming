import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ChatService } from '../../services/ChatService';
import type { ChatMessage, NodeSuggestion } from '../../types';

describe('ChatService', () => {
  // Get a fresh instance for each test
  let chatService: ChatService;

  // Mock fetch globally
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  // Helper to create a mock response
  const createMockResponse = (data: any, ok = true) => {
    return {
      ok,
      json: vi.fn().mockResolvedValue(data),
      text: vi.fn().mockResolvedValue(JSON.stringify(data)),
      status: ok ? 200 : 400,
      statusText: ok ? 'OK' : 'Bad Request',
    };
  };

  // Mock crypto.randomUUID
  const mockUUID = 'test-uuid-1234';
  vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);

  // Mock Date
  const mockDate = new Date('2023-01-01T00:00:00Z');
  vi.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Get a fresh instance
    chatService = ChatService.getInstance();
    chatService.configure('test-api-key', 'test-model');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = ChatService.getInstance();
      const instance2 = ChatService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('configure', () => {
    it('should configure the service with API key and model', () => {
      const service = ChatService.getInstance();
      service.configure('new-api-key', 'new-model');

      // Test the configuration by making a call that would fail if not configured
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      return service.getAvailableModels().then(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'https://openrouter.ai/api/v1/models',
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer new-api-key',
            }),
          })
        );
      });
    });
  });

  describe('sendMessage', () => {
    it('should throw an error if not configured', async () => {
      // Create a new instance without configuration
      const unconfiguredService = new ChatService();

      await expect(unconfiguredService.sendMessage([])).rejects.toThrow(
        'ChatService is not configured'
      );
    });

    it('should send messages to the API and return the response', async () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: '2023-01-01T00:00:00Z',
        },
      ];

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Hello, how can I help you?',
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await chatService.sendMessage(messages);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          }),
          body: JSON.stringify({
            model: 'test-model',
            messages: [{ role: 'user', content: 'Hello' }],
          }),
        })
      );

      expect(result).toEqual({
        id: mockUUID,
        role: 'assistant',
        content: 'Hello, how can I help you?',
        timestamp: mockDate.toISOString(),
      });
    });

    it('should include project context as a system message when provided', async () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: '2023-01-01T00:00:00Z',
        },
      ];

      const projectContext = {
        name: 'Test Project',
        description: 'A test project',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Response with context' } }],
          }),
      });

      await chatService.sendMessage(messages, projectContext);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            model: 'test-model',
            messages: [
              {
                role: 'system',
                content: `You are a helpful brainstorming assistant. Here is the current project context: ${JSON.stringify(
                  projectContext
                )}`,
              },
              { role: 'user', content: 'Hello' },
            ],
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: '2023-01-01T00:00:00Z',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: { message: 'Invalid request' } }),
      });

      await expect(chatService.sendMessage(messages)).rejects.toThrow('API error: Invalid request');
    });
  });

  describe('generateNodeSuggestions', () => {
    it('should throw an error if not configured', async () => {
      // Create a new instance without configuration
      const unconfiguredService = new ChatService();

      await expect(unconfiguredService.generateNodeSuggestions('test prompt')).rejects.toThrow(
        'ChatService is not configured'
      );
    });

    it('should generate node suggestions based on a prompt', async () => {
      const prompt = 'Generate ideas about climate change';

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                nodes: [
                  {
                    title: 'Renewable Energy',
                    content: 'Transition to renewable energy sources',
                    type: 'idea',
                    tags: ['energy', 'sustainability'],
                  },
                  {
                    title: 'Carbon Capture',
                    content: 'Technologies to capture carbon from the atmosphere',
                    type: 'note',
                    tags: ['technology', 'research'],
                  },
                ],
              }),
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await chatService.generateNodeSuggestions(prompt);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(prompt),
        })
      );

      expect(result).toEqual({
        id: mockUUID,
        nodes: [
          {
            title: 'Renewable Energy',
            content: 'Transition to renewable energy sources',
            type: 'idea',
            tags: ['energy', 'sustainability'],
          },
          {
            title: 'Carbon Capture',
            content: 'Technologies to capture carbon from the atmosphere',
            type: 'note',
            tags: ['technology', 'research'],
          },
        ],
        originalMessage: prompt,
        timestamp: mockDate.toISOString(),
        accepted: false,
      });
    });

    it('should include existing nodes when provided', async () => {
      const prompt = 'Generate more ideas';
      const existingNodes: NodeSuggestion[] = [
        {
          title: 'Existing Node',
          content: 'This is an existing node',
          type: 'idea',
          tags: ['existing'],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    nodes: [
                      {
                        title: 'New Node',
                        content: 'This is a new node',
                        type: 'task',
                        tags: ['new'],
                      },
                    ],
                  }),
                },
              },
            ],
          }),
      });

      await chatService.generateNodeSuggestions(prompt, undefined, existingNodes);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining(JSON.stringify(existingNodes)),
        })
      );
    });

    it('should handle invalid node types by defaulting to idea', async () => {
      const prompt = 'Generate ideas';

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                nodes: [
                  {
                    title: 'Invalid Type Node',
                    content: 'This node has an invalid type',
                    type: 'invalid_type',
                    tags: [],
                  },
                ],
              }),
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await chatService.generateNodeSuggestions(prompt);

      expect(result.nodes[0].type).toBe('idea');
    });

    it('should handle parsing errors in the response', async () => {
      const prompt = 'Generate ideas';

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This is not valid JSON',
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await expect(chatService.generateNodeSuggestions(prompt)).rejects.toThrow(
        'Failed to parse node suggestions'
      );
    });

    it('should handle invalid response structure', async () => {
      const prompt = 'Generate ideas';

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({ not_nodes: [] }),
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await expect(chatService.generateNodeSuggestions(prompt)).rejects.toThrow(
        'Invalid response format'
      );
    });
  });

  describe('getAvailableModels', () => {
    it('should throw an error if not configured', async () => {
      // Create a new instance without configuration
      const unconfiguredService = new ChatService();

      await expect(unconfiguredService.getAvailableModels()).rejects.toThrow(
        'ChatService is not configured'
      );
    });

    it('should fetch available models from the API', async () => {
      const mockModels = {
        data: [
          { id: 'model1', name: 'Model 1' },
          { id: 'model2', name: 'Model 2' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await chatService.getAvailableModels();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        })
      );

      expect(result).toEqual(mockModels.data);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: { message: 'Invalid API key' } }),
      });

      await expect(chatService.getAvailableModels()).rejects.toThrow('API error: Invalid API key');
    });
  });
});
