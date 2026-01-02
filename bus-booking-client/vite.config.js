import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    // Use esbuild for CSS minification (faster, less warnings)
    cssMinify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    // Suppress warnings
    chunkSizeWarningLimit: 1000,
  },
});
