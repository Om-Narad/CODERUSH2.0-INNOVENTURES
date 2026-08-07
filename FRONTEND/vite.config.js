import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages hosts under /<repo-name>/ — this prefix must match exactly
  base: '/CODERUSH2.0-INNOVENTURES/',

  plugins: [react(), tailwindcss()],

  server: {
    host: true,
    port: 5173,
    // DEV proxy: forwards /api → local FastAPI so we never hardcode localhost
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  },

  build: {
    // PRODUCTION FIX: raise warning threshold — MapLibre GL + framer-motion are large
    chunkSizeWarningLimit: 2000,

    rollupOptions: {
      output: {
        // Split heavy vendor libs into separate chunks so the main bundle stays small
        manualChunks: {
          'maplibre':    ['maplibre-gl'],
          'react-core':  ['react', 'react-dom'],
          'framer':      ['framer-motion'],
          'lucide':      ['lucide-react'],
        },
      },
    },
  },
})
