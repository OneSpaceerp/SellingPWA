/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Enable globals so we don't have to import describe, it, etc. in every file.
    globals: true,
    // Use jsdom as the environment for testing React components.
    environment: 'jsdom',
    // Point to the setup file to be run before each test file.
    setupFiles: './src/test/setup.ts',
  },
});
