/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node', // Use node environment to avoid DOM/CSS issues
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'src/test/setup.ts',
      'src/test/utils/**'
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})