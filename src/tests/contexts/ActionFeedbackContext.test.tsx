import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionFeedbackProvider, useActionFeedback } from '../../contexts/ActionFeedbackContext';
import { ThemeProvider, createTheme, Button } from '@mui/material';

// Test component that uses the ActionFeedback context
const TestComponent = () => {
  const {
    showFeedback,
    showLoading,
    updateLoading,
    completeLoading,
    hideFeedback
  } = useActionFeedback();

  return (
    <div>
      <Button
        data-testid="show-success"
        onClick={() => showFeedback('Success message', 'success')}
      >
        Show Success
      </Button>

      <Button
        data-testid="show-error"
        onClick={() => showFeedback('Error message', 'error')}
      >
        Show Error
      </Button>

      <Button
        data-testid="show-loading"
        onClick={() => {
          const id = showLoading('Loading message');
          // Store the ID in a data attribute for later use
          document.getElementById('loading-id')?.setAttribute('data-id', id);
        }}
      >
        Show Loading
      </Button>

      <Button
        data-testid="update-loading"
        onClick={() => {
          const id = document.getElementById('loading-id')?.getAttribute('data-id') || '';
          updateLoading(id, 'Updated loading message', 50);
        }}
      >
        Update Loading
      </Button>

      <Button
        data-testid="complete-loading"
        onClick={() => {
          const id = document.getElementById('loading-id')?.getAttribute('data-id') || '';
          completeLoading(id, 'Loading complete', 'success');
        }}
      >
        Complete Loading
      </Button>

      <Button
        data-testid="hide-feedback"
        onClick={() => hideFeedback()}
      >
        Hide Feedback
      </Button>

      <div id="loading-id"></div>
    </div>
  );
};

describe('ActionFeedbackContext', () => {
  const theme = createTheme();

  const renderWithProviders = () => {
    return render(
      <ThemeProvider theme={theme}>
        <ActionFeedbackProvider>
          <TestComponent />
        </ActionFeedbackProvider>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show success feedback', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders();

    // Click the show success button
    await user.click(screen.getByTestId('show-success'));

    // Check that the success message is displayed
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should show error feedback', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders();

    // Click the show error button
    await user.click(screen.getByTestId('show-error'));

    // Check that the error message is displayed
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should show loading feedback', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders();

    // Click the show loading button
    await user.click(screen.getByTestId('show-loading'));

    // Check that the loading message is displayed
    expect(screen.getByText('Loading message')).toBeInTheDocument();
  });

  it('should update loading feedback', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders();

    // Show loading
    await user.click(screen.getByTestId('show-loading'));

    // Update loading
    await user.click(screen.getByTestId('update-loading'));

    // Check that the loading message is updated
    expect(screen.getByText('Updated loading message')).toBeInTheDocument();
  });

  it('should complete loading feedback', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders();

    // Show loading
    await user.click(screen.getByTestId('show-loading'));

    // Complete loading
    await user.click(screen.getByTestId('complete-loading'));

    // Check that the loading complete message is displayed
    expect(screen.getByText('Loading complete')).toBeInTheDocument();

    // Advance timers to trigger auto-hide
    vi.advanceTimersByTime(5000);

    // Wait for the feedback to be hidden
    await waitFor(() => {
      expect(screen.queryByText('Loading complete')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('should hide feedback', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders();

    // Show success
    await user.click(screen.getByTestId('show-success'));

    // Check that the success message is displayed
    expect(screen.getByText('Success message')).toBeInTheDocument();

    // Hide feedback
    await user.click(screen.getByTestId('hide-feedback'));

    // Wait for the feedback to be hidden
    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });
});
