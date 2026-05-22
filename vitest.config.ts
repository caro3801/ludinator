import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/**/*.config.*'],
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
})
