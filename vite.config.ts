import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE lets the site live under a sub-path (for example GitHub Pages: /my-repo/).
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  build: { outDir: 'dist', chunkSizeWarningLimit: 1200 },
});
