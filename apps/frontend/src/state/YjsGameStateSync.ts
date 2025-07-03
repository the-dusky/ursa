/**
 * Y.js Game State Sync - Proper CRDT-based synchronization
 * 
 * Following Y.js best practices:
 * 1. Use proper Y.js data types (Y.Map, Y.Array, Y.Text)
 * 2. Let Y.js handle synchronization and conflict resolution
 * 3. No manual timestamp checking or JSON serialization
 * 4. Direct Y.js type mapping for automatic merging
 */

import { WebsocketProvider } from 'y-websocket'
import {
  YjsGameDocument,
  createYjsDocument,
  initializeYjsDocument,
  syncStateToYjs,
  yjsToGameState,
  validateYjsDocument,
  observeGameState,
  updatePlayerResources,
  movePiece,
  advanceTurn,
  updateDiceState,
  GameResources
} from './YjsDocumentStructure'
import type { CoreGameState } from './CoreGameState'

// Re-export types for backwards compatibility
export type { CoreGameState as SyncedGameState } from './CoreGameState'

export class YjsGameStateSync {
  private yjsDoc: YjsGameDocument
  private provider: WebsocketProvider | null = null
  private listeners: Set<(state: CoreGameState) => void> = new Set()
  private unsubscribeObservers: (() => void) | null = null

  constructor() {
    // Create properly structured Y.js document
    this.yjsDoc = createYjsDocument()
    
    // Initialize with default structure
    initializeYjsDocument(this.yjsDoc)
    
    // Set up granular observers
    this.setupObservers()
  }

  /**
   * Connect to Y.js WebSocket server
   */
  connect(roomId: string, wsUrl: string = 'ws://localhost:1234'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.provider = new WebsocketProvider(wsUrl, roomId, this.yjsDoc.doc)
        
        this.provider.on('status', (event: { status: string }) => {
          if (event.status === 'connected') {
            console.log('✅ Y.js connected to room:', roomId)
            resolve()
          }
        })
        
        this.provider.on('connection-error', (error: any) => {
          console.error('❌ Y.js connection error:', error)
          reject(error)
        })
        
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Disconnect from Y.js
   */
  disconnect(): void {
    // Clean up observers
    if (this.unsubscribeObservers) {
      this.unsubscribeObservers()
      this.unsubscribeObservers = null
    }
    
    // Disconnect provider
    if (this.provider) {
      this.provider.disconnect()
      this.provider = null
    }
    
    // Destroy document
    this.yjsDoc.doc.destroy()
  }

  /**
   * Update game state - Y.js handles synchronization automatically
   * Uses proper Y.js data types instead of JSON serialization
   */
  updateGameState(gameState: CoreGameState): void {
    // Validate document structure first
    const validation = validateYjsDocument(this.yjsDoc)
    if (!validation.valid) {
      console.error('Invalid Y.js document structure:', validation.errors)
      initializeYjsDocument(this.yjsDoc, gameState)
    }
    
    // Use atomic transaction for better performance and consistency
    this.yjsDoc.doc.transact(() => {
      syncStateToYjs(this.yjsDoc, gameState)
    }, 'updateGameState')
    
    console.log('📡 Updated Y.js game state using atomic transaction')
  }

  /**
   * Get current game state from Y.js
   * Reconstructs state from proper Y.js data types
   */
  getGameState(): CoreGameState | null {
    return yjsToGameState(this.yjsDoc)
  }

  /**
   * Subscribe to game state changes
   */
  onStateChange(callback: (state: CoreGameState) => void): () => void {
    this.listeners.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.provider?.wsconnected || false
  }

  /**
   * Get room info
   */
  getRoomId(): string | null {
    return this.provider?.roomname || null
  }
  
  /**
   * Get Y.js document (for advanced use cases)
   */
  getYjsDocument(): YjsGameDocument {
    return this.yjsDoc
  }
  
  /**
   * Update player resources only (atomic operation)
   */
  updatePlayerResources(playerId: string, resources: Partial<GameResources>): boolean {
    return updatePlayerResources(this.yjsDoc, playerId, resources)
  }
  
  /**
   * Move a piece atomically
   */
  movePiece(pieceId: string, fromSpaceId: string, toSpaceId: string): boolean {
    return movePiece(this.yjsDoc, pieceId, fromSpaceId, toSpaceId)
  }
  
  /**
   * Advance turn atomically
   */
  advanceTurn(updates: {
    turn?: number
    currentPlayerIndex?: number
    season?: any
    year?: number
    gamePhase?: any
    energyTaxPaid?: boolean
  }): void {
    advanceTurn(this.yjsDoc, updates)
  }
  
  /**
   * Update dice state atomically
   */
  updateDice(updates: {
    isRolling?: boolean
    positionRolls?: any
    directionRolls?: any
    rotations?: number[]
  }): void {
    updateDiceState(this.yjsDoc, updates)
  }
  
  /**
   * Set up granular observers for better performance
   */
  private setupObservers(): void {
    // Clean up existing observers
    if (this.unsubscribeObservers) {
      this.unsubscribeObservers()
    }
    
    // Set up new observers
    this.unsubscribeObservers = observeGameState(this.yjsDoc, {
      onPlayersChange: () => this.notifyStateChange(),
      onGamePhaseChange: () => this.notifyStateChange(),
      onTurnChange: () => this.notifyStateChange(),
      onDiceChange: () => this.notifyStateChange()
    })
    
    // Also observe spaces array
    const spacesObserver = () => this.notifyStateChange()
    this.yjsDoc.spaces.observe(spacesObserver)
    
    // Add spaces observer to cleanup
    const originalUnsubscribe = this.unsubscribeObservers
    this.unsubscribeObservers = () => {
      originalUnsubscribe()
      this.yjsDoc.spaces.unobserve(spacesObserver)
    }
  }
  
  /**
   * Notify all listeners of state changes
   */
  private notifyStateChange(): void {
    const state = this.getGameState()
    if (state) {
      this.listeners.forEach(listener => {
        try {
          listener(state)
        } catch (error) {
          console.error('Error in state change listener:', error)
        }
      })
    }
  }
}