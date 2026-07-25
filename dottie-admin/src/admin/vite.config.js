import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';

// Build admin portal to ../../../dist/admin directory
// __dirname is frontend/src/admin/drops
// ../../../.. is the root project directory
const outDir = path.resolve(__dirname, '../../../../dist/admin');

// Ensure output directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

export default defineConfig({
  root: __dirname,
  plugins: [vue()],
  base: '/admin/',
  build: {
    outDir: outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html')
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  server: {
    port: 5176,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
