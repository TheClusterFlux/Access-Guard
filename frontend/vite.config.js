import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' ? 'http://backend:3000' : 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 3002,
    host: '0.0.0.0',
    allowedHosts: '.theclusterflux.com'
  }
}) 