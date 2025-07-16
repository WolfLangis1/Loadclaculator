import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Development-specific Vite configuration for Docker
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    watch: {
      usePolling: true,
      interval: 2000, // Slower polling to reduce CPU usage
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/coverage/**', '**/.vite/**']
    },
    hmr: {
      port: 3000,
      clientPort: 3002, // Use the exposed port for HMR
      host: 'localhost'
    },
    // Proxy API calls to backend server
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://api-server:3001',
        changeOrigin: true,
        secure: false,
        timeout: 5000,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('API proxy error:', err);
            // Fallback to mock data on proxy error
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'API service unavailable', details: err.message }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying request:', req.method, req.url, 'to', proxyReq.host + ':' + proxyReq.port + proxyReq.path);
          });
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'jspdf',
      'lucide-react'
    ],
    exclude: ['vite']
  },
  // Disable automatic page reload on config changes
  configFile: false,
})