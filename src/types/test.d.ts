/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration) => void;
    onRegisterError?: (error: any) => void;
  }

  export function registerSW(options?: RegisterSWOptions): {
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}

declare global {
  // Extend jest-dom matchers
  namespace Vi {
    interface JestAssertion<T = any> extends jest.Matchers<void, T> {
      toBeInTheDocument(): void;
      toHaveTextContent(text: string | RegExp): void;
      toHaveValue(value: string | number | string[]): void;
    }
  }

  // Extend window with test-specific properties
  interface Window {
    IntersectionObserver: typeof IntersectionObserver;
  }

  // Add test lifecycle hooks to global scope
  const beforeAll: (typeof import('vitest'))['beforeAll'];
  const afterEach: (typeof import('vitest'))['afterEach'];
  const beforeEach: (typeof import('vitest'))['beforeEach'];
  const vi: (typeof import('vitest'))['vi'];
}

export {};
