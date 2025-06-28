# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context

Always read the CHANGELOG.md for context
Always look at tasks/todo.md for next steps

### Task Management Workflow
When given a task, analyze and respond with:
1. "Here's the prompt I would execute:"
2. [Complete optimized prompt]
3. "This will use: [MCP servers/tools needed]"
4. "Should I proceed? (y/n)"

**MCP Server Usage:**
- Playwright MCP for UI changes and testing


**development server

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
pnpm dev:local > logs/shopify_dev.log 2>&1 &

# Make code changes (auto-sync)
# Use Playwright to test changes
# Check logs for any issues
cat logs/dev.log

# Stop server when done
pkill -f "pnpm dev:local"
```

##Rules

- use pnpm for package management
  - do not use npm
- use `docker compose` not `docker-compose` (modern Docker command)
  
## Tasks

Use the tasks/todo.md file as the source of truth. Work on it in order, asking if we are ready to move on.

## Git

Commit after finishing task sections
- pnpm lint
- if linting passes then
  - pnpm tsc
  - if pnpm tsc is free of errors then
    - pnpm build

Once we build is succesful
- update the changelog and cross of todos
- Then `git add` . and `git commit` and push

## Development Commands

### Core Development
- `pnpm dev:local` - Start both WebSocket server and Next.js dev server 
- `pnpm dev:remote` - Start Next.js dev server and connect to remote y.js
  (recommended for full development)
- `pnpm dev` - Next.js development server only (Turbopack enabled)
- `pnpm server` - Y.js WebSocket server only
- `pnpm build` - Build Next.js application
- `pnpm lint` - Run ESLint

### Testing & Quality
- `pnpm lint` - ESLint for code quality

## Project Architecture

This is a **multiplayer board game application** ("Seasonal Board Game") built with Next.js 15 and real-time collaboration using Y.js WebSockets.

### Key Components Architecture

**Frontend (Next.js App)**
- Next.js 15 with App Router and React 19
- Zustand state management integrated with Y.js for real-time multiplayer
- SVG-based circular game board with 5 concentric rings and 4 quadrants
- Tailwind CSS v4 with custom game-themed color palette
- Shadcn/ui component system (configured but components not yet populated)

**Backend (Separate Server)**
- Custom Y.js WebSocket server in `/server/` directory
- Handles real-time multiplayer synchronization using CRDTs
- Currently empty (`server/y-websocket-server.js` needs implementation)

### Game-Specific Architecture

**Board Structure**
- Circular board with 5 rings and 4 quadrants (Mountains, Pastures, Forests, Riverlands)
- SVG rendering with polar coordinates for space positioning
- Mountain quadrant has special Cave vs Hunting Ground mechanics
- Seasonal resource production system with bear survival mechanics

**State Management** (`/src/store/gameStore.ts`)
- Zustand store with Y.js WebSocket provider integration
- Conflict-free multiplayer state using Y.js CRDTs
- Game state includes player territories, resources, and seasonal mechanics

**Game Components** (`/src/components/game/`)
- `GameBoard.tsx` - Main SVG board rendering
- `GameControls.tsx`, `PlayerInfo.tsx`, `ResourcePanel.tsx` - UI controls
- `MultiplayerControls.tsx` - Real-time collaboration features
- Components are built but not integrated into main page yet

### Current Implementation Status

**Completed:**
- All dependencies installed and configured
- Game components built with sophisticated mechanics
- Tailwind configuration with custom game colors and animations
- Zustand + Y.js state management architecture

**Needs Implementation:**
- Main page (`/src/app/page.tsx`) still shows default Next.js starter
- WebSocket server (`/server/y-websocket-server.js`) is empty
- Shadcn/ui components not yet added to `/src/components/ui/`

### Configuration

**Tailwind CSS**: Custom game-themed colors (Mountain #8B7355, Pasture #90EE90, Forest #228B22, Riverland #4682B4) with seasonal animations

**Shadcn/ui**: Configured with "new-york" style, TypeScript enabled, path aliases set up

**Y.js Integration**: WebSocket provider configured for real-time multiplayer at `ws://localhost:1234`

## Development Notes

- Use `npm run dev:full` for full development experience with both servers
- Main game logic is in game store and components but needs integration
- Project uses both npm (main) and has pnpm-lock.yaml present
- WebSocket server needs implementation before multiplayer features work

## Known Patterns & Solutions

### Y.js Race Condition Fix (Implemented)

**Problem**: When Client A updates Yjs, Client B receives the update and triggers Zustand set(), which fires store subscription and calls syncToYjs(), potentially overwriting A's fresh data with B's stale copy.

**Solution Pattern** (implemented in `gameStore.ts:552-578`):
1. **Lock Pattern**: Use `isUpdatingFromYjs` flag to prevent recursive updates
   - Set `isUpdatingFromYjs = true` BEFORE calling `set()` in observer
   - Check flag in `syncToYjs` to avoid sending updates while receiving them
2. **Shallow Equality Check**: Compare current vs previous state using JSON.stringify
3. **Debounced Sync**: Use setTimeout(50ms) to batch rapid local changes
4. **Debug Logging**: Track update sources with console.log

**Files Modified**: 
- `apps/frontend/src/store/gameStore.ts` (lines 145-166, 241-284, 552-578, 1039-1044)

**Prevention**: Always implement this pattern when adding new Yjs synchronization to prevent data corruption in multiplayer scenarios.

### Y.js Boolean State Synchronization Fix (Implemented)

**Problem**: Player 2 was not being asked for energy tax on their first turn because boolean `false` values were being incorrectly overridden by local fallback values in multiplayer synchronization.

**Root Cause**: Using logical OR (`||`) instead of nullish coalescing (`??`) for boolean state fields:
```typescript
// WRONG - false values fallback to local state
energyTaxPaid: yjsState.energyTaxPaid || get().energyTaxPaid

// CORRECT - only null/undefined values fallback  
energyTaxPaid: yjsState.energyTaxPaid ?? get().energyTaxPaid
```

**Solution**: Use nullish coalescing (`??`) for boolean and numeric fields in Yjs observer (line 594).

**Files Modified**: 
- `apps/frontend/src/store/gameStore.ts` (line 594)

**Prevention**: Always use `??` instead of `||` for boolean and numeric state synchronization in multiplayer games.

### Multiplayer UI Update Race Condition Fix (Implemented)

**Problem**: Local UI changes (like energy tax payment) were not immediately reflecting on the current player's screen but were visible on other players' screens. UI updates would only appear after a phase change or other state update.

**Root Cause**: Double synchronization to Yjs was creating race conditions:
1. Action methods manually synced to Yjs immediately
2. Store subscription also synced to Yjs with 50ms debounce  
3. Remote Yjs updates could override local changes during this timing window

**Solution**: Remove all manual `gameStateMap.set()` calls from action methods and rely solely on the store subscription for Yjs synchronization.

**Files Modified**:
- `apps/frontend/src/store/gameStore.ts` (lines 786-800, 816-825, 835-842)

**Methods Fixed**:
- `updateFromEngineState` - removed manual energy tax sync
- `updateBoardRotations` - removed manual board/player sync  
- `updateDiceState` - removed manual dice state sync

**Prevention**: Never manually sync to Yjs in action methods - let the store subscription handle all Yjs synchronization to avoid race conditions.