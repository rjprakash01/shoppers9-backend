import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    allowedHosts: [
      'shoppers9-demo.loca.lt',
      '33a69b5388ed738c9b695e95fec85d15.serveo.net',
      '3833ae7cec8a419bd5578d5a5dec5bbe.serveo.net',
      'localhost',
      '127.0.0.1',
      '192.168.1.5'
    ],
    proxy: {
      '/api': {
        target: 'http://192.168.1.5:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
