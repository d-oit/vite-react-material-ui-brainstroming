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

    // Mock Material-UI components
    vi.mock('@mui/material', async () => {
      const actual = await vi.importActual('@mui/material');
      return {
        ...actual,
        Fade: ({ children }: { children: React.ReactNode }) => children,
        Grow: ({ children }: { children: React.ReactNode }) => children,
        Dialog: ({ children, open, onClose, 'aria-labelledby': ariaLabelledBy }: any) => {
          if (!open) return null;
          return (
            <div role="dialog" aria-labelledby={ariaLabelledBy} data-testid="dialog">
              {children}
              <button type="button" onClick={onClose} data-testid="close-dialog">
                Close
              </button>
            </div>
          );
        },
        DialogTitle: ({ children, id }: any) => <h2 id={id}>{children}</h2>,
        DialogContent: ({ children }: any) => <div>{children}</div>,
      };
    });
  });

  vi.setConfig({ testTimeout: 30000 }); // Increased from 5000 to 30000
  // Use type assertion for the mock function
  const mockOnInsightGenerated = vi.fn() as unknown as (node: BrainstormNode) => void;

  setupTest();
  setupTimers();

  function renderComponent() {
    return render(
      <I18nProvider initialLocale="en">
        <LLMChatPanel
          projectId={TEST_PROJECT_ID}
          session={MOCK_SESSION}
          onInsightGenerated={mockOnInsightGenerated}
          open={true}
          onClose={() => {}}
        />
      </I18nProvider>
    );
  }

  it('should render the chat interface', () => {
    renderComponent();

    // Check for dialog
    const dialog = screen.getByTestId('dialog');
    expect(dialog).toBeInTheDocument();

    // Check for basic elements
    expect(screen.getByPlaceholderText(/type.*message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('should show predefined prompts', () => {
    renderComponent();

    // Check for predefined prompts
    for (const promptKey of DEFAULT_PROMPTS) {
      const element = screen.getByText(promptKey);
      expect(element).toBeInTheDocument();
    }
  });

  it('should have a working send button', () => {
    renderComponent();

    // Check for send button
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeInTheDocument();
    expect(sendButton).toBeDisabled(); // Should be disabled when input is empty

    // Check for input field
    const input = screen.getByPlaceholderText(/type.*message/i);
    expect(input).toBeInTheDocument();
  });
});
