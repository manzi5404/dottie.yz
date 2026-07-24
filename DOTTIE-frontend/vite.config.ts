import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        shop: './shop.html',
        product: './product.html',
        cart: './cart.html',
        collections: './collections.html',
        login: './login.html',
        signup: './signup.html',
        about: './about.html',
        contact: './contact.html',
        lookbook: './lookbook.html',
        closed: './closed.html',
        faq: './faq.html',
        shipping: './shipping.html',
        terms: './terms.html',
      },
      output: {
        manualChunks: {
          alpine: ['alpinejs', '@alpinejs/collapse'],
          gsap: ['gsap'],
          vendor: ['src/js/shop.js', 'src/js/product.js'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        timeout: 300000,
        proxyTimeout: 300000,
      },
      '/admin': {
        target: 'http://127.0.0.1:5174',
        changeOrigin: true,
        timeout: 300000,
        proxyTimeout: 300000,
      },
    },
  },
})
