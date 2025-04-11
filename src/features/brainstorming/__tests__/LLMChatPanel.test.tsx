import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

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
  const mockOnInsightGenerated = jest.fn();

  setupTest();
  setupTimers();

  const renderComponent = () =>
    render(
      <I18nProvider initialLocale="en">
        <LLMChatPanel
          projectId={TEST_PROJECT_ID}
          session={MOCK_SESSION}
          onInsightGenerated={mockOnInsightGenerated}
        />
      </I18nProvider>
    );

  it('should render the chat interface', () => {
    renderComponent();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('should show predefined prompts', () => {
    renderComponent();
    DEFAULT_PROMPTS.forEach(promptKey => {
      expect(screen.getByText(promptKey)).toBeInTheDocument();
    });
  });

  it('should handle message sending', async () => {
    renderComponent();
    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /send/i });

    await userEvent.type(input, 'Test message');
    expect(sendButton).toBeEnabled();

    await userEvent.click(sendButton);
    expect(input).toHaveValue('');

    // Wait for simulated response
    await act(async () => {
      jest.advanceTimersByTime(MOCK_RESPONSE_DELAY);
    });

    await waitFor(() => {
      expect(screen.getByText(/Test message/)).toBeInTheDocument();
      expect(screen.getByText(/Simulated LLM response/)).toBeInTheDocument();
    });
  });

  it('should generate insights from responses', async () => {
    renderComponent();
    const input = screen.getByRole('textbox');

    await userEvent.type(input, 'Generate ideas');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    // Wait for simulated response and insight generation
    await act(async () => {
      jest.advanceTimersByTime(MOCK_RESPONSE_DELAY);
    });

    await waitFor(() => {
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
    });
  });

  it('should handle prompt template selection', async () => {
    renderComponent();
    const firstPrompt = screen.getByText(DEFAULT_PROMPTS[0]);
    await userEvent.click(firstPrompt);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue(DEFAULT_PROMPTS[0]);
  });

  it('should disable input while processing', async () => {
    renderComponent();
    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /send/i });

    await userEvent.type(input, 'Test message');
    await userEvent.click(sendButton);

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();

    await act(async () => {
      jest.advanceTimersByTime(MOCK_RESPONSE_DELAY);
    });

    await waitFor(() => {
      expect(input).toBeEnabled();
      expect(sendButton).toBeEnabled();
    });
  });

  it('should handle enter key press', async () => {
    renderComponent();
    const input = screen.getByRole('textbox');

    await userEvent.type(input, 'Test message{enter}');

    await waitFor(() => {
      expect(screen.getByText(/Test message/)).toBeInTheDocument();
    });

    await act(async () => {
      jest.advanceTimersByTime(MOCK_RESPONSE_DELAY);
    });

    await waitFor(() => {
      expect(screen.getByText(/Simulated LLM response/)).toBeInTheDocument();
    });
  });

  it('should preserve chat history within session', async () => {
    const { rerender } = renderComponent();

    // Send first message
    await userEvent.type(screen.getByRole('textbox'), 'First message{enter}');
    await act(async () => {
      jest.advanceTimersByTime(MOCK_RESPONSE_DELAY);
    });

    // Rerender with same session
    rerender(
      <I18nProvider initialLocale="en">
        <LLMChatPanel
          projectId={TEST_PROJECT_ID}
          session={MOCK_SESSION}
          onInsightGenerated={mockOnInsightGenerated}
        />
      </I18nProvider>
    );

    // Messages should persist
    expect(screen.getByText(/First message/)).toBeInTheDocument();
    expect(screen.getByText(/Simulated LLM response/)).toBeInTheDocument();
  });
});
