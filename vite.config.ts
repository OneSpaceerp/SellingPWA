/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      manifest: {
        name: 'ERPNext Selling App',
        short_name: 'ERPNext POS',
        description: 'A Progressive Web App for ERPNext Sales Representatives.',
        theme_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'vite.svg', // Placeholder icon
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'vite.svg', // Placeholder icon
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
  assetsInclude: ['**/*.svg'],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://lcs.nsd-eg.com',
        changeOrigin: true,
      },
    },
  },
});
