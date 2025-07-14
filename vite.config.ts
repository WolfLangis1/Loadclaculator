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
        manualChunks: {
          // Vendor chunk for React and core libraries
          vendor: ['react', 'react-dom'],
          // Calculations chunk for NEC calculations
          calculations: ['./src/services/necCalculations', './src/services/wireCalculations'],
          // UI components chunk
          ui: ['lucide-react'],
          // PDF and export functionality
          export: ['jspdf'],
          // Google APIs chunk
          maps: ['./src/services/aerialViewService', './src/services/googleSolarService']
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