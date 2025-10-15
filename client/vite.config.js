import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8080,
    open: true,
    host: true,
    proxy: {
      "^/api.*": {
        target: "http://localhost:3000",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      // Proxy Socket.IO websocket requests to backend during dev
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
    // close server object
  },
  // close config object
});
