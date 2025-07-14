import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock window.ResizeObserver for components that use it
global.ResizeObserver = class ResizeObserver {
  constructor(cb: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock console methods for cleaner test output
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = (...args: any[]) => {
    // Ignore React error boundary errors in tests
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Error boundaries should implement getDerivedStateFromError')
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };
});

afterEach(() => {
  console.error = originalConsoleError;
});