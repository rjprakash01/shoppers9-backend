import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { ProxyOptions } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5002',
        changeOrigin: true,
        secure: false,
      } as ProxyOptions,
      '/uploads': {
        target: 'http://127.0.0.1:5002',
        changeOrigin: true,
        secure: false
      } as ProxyOptions,
      '/auth': {
        target: 'http://127.0.0.1:5002',
        changeOrigin: true,
        secure: false
      } as ProxyOptions
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
