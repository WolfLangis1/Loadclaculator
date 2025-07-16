import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Production-ready Vite configuration in JavaScript
// Eliminates TypeScript import issues during Vercel deployment
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable in production for smaller bundle
    minify: 'terser',
    target: 'es2015', // Better browser compatibility
    chunkSizeWarningLimit: 1000, // Warn for chunks over 1MB
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react'],
          pdf: ['jspdf']
        },
        chunkFileNames: (chunkInfo) => {
          return `assets/[name]-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/styles/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    }
  },
  // Production-specific settings
  define: {
    'process.env.NODE_ENV': mode === 'production' ? '"production"' : '"development"',
    ...(mode === 'production' && {
      'import.meta.env.DEV': 'false',
      'import.meta.env.PROD': 'true'
    })
  },
  esbuild: {
    ...(mode === 'production' && {
      drop: ['console', 'debugger'],
      jsx: 'automatic'
    })
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-dom/client',
      'jspdf',
      'lucide-react'
    ],
    exclude: ['@testing-library/react', '@testing-library/jest-dom']
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    watch: {
      usePolling: process.env.NODE_ENV === 'development',
      interval: 2000, // Slower polling to reduce constant refreshing
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/coverage/**', '**/.vite/**', '**/DOCKER_SETUP.md**']
    },
    hmr: {
      port: 3000,
      clientPort: process.env.NODE_ENV === 'development' ? 3002 : 3000,
      host: 'localhost'
    },
    // Prevent automatic page reload on certain file changes
    middlewareMode: false,
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
}))