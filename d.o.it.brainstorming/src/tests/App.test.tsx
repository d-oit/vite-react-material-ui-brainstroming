import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock the service worker registration
vi.mock('virtual:pwa-register', () => ({
  registerSW: () => ({
    onNeedRefresh: vi.fn(),
    onOfflineReady: vi.fn(),
  }),
}));

// Mock the router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Route: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Navigate: () => <div>Navigate</div>,
  };
});

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // If the app renders without crashing, this test passes
    expect(true).toBeTruthy();
  });
});
