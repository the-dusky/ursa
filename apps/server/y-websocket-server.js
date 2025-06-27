#!/usr/bin/env node

/**
 * Y.js WebSocket server for Seasonal Board Game
 * Optimized for Railway deployment with enhanced logging and monitoring
 */

import { WebSocketServer } from 'ws'
import * as Y from 'yjs'
import { setupWSConnection } from 'y-websocket/bin/utils'
import http from 'http'

const PORT = process.env.PORT || 1234
const HOST = process.env.HOST || '0.0.0.0'
const NODE_ENV = process.env.NODE_ENV || 'development'

// Enhanced logging with timestamps
const log = (message, level = 'INFO') => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [${level}] ${message}`)
}

log(`🚀 Starting Y.js WebSocket server`)
log(`📍 Environment: ${NODE_ENV}`)
log(`🌐 Host: ${HOST}:${PORT}`)

// Create HTTP server for health checks
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ 
      status: 'healthy', 
      service: 'y-websocket-server',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      connections: wss?.clients?.size || 0
    }))
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('WebSocket server - connect via ws://')
  }
})

// Create WebSocket server on the same HTTP server
const wss = new WebSocketServer({ 
  server,
  perMessageDeflate: false // Disable compression for better performance
})

// Connection tracking
let connectionCount = 0
const activeRooms = new Set()

wss.on('connection', (ws, req) => {
  connectionCount++
  const clientId = `client-${connectionCount}`
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  
  log(`🔌 New connection ${clientId} from ${clientIP}`)
  log(`👥 Total connections: ${wss.clients.size}`)
  
  // Track room from URL
  const url = new URL(req.url, `http://${req.headers.host}`)
  const roomName = url.searchParams.get('room') || url.pathname.slice(1)
  if (roomName) {
    activeRooms.add(roomName)
    log(`🏠 Client ${clientId} joined room: ${roomName}`)
  }
  
  // Set up Y.js connection
  setupWSConnection(ws, req)
  
  // Handle disconnection
  ws.on('close', () => {
    log(`🔌 Client ${clientId} disconnected`)
    log(`👥 Total connections: ${wss.clients.size}`)
    
    // Clean up empty rooms periodically
    if (wss.clients.size === 0) {
      activeRooms.clear()
      log(`🧹 Cleared empty rooms`)
    }
  })
  
  ws.on('error', (error) => {
    log(`❌ WebSocket error for ${clientId}: ${error.message}`, 'ERROR')
  })
})

wss.on('error', (error) => {
  log(`❌ Server error: ${error.message}`, 'ERROR')
})

// Start the server
server.listen(PORT, HOST, () => {
  log(`✅ Y.js WebSocket server ready on ws://${HOST}:${PORT}`)
  log(`🏥 Health check available at http://${HOST}:${PORT}/health`)
  log(`🎮 Using standard y-websocket protocol`)
  
  if (NODE_ENV === 'development') {
    log(`🔧 Press Ctrl+C to stop`, 'DEBUG')
  }
})

// Enhanced graceful shutdown
const gracefulShutdown = (signal) => {
  log(`🛑 Received ${signal}, shutting down gracefully...`)
  
  // Close all WebSocket connections
  wss.clients.forEach((ws) => {
    ws.close(1000, 'Server shutting down')
  })
  
  // Close the server
  server.close(() => {
    log('✅ Server stopped')
    process.exit(0)
  })
  
  // Force exit after 10 seconds
  setTimeout(() => {
    log('⚠️ Forced shutdown after timeout', 'WARN')
    process.exit(1)
  }, 10000)
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

// Log server stats every 5 minutes in production
if (NODE_ENV === 'production') {
  setInterval(() => {
    log(`📊 Stats - Connections: ${wss.clients.size}, Rooms: ${activeRooms.size}, Uptime: ${Math.floor(process.uptime())}s`)
  }, 300000) // 5 minutes
}