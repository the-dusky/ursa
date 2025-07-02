# Clean State Machine Architecture - Design Document

## Overview

This document describes the clean, DRY state machine architecture implemented to replace the previous complex, coupled system. This architecture enforces **strict separation of concerns** and eliminates format conversions and race conditions.

**🚨 IMPORTANT: All new features MUST follow this architecture. Do not add code to the old stores or create new mixed-concern components.**

## Architecture Principles

### 1. **Single Source of Truth**
- `CoreGameState` is the ONLY state format used throughout the application
- No format conversions between UI, stores, engine, or multiplayer sync
- All state changes go through the centralized `StateManager`

### 2. **Separation of Concerns**
- **GameStateStore**: Core game data ONLY
- **MultiplayerStore**: Y.js sync and room management ONLY  
- **UIStore**: UI state ONLY (existing)
- **ActionDispatcher**: Action processing ONLY
- **StateManager**: State orchestration ONLY

### 3. **Clean Data Flow**
```
UI Component → ActionDispatcher → GameEngine → StateManager → Store Updates
                     ↓
              Multiplayer Sync (automatic)
```

### 4. **Type Safety**
- All actions are type-safe with validation
- State changes are validated before application
- No `any` types or loose interfaces

## Core Components

### `/src/state/CoreGameState.ts`
**Single source of truth for all game data**

```typescript
// ✅ CORRECT: Use this interface everywhere
export interface CoreGameState extends EngineGameState {
  gameId: string
  players: Player[]
  board: GameBoard
  diceState: DiceState
  isGameStarted: boolean
  createdAt: number
  lastUpdated: number
}

// ✅ CORRECT: Use utility functions
CoreGameStateUtils.getPiece(state, pieceId)
CoreGameStateUtils.getSpace(state, spaceId)
```

**❌ NEVER:**
- Create alternate state interfaces
- Convert between state formats
- Access state properties directly without utilities

### `/src/state/StateManager.ts`
**Central orchestrator for all state changes**

```typescript
// ✅ CORRECT: All state changes go through StateManager
const result = stateManager.updateState(newState, 'source')
const result = stateManager.transform(state => ({ ...state, turn: state.turn + 1 }))

// ✅ CORRECT: Listen to state changes
const unsubscribe = stateManager.addListener((newState, prevState) => {
  // React to state changes
})
```

**❌ NEVER:**
- Modify state directly
- Skip state validation
- Create multiple state managers

### `/src/state/ActionDispatcher.ts`
**Single entry point for all game actions**

```typescript
// ✅ CORRECT: All actions go through dispatcher
await dispatcher.dispatch({
  type: 'MOVE_PIECE',
  pieceId: 'bear-1',
  fromSpaceId: 'space-1',
  toSpaceId: 'space-2',
  playerId: 'player-1'
})

// ✅ CORRECT: Register new action handlers
dispatcher.registerHandler('NEW_ACTION', (state, action) => {
  // Process action and return new state
  return { success: true, state: newState }
})
```

**❌ NEVER:**
- Call engine methods directly from UI
- Create actions without going through dispatcher
- Skip action validation

### `/src/state/GameStateStore.ts`
**React store for core game data only**

```typescript
// ✅ CORRECT: Use provided hooks
const { players, currentPlayer, board } = useGameSelectors()
const { movePiece, harvest, advanceTurn } = useGameActions()

// ✅ CORRECT: Access specific state slices
const gamePhase = useGameStateStore(state => state.gameState.gamePhase)
```

**❌ NEVER:**
- Add UI state to this store
- Add multiplayer logic to this store
- Access state manager directly from components

### `/src/state/MultiplayerStore.ts`
**React store for multiplayer concerns only**

```typescript
// ✅ CORRECT: Use for multiplayer functionality
const { isConnected, roomId, playerNumber } = useMultiplayerSelectors()
const { connectToRoom, syncGameState } = useMultiplayerActions()

// ✅ CORRECT: Sync game state to multiplayer
syncGameState(coreGameState)
```

**❌ NEVER:**
- Add game logic to this store
- Handle game actions in this store
- Mix multiplayer concerns with game state

## Usage Patterns

### Adding New Features

#### ✅ CORRECT: Adding a New Game Action

