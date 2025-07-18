import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Production-ready Vite configuration in JavaScript
// Eliminates TypeScript import issues during Vercel deployment
export default defineConfig(({ mode }) => {
  // Load environment variables for both VITE_ prefixed and non-prefixed
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false, // Disable in production for smaller bundle
      minify: 'esbuild', // Use esbuild instead of terser to avoid Rollup issues
      target: 'es2015', // Better browser compatibility
      chunkSizeWarningLimit: 1000, // Warn for chunks over 1MB
      rollupOptions: {
        // Disable native modules to avoid Windows issues
        external: [],
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
    // Production-specific settings and environment variable exposure
    define: {
      'process.env.NODE_ENV': mode === 'production' ? '"production"' : '"development"',
      // Expose environment variables without VITE_ prefix for client access
      'import.meta.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
      'import.meta.env.USE_REAL_AERIAL_DATA': JSON.stringify(env.USE_REAL_AERIAL_DATA),
      'import.meta.env.AERIAL_PROVIDER': JSON.stringify(env.AERIAL_PROVIDER),
      'import.meta.env.MAPBOX_API_KEY': JSON.stringify(env.MAPBOX_API_KEY),
      'import.meta.env.REACT_APP_STRIPE_DONATION_URL': JSON.stringify(env.REACT_APP_STRIPE_DONATION_URL),
      'import.meta.env.API_BASE_URL': JSON.stringify(env.API_BASE_URL),
      'import.meta.env.API_URL': JSON.stringify(env.API_URL),
      'import.meta.env.VERCEL_ENV': JSON.stringify(env.VERCEL_ENV),
      'import.meta.env.NODE_ENV': JSON.stringify(env.NODE_ENV),
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
        usePolling: false, // Disable polling to prevent constant reloads
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/coverage/**', '**/.vite/**', '**/DOCKER_SETUP.md**', '**/test-api-keys.js**']
      },
      hmr: {
        port: 3001,
        host: 'localhost'
      },
      // Prevent automatic page reload on certain file changes
      middlewareMode: false,
      // Proxy API requests to serverless functions during development
      proxy: mode === 'development' ? {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          configure: (proxy, options) => {
            // Custom middleware to handle serverless function simulation
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('Proxying API request:', req.url);
            });
          }
        }
      } : {}
    }
  }
})