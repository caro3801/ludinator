import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
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
})
