# Changelog

## [Unreleased] - 2025-06-25

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