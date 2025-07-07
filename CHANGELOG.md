# Changelog

## [Unreleased] - 2025-07-07

### Added
- **Arena Combat System**
  - Implemented complete team-based combat mechanics for bears on same space
  - Added ArenaPanel component with multi-phase combat flow
  - Created hidden energy commitment phase with simultaneous reveal
  - Implemented skill-based dice rolls determined by committed energy
  - Added support for adjacent bears to join combat (1 energy cost)
  - Track combat casualties and team scores
  - Added 4 new arena actions: START_ARENA, JOIN_ARENA, COMMIT_ENERGY, RESOLVE_ARENA

- **Enhanced Turn and Round Tracking**
  - Separated turn counter (individual moves) from round counter (complete cycles)
  - Added bearTurn field to track individual bear lifespans
  - Added playerTurn field to track when players join the game
  - Implemented totalBearTurns and totalPlayerTurns for game analytics
  - Season advancement now based on complete rounds, not individual turns

- **Debug and Monitoring Tools**
  - Created StateDebugPanel component for real-time state monitoring
  - Shows player info, game state, bear placement, and multiplayer status
  - Added monitor.js Node.js script for Y.js WebSocket traffic analysis
  - Support for monitoring specific rooms with --room parameter
  - Tracks rapid state changes and identifies sync issues

- **Winter Resource Management**
  - Implemented resource perishing when transitioning to winter
  - Grains, berries, and salmon expire at winter start
  - Only honey and bear meat survive winter transitions
  - Added detailed logging of resources lost

### Changed
- **State Management Improvements**
  - Fixed Y.js sync with nullish coalescing (`??`) for boolean/numeric values
  - Added SimpleStateCoordinator for cleaner Y.js integration
  - Enhanced type safety in state conversions
  - Improved error handling in multiplayer synchronization

### Fixed
- Boolean and numeric value synchronization in multiplayer
- Prevented false/0 values from being lost in Y.js updates
- Enhanced test utilities to support new turn tracking fields

## [Unreleased] - 2025-07-02

### Added
- **Proper Game Setup Sequence**
  - Implemented strict phase-based setup: dice_roll → board_setup → bear_placement → playing
  - Added new game phases `dice_roll` and `board_setup` to replace generic `setup` phase
  - Enforced sequential setup flow preventing actions out of order
  - Added automatic phase progression when each setup step completes
- **Clean State Machine Architecture**
  - Implemented complete architectural overhaul with strict separation of concerns
  - Created single source of truth with `CoreGameState` interface
  - Added centralized `StateManager` for all state orchestration
  - Built type-safe `ActionDispatcher` system for all game actions
  - Implemented separate stores: `GameStateStore` (game data), `MultiplayerStore` (Y.js sync)
  - Added `StateCoordinator` for clean store synchronization
  - Created comprehensive test suite with 80+ tests covering all new components

- **Y.js Persistence and Multiplayer Improvements**
  - Added LevelDB persistence for Y.js server to maintain room configuration
  - Implemented event-driven Y.js observers replacing brittle retry mechanisms
  - Fixed room synchronization so all players transition together
  - Added "Start Game" button for room creator when enough players join
  - Enhanced logging system for multiplayer debugging

- **Board Adjacency System**
  - Created isolated `AdjacencyCalculator.ts` with angle-based edge detection
  - Added comprehensive regression tests to prevent adjacency bugs
  - Protected critical edge cases (e.g., R1-7 and R0-NORTH adjacency)

- **Development Workflow Enhancements**
  - Added logged development mode with real-time monitoring
  - Created test utilities and mock systems for Y.js and WebSocket
  - Implemented Vitest configuration with coverage reporting
  - Added Playwright MCP integration for UI testing

### Changed
- **Complete Migration from Legacy Architecture**
  - Replaced complex coupled state system with clean architecture
  - Eliminated all format conversions between state representations
  - Removed simulation system in favor of integrated game engine
  - Migrated from mixed-concern stores to single-responsibility stores
  - Updated all game components to use new `useGameState()` hook

### Fixed
- **Game Setup Flow Issues**
  - Fixed setup phase validation to prevent actions before dice rolling
  - Fixed bear placement to only start after board setup is complete
  - Fixed game started state to only trigger after all bears are placed
  - Updated UI components to properly handle new setup phases
  - Fixed TypeScript errors with obsolete 'setup' phase references

