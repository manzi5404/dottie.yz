import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';

const rootDir = path.resolve(__dirname, 'src/admin');
const outDir = path.resolve(__dirname, 'dist/admin');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

export default defineConfig({
  root: rootDir,
  plugins: [vue()],
  base: '/admin/',
  build: {
    outDir: outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(rootDir, 'index.html')
    }
  },
  resolve: {
    alias: {
      '@': rootDir
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
