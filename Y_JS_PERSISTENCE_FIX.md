# Y.js Persistence Fix Summary

## The Problem
The Y.js persistence wasn't working because the `setupWSConnection` function from y-websocket doesn't accept a `persistence` parameter in its options. The persistence configuration was being ignored.

## The Solution
Y.js persistence must be configured globally using the `setPersistence` function before any connections are established. The correct implementation:

1. Import `setPersistence` from y-websocket utils
2. Create the LevelDB persistence instance
3. Call `setPersistence` with a proper configuration object
4. The persistence will automatically be applied to all documents

## Key Changes Made

### 1. Import the Required Functions
```javascript
import { setupWSConnection, setPersistence } from 'y-websocket/bin/utils'
import * as Y from 'yjs'
```

### 2. Configure Persistence Globally
```javascript
// Configure y-websocket to use our persistence
setPersistence({
  provider: ldb,
  bindState: async (docName, ydoc) => {
    try {
      // Load existing data from LevelDB
      const persistedYdoc = await ldb.getYDoc(docName)
      const persistedStateVector = Y.encodeStateVector(persistedYdoc)
      const diff = Y.encodeStateAsUpdate(persistedYdoc, Y.encodeStateVector(ydoc))
      
      // Apply persisted state to the new document
      if (diff.length > 0) {
        Y.applyUpdate(ydoc, diff)
        log(`📥 Loaded persisted state for room: ${docName} (${diff.length} bytes)`)
      }
      
      // Subscribe to updates
      ydoc.on('update', update => {
        ldb.storeUpdate(docName, update)
      })
      
      log(`🔗 Persistence bound for room: ${docName}`)
    } catch (err) {
      log(`⚠️ Error binding persistence for ${docName}: ${err.message}`, 'WARN')
    }
  },
  writeState: async (docName, ydoc) => {
    // This is called when all clients disconnect
    const update = Y.encodeStateAsUpdate(ydoc)
    await ldb.storeUpdate(docName, update)
    log(`💾 Persisted final state for room: ${docName}`)
  }
})
```

### 3. Simplified Connection Setup
```javascript
// Set up Y.js connection (persistence is now handled globally)
setupWSConnection(ws, req, {
  docName: roomName || 'default',
  gc: true // Enable garbage collection
})
```

## Testing Persistence

Use the provided test script to verify persistence is working:

```bash
# Start the server
pnpm server:dev

# In another terminal, run the test
node test-persistence.js
```

The test will:
1. Connect as Client 1 and set some data
2. Disconnect and reconnect as Client 2 to verify data persists
3. Update data with Client 3
4. Verify all changes with Client 4

## Docker Volume for Persistence

The Docker setup already includes a volume mount for persistence:
```yaml
volumes:
  - ./data/yjs-db:/app/db  # LevelDB data persists here
```

This ensures data persists between container restarts.

## Debugging Tips

1. **Check LevelDB Files**: Look in `./data/yjs-db/` for LevelDB files
2. **Monitor Server Logs**: The server now logs when persistence is loaded/saved
3. **Use Browser DevTools**: Check WebSocket messages for sync data
4. **Test Script**: Use the provided test script to verify persistence

## Common Issues

1. **Empty Data on Reconnect**: Usually means persistence isn't configured correctly
2. **Permission Errors**: Ensure Docker has write permissions to `./data/yjs-db/`
3. **Data Loss on Restart**: Check if the volume mount is working correctly

## Server Logs to Look For

- `🔗 Persistence bound for room: [roomName]` - Persistence initialized
- `📥 Loaded persisted state for room: [roomName]` - Data loaded from disk
- `💾 Persisted final state for room: [roomName]` - Data saved to disk