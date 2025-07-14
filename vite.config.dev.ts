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