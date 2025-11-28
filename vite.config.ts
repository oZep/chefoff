import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0', // Allow connections from any IP (needed for Tailscale)
    port: 10000,
    proxy: {
      // Proxy websocket requests at /ws to the local WebSocket server
      '/ws': {
        target: 'ws://127.0.0.1:10001',
        ws: true,
        changeOrigin: true
      }
    }
  }
});
