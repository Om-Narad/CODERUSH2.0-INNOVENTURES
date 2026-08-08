import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // base: '/' is required for Vercel (and any root-based deployment).
  // Do NOT change this to a sub-path unless you are hosting on GitHub Pages
  // with a repo sub-path — and even then, set it via VITE_BASE_PATH env var.
  base: '/',

  plugins: [react(), tailwindcss()],

  server: {
    host: true,
    port: 5173,
    // Dev proxy: forwards /api/* → FastAPI backend on localhost.
    // This lets the frontend use fetch(`${API_URL}/api/...`) uniformly
    // in both dev (proxy rewrites) and production (VITE_API_URL set).
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
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