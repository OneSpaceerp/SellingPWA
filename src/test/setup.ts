// This file is run before each test file, ensuring the testing environment is set up correctly.

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia, which is used by Mantine but not implemented in JSDOM.
// This prevents tests that render Mantine components from crashing.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
