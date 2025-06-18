const Y = require('yjs');
const { WebsocketProvider } = require('y-websocket');

// --- Parse CLI args ---
const args = process.argv.slice(2);
const roomFlagIndex = args.indexOf('--room');
const roomName = roomFlagIndex !== -1 && args[roomFlagIndex + 1] ? args[roomFlagIndex + 1] : 'default-room';

console.log(`[Monitor] Connecting to room: ${roomName}`);

// --- Yjs setup ---
const doc = new Y.Doc();
const provider = new WebsocketProvider('ws://localhost:1234', roomName, doc);

// --- Track status ---
provider.on('status', ({ status }) => {
  console.log(`[WebSocket] Status: ${status}`);
});

// --- Observe Y.Map ---
const ymap = doc.getMap('sharedMap');
const knownValues = new Map();

ymap.observe(event => {
  console.log(`[Map Change] @ ${new Date().toISOString()}`);

  for (const [key, change] of event.changes.keys) {
    const newVal = ymap.get(key);
    const oldVal = knownValues.get(key);

    if (change.action === 'add') {
      console.log(`  [+] ${key} =`, newVal);
    } else if (change.action === 'update') {
      const isRevert = JSON.stringify(newVal) === JSON.stringify(oldVal);
      if (isRevert) {
        console.log(`  [~] ${key} reverted to previous value:`, newVal);
      } else {
        console.log(`  [~] ${key}: ${oldVal} → ${newVal}`);
      }
    } else if (change.action === 'delete') {
      console.log(`  [-] ${key} (was: ${JSON.stringify(oldVal)})`);
    }

    knownValues.set(key, newVal);
  }

  // Optional: dump current map
  // console.log('[State]', Object.fromEntries(ymap.entries()));
});