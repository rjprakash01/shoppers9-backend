import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { ProxyOptions } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      } as ProxyOptions,
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      } as ProxyOptions,
      '/auth': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      } as ProxyOptions
    }
  }
})
