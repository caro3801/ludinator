import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/ws': {
        target: 'ws://localhost:3000/ws',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
      '@shared': '/src/shared',
      '@crew': '/src/crew',
      '@fest': '/src/fest',
      '@mioum': '/src/mioum',
      '@server': '/src/server',
      '@client': '/src/client',
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        fest: resolve(__dirname, 'fest.html'),
        mioum: resolve(__dirname, 'mioum.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
})
