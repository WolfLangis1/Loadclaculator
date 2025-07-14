import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable in production for smaller bundle
    minify: 'terser',
    target: 'es2015', // Better browser compatibility
    chunkSizeWarningLimit: 1000, // Warn for chunks over 1MB
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          if (id.includes('node_modules/jspdf')) {
            return 'pdf';
          }
          if (id.includes('node_modules/@testing-library') || id.includes('node_modules/vitest')) {
            return 'testing';
          }
          
          // Application chunks
          if (id.includes('src/services/necCalculations') || id.includes('src/services/wireCalculations')) {
            return 'calculations';
          }
          if (id.includes('src/services/aerialView') || id.includes('src/services/googleSolar')) {
            return 'maps';
          }
          if (id.includes('src/components/LoadCalculator/LoadTables')) {
            return 'load-tables';
          }
          if (id.includes('src/components/UI')) {
            return 'ui-components';
          }
          if (id.includes('src/components/AerialView') || id.includes('src/components/SLD')) {
            return 'advanced-features';
          }
          
          // Default chunk
          return 'main';
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
  },
})