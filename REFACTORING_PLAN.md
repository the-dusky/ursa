# Codebase Refactoring Plan

## Overview
This plan addresses the separation of game engine logic from UI logic and centralizes all game parameters for better maintainability and testability.

## Current Problems

### 1. Monolithic Game Store (2049 lines)
- **Issue**: `gameStore.ts` handles game logic, UI state, networking, and turn management
- **Impact**: Hard to test, maintain, and debug individual components

### 2. Scattered Parameters 
- **Issue**: Game parameters defined in multiple places with inconsistencies
- **Examples**: 
  - Hibernation cost: 35 in gameStore.ts vs 20 in PlayerControlCard.tsx
  - Movement costs hardcoded in multiple locations
  - Energy limits scattered throughout codebase

### 3. UI Logic Mixed with Game Logic
- **Issue**: Components like `PlayerControlCard.tsx` contain game validation and state manipulation
- **Impact**: Violates separation of concerns, makes testing difficult

## Refactoring Strategy

### Phase 1: Create Game Engine Core
**Goal**: Extract pure game logic into a separate engine layer

#### 1.1 Create Configuration System
```
src/engine/
  ├── GameConfig.ts          // All game parameters centralized
  ├── types/
  │   ├── GameState.ts       // Core game state interfaces
  │   ├── Actions.ts         // Action type definitions
  │   └── Config.ts          // Configuration type definitions
  └── GameEngine.ts          // Pure game logic engine
```

**Key Files to Create**:

**`src/engine/GameConfig.ts`**
```typescript
export const GAME_CONFIG = {
  movement: {
    baseCost: (fat: number) => fat <= 5 ? 1 : fat <= 15 ? 2 : 3,
    winterCost: { mountains: 2, outside: 5 }
  },
  hibernation: {
    fatCost: 35,
    energyReset: 5
  },
  energy: {
    maxEnergy: 20,
    dailyLoss: { winter: { mountains: 2, outside: 5 }, other: 1 },
    emergencyConversion: 2  // 1 fat = 2 emergency energy
  },
  combat: {
    strengthFormula: (piece: GamePiece) => piece.fat + piece.energy + piece.emergencyEnergy,
    randomnessRange: { min: 0.8, max: 1.2 },
    bearMeatReward: (loser: GamePiece) => Math.max(1, Math.floor((loser.fat + loser.energy) / 5))
  },
  resources: {
    conversion: {
      energy: { grains: 3, berries: 2, salmon: 1, honey: 4, bearMeat: 6 },
      fat: { grains: 1, berries: 2, salmon: 4, honey: 3, bearMeat: 8 }
    },
    seasonal_production: {
      Spring: { grains: 4, berries: 1, salmon: 2, honey: 1 },
      Summer: { grains: 3, berries: 3, salmon: 3, honey: 2 },
      Autumn: { grains: 3, berries: 2, salmon: 4, honey: 1 },
      Winter: { grains: 1, berries: 0, salmon: 0, honey: 0 }
    }
  }
}
```

**`src/engine/GameEngine.ts`**
```typescript
export class GameEngine {
  constructor(private config: GameConfig = GAME_CONFIG) {}

  // Pure functions for game logic
  executeMovement(state: GameState, action: MovementAction): GameResult<GameState>
  executeEating(state: GameState, action: EatingAction): GameResult<GameState>
  executeHibernation(state: GameState, action: HibernationAction): GameResult<GameState>
  executeTurnAdvancement(state: GameState): GameResult<GameState>
  
  // Validation functions
  canExecuteMovement(state: GameState, action: MovementAction): ValidationResult
  canExecuteEating(state: GameState, action: EatingAction): ValidationResult
  
  // State queries
  getValidMoves(state: GameState, pieceId: string): GameSpace[]
  calculateScore(state: GameState, playerId: string): number
}
```

#### 1.2 Extract Actions from Game Store
**Goal**: Move all game logic out of the store into pure functions

