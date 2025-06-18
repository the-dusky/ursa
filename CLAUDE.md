# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context

Always read the CHANGELOG.md for context
Always look at tasks/todo.md for next steps

##Rules

- use pnpm for package management
  - do not use npm
  
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
- `npm run dev:full` - Start both WebSocket server and Next.js dev server (recommended for full development)
- `npm run dev` - Next.js development server only (Turbopack enabled)
- `npm run server` - Y.js WebSocket server only
- `npm run build` - Build Next.js application
- `npm run lint` - Run ESLint

### Testing & Quality
- `npm run lint` - ESLint for code quality

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