import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Production-specific Vite configuration for Vercel
export default defineConfig({
  plugins: [react()],
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
      }
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  esbuild: {
    drop: ['console', 'debugger']
  }
})