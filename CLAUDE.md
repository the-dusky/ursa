# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **multiplayer board game application** ("Seasonal Board Game") built with Next.js 15 and real-time collaboration using Y.js WebSockets. The project implements a **clean state machine architecture** with strict separation of concerns to eliminate the complexity and race conditions of the previous system.

## Architecture

**CRITICAL:** `/Users/the_dusky/code/sandox/bears2/ARCHITECTURE.md` is the complete architectural bible. All new features MUST follow this clean architecture. Do not add code to old stores or create mixed-concern components.

### Core Architecture Principles

1. **Single Source of Truth**: `CoreGameState` is the ONLY state format used throughout the application
2. **Separation of Concerns**: Clear boundaries between game logic, multiplayer sync, and UI state
3. **Clean Data Flow**: UI → ActionDispatcher → GameEngine → StateManager → Store Updates
4. **Type Safety**: All actions are type-safe with validation, no `any` types

### Key Architecture Components

**State Layer (`/src/state/`)**:
- `CoreGameState.ts` - Single source of truth for all game data
- `StateManager.ts` - Central orchestrator for all state changes  
- `ActionDispatcher.ts` - Single entry point for all game actions
- `GameStateStore.ts` - React store for core game data ONLY
- `MultiplayerStore.ts` - React store for Y.js sync and room management ONLY
- `StateCoordinator.ts` - Coordinates between the two stores

**Engine Layer (`/src/engine/`)**:
- Game logic processing and validation
- Board generation and game mechanics
- Type definitions for core game concepts

## Task Management Workflow

When given a task, analyze and respond with:
1. "Here's the prompt I would execute:"
2. [Complete optimized prompt]
3. "This will use: [MCP servers/tools needed]"
4. "Should I proceed? (y/n)"

**MCP Server Usage:**
- Playwright MCP for UI changes and testing

## Development Commands

### Core Development
- `pnpm dev` - Next.js development server only (Turbopack enabled, port 8347)
- `pnpm dev:local` - Start both WebSocket server and Next.js dev server (recommended)
- `pnpm dev:remote` - Next.js dev server connecting to remote Y.js server
- `pnpm server` - Y.js WebSocket server only (Docker)
- `pnpm build` - Build Next.js application
- `pnpm lint` - Run ESLint

### Testing
- `pnpm test` - Run Vitest in watch mode
- `pnpm test:run` - Run tests once
- `pnpm test:ui` - Run tests with UI
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm test:watch` - Run tests in watch mode

### Quality Assurance Workflow
Always run in this order before committing:
1. `pnpm lint` - Must pass
2. `pnpm tsc` - TypeScript compilation must be error-free (from frontend directory)
3. `pnpm build` - Build must succeed

### Docker & Infrastructure
- `pnpm server:build` - Build Y.js WebSocket server
- `pnpm server:dev` - Start server in development mode
- `pnpm server:logs` - View server logs
- `pnpm server:stop` - Stop all Docker services

## UI Testing with Playwright MCP

### Starting Local Development with Logging
To properly monitor development and debug issues:

```bash
# 1. Create logs directory
mkdir -p logs

# 2. Start dev server with logging
pnpm dev:local > logs/dev.log 2>&1 &

# 3. Monitor logs in real-time (optional)
tail -f logs/dev.log
```

### Using Playwright for Testing
With the dev server running, use Playwright MCP to:

1. **Navigate to local server**: `http://localhost:8347`
2. **Inspect page elements**: Take snapshots and check UI components
3. **Monitor console errors**: Check for JavaScript errors
4. **Cross-reference logs**: Check `logs/dev.log` for server-side issues

### Benefits of This Approach
- **Real-time monitoring**: See errors immediately
- **Live testing**: Test changes as they sync from file edits
- **Comprehensive debugging**: View both client-side (Playwright) and server-side (logs) issues
- **Development efficiency**: No need to constantly restart servers

### Example Workflow
```bash
# Start logged development
pnpm dev:local > logs/dev.log 2>&1 &

# Make code changes (auto-sync)
# Use Playwright to test changes
# Check logs for any issues
cat logs/dev.log

# Stop server when done
pkill -f "pnpm dev:local"
```

## Rules

- **Package Management**: Use `pnpm` only, never `npm`
- **Docker**: Use `docker compose` (modern command), not `docker-compose`
- **Architecture**: Follow `/ARCHITECTURE.md` patterns strictly
- **State Management**: Always use `useGameState()` hook for main component state
- **Actions**: All game actions MUST go through ActionDispatcher
- **Types**: Strict TypeScript, no `any` types allowed

## Current Implementation Status

**✅ Completed Architecture**:
- Clean state machine with separation of concerns
- Type-safe action system with validation
- Multiplayer synchronization using Y.js CRDTs
- Comprehensive test suite (80+ tests)
- Race condition fixes implemented

**🚧 Current State**:
- Main page shows architecture status placeholder
- Game components need integration with new state system
- WebSocket server configured but may need updates
- Tests are mostly passing with new architecture

**🔜 Next Steps**:
- Integrate game components with new state system
- Migrate remaining components from old architecture
- Implement missing game UI features

## Known Patterns & Critical Fixes

### Adjacency Calculation (IMMUTABLE - DO NOT MODIFY)
**Problem**: Edge angle overlap detection for board adjacencies
**Solution**: Isolated `AdjacencyCalculator.ts` with comprehensive tests
**Files**: `src/engine/AdjacencyCalculator.ts`, `src/test/AdjacencyCalculator.test.ts`
**Protection**: Verification tests run on every board generation, 8 regression tests
**Critical Case**: R1-7 (right: 4.555309) and R0-NORTH (left: 4.556582) must NOT be adjacent

