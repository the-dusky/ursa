/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  css: {
    modules: false,
    preprocessorOptions: {}
  }, // Disable CSS processing for tests
  test: {
    // Test environment
    environment: 'happy-dom',
    
    // Global test setup
    setupFiles: ['./src/test/setup.ts'],
    
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'src/test/setup.ts',
      'src/test/utils/**',
      'src/test/mocks/**'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts', // Barrel exports
        'src/types/**',
        'src/**/*.stories.*',
        'src/**/*.test.*',
        'src/**/*.spec.*'
      ],
      // Coverage thresholds
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Stricter thresholds for core state management
        'src/state/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Reporter configuration
    reporters: ['verbose', 'html'],
    outputFile: {
      html: './test-results/index.html'
    },
    
    // Watch mode settings - use boolean instead of object
    watchExclude: ['node_modules/**', '.next/**', 'dist/**'],
    
    // Globals (similar to Jest)
    globals: true,
    
    // Mock configuration
    deps: {
      inline: ['@testing-library/user-event']
    },
    
    // Pool configuration for better performance
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false
      }
    }
  },
  
  // Resolve configuration (for path aliases)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/test': path.resolve(__dirname, './src/test')
    }
  },
  
  // Define configuration for better IDE support
  define: {
    'import.meta.vitest': 'undefined'
  }
})