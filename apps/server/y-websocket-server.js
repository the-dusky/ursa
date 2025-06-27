#!/usr/bin/env node

/**
 * Y.js WebSocket server using the standard y-websocket utilities
 */

import { WebSocketServer } from 'ws'
import * as Y from 'yjs'
import { setupWSConnection } from 'y-websocket/bin/utils'

const PORT = process.env.PORT || 1234
const HOST = process.env.HOST || '0.0.0.0'

console.log(`🚀 Starting Y.js WebSocket server on ws://${HOST}:${PORT}`)

const wss = new WebSocketServer({ 
  port: PORT,
  host: HOST 
})

wss.on('connection', (ws, req) => {
  console.log(`🔌 New connection from ${req.socket.remoteAddress}`)
  setupWSConnection(ws, req)
})

wss.on('error', (error) => {
  console.error('❌ Server error:', error)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...')
  wss.close(() => {
    console.log('✅ Server stopped')
    process.exit(0)
  })
})

console.log(`✅ Y.js WebSocket server ready on ws://${HOST}:${PORT}`)
console.log(`🎮 Using standard y-websocket protocol`)
console.log(`🔧 Press Ctrl+C to stop\n`)