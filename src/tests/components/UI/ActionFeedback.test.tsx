import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActionFeedback from '../../../components/UI/ActionFeedback';
import { ThemeProvider, createTheme } from '@mui/material';

describe('ActionFeedback', () => {
  const theme = createTheme();
  const renderWithTheme = (ui: React.ReactElement) => {
    return render(
      <ThemeProvider theme={theme}>
        {ui}
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render success feedback', () => {
    const onClose = vi.fn();

    renderWithTheme(
      <ActionFeedback
        message="Operation successful"
        type="success"
        open={true}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('should render error feedback', () => {
    const onClose = vi.fn();

    renderWithTheme(
      <ActionFeedback
        message="Operation failed"
        type="error"
        open={true}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Operation failed')).toBeInTheDocument();
  });

  it('should render loading feedback with progress', () => {
    const onClose = vi.fn();

    renderWithTheme(
      <ActionFeedback
        message="Loading..."
        type="loading"
        open={true}
        onClose={onClose}
        showProgress={true}
        progressValue={50}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should call onClose when closed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithTheme(
      <ActionFeedback
        message="Test message"
        type="info"
        open={true}
        onClose={onClose}
        autoHideDuration={1000}
      />
    );

    // Advance timers to trigger auto-hide
    vi.advanceTimersByTime(1500);

    // Wait for the onClose to be called
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('should not auto-hide loading feedback', () => {
    const onClose = vi.fn();

    renderWithTheme(
      <ActionFeedback
        message="Loading..."
        type="loading"
        open={true}
        onClose={onClose}
      />
    );

    // Advance timers
    vi.advanceTimersByTime(10000);

    // onClose should not be called
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should auto-increment progress for loading type', async () => {
    renderWithTheme(
      <ActionFeedback
        message="Loading..."
        type="loading"
        open={true}
        showProgress={true}
        progressValue={0}
      />
    );

    // Initial progress should be 0
    expect(screen.getByText(/0%/)).toBeInTheDocument();

    // Advance timers to trigger progress updates
    vi.advanceTimersByTime(1000);

    // Progress should have increased
    await waitFor(() => {
      const progressText = screen.getByText(/\d+%/);
      const progress = parseInt(progressText.textContent || '0');
      expect(progress).toBeGreaterThan(0);
    }, { timeout: 1000 });
  });
});
