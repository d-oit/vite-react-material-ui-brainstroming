import type { Mock } from 'vitest';

declare global {
  const vi: {
    fn: <T extends (...args: any[]) => any>(implementation?: T) => Mock<T>;
    mock: (path: string) => void;
    doMock: (path: string, factory?: () => unknown) => void;
    unmock: (path: string) => void;
    spyOn: <T extends object, K extends keyof T>(obj: T, method: K) => Mock;
    clearAllMocks: () => void;
    resetAllMocks: () => void;
    restoreAllMocks: () => void;
  };

  namespace Vitest {
    interface TestContext {
      mockResizeObserver: ResizeObserver;
      mockIntersectionObserver: IntersectionObserver;
      mockStorage: Storage;
    }
  }
}

// Empty export to make this a module
export {};