1. **Define the action type**:
```typescript
// In ActionDispatcher.ts
export interface TradeResourceAction extends GameAction {
  type: 'TRADE_RESOURCE'
  fromPlayerId: string
  toPlayerId: string
  resourceType: 'grains' | 'berries' | 'salmon' | 'honey'
  amount: number
}
```

2. **Add to action union**:
```typescript
export type AnyGameAction = 
  | MovePieceAction
  | TradeResourceAction  // Add here
  | ...
```

3. **Register handler in GameEngineAdapter**:
```typescript
// In GameEngineAdapter.ts
dispatcher.registerHandler('TRADE_RESOURCE', (state, action) => 
  this.handleTradeResource(state, action)
)
```

4. **Implement handler**:
```typescript
private handleTradeResource(state: CoreGameState, action: TradeResourceAction): GameActionResult {
  // Validate trade
  // Update player resources
  // Return new state
}
```

5. **Add convenience method**:
```typescript
// In GameStateStore.ts
tradeResource: (fromPlayerId, toPlayerId, resourceType, amount) =>
  dispatch.dispatch({
    type: 'TRADE_RESOURCE',
    fromPlayerId,
    toPlayerId,
    resourceType,
    amount
  })
```

#### ✅ CORRECT: Adding UI State

```typescript
// In uiStore.ts (existing)
interface UIState {
  tradeDialogOpen: boolean
  selectedTradeResource: ResourceType | null
}
```

**❌ NEVER add UI state to GameStateStore or MultiplayerStore**

#### ✅ CORRECT: Using the Main Hook

```typescript
// In React components
function GameComponent() {
  const {
    // Game state
    players, currentPlayer, board, gamePhase,
    // Multiplayer state
    multiplayer: { isConnected, roomId, playerNumber },
    // Actions
    actions: { movePiece, harvest, tradeResource },
    // System status
    isMultiplayer, isCoordinated
  } = useGameState()
  
  // Component logic...
}
```

### Migration from Old Architecture

#### ✅ CORRECT: Migrating Components

```typescript
// ❌ OLD WAY
const { 
  players, 
  movePiece, 
  isConnected,
  gamePhase 
} = useGameStore() // Mixed concerns

// ✅ NEW WAY  
const {
  players,
  gamePhase,
  multiplayer: { isConnected },
  actions: { movePiece }
} = useGameState() // Clean separation
```

#### ✅ CORRECT: Backward Compatibility

The new architecture provides a compatibility layer:

```typescript
// ✅ TEMPORARY: Use during migration
const legacyStore = useGameStore() // Maps to new architecture

// ✅ FINAL: Migrate to new architecture
const gameState = useGameState()
```

## State Flow Diagrams

### Game Action Flow
```
[UI Component]
      ↓ (user action)
[ActionDispatcher.dispatch()]
      ↓ (validation)
[GameEngineAdapter]
      ↓ (game logic)
[GameEngine]
      ↓ (state update)
[StateManager.updateState()]
      ↓ (validation & notification)
[GameStateStore] ←→ [MultiplayerStore]
      ↓ (React updates)
[UI Re-render]
```

### Multiplayer Sync Flow
```
[Local State Change]
      ↓ (automatic)
[StateCoordinator]
      ↓ (sync)
[MultiplayerStore.syncGameState()]
      ↓ (Y.js)
[Remote Clients]
      ↓ (Y.js observer)
[MultiplayerStore.onGameStateSync()]
      ↓ (coordination)
[StateCoordinator]
      ↓ (update)
[GameStateStore.setState()]
```

## Rules and Constraints

### DO's ✅

1. **Always use `useGameState()` for main component state**
2. **All actions MUST go through ActionDispatcher**
3. **All state changes MUST go through StateManager**
4. **Use TypeScript strictly - no `any` types**
5. **Add validation for new actions**
6. **Test new features with both single-player and multiplayer**
7. **Use the provided utility functions for state access**
8. **Follow the naming conventions (PascalCase for types, camelCase for functions)**

### DON'Ts ❌

