#!/usr/bin/env node

/**
 * Simple Y.js WebSocket server that works with the frontend
 */

import { WebSocketServer } from 'ws'
import * as Y from 'yjs'

const PORT = process.env.PORT || 1234
const HOST = process.env.HOST || 'localhost'

console.log(`🚀 Starting Y.js WebSocket server on ws://${HOST}:${PORT}`)

const wss = new WebSocketServer({ 
  port: PORT,
  host: HOST 
})

// Store Y.Docs by room name
const docs = new Map()
const connections = new Map()

wss.on('connection', (ws, req) => {
  // Extract room name from URL path
  const roomName = req.url?.split('/')[1]?.split('?')[0] || 'default-room'
  
  console.log(`🔌 New connection to room: ${roomName}`)
  console.log(`👥 Total connections: ${wss.clients.size}`)
  
  // Get or create Y.Doc for this room
  if (!docs.has(roomName)) {
    const doc = new Y.Doc()
    docs.set(roomName, doc)
    console.log(`📄 Created new document for room: ${roomName}`)
  }
  
  const doc = docs.get(roomName)
  connections.set(ws, { roomName, doc })
  
  // Simple sync: send current state to new client
  const state = Y.encodeStateAsUpdate(doc)
  if (state.length > 0) {
    ws.send(state)
  }
  
  // Handle incoming updates
  ws.on('message', (message) => {
    try {
      // Apply update to document
      Y.applyUpdate(doc, new Uint8Array(message))
      
      // Broadcast to other clients in same room
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) { // OPEN
          const clientInfo = connections.get(client)
          if (clientInfo?.roomName === roomName) {
            client.send(message)
          }
        }
      })
    } catch (error) {
      console.error(`❌ Error processing message:`, error)
    }
  })
  
  // Forward document updates to clients
  const updateHandler = (update, origin) => {
    if (origin !== ws) {
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) {
          const clientInfo = connections.get(client)
          if (clientInfo?.roomName === roomName) {
            client.send(update)
          }
        }
      })
    }
  }
  
  doc.on('update', updateHandler)
  
  // Cleanup on close
  ws.on('close', () => {
    doc.off('update', updateHandler)
    connections.delete(ws)
    console.log(`🔌 Connection closed for room: ${roomName}`)
    
    // Clean up empty rooms
    setTimeout(() => {
      const hasConnections = Array.from(connections.values()).some(c => c.roomName === roomName)
      if (!hasConnections && docs.has(roomName)) {
        docs.delete(roomName)
        console.log(`🗑️ Cleaned up room: ${roomName}`)
      }
    }, 10000)
  })
  
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error:`, error)
  })
  
  console.log(`✅ Connected to room: ${roomName}`)
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
console.log(`🎮 Rooms will be created automatically`)
console.log(`🔧 Press Ctrl+C to stop\n`)