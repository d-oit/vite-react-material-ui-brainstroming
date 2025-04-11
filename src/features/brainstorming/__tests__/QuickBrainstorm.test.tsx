import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import { I18nProvider } from '../../../contexts/I18nContext';
import QuickBrainstorm from '../QuickBrainstorm';
import type { BrainstormSession } from '../types';

import { mockGenerateId, setupTest } from './testUtils';
import './matchers';

vi.mock('@testing-library/user-event', () => ({
  default: {
    setup: () => ({
      type: vi.fn(),
      click: vi.fn(),
    }),
  },
}));

describe('QuickBrainstorm', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnConvert = vi.fn();

  setupTest();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <I18nProvider initialLocale="en">
        <QuickBrainstorm onSave={mockOnSave} onClose={mockOnClose} onConvert={mockOnConvert} />
      </I18nProvider>
    );

  const getTextbox = () => screen.getByPlaceholderText('brainstorming.quickIdea');
  const getAddButton = () => screen.getByTestId('add-button');
  const getSaveButton = () => screen.getByTestId('save-button');
  const getRemoveButton = () => screen.getByTestId('remove-button');
  const getConvertButton = () => screen.getByTestId('convert-button');

  it('should add new ideas when enter is pressed', async () => {
    const user = userEvent.setup();
    renderComponent();

    user.type.mockImplementationOnce(() => Promise.resolve());
    await user.type(getTextbox(), 'New idea{Enter}');

    await screen.findByText('New idea');
  });

  it('should remove ideas when delete is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    user.type.mockImplementationOnce(() => Promise.resolve());
    await user.type(getTextbox(), 'Idea to delete{Enter}');

    const idea = await screen.findByText('Idea to delete');
    expect(idea).toBeInTheDocument();

    user.click.mockImplementationOnce(() => Promise.resolve());
    await user.click(getRemoveButton());

    expect(screen.queryByText('Idea to delete')).not.toBeInTheDocument();
  });

  it('should save ideas when save button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Add ideas one by one
    user.type.mockImplementationOnce(() => Promise.resolve());
    await user.type(getTextbox(), 'Idea 1{Enter}');
    await screen.findByText('Idea 1');

    user.type.mockImplementationOnce(() => Promise.resolve());
    await user.type(getTextbox(), 'Idea 2{Enter}');
    await screen.findByText('Idea 2');

    user.click.mockImplementationOnce(() => Promise.resolve());
    await user.click(getSaveButton());

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        nodes: expect.arrayContaining([
          expect.objectContaining({ content: 'Idea 1' }),
          expect.objectContaining({ content: 'Idea 2' }),
        ]),
      })
    );
  });

  it('should convert to full session when convert button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    user.type.mockImplementationOnce(() => Promise.resolve());
    await user.type(getTextbox(), 'Idea for conversion{Enter}');
    await screen.findByText('Idea for conversion');

    user.click.mockImplementationOnce(() => Promise.resolve());
    await user.click(getConvertButton());

    expect(mockOnConvert).toHaveBeenCalledWith(
      expect.objectContaining({
        nodes: expect.arrayContaining([
          expect.objectContaining({ content: 'Idea for conversion' }),
        ]),
      })
    );
  });

  it('should disable buttons when there are no ideas', () => {
    renderComponent();
    expect(getSaveButton()).toBeDisabled();
    expect(getConvertButton()).toBeDisabled();
  });

  it('should handle multiline input correctly', async () => {
    const user = userEvent.setup();
    renderComponent();

    user.type.mockImplementationOnce(() => Promise.resolve());
    await user.type(getTextbox(), 'Line 1\nLine 2{Enter}');

    const textElement = await screen.findByText((content, element) => {
      const text = element?.textContent || '';
      return text.includes('Line 1') && text.includes('Line 2');
    });
    expect(textElement).toBeInTheDocument();
  });
});