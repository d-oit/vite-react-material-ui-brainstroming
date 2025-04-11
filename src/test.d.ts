import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

declare global {
  const jest: (typeof import('@jest/globals'))['jest'];
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveStyle(style: Record<string, any>): R;
    }
  }

  interface Window {
    matchMedia: (query: string) => MediaQueryList;
  }
}

export {};
