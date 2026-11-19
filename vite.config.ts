import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE lets the site live under a sub-path (for example GitHub Pages: /my-repo/).
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    // The map page carries MapLibre (about 1.2 MB, loaded only when a map is opened).
    chunkSizeWarningLimit: 1400,
    rolldownOptions: {
      output: {
        // Publish MapLibre's worker (.mjs) as .js so every server, including the phone
        // apps' built-in ones, sends it with a JavaScript content type.
        assetFileNames: (asset) =>
          asset.names?.some((n) => n.endsWith('.mjs')) ? 'assets/[name]-[hash].js' : 'assets/[name]-[hash][extname]',
      },
    },
  },
});