**Current Problem** (in gameStore.ts lines 915-956):
```typescript
eatFood: (pieceId, resourceType, amount, convertTo) => {
  // 40+ lines of game logic mixed with state management
  const state = get()
  const pieceSpace = Object.values(state.board.spaces).find(s => s.piece?.id === pieceId)
  // ... complex logic inside store action
}
```

**Refactored Approach**:
```typescript
// src/engine/actions/EatingActions.ts
export const executeEating = (state: GameState, action: EatingAction, config: GameConfig): GameResult<GameState> => {
  // Pure function - no side effects
  const validation = validateEating(state, action, config)
  if (!validation.valid) {
    return { success: false, error: validation.error, state }
  }
  
  const newState = applyEatingLogic(state, action, config)
  return { success: true, state: newState, message: validation.message }
}

// src/store/gameStore.ts (simplified)
eatFood: (pieceId, resourceType, amount, convertTo) => {
  const currentState = convertZustandToGameState(get())
  const action = { pieceId, resourceType, amount, convertTo }
  const result = gameEngine.executeEating(currentState, action)
  
  if (result.success) {
    set(convertGameStateToZustand(result.state))
    get().addToLog(result.message)
  } else {
    get().addToLog(result.error)
  }
}
```

### Phase 2: Separate UI State from Game State
**Goal**: Clean separation between game data and UI presentation state

#### 2.1 Split State Management
```
src/store/
  ├── gameStore.ts          // Pure game state (board, players, turn)
  ├── uiStore.ts           // UI state (selections, highlights, modals)
  ├── multiplayerStore.ts  // Y.js networking logic
  └── actions/
      ├── gameActions.ts   // Game action creators
      └── uiActions.ts     // UI action creators
```

**Current Mixed State** (gameStore.ts lines 78-102):
```typescript
interface GameState {
  // Game data
  board: Board
  players: Player[]
  currentPlayerIndex: number
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter'
  
  // UI state (should be separate!)
  selectedSpaceId: string | null
  selectedPieceId: string | null
  highlightedSpaces: string[]
  hoveredSpaceId: string | null
  showRules: boolean
  gameLog: string[]
}
```

**Refactored Separation**:
```typescript
// src/store/gameStore.ts
interface GameState {
  board: Board
  players: Player[]
  currentPlayerIndex: number
  season: Season
  year: number
  turn: number
  gamePhase: GamePhase
  turnPhase: TurnPhase
  energyTaxPaid: boolean
}

// src/store/uiStore.ts  
interface UIState {
  selectedSpaceId: string | null
  selectedPieceId: string | null
  highlightedSpaces: string[]
  hoveredSpaceId: string | null
  showRules: boolean
  gameLog: string[]
  modals: {
    rulesOpen: boolean
    multiplayerOpen: boolean
  }
}
```

#### 2.2 Create Action Creators
**Goal**: Clean interface between UI and game logic

**src/store/actions/gameActions.ts**
```typescript
export const useGameActions = () => {
  const gameStore = useGameStore()
  const uiStore = useUIStore()
  
  return {
    eatFood: (action: EatingAction) => {
      const result = gameEngine.executeEating(gameStore.getState(), action)
      if (result.success) {
        gameStore.setState(result.state)
        uiStore.addLogMessage(result.message)
      } else {
        uiStore.addLogMessage(result.error)
      }
    },
    
    movePiece: (action: MovementAction) => {
      // Similar pattern for all game actions
    }
  }
}
```

### Phase 3: Clean Up Components
**Goal**: Remove game logic from UI components

#### 3.1 Refactor PlayerControlCard Component
**Current Issue** (PlayerControlCard.tsx lines 84-92):
```typescript
const handleEatResource = (pieceId: string, resourceType: string, convertTo: string) => {
  if (!isCurrentPlayer || turnPhase !== 'eat') return
  
  // Game logic validation in UI component!
  const piece = player?.pieces.find(p => p.id === pieceId)
  if (!piece || piece.resources[resourceType] <= 0) return
  
  eatFood(pieceId, resourceType, 1, convertTo)
}
```

