/**
 * StateManager - Central State Orchestrator
 * 
 * This class orchestrates all state changes across the application.
 * It's the single point of truth for state updates and ensures
 * consistency across all stores and systems.
 */

import { CoreGameState, GameActionResult, StateValidation, CoreGameStateUtils } from './CoreGameState'

export type StateChangeListener = (newState: CoreGameState, previousState: CoreGameState) => void
export type StateValidator = (state: CoreGameState) => StateValidation

/**
 * StateManager - Manages the master game state
 */
export class StateManager {
  private _currentState: CoreGameState
  private _previousState: CoreGameState | null = null
  private _listeners: Set<StateChangeListener> = new Set()
  private _validators: Set<StateValidator> = new Set()
  private _isUpdating = false
  
  constructor(initialState: CoreGameState) {
    this._currentState = CoreGameStateUtils.clone(initialState)
  }
  
  /**
   * Get current state (read-only)
   */
  get state(): Readonly<CoreGameState> {
    return this._currentState
  }
  
  /**
   * Get previous state (for debugging/undo)
   */
  get previousState(): Readonly<CoreGameState> | null {
    return this._previousState
  }
  
  /**
   * Check if state is currently being updated
   */
  get isUpdating(): boolean {
    return this._isUpdating
  }
  
  /**
   * Update the state (with validation and notifications)
   */
  updateState(newState: CoreGameState, source: string = 'unknown'): GameActionResult<CoreGameState> {
    if (this._isUpdating) {
      return {
        success: false,
        state: this._currentState,
        error: 'State update already in progress - recursive updates not allowed'
      }
    }
    
    try {
      this._isUpdating = true
      
      // Validate the new state
      const validation = this.validateState(newState)
      if (!validation.isValid) {
        console.error('State validation failed:', validation.errors)
        return {
          success: false,
          state: this._currentState,
          error: `State validation failed: ${validation.errors.join(', ')}`
        }
      }
      
      // Log warnings but allow the update
      if (validation.warnings.length > 0) {
        console.warn('State validation warnings:', validation.warnings)
      }
      
      // Check for timestamp-based conflict resolution (Y.js race condition fix)
      if (newState.lastUpdated < this._currentState.lastUpdated) {
        console.log(`🚫 Rejecting stale state update (${newState.lastUpdated} < ${this._currentState.lastUpdated})`)
        return {
          success: true, // Not an error, just ignored stale update
          state: this._currentState,
          message: 'Stale state update ignored based on timestamp'
        }
      }
      
      // Store previous state for rollback/debugging
      this._previousState = CoreGameStateUtils.clone(this._currentState)
      
      // Update the state (update timestamp if not newer than current)
      this._currentState = newState.lastUpdated <= this._currentState.lastUpdated 
        ? CoreGameStateUtils.touch(CoreGameStateUtils.clone(newState))
        : CoreGameStateUtils.clone(newState)
      
      // Notify all listeners
      this.notifyListeners(source)
      
      console.log(`🔄 State updated from: ${source}`)
      
      return {
        success: true,
        state: this._currentState,
        newState: this._currentState
      }
      
    } catch (error) {
      console.error('Error updating state:', error)
      return {
        success: false,
        state: this._currentState,
        error: `State update error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    } finally {
      this._isUpdating = false
    }
  }
  
  /**
   * Apply a state transformation function
   */
  transform(
    transformer: (currentState: CoreGameState) => CoreGameState, 
    source: string = 'transformation'
  ): GameActionResult<CoreGameState> {
    try {
      const newState = transformer(CoreGameStateUtils.clone(this._currentState))
      return this.updateState(newState, source)
    } catch (error) {
      return {
        success: false,
        state: this._currentState,
        error: `Transformation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
  
  /**
   * Rollback to previous state (for error recovery)
   */
  rollback(reason: string = 'manual rollback'): GameActionResult<CoreGameState> {
    if (!this._previousState) {
      return {
        success: false,
        state: this._currentState,
        error: 'No previous state available for rollback'
      }
    }
    
    console.warn(`🔙 Rolling back state: ${reason}`)
    return this.updateState(this._previousState, `rollback: ${reason}`)
  }
  
  /**
   * Add a state change listener
   */
  addListener(listener: StateChangeListener): () => void {
    this._listeners.add(listener)
    
    // Return unsubscribe function
    return () => {
      this._listeners.delete(listener)
    }
  }
  
  /**
   * Add a state validator
   */
  addValidator(validator: StateValidator): () => void {
    this._validators.add(validator)
    
    // Return remove function
    return () => {
      this._validators.delete(validator)
    }
  }
  
  /**
   * Validate state using all registered validators
   */
  private validateState(state: CoreGameState): StateValidation {
    const allErrors: string[] = []
    const allWarnings: string[] = []
    
    // Run basic validation
    const basicValidation = this.basicValidation(state)
    allErrors.push(...basicValidation.errors)
    allWarnings.push(...basicValidation.warnings)
    
    // Run all custom validators
    for (const validator of this._validators) {
      try {
        const result = validator(state)
        allErrors.push(...result.errors)
        allWarnings.push(...result.warnings)
      } catch (error) {
        allErrors.push(`Validator error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    return {
      valid: allErrors.length === 0,
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    }
  }
  
  /**
   * Basic state validation (always runs)
   */
  private basicValidation(state: CoreGameState): StateValidation {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Required fields
    if (!state.gameId) errors.push('gameId is required')
    if (!state.gamePhase) errors.push('gamePhase is required')
    if (!state.season) errors.push('season is required')
    if (state.year < 1) errors.push('year must be >= 1')
    if (state.turn < 1) errors.push('turn must be >= 1')
    if (state.currentPlayerIndex < 0) errors.push('currentPlayerIndex must be >= 0')
    
    // Player validation
    if (state.currentPlayerIndex >= state.players.length && state.players.length > 0) {
      errors.push('currentPlayerIndex out of bounds')
    }
    
    // Piece consistency - pieces are stored in players array
    for (const player of state.players) {
      for (const piece of player.pieces) {
        // Skip validation for pieces not on board (spaceId === null)
        if (piece.spaceId === null) continue
        
        const space = CoreGameStateUtils.getSpace(state, piece.spaceId)
        if (!space) {
          errors.push(`Piece ${piece.id} references non-existent space ${piece.spaceId}`)
        } else if (space.piece?.id !== piece.id) {
          errors.push(`Piece ${piece.id} location mismatch - space ${piece.spaceId} doesn't reference it`)
        }
      }
    }
    
    // Board consistency
    for (const [spaceId, space] of Object.entries(state.board.spaces)) {
      if (space.piece) {
        const piece = CoreGameStateUtils.getPiece(state, space.piece.id)
        if (!piece) {
          errors.push(`Space ${spaceId} references non-existent piece ${space.piece.id}`)
        } else if (piece.spaceId !== spaceId) {
          errors.push(`Space ${spaceId} piece location mismatch`)
        }
      }
    }
    
    return { valid: errors.length === 0, isValid: errors.length === 0, errors, warnings }
  }
  
  /**
   * Notify all listeners of state change
   */
  private notifyListeners(source: string): void {
    if (!this._previousState) return
    
    for (const listener of this._listeners) {
      try {
        listener(this._currentState, this._previousState)
      } catch (error) {
        console.error(`Error in state listener from ${source}:`, error)
      }
    }
  }
  
  /**
   * Get state snapshot for debugging/save
   */
  getSnapshot(): { current: CoreGameState; previous: CoreGameState | null } {
    return {
      current: CoreGameStateUtils.clone(this._currentState),
      previous: this._previousState ? CoreGameStateUtils.clone(this._previousState) : null
    }
  }
  
  /**
   * Load state from snapshot (for debugging/load)
   */
  loadSnapshot(snapshot: CoreGameState, source: string = 'snapshot'): GameActionResult<CoreGameState> {
    return this.updateState(snapshot, source)
  }
}

/**
 * State Manager Factory - Creates properly configured state managers
 */
export class StateManagerFactory {
  static create(initialState: CoreGameState): StateManager {
    const manager = new StateManager(initialState)
    
    // Add common validators
    manager.addValidator((state) => {
      const warnings: string[] = []
      
      // Performance warnings - count pieces across all players
      const totalPieces = state.players.reduce((count, player) => count + player.pieces.length, 0)
      if (totalPieces > 100) {
        warnings.push('Large number of pieces may impact performance')
      }
      
      if (Object.keys(state.board.spaces).length > 1000) {
        warnings.push('Large board may impact performance')
      }
      
      return { valid: true, isValid: true, errors: [], warnings }
    })
    
    return manager
  }
}