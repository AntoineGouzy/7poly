import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8080,
    open: true,
    host: true,
    proxy: {
      '^/api.*': {
      target :'http://localhost:3000',
      ws: true,
      changeOrigin: true,
      secure: true,
      }
    }
  // close server object
  },
  resolve: {
      alias: {
        // C'est cette ligne qui fait fonctionner le @
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
  }
// close config object
})
