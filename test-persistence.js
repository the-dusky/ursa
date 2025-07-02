#!/usr/bin/env node

/**
 * Test script to verify Y.js persistence is working correctly
 */

import WebSocket from 'ws'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const ROOM_NAME = 'test-persistence-room'
const WS_URL = 'ws://localhost:1234'

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testConnection(clientName, testData) {
  return new Promise((resolve, reject) => {
    log(`\n${clientName} connecting to room: ${ROOM_NAME}`, 'cyan')
    
    const ydoc = new Y.Doc()
    const wsProvider = new WebsocketProvider(WS_URL, ROOM_NAME, ydoc, {
      WebSocketPolyfill: WebSocket
    })
    
    const ymap = ydoc.getMap('test-data')
    
    wsProvider.on('status', event => {
      log(`${clientName} status: ${event.status}`, 'yellow')
    })
    
    wsProvider.once('sync', isSynced => {
      if (isSynced) {
        log(`${clientName} synced successfully`, 'green')
        
        // Check existing data
        const existingData = ymap.toJSON()
        log(`${clientName} found existing data:`, 'blue')
        console.log(existingData)
        
        // Add test data if provided
        if (testData) {
          Object.entries(testData).forEach(([key, value]) => {
            ymap.set(key, value)
            log(`${clientName} set ${key} = ${value}`, 'green')
          })
        }
        
        // Wait a bit for data to sync
        setTimeout(() => {
          wsProvider.disconnect()
          wsProvider.destroy()
          ydoc.destroy()
          resolve(ymap.toJSON())
        }, 1000)
      }
    })
    
    wsProvider.on('connection-error', error => {
      log(`${clientName} connection error: ${error}`, 'red')
      reject(error)
    })
    
    // Timeout after 5 seconds
    setTimeout(() => {
      wsProvider.disconnect()
      wsProvider.destroy()
      reject(new Error(`${clientName} connection timeout`))
    }, 5000)
  })
}

async function runTest() {
  try {
    log('\n=== Y.js Persistence Test ===', 'bright')
    
    // Test 1: First client sets data
    log('\nTest 1: First client sets initial data', 'bright')
    const testData1 = {
      timestamp: new Date().toISOString(),
      message: 'Hello from first client',
      counter: 1
    }
    await testConnection('Client 1', testData1)
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Test 2: Second client connects and should see the data
    log('\nTest 2: Second client connects to check persistence', 'bright')
    const result = await testConnection('Client 2', null)
    
    // Verify persistence
    if (result.timestamp && result.message && result.counter) {
      log('\n✅ PERSISTENCE TEST PASSED!', 'green')
      log('Data successfully persisted between connections', 'green')
    } else {
      log('\n❌ PERSISTENCE TEST FAILED!', 'red')
      log('Data was not persisted between connections', 'red')
    }
    
    // Test 3: Third client updates data
    log('\nTest 3: Third client updates the data', 'bright')
    const testData3 = {
      counter: 2,
      updatedAt: new Date().toISOString(),
      newField: 'Added by client 3'
    }
    await testConnection('Client 3', testData3)
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Test 4: Fourth client verifies all changes
    log('\nTest 4: Fourth client verifies all changes', 'bright')
    const finalResult = await testConnection('Client 4', null)
    
    log('\nFinal persisted data:', 'cyan')
    console.log(finalResult)
    
    if (finalResult.counter === 2 && finalResult.newField) {
      log('\n✅ ALL TESTS PASSED!', 'green')
    } else {
      log('\n❌ SOME TESTS FAILED!', 'red')
    }
    
  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red')
    console.error(error)
  }
  
  process.exit(0)
}

// Run the test
runTest()