1. **NEVER modify state directly**
2. **NEVER create format conversions**
3. **NEVER mix concerns in stores**
4. **NEVER access StateManager directly from components**
5. **NEVER add game logic to MultiplayerStore**
6. **NEVER add multiplayer logic to GameStateStore**
7. **NEVER add UI state to game stores**
8. **NEVER skip action validation**
9. **NEVER create multiple sources of truth**
10. **NEVER use the old gameStore.ts for new features**

## Error Patterns to Avoid

### ❌ BAD: Mixed Concerns
```typescript
// DON'T do this - mixing game logic with multiplayer
const multiplayerStore = useMultiplayerStore()
if (multiplayerStore.isConnected) {
  // Game logic here - WRONG!
  calculateDamage(attacker, defender)
}
```

### ❌ BAD: Direct State Modification
```typescript
// DON'T do this - modifying state directly
const gameState = useGameStateStore(state => state.gameState)
gameState.turn += 1 // WRONG!
```

### ❌ BAD: Format Conversions
```typescript
// DON'T do this - creating conversions
function convertToEngineFormat(storeState) {
  return {
    // Converting between formats - WRONG!
  }
}
```

### ❌ BAD: Multiple Entry Points
```typescript
// DON'T do this - bypassing ActionDispatcher
gameEngine.executeMovement(state, action) // WRONG!
```

## Testing Patterns

### ✅ CORRECT: Testing Actions
```typescript
test('trading resources updates both players', async () => {
  const dispatcher = new ActionDispatcher(stateManager)
  const adapter = new GameEngineAdapter()
  adapter.registerHandlers(dispatcher)
  
  const result = await dispatcher.dispatch({
    type: 'TRADE_RESOURCE',
    fromPlayerId: 'player-1',
    toPlayerId: 'player-2',
    resourceType: 'grains',
    amount: 5
  })
  
  expect(result.success).toBe(true)
  expect(result.newState?.players[0].resources.grains).toBe(5)
})
```

### ✅ CORRECT: Testing State Changes
```typescript
test('state manager validates changes', () => {
  const stateManager = new StateManager(initialState)
  
  const invalidState = { ...initialState, turn: -1 }
  const result = stateManager.updateState(invalidState)
  
  expect(result.success).toBe(false)
  expect(result.error).toContain('turn must be >= 1')
})
```

## File Organization

```
/src/state/
├── index.ts                 # Main export and useGameState()
├── CoreGameState.ts         # Single source of truth types
├── StateManager.ts          # Central state orchestrator  
├── ActionDispatcher.ts      # Single action entry point
├── GameEngineAdapter.ts     # Engine integration
├── GameStateStore.ts        # Core game data store
├── MultiplayerStore.ts      # Multiplayer sync store
└── StateCoordinator.ts      # Store coordination

/src/store/
├── uiStore.ts              # UI state only (existing)
└── gameStore.ts            # DEPRECATED - do not use

/src/engine/                # Game logic (existing)
/src/components/            # React components
```

## Performance Considerations

1. **State Updates**: Only update state when truly necessary
2. **Multiplayer Sync**: Automatic batching prevents excessive Y.js updates
3. **Component Updates**: Use selectors to limit re-renders
4. **Action History**: Limited to 100 actions for memory management
5. **State Validation**: Cached validation to avoid repeated checks

## Development Tools

```typescript
// Debug hooks available
const debug = useGameStateDebug()
const coordDebug = useStateCoordinatorDebug()

// Inspect current state
console.log(debug.inspect())

// View action history
console.log(debug.game.getActionHistory())

// Manual sync (debugging)
debug.coordination.forceSyncToMultiplayer()
```

## Future Extensibility

This architecture makes it easy to add:

- **New game mechanics** (cub birth, fighting, trading)
- **Spectator mode** (separate viewer state)
- **Replay system** (action history)
- **Save/load games** (state snapshots)
- **AI players** (automated actions)
- **Tournament mode** (room management)

## Migration Timeline

1. **Phase 1**: ✅ **Complete** - New architecture implemented
2. **Phase 2**: Fix TypeScript issues and basic integration
3. **Phase 3**: Migrate existing components to `useGameState()`
4. **Phase 4**: Remove old `gameStore.ts` and `StateAdapter.ts`
5. **Phase 5**: Add new features using clean architecture

---

**Remember: This architecture is designed to prevent the complexity and bugs we had before. Following these patterns ensures maintainable, testable, and extensible code.**