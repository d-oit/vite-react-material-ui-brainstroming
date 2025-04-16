/// <reference types="vitest/globals" />
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { vi } from 'vitest'; // Explicit import might help TS

import { I18nProvider } from '../../../contexts/I18nContext';
import LLMChatPanel from '../LLMChatPanel';
import type { BrainstormNode } from '../types';

import {
  DEFAULT_PROMPTS,
  MOCK_NODE_BASE,
  MOCK_RESPONSE_DELAY,
  MOCK_SESSION,
  TEST_PROJECT_ID,
} from './constants';
import { mockGenerateId, setupTest, setupTimers } from './testUtils';

describe('LLMChatPanel', () => {
  // Set up mocks
  beforeAll(() => {
    // Mock chat service
    vi.mock('../../../services/ChatService', () => ({
      default: {
        getInstance: vi.fn().mockReturnValue({
          sendMessage: vi.fn().mockResolvedValue('Simulated LLM response'),
          generateNodeSuggestions: vi.fn().mockResolvedValue([]),
        }),
      },
    }));

    // Mock Material-UI transitions
    vi.mock('@mui/material', async () => {
      const actual = await vi.importActual('@mui/material');
      return {
        ...actual,
        Fade: ({ children }: { children: React.ReactNode }) => children,
        Grow: ({ children }: { children: React.ReactNode }) => children,
      };
    });
  });

  vi.setConfig({ testTimeout: 5000 });
  // Use type assertion for the mock function
  const mockOnInsightGenerated = vi.fn() as unknown as (node: BrainstormNode) => void;

  setupTest();
  setupTimers();

  async function renderAndSetupComponent() {
    const renderResult = render(
      <I18nProvider initialLocale="en">
        <LLMChatPanel
          projectId={TEST_PROJECT_ID}
          session={MOCK_SESSION}
          onInsightGenerated={mockOnInsightGenerated}
        />
      </I18nProvider>
    );

    // Wait for initial render to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    return {
      ...renderResult,
      input: screen.getByRole('textbox'),
      sendButton: screen.getByRole('button', { name: /send/i }),
    };
  }

  it('should render the chat interface', async () => {
    const { input, sendButton } = await renderAndSetupComponent();
    expect(input).toBeInTheDocument();
    expect(sendButton).toBeInTheDocument();
  });

  it('should show predefined prompts', async () => {
    await renderAndSetupComponent();
    for (const promptKey of DEFAULT_PROMPTS) {
      const element = screen.getByText(promptKey);
      expect(element).toBeInTheDocument();
    }
  });

  it('should handle message sending', async () => {
    const { input, sendButton } = await renderAndSetupComponent();

    await userEvent.type(input, 'Test message');
    await userEvent.click(sendButton);

    expect(input).toHaveValue('');
    await screen.findByText(/Test message/);

    vi.advanceTimersByTime(MOCK_RESPONSE_DELAY);
    await screen.findByText(/Simulated LLM response/);
  });

  it('should generate insights from responses', async () => {
    const { input, sendButton } = await renderAndSetupComponent();

    await userEvent.type(input, 'Generate ideas');
    await userEvent.click(sendButton);

    await screen.findByText(/Generate ideas/);
    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();

    vi.advanceTimersByTime(MOCK_RESPONSE_DELAY);

    expect(mockOnInsightGenerated).toHaveBeenCalledWith(
      expect.objectContaining<BrainstormNode>({
        ...MOCK_NODE_BASE,
        content: expect.any(String),
        position: expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
        }),
        tags: ['llm-generated'],
      })
    );

    const input2 = await screen.findByRole('textbox');
    const sendButton2 = await screen.findByRole('button', { name: /send/i });
    expect(input2).toBeEnabled();
    expect(sendButton2).toBeEnabled();
  });

  it('should handle prompt template selection', async () => {
    const { input } = await renderAndSetupComponent();
    const firstPrompt = screen.getByText(DEFAULT_PROMPTS[0]);

    await userEvent.clear(input);
    await userEvent.click(firstPrompt);

    expect(input).toHaveValue(DEFAULT_PROMPTS[0]);
  });

  it('should disable input while processing', async () => {
    const { input, sendButton } = await renderAndSetupComponent();

    await userEvent.type(input, 'Test message');
    expect(input).toBeEnabled();
    expect(sendButton).toBeEnabled();

    await userEvent.click(sendButton);

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();

    vi.advanceTimersByTime(MOCK_RESPONSE_DELAY);

    const input2 = await screen.findByRole('textbox');
    const sendButton2 = await screen.findByRole('button', { name: /send/i });
    expect(input2).toBeEnabled();
    expect(sendButton2).toBeEnabled();
  });

  it('should handle enter key press', async () => {
    const { input } = await renderAndSetupComponent();

    await userEvent.type(input, 'Test message{enter}');
    await screen.findByText(/Test message/);

    vi.advanceTimersByTime(MOCK_RESPONSE_DELAY);
    await screen.findByText(/Simulated LLM response/);
  });

  it('should preserve chat history within session', async () => {
    const { input, rerender } = await renderAndSetupComponent();

    await userEvent.type(input, 'First message{enter}');
    await screen.findByText(/First message/);

    vi.advanceTimersByTime(MOCK_RESPONSE_DELAY);
    await screen.findByText(/Simulated LLM response/);

    rerender(
      <I18nProvider initialLocale="en">
        <LLMChatPanel
          projectId={TEST_PROJECT_ID}
          session={MOCK_SESSION}
          onInsightGenerated={mockOnInsightGenerated}
        />
      </I18nProvider>
    );

    await screen.findByText(/First message/);
    await screen.findByText(/Simulated LLM response/);
  });
});
