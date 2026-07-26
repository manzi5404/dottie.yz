import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// List of root HTML pages that need to be built
const rootHtmlFiles = [
  'index.html', 'shop.html', 'lookbook.html', 'cart.html', 'product.html',
  'contact.html', 'about.html', 'shipping.html',
  'faq.html', 'terms.html', 'login.html', 'signup.html',
  'forgot-password.html', 'reset-password.html'
];

// Plugin to copy static assets after build
function copyStaticAssets() {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      
      // Copy src directory to dist/src (needed for /src/css/style.css references)
      const srcDir = path.resolve(__dirname, 'src');
      const distSrcDir = path.join(distDir, 'src');
      if (fs.existsSync(srcDir)) {
        const copyDir = (src, dest) => {
          fs.mkdirSync(dest, { recursive: true });
          for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
              copyDir(srcPath, destPath);
            } else {
              fs.copyFileSync(srcPath, destPath);
            }
          }
        };
        copyDir(srcDir, distSrcDir);
        console.log('✓ Copied src/ to dist/src/');
      }

      // Copy images directory to dist/images
      const imagesDir = path.resolve(__dirname, 'images');
      const distImagesDir = path.join(distDir, 'images');
      if (fs.existsSync(imagesDir)) {
        const copyDir = (src, dest) => {
          fs.mkdirSync(dest, { recursive: true });
          for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
              copyDir(srcPath, destPath);
            } else {
              fs.copyFileSync(srcPath, destPath);
            }
          }
        };
        copyDir(imagesDir, distImagesDir);
        console.log('✓ Copied src/ to dist/src/');
        console.log('✓ Copied images/ to dist/images/');

        // Copy _headers files for Cloudflare Pages cache control
        const headersFiles = [
          { src: path.resolve(__dirname, 'public', '_headers'), dest: path.join(distDir, '_headers') },
          { src: path.resolve(__dirname, 'public', '_headers'), dest: path.join(distDir, 'admin', '_headers') },
          { src: path.resolve(__dirname, 'DOTTIE-frontend', 'public', '_headers'), dest: path.join(distDir, 'admin', '_headers') },
        ];
        headersFiles.forEach(({ src, dest }) => {
          if (fs.existsSync(src)) {
            const destDir = path.dirname(dest);
            if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
            fs.copyFileSync(src, dest);
            console.log(`✓ Copied _headers to ${dest}`);
          }
        });
      }
    }
  };
}

// Build input object for all HTML files
const htmlInputs = {};
rootHtmlFiles.forEach(file => {
  const name = file.replace('.html', '');
  htmlInputs[name] = path.resolve(__dirname, file);
});

export default defineConfig({
  root: '.',
  base: '/',
  plugins: [vue(), react(), copyStaticAssets()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: htmlInputs
    }
  },
  server: {
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  publicDir: false // Disable default public dir
});
