import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ChatService } from '../../services/ChatService';
import type { ChatMessage, NodeSuggestion } from '../../types';
import { NodeType } from '../../types/enums';

// Create a proper mock for fetch
const createFetchMock = () => {
  const mockFn = vi.fn();
  return mockFn;
};

// Helper to create a mock response
const createMockResponse = (data: any, ok = true) => {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    status: ok ? 200 : 400,
    statusText: ok ? 'OK' : 'Bad Request',
  });
};

describe('ChatService', () => {
  // Mock fetch
  let mockFetch: ReturnType<typeof createFetchMock>;

  // Mock timestamp and ID generation
  const mockTimestamp = '2023-01-01T00:00:00.000Z';
  const mockId = '12345678-1234-1234-1234-123456789012';

  // Create a subclass of ChatService for testing
  class TestChatService extends ChatService {
    // Make constructor public for testing
    public constructor() {
      super();
    }

    protected override generateId(): string {
      return mockId;
    }

    protected override getTimestamp(): string {
      return mockTimestamp;
    }
  }

  // Use the test service instead of the real one
  let chatService: TestChatService;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create a new mock for fetch
    mockFetch = createFetchMock();
    global.fetch = mockFetch;

    // Create a fresh instance of our test service
    chatService = new TestChatService();
    chatService.configure('test-api-key', 'test-model');
  });

  // Mock crypto.randomUUID
  vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockId);

  // Remove duplicate beforeEach

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
    it('should configure the service with API key and model', async () => {
      const service = ChatService.getInstance();
      service.configure('new-api-key', 'new-model');

      // Test the configuration by making a call that would fail if not configured
      const mockModelsResponse = {
        data: [
          { id: 'model1', name: 'Model 1' },
          { id: 'model2', name: 'Model 2' },
        ],
      };

      // Setup the mock response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockModelsResponse,
        status: 200,
        statusText: 'OK',
      });

      const models = await service.getAvailableModels();

      expect(models).toHaveLength(2);
      expect((models as any)[0].id).toBe('model1');
      expect((models as any)[1].id).toBe('model2');

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

  describe('sendMessage', () => {
    it('should throw an error if not configured', async () => {
      // Create a new instance without configuration
      const unconfiguredService = new TestChatService();
      // Reset the configuration
      unconfiguredService.configure('', '');

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

      // Setup the mock response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 200,
        statusText: 'OK',
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
        id: mockId,
        role: 'assistant',
        content: 'Hello, how can I help you?',
        timestamp: mockTimestamp,
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

      // Setup the mock response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response with context' } }],
        }),
        status: 200,
        statusText: 'OK',
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

      // Setup the mock error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Invalid request' } }),
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(chatService.sendMessage(messages)).rejects.toThrow('API error: Invalid request');
    });
  });

  describe('generateNodeSuggestions', () => {
    it('should throw an error if not configured', async () => {
      // Create a new instance without configuration
      const unconfiguredService = new TestChatService();
      // Reset the configuration
      unconfiguredService.configure('', '');

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

      mockFetch.mockImplementationOnce(() => createMockResponse(mockResponse));

      const result = await chatService.generateNodeSuggestions(prompt);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(prompt),
        })
      );

      expect(result).toEqual({
        id: mockId,
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
        timestamp: mockTimestamp,
        accepted: false,
      });
    });

    it('should include existing nodes when provided', async () => {
      const prompt = 'Generate more ideas';
      const existingNodes: NodeSuggestion[] = [
        {
          title: 'Existing Node',
          content: 'This is an existing node',
          type: NodeType.IDEA,
          tags: ['existing'],
        },
      ];

      mockFetch.mockImplementationOnce(() =>
        createMockResponse({
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
        })
      );

      await chatService.generateNodeSuggestions(prompt, undefined, existingNodes);

      const mockFetchCalls = mockFetch.mock.calls;
      const lastCall = mockFetchCalls[mockFetchCalls.length - 1];
      const requestBody = JSON.parse(lastCall[1].body);
      
      expect(requestBody.messages[0].content).toContain(JSON.stringify(existingNodes));
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

      mockFetch.mockImplementationOnce(() => createMockResponse(mockResponse));

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

      mockFetch.mockImplementationOnce(() => createMockResponse(mockResponse));

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

      mockFetch.mockImplementationOnce(() => createMockResponse(mockResponse));

      await expect(chatService.generateNodeSuggestions(prompt)).rejects.toThrow(
        'Invalid response format'
      );
    });
  });

  describe('getAvailableModels', () => {
    it('should throw an error if not configured', async () => {
      // Create a new instance without configuration
      const unconfiguredService = new TestChatService();
      // Reset the configuration
      unconfiguredService.configure('', '');

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

      mockFetch.mockImplementationOnce(() => createMockResponse(mockModels));

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
      mockFetch.mockImplementationOnce(() =>
        createMockResponse({ error: { message: 'Invalid API key' } }, false)
      );

      await expect(chatService.getAvailableModels()).rejects.toThrow('API error: Invalid API key');
    });
  });
});