## Known Patterns & Critical Fixes

### Y.js Race Condition Fix (Implemented)
**Problem**: Multiplayer state updates causing data corruption
**Solution**: Lock pattern with `isUpdatingFromYjs` flag, nullish coalescing for boolean sync, debounced updates
**Files**: `apps/frontend/src/store/gameStore.ts` (legacy), state system (new)

### Boolean State Synchronization Fix (Implemented)  
**Problem**: `false` values being overridden in multiplayer sync
**Solution**: Use `??` instead of `||` for boolean fields
**Prevention**: Always use nullish coalescing for boolean/numeric multiplayer state

### Timestamp-Based Conflict Resolution (Implemented)
**Problem**: Stale state updates overwriting fresh data  
**Solution**: StateManager rejects updates with older timestamps
**Files**: `src/state/StateManager.ts`

## Usage Patterns

### ✅ CORRECT: Adding New Features
```typescript
// 1. Define action in ActionDispatcher.ts
export interface NewGameAction extends GameAction {
  type: 'NEW_ACTION'
  // ... action properties
}

// 2. Add to AnyGameAction union
export type AnyGameAction = MovePieceAction | NewGameAction | ...

// 3. Register handler and implement logic
dispatcher.registerHandler('NEW_ACTION', (state, action) => {
  // Process action, return new state
})

// 4. Use in components
const { actions } = useGameState()
actions.newAction(...)
```

### ✅ CORRECT: Component State Access
```typescript
function GameComponent() {
  const {
    // Game state
    players, currentPlayer, board, gamePhase,
    // Multiplayer state  
    multiplayer: { isConnected, roomId },
    // Actions
    actions: { movePiece, harvest },
    // System status
    isMultiplayer, isCoordinated
  } = useGameState()
}
```

### ❌ NEVER Do These Things
- Modify state directly
- Create format conversions between state types
- Mix concerns in stores (game logic in MultiplayerStore, etc.)
- Add UI state to game stores
- Skip action validation
- Use old `gameStore.ts` for new features
- Access StateManager directly from components

## File Structure

```
/src/state/           # New clean architecture (USE THIS)
├── index.ts          # Main export and useGameState()
├── CoreGameState.ts  # Single source of truth types
├── StateManager.ts   # Central state orchestrator
├── ActionDispatcher.ts # Action processing
├── GameStateStore.ts # Core game data store
├── MultiplayerStore.ts # Multiplayer sync store
└── StateCoordinator.ts # Store coordination

/src/store/           # Legacy stores
└── gameStore.old.ts  # DEPRECATED - do not use

/src/engine/          # Game logic layer
/src/components/      # React components
/src/test/           # Test utilities and regression tests
```

## Testing Architecture

The project has comprehensive test coverage for the new architecture:
- **Unit Tests**: Individual component testing (StateManager, ActionDispatcher, etc.)
- **Integration Tests**: Store coordination and multiplayer sync
- **Regression Tests**: Prevent known bugs from reappearing
- **Mock System**: Y.js and WebSocket mocking for reliable testing

### Running Specific Tests
```bash
# Run single test file
pnpm test StateManager.test.ts

# Run tests matching pattern
pnpm test --grep "multiplayer"

# Run with debugging
pnpm test --reporter=verbose
```

## Development Notes

- **Port**: Development server runs on `http://localhost:8347`
- **WebSocket**: Y.js server at `ws://localhost:1234`
- **State Format**: Single `CoreGameState` interface used everywhere
- **Multiplayer**: Real-time collaboration with conflict resolution
- **Board**: SVG-based circular board with 5 rings and 4 quadrants
- **Game Theme**: Seasonal bear survival with resource management

## Migration Status

- **Phase 1**: ✅ New architecture implemented
- **Phase 2**: ✅ TypeScript issues resolved, tests passing
- **Phase 3**: ✅ Y.js refactoring fixed - multiplayer working
- **Phase 4**: 🚧 Component migration to `useGameState()`  
- **Phase 5**: 🔜 Remove legacy stores
- **Phase 6**: 🔜 Add new features using clean architecture

## Current Status (Updated: 2025-07-03)

### ✅ **Y.js Multiplayer System WORKING**
- **WebSocket Server**: Running on `ws://localhost:1234` with LevelDB persistence
- **Frontend Integration**: Proper CRDT synchronization via StateCoordinator
- **Real-time Sync**: Client connections, room management, and state persistence working
- **Architecture**: Clean separation between game logic and multiplayer sync

### 🛠️ **Recent Fixes Applied**
- Fixed Y.js awareness import path and type handling
- Added missing type re-exports from YjsDocumentStructure
- Resolved observer callback handling and error management  
- Removed problematic require() imports in favor of ES6 imports
- Fixed Y.js observer parameter passing issues
- Added global safeCall helper to prevent callback duplicates

### 🚧 **Known Issues**
- ESLint warnings and unused variables (non-critical)
- Some legacy components not using new state system
- TypeScript strictness issues in legacy files

### 🎯 **Next Priorities**
1. Clean up lint warnings and unused imports
2. Migrate remaining components to useGameState()
3. Remove legacy store files
4. Add comprehensive error handling

Remember: This architecture prevents the complexity and bugs of the previous system. Following these patterns ensures maintainable, testable, and extensible code.