- **Harvest Restriction Bug**
  - Fixed GameEngine to use consistent piece object references
  - Preserved `movedThisTurn` flag through state updates
  - Moved `resetMovementFlags` to turn advancement (not phase advancement)
  - Bears that don't move can no longer harvest resources

- **Multiplayer Synchronization Issues**
  - Fixed `isGameStarted` synchronization across all players
  - Resolved `roomConfig.playerCount` undefined issue
  - Fixed race conditions with new lock pattern and debounced updates
  - Implemented timestamp-based conflict resolution

### Removed
- Legacy `gameStore.ts` (replaced by new architecture)
- Simulation system and `/simulation` page
- BearCard components (consolidated into main game components)
- Complex format conversion functions
- Coupled state management patterns

## [Released] - 2025-06-25

### Fixed
- **Code Quality and Build System**
  - Fixed all TypeScript compilation errors throughout codebase
  - Resolved ESLint issues by proper type definitions and unused variable cleanup
  - Exported missing TypeScript types (AIDecision, GameStatistics, BatchResults)
  - Replaced `any` types with proper type definitions for better type safety
  - Fixed import statements and removed unused variables across simulation system
  - Build now passes successfully with no lint or TypeScript errors

## [Released] - 2025-06-22

### Added
- **Brutal Winter Survival Mechanics**
  - Implemented harsh energy costs: 2 energy/day in mountains, 5 outside
  - Added same energy costs for movement
  - Capped energy at 20 maximum
  - Death now requires both 0 energy AND 0 fat
  - Added emergency energy system: 1 fat → 2 temporary energy at turn start

- **New Resources System**
  - Added honey resource (5 random forest spaces, 1→4 energy conversion)
  - Added bear meat resource (gained through fighting, 1→8 fat conversion)
  - Updated all UI components to display honey and bear meat
  - Added honey space visualization (🍯 icon) on game board

- **Fighting & Combat System**
  - Implemented bear-vs-bear combat based on total strength (fat + energy)
  - Winner gains bear meat from defeated opponent
  - Combat determines territorial control

- **Shared Rules Engine**
  - Created `/src/shared/gameRules.ts` with pure functions
  - Centralized all game mechanics for consistency
  - Eliminated code duplication between main game and simulation
  - Fixed salmon production rates (now 2/3/4 per season)

- **Real-time Simulation System**
  - Added SimulationVisualizer component with live progress updates
  - Created `/simulation` page for browser-based testing
  - Implemented progress callbacks showing win rates, survival rates, metrics
  - Added comprehensive game balance analysis tools

- **Enhanced Movement Phase Controls**
  - Manual energy tax payment (required before movement/harvest)
  - Per-bear fat-to-energy conversion buttons
  - Player choice system for survival mechanics
  - Blocking movement until tax obligations are met

### Updated
- Player control cards now show all 5 resources (grains, berries, salmon, honey, bear meat)
- Resource panel displays progress bars for all resources
- Rules reference card updated with complete mechanics
- Game store refactored to use shared rules engine
- Simulation engine unified with main game logic

### Fixed
- Router conflict between App Router and Pages Router for /simulation
- TypeScript errors with emergencyEnergy property
- Hardcoded values replaced with shared constants
- Energy tax now properly reduces energy (was clearing emergency energy)
- Harvest system now uses shared rules (was using hardcoded logic)
- Movement blocking until energy tax is paid

## [Previous] - 2025-01-21

### Added
- Enhanced game state management with detailed board structure
  - Implemented string-based space IDs (e.g., "R1-5", "R2-15") for better space identification
  - Added adjacency tracking for game spaces
  - Added board configuration with ring-based layout (5 rings with varying space counts)
  
- Implemented comprehensive turn phase system
  - Added turn phases: eat, movement, harvest, digestion
  - Implemented phase-specific actions (eatFood, harvestResources, digestFood)
  - Added nextTurnPhase function for turn progression
  
- Enhanced bear/cub resource management
  - Added stomach system for tracking consumed resources
  - Added fat resource type for bear survival
  - Implemented resource digestion mechanics
  
- UI State improvements
  - Added hoveredSpaceId for better user interaction
  - Enhanced space selection and highlighting system
  
- Build system updates
  - Successful build with no lint or TypeScript errors
  - Updated Next.js build artifacts

## Initial Setup
- Created project structure with Next.js 15 and Y.js WebSocket server
- Configured Tailwind CSS with custom game-themed colors
- Built game components (GameBoard, GameControls, etc.)
- Set up Zustand + Y.js state management architecture
- Added pnpm package management configuration