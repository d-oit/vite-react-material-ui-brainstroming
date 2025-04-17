import '@testing-library/jest-dom';
import type { Mock } from 'vitest';

declare global {
  const vi: {
    fn: <T extends (...args: unknown[]) => unknown>(implementation?: T) => Mock<T>;
    mock: (path: string) => void;
    doMock: (path: string, factory?: () => unknown) => void;
    unmock: (path: string) => void;
    spyOn: <T extends object, K extends keyof T>(obj: T, method: K) => Mock;
    clearAllMocks: () => void;
    resetAllMocks: () => void;
    restoreAllMocks: () => void;
  };

  namespace Vi {
    interface JestAssertion<T = unknown> {
      toBeInTheDocument(): void;
      toHaveStyle(style: Record<string, any>): void;
    }
  }

  interface Window {
    matchMedia: (query: string) => MediaQueryList;
  }
}

export {};
