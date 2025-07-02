/**
 * Test Setup - Global test configuration for Vitest
 * 
 * This file sets up the testing environment for our clean state architecture.
 * It includes mocks, global utilities, and test helpers.
 */

import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock console methods for cleaner test output
const originalConsole = { ...console }

// Mock all console methods for testing
global.console = {
  ...originalConsole,
  log: vi.fn(), // Mock console.log
  debug: vi.fn(), // Mock console.debug
  info: vi.fn(), // Mock console.info
  error: vi.fn(), // Mock console.error
  warn: vi.fn() // Mock console.warn
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue('')
  }
})

// Mock window.location for router tests
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000',
    search: '',
    pathname: '/',
    hash: ''
  },
  writable: true
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock WebSocket for multiplayer tests
const MockWebSocket = vi.fn().mockImplementation(() => ({
  close: vi.fn(),
  send: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1, // OPEN
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}))

// Add static properties to the mock constructor
;(MockWebSocket as typeof MockWebSocket & { CONNECTING: number; OPEN: number; CLOSING: number; CLOSED: number }).CONNECTING = 0
;(MockWebSocket as typeof MockWebSocket & { CONNECTING: number; OPEN: number; CLOSING: number; CLOSED: number }).OPEN = 1
;(MockWebSocket as typeof MockWebSocket & { CONNECTING: number; OPEN: number; CLOSING: number; CLOSED: number }).CLOSING = 2
;(MockWebSocket as typeof MockWebSocket & { CONNECTING: number; OPEN: number; CLOSING: number; CLOSED: number }).CLOSED = 3

global.WebSocket = MockWebSocket as unknown as typeof WebSocket

// Mock Y.js for multiplayer tests
vi.mock('yjs', () => ({
  Doc: vi.fn().mockImplementation(() => ({
    getMap: vi.fn().mockReturnValue({
      set: vi.fn(),
      get: vi.fn(),
      toJSON: vi.fn().mockReturnValue({}),
      observe: vi.fn(),
      unobserve: vi.fn()
    }),
    destroy: vi.fn()
  })),
  Map: vi.fn()
}))

// Mock y-websocket for multiplayer tests
vi.mock('y-websocket', () => ({
  WebsocketProvider: vi.fn().mockImplementation(() => {
    const listeners = new Map<string, ((event: unknown) => void)[]>()
    
    const provider = {
      on: vi.fn((event: string, callback: (event: unknown) => void) => {
        if (!listeners.has(event)) {
          listeners.set(event, [])
        }
        listeners.get(event)!.push(callback)
        
        // Auto-trigger connection for tests - use immediate callback instead of setTimeout
        if (event === 'status') {
          // Call immediately in the same tick
          callback({ status: 'connected' })
        }
      }),
      off: vi.fn(),
      destroy: vi.fn(),
      ws: { readyState: 1 }
    }
    
    return provider
  })
}))

// Global test utilities
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Vi {
    interface JestAssertion<T = unknown> {
      toBeWithinRange(floor: number, ceiling: number): T
    }
  }
}

// Custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true
      }
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false
      }
    }
  }
})

// Extend the Jest matchers with our custom ones
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Vi {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Assertion<T = unknown> {
      toBeWithinRange(floor: number, ceiling: number): void
    }
  }
}

// Setup cleanup after each test
afterEach(() => {
  // Clear all mocks
  vi.clearAllMocks()
  
  // Clear localStorage/sessionStorage mocks
  localStorageMock.clear()
  sessionStorageMock.clear()
  
  // Reset console mocks
  vi.mocked(console.log).mockClear()
  vi.mocked(console.debug).mockClear()
  vi.mocked(console.info).mockClear()
  vi.mocked(console.error).mockClear()
  vi.mocked(console.warn).mockClear()
})

// Setup before each test
beforeEach(() => {
  // Reset localStorage mock return values
  localStorageMock.getItem.mockReturnValue(null)
  sessionStorageMock.getItem.mockReturnValue(null)
})