**Refactored Approach**:
```typescript
const PlayerControlCard = ({ playerId }: Props) => {
  const actions = useGameActions()
  const gameState = useGameStore()
  const uiState = useUIStore()
  
  const handleEatResource = (pieceId: string, resourceType: ResourceType, convertTo: ConversionType) => {
    // No validation logic in UI - engine handles all validation
    actions.eatFood({
      pieceId,
      resourceType,
      amount: 1,
      convertTo
    })
  }
  
  // Component focuses purely on presentation
}
```

#### 3.2 Standardize Parameter Usage
**Current Inconsistency**:
- Hibernation cost: 35 in gameStore.ts, 20 in PlayerControlCard.tsx
- Movement costs calculated differently in multiple places

**Solution**: All components import from centralized config
```typescript
import { GAME_CONFIG } from '../engine/GameConfig'

// Use config values everywhere
const hasEnoughFat = piece.fat >= GAME_CONFIG.hibernation.fatCost
const movementCost = GAME_CONFIG.movement.baseCost(piece.fat)
```

### Phase 4: Update Simulation System
**Goal**: Use the same engine and config for simulation consistency

#### 4.1 Align Simulation with Main Game
**Current**: Simulation has separate state factory and some different logic
**Target**: Use same GameEngine and GameConfig for both main game and simulation

```typescript
// src/simulation/SimulationEngine.ts
import { GameEngine } from '../engine/GameEngine'
import { GAME_CONFIG } from '../engine/GameConfig'

export class SimulationEngine {
  private gameEngine = new GameEngine(GAME_CONFIG)
  
  runGame(config: SimulationConfig): GameStatistics {
    let gameState = this.initializeGame(config)
    
    while (!this.isGameComplete(gameState)) {
      const aiDecisions = this.getAIDecisions(gameState)
      
      for (const decision of aiDecisions) {
        const result = this.gameEngine.executeAction(gameState, decision)
        if (result.success) {
          gameState = result.state
        }
      }
    }
    
    return this.generateStatistics(gameState)
  }
}
```

## Implementation Order

### Week 1: Foundation
1. Create `src/engine/GameConfig.ts` with all parameters centralized
2. Create `src/engine/types/` with clean type definitions
3. Update shared gameRules.ts to use centralized config

### Week 2: Game Engine
1. Create `src/engine/GameEngine.ts` with pure game logic
2. Extract eating logic from gameStore.ts into engine
3. Extract movement logic from gameStore.ts into engine

### Week 3: State Separation  
1. Create `src/store/uiStore.ts` for UI-only state
2. Create action creators in `src/store/actions/`
3. Refactor gameStore.ts to use engine

### Week 4: Component Cleanup
1. Remove game logic from PlayerControlCard component
2. Remove game logic from GameControls component  
3. Update all components to use centralized config

### Week 5: Simulation Alignment
1. Update simulation system to use main GameEngine
2. Ensure simulation uses same config as main game
3. Add config-based testing for balance adjustments

## Expected Benefits

### 1. Better Testability
- Pure functions easy to unit test
- Game logic isolated from UI concerns
- Simulation and main game guaranteed consistent

### 2. Easier Game Balancing
- Single config file to adjust all parameters
- A/B testing different configurations
- Data-driven balance decisions

### 3. Improved Maintainability
- Clear separation of concerns
- Smaller, focused files
- Consistent patterns throughout codebase

### 4. Enhanced Development Experience
- Faster debugging with isolated components
- Easier to add new features
- Better code reuse between UI and simulation

## Migration Strategy

### Backward Compatibility
- Keep existing store interface during transition
- Gradual migration of components
- Feature flags for new vs old logic during development

### Testing Strategy
- Unit tests for all engine functions
- Integration tests for action creators
- Component tests focused on UI behavior only
- Simulation tests to ensure consistency

### Rollback Plan
- Maintain current working system until full migration complete
- Use feature flags to switch between old and new implementations
- Comprehensive testing before removing old code

This refactoring will transform the codebase from a monolithic structure to a clean, maintainable architecture with proper separation of concerns.