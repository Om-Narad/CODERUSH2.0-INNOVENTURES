import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/',   // ← changed for Vercel

  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  },

  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          'maplibre': ['maplibre-gl'],
          'react-core': ['react', 'react-dom'],
          'framer': ['framer-motion'],
          'lucide': ['lucide-react'],
        },
      },
    },
  },
})