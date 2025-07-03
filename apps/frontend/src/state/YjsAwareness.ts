/**
 * Y.js Awareness - User Presence and Collaboration Features
 * 
 * This module implements Y.js awareness protocol for real-time user presence,
 * cursor tracking, and collaborative indicators.
 * 
 * Key Features:
 * - Real-time user presence (online/offline status)
 * - User cursor and selection tracking
 * - Active player indicators
 * - Collaborative editing awareness
 */

import { WebsocketProvider } from 'y-websocket'
// @ts-expect-error - Y.js awareness types not fully typed
import { Awareness } from 'y-protocols/awareness.js'
import * as Y from 'yjs'
import { useState, useEffect, useCallback } from 'react'

/**
 * User presence state
 */
export interface UserPresence {
  userId: string
  userName: string
  userColor: string
  isActive: boolean
  lastSeen: number
  
  // Game-specific presence
  currentAction?: string
  selectedPiece?: string
  hoveredSpace?: string
  
  // Cursor/selection tracking
  cursor?: {
    x: number
    y: number
    visible: boolean
  }
  
  // Connection info
  connectionId: string
  joinedAt: number
}

/**
 * Awareness configuration
 */
export interface AwarenessConfig {
  userId: string
  userName: string
  userColor: string
  updateInterval?: number
  timeoutDuration?: number
}

/**
 * Awareness callbacks
 */
export interface AwarenessCallbacks {
  onUserJoin?: (user: UserPresence) => void
  onUserLeave?: (userId: string) => void
  onUserUpdate?: (user: UserPresence) => void
  onPresenceChange?: (users: Map<string, UserPresence>) => void
  onCursorMove?: (userId: string, cursor: { x: number, y: number }) => void
  onActionChange?: (userId: string, action: string) => void
  onError?: (error: Error) => void
}

/**
 * Y.js Awareness Manager
 */
export class YjsAwarenessManager {
  private awareness: Awareness
  private provider: WebsocketProvider
  private config: AwarenessConfig
  private callbacks: AwarenessCallbacks
  private updateInterval: NodeJS.Timeout | null = null
  private isDestroyed = false
  
  constructor(
    yjsDoc: Y.Doc,
    provider: WebsocketProvider,
    config: AwarenessConfig,
    callbacks: AwarenessCallbacks = {}
  ) {
    this.awareness = new Awareness(yjsDoc)
    this.provider = provider
    this.config = config
    this.callbacks = callbacks
    
    // Connect awareness to WebSocket provider
    this.provider.awareness = this.awareness
    
    this.setupAwareness()
    this.startHeartbeat()
  }
  
  /**
   * Setup awareness event listeners
   */
  private setupAwareness(): void {
    // Listen for awareness changes
    this.awareness.on('change', (changes: {
      added: number[]
      updated: number[]
      removed: number[]
    }) => {
      try {
        // Handle users joining
        changes.added.forEach(clientId => {
          const user = this.awareness.getStates().get(clientId)
          if (user && user.userId !== this.config.userId) {
            const presence = this.parseUserPresence(user, clientId)
            this.callbacks.onUserJoin?.(presence)
          }
        })
        
        // Handle users leaving
        changes.removed.forEach(clientId => {
          const user = this.awareness.getStates().get(clientId)
          if (user && user.userId !== this.config.userId) {
            this.callbacks.onUserLeave?.(user.userId)
          }
        })
        
        // Handle user updates
        changes.updated.forEach(clientId => {
          const user = this.awareness.getStates().get(clientId)
          if (user && user.userId !== this.config.userId) {
            const presence = this.parseUserPresence(user, clientId)
            this.callbacks.onUserUpdate?.(presence)
          }
        })
        
        // Notify of overall presence changes
        const allUsers = this.getAllUsers()
        this.callbacks.onPresenceChange?.(allUsers)
        
      } catch (error) {
        console.error('Error handling awareness change:', error)
        this.callbacks.onError?.(error as Error)
      }
    })
    
    // Set initial user state
    this.updateUserState({
      userId: this.config.userId,
      userName: this.config.userName,
      userColor: this.config.userColor,
      isActive: true,
      lastSeen: Date.now(),
      connectionId: this.provider.doc.clientID.toString(),
      joinedAt: Date.now()
    })
    
    console.log('✅ Y.js Awareness initialized for user:', this.config.userName)
  }
  
  /**
   * Start heartbeat to maintain presence
   */
  private startHeartbeat(): void {
    const interval = this.config.updateInterval || 30000 // 30 seconds
    
    this.updateInterval = setInterval(() => {
      if (this.isDestroyed) return
      
      try {
        // Update last seen timestamp
        this.updateUserState({
          lastSeen: Date.now(),
          isActive: true
        })
      } catch (error) {
        console.error('Error in awareness heartbeat:', error)
      }
    }, interval)
  }
  
  /**
   * Parse user presence from awareness state
   */
  private parseUserPresence(state: any, clientId: number): UserPresence {
    return {
      userId: state.userId || `client-${clientId}`,
      userName: state.userName || 'Unknown User',
      userColor: state.userColor || '#666666',
      isActive: state.isActive ?? true,
      lastSeen: state.lastSeen || Date.now(),
      currentAction: state.currentAction,
      selectedPiece: state.selectedPiece,
      hoveredSpace: state.hoveredSpace,
      cursor: state.cursor,
      connectionId: clientId.toString(),
      joinedAt: state.joinedAt || Date.now()
    }
  }
  
  /**
   * Update user state in awareness
   */
  updateUserState(updates: Partial<UserPresence>): void {
    if (this.isDestroyed) return
    
    try {
      const currentState = this.awareness.getLocalState() || {}
      const newState = {
        ...currentState,
        ...updates,
        lastSeen: Date.now()
      }
      
      this.awareness.setLocalState(newState)
      
      // Trigger specific callbacks
      if (updates.cursor) {
        this.callbacks.onCursorMove?.(this.config.userId, updates.cursor)
      }
      if (updates.currentAction) {
        this.callbacks.onActionChange?.(this.config.userId, updates.currentAction)
      }
      
    } catch (error) {
      console.error('Error updating user state:', error)
      this.callbacks.onError?.(error as Error)
    }
  }
  
  /**
   * Update cursor position
   */
  updateCursor(x: number, y: number, visible: boolean = true): void {
    this.updateUserState({
      cursor: { x, y, visible }
    })
  }
  
  /**
   * Update current game action
   */
  updateCurrentAction(action: string): void {
    this.updateUserState({
      currentAction: action
    })
  }
  
  /**
   * Update selected piece
   */
  updateSelectedPiece(pieceId: string | undefined): void {
    this.updateUserState({
      selectedPiece: pieceId
    })
  }
  
  /**
   * Update hovered space
   */
  updateHoveredSpace(spaceId: string | undefined): void {
    this.updateUserState({
      hoveredSpace: spaceId
    })
  }
  
  /**
   * Set user as active/inactive
   */
  setActive(isActive: boolean): void {
    this.updateUserState({
      isActive,
      lastSeen: Date.now()
    })
  }
  
  /**
   * Get all online users
   */
  getAllUsers(): Map<string, UserPresence> {
    const users = new Map<string, UserPresence>()
    
    this.awareness.getStates().forEach((state, clientId) => {
      if (state && state.userId) {
        const presence = this.parseUserPresence(state, clientId)
        users.set(presence.userId, presence)
      }
    })
    
    return users
  }
  
  /**
   * Get active users (excluding self)
   */
  getActiveUsers(): Map<string, UserPresence> {
    const users = this.getAllUsers()
    const activeUsers = new Map<string, UserPresence>()
    
    users.forEach((user, userId) => {
      if (userId !== this.config.userId && user.isActive) {
        activeUsers.set(userId, user)
      }
    })
    
    return activeUsers
  }
  
  /**
   * Get user by ID
   */
  getUser(userId: string): UserPresence | undefined {
    const users = this.getAllUsers()
    return users.get(userId)
  }
  
  /**
   * Get users performing specific action
   */
  getUsersByAction(action: string): UserPresence[] {
    const users = this.getAllUsers()
    return Array.from(users.values()).filter(user => 
      user.currentAction === action && user.userId !== this.config.userId
    )
  }
  
  /**
   * Get users with visible cursors
   */
  getUsersWithCursors(): UserPresence[] {
    const users = this.getAllUsers()
    return Array.from(users.values()).filter(user => 
      user.cursor?.visible && user.userId !== this.config.userId
    )
  }
  
  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    const user = this.getUser(userId)
    if (!user) return false
    
    const timeout = this.config.timeoutDuration || 60000 // 1 minute
    return user.isActive && (Date.now() - user.lastSeen) < timeout
  }
  
  /**
   * Get online user count
   */
  getOnlineUserCount(): number {
    return this.getActiveUsers().size
  }
  
  /**
   * Destroy awareness manager
   */
  destroy(): void {
    if (this.isDestroyed) return
    
    this.isDestroyed = true
    
    // Clear heartbeat
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    
    // Mark user as inactive
    this.setActive(false)
    
    // Remove awareness from provider
    if (this.provider.awareness === this.awareness) {
      this.provider.awareness = undefined
    }
    
    // Destroy awareness
    this.awareness.destroy()
    
    console.log('✅ Y.js Awareness destroyed for user:', this.config.userName)
  }
}

/**
 * React hook for Y.js Awareness
 */
export function useYjsAwareness(
  yjsDoc: Y.Doc | null,
  provider: WebsocketProvider | null,
  config: AwarenessConfig | null,
  callbacks: AwarenessCallbacks = {}
): {
  awareness: YjsAwarenessManager | null
  users: Map<string, UserPresence>
  activeUsers: Map<string, UserPresence>
  onlineCount: number
  updateCursor: (x: number, y: number, visible?: boolean) => void
  updateAction: (action: string) => void
  updateSelectedPiece: (pieceId: string | undefined) => void
  updateHoveredSpace: (spaceId: string | undefined) => void
  setActive: (isActive: boolean) => void
} {
  const [awareness, setAwareness] = useState<YjsAwarenessManager | null>(null)
  const [users, setUsers] = useState<Map<string, UserPresence>>(new Map())
  const [activeUsers, setActiveUsers] = useState<Map<string, UserPresence>>(new Map())
  const [onlineCount, setOnlineCount] = useState(0)
  
  // Initialize awareness
  useEffect(() => {
    if (!yjsDoc || !provider || !config) return
    
    const awarenessManager = new YjsAwarenessManager(yjsDoc, provider, config, {
      ...callbacks,
      onPresenceChange: (users) => {
        setUsers(new Map(users))
        const active = new Map<string, UserPresence>()
        users.forEach((user, userId) => {
          if (user.isActive && userId !== config.userId) {
            active.set(userId, user)
          }
        })
        setActiveUsers(active)
        setOnlineCount(active.size)
        callbacks.onPresenceChange?.(users)
      }
    })
    
    setAwareness(awarenessManager)
    
    return () => {
      awarenessManager.destroy()
      setAwareness(null)
    }
  }, [yjsDoc, provider, config?.userId])
  
  // Helper functions
  const updateCursor = useCallback((x: number, y: number, visible = true) => {
    awareness?.updateCursor(x, y, visible)
  }, [awareness])
  
  const updateAction = useCallback((action: string) => {
    awareness?.updateCurrentAction(action)
  }, [awareness])
  
  const updateSelectedPiece = useCallback((pieceId: string | undefined) => {
    awareness?.updateSelectedPiece(pieceId)
  }, [awareness])
  
  const updateHoveredSpace = useCallback((spaceId: string | undefined) => {
    awareness?.updateHoveredSpace(spaceId)
  }, [awareness])
  
  const setActive = useCallback((isActive: boolean) => {
    awareness?.setActive(isActive)
  }, [awareness])
  
  return {
    awareness,
    users,
    activeUsers,
    onlineCount,
    updateCursor,
    updateAction,
    updateSelectedPiece,
    updateHoveredSpace,
    setActive
  }
}