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

// --- Observe Y.Map (your game uses 'gameState' map) ---
const gameStateMap = doc.getMap('gameState');
const knownValues = new Map();
const knownTimes = new Map();

gameStateMap.observe(event => {
  console.log(`[GameState Change] @ ${new Date().toISOString()}`);

  for (const [key, change] of event.changes.keys) {
    const newVal = gameStateMap.get(key);
    const now = Date.now();
    const prev = knownValues.get(key);
    const prevTime = knownTimes.get(key);

    if (change.action === 'add') {
      console.log(`  [+] ${key} =`, typeof newVal === 'object' ? `[${newVal?.length || 'Object'}]` : newVal);
    } else if (change.action === 'update') {
      // Check for rapid flip-flops
      if (prev !== undefined && prevTime) {
        const delta = now - prevTime;
        if (delta < 500 && JSON.stringify(newVal) !== JSON.stringify(prev)) {
          console.log(`  [!] RAPID CHANGE: ${key} flip-flopped within ${delta}ms`);
        }
      }
      console.log(`  [~] ${key}: updated`, typeof newVal === 'object' ? `[${newVal?.length || 'Object'}]` : newVal);
    } else if (change.action === 'delete') {
      console.log(`  [-] ${key} (was: ${JSON.stringify(prev)})`);
    }

    knownValues.set(key, newVal);
    knownTimes.set(key, now);
  }

  // Optional: Show current game phase and player count for context
  const gamePhase = gameStateMap.get('gamePhase');
  const players = gameStateMap.get('players');
  const bearPlacementState = gameStateMap.get('bearPlacementState');
  
  if (gamePhase || players || bearPlacementState) {
    console.log(`  [Context] Phase: ${gamePhase}, Players: ${players?.length || 0}, BearState: ${bearPlacementState ? 'exists' : 'null'}`);
  }
});

console.log('[Monitor] Watching for gameState changes...');
console.log('[Monitor] Press Ctrl+C to exit');