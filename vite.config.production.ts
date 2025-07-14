import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Production-specific Vite configuration for Vercel
export default defineConfig({
  plugins: [react({
    // Ensure React is properly configured for production
    include: "**/*.{jsx,tsx}",
    babel: {
      plugins: []
    }
  })],
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          calculations: ['./src/services/necCalculations.ts', './src/services/wireCalculations.ts'],
          ui: ['lucide-react']
        }
      },
      external: [],
      // Ensure scheduler is properly handled
      onwarn(warning, warn) {
        // Suppress specific warnings that can cause issues
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
        if (warning.code === 'SOURCEMAP_ERROR') return
        warn(warning)
      }
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    'import.meta.env.DEV': 'false',
    'import.meta.env.PROD': 'true'
  },
  esbuild: {
    drop: ['console', 'debugger'],
    // Ensure JSX is properly handled
    jsx: 'automatic'
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-dom/client'
    ],
    exclude: ['@testing-library/react', '@testing-library/jest-dom']
  }
})