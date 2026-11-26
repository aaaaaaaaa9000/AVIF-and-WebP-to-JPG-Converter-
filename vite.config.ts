import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Pure client-side app: no API keys are injected into the bundle.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
