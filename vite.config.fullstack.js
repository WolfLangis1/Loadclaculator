import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Fullstack configuration - proxy to backend in same container
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    // Proxy API calls to backend running on same container
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
        timeout: 5000,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('API proxy error:', err);
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'API service unavailable', details: err.message }));
            }
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
    ]
  },
  // Use proxy endpoint for API calls in fullstack container
  define: {
    'process.env.VITE_API_BASE_URL': JSON.stringify('')
  }
})