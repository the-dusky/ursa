/**
 * UI Store - User Interface State Management
 * 
 * This store handles all UI-specific state that is NOT part of the core game logic.
 * It's separate from the game state to maintain clean separation of concerns.
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface UIState {
  // Selection and interaction state
  selectedSpaceId: string | null
  selectedPieceId: string | null
  highlightedSpaces: string[]
  hoveredSpaceId: string | null

  // Modal and overlay state
  showRules: boolean
  showMultiplayerControls: boolean
  
  // Development toggles
  showCoordinates: boolean
  
  // Game log and messaging
  gameLog: string[]
  
  // Loading and error states
  isLoading: boolean
  error: string | null
  
  // Multiplayer UI state
  isConnected: boolean
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
  
  // Actions
  setSelectedSpace: (spaceId: string | null) => void
  setSelectedPiece: (pieceId: string | null) => void
  setHighlightedSpaces: (spaceIds: string[]) => void
  setHoveredSpace: (spaceId: string | null) => void
  
  toggleRules: () => void
  toggleMultiplayerControls: () => void
  toggleCoordinates: () => void
  
  addLogMessage: (message: string) => void
  clearLog: () => void
  
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  setConnectionStatus: (status: UIState['connectionStatus']) => void
  
  // Clear all selections (useful when switching turns or phases)
  clearSelections: () => void
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Initial state
      selectedSpaceId: null,
      selectedPieceId: null,
      highlightedSpaces: [],
      hoveredSpaceId: null,
      
      showRules: false,
      showMultiplayerControls: false,
      showCoordinates: false,
      
      gameLog: [],
      
      isLoading: false,
      error: null,
      
      isConnected: false,
      connectionStatus: 'disconnected',
      
      // Selection actions
      setSelectedSpace: (spaceId) => set({ selectedSpaceId: spaceId }),
      
      setSelectedPiece: (pieceId) => set({ selectedPieceId: pieceId }),
      
      setHighlightedSpaces: (spaceIds) => set({ highlightedSpaces: spaceIds }),
      
      setHoveredSpace: (spaceId) => set({ hoveredSpaceId: spaceId }),
      
      // Modal actions
      toggleRules: () => set((state) => ({ showRules: !state.showRules })),
      
      toggleMultiplayerControls: () => set((state) => ({ 
        showMultiplayerControls: !state.showMultiplayerControls 
      })),
      
      toggleCoordinates: () => set((state) => ({ 
        showCoordinates: !state.showCoordinates 
      })),
      
      // Log actions
      addLogMessage: (message) => set((state) => ({
        gameLog: [...state.gameLog, `${new Date().toLocaleTimeString()}: ${message}`]
      })),
      
      clearLog: () => set({ gameLog: [] }),
      
      // Loading and error actions
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      // Connection actions
      setConnectionStatus: (status) => set(() => ({
        connectionStatus: status,
        isConnected: status === 'connected'
      })),
      
      // Utility actions
      clearSelections: () => set({
        selectedSpaceId: null,
        selectedPieceId: null,
        highlightedSpaces: [],
        hoveredSpaceId: null
      })
    }),
    {
      name: 'ui-store',
      // Only store UI state in devtools, not game state
      partialize: (state: UIState) => ({
        selectedSpaceId: state.selectedSpaceId,
        selectedPieceId: state.selectedPieceId,
        highlightedSpaces: state.highlightedSpaces,
        showRules: state.showRules,
        gameLog: state.gameLog.slice(-10) // Only last 10 log messages
      })
    }
  )
)

/**
 * UI Store Hooks - Convenience hooks for common UI state patterns
 */

// Hook for selection state (commonly used together)
export const useSelectionState = () => {
  const selectedSpaceId = useUIStore(state => state.selectedSpaceId)
  const selectedPieceId = useUIStore(state => state.selectedPieceId)
  const highlightedSpaces = useUIStore(state => state.highlightedSpaces)
  const hoveredSpaceId = useUIStore(state => state.hoveredSpaceId)
  
  const setSelectedSpace = useUIStore(state => state.setSelectedSpace)
  const setSelectedPiece = useUIStore(state => state.setSelectedPiece)
  const setHighlightedSpaces = useUIStore(state => state.setHighlightedSpaces)
  const setHoveredSpace = useUIStore(state => state.setHoveredSpace)
  const clearSelections = useUIStore(state => state.clearSelections)
  
  return {
    selectedSpaceId,
    selectedPieceId,
    highlightedSpaces,
    hoveredSpaceId,
    setSelectedSpace,
    setSelectedPiece,
    setHighlightedSpaces,
    setHoveredSpace,
    clearSelections
  }
}

// Hook for modal state
export const useModalState = () => {
  const showRules = useUIStore(state => state.showRules)
  const showMultiplayerControls = useUIStore(state => state.showMultiplayerControls)
  const toggleRules = useUIStore(state => state.toggleRules)
  const toggleMultiplayerControls = useUIStore(state => state.toggleMultiplayerControls)
  
  return {
    showRules,
    showMultiplayerControls,
    toggleRules,
    toggleMultiplayerControls
  }
}

// Hook for game log
export const useGameLog = () => {
  const gameLog = useUIStore(state => state.gameLog)
  const addLogMessage = useUIStore(state => state.addLogMessage)
  const clearLog = useUIStore(state => state.clearLog)
  
  return {
    gameLog,
    addLogMessage,
    clearLog
  }
}

// Hook for loading/error state
export const useLoadingState = () => {
  const isLoading = useUIStore(state => state.isLoading)
  const error = useUIStore(state => state.error)
  const setLoading = useUIStore(state => state.setLoading)
  const setError = useUIStore(state => state.setError)
  
  return {
    isLoading,
    error,
    setLoading,
    setError
  }
}

// Hook for connection state
export const useConnectionState = () => {
  const isConnected = useUIStore(state => state.isConnected)
  const connectionStatus = useUIStore(state => state.connectionStatus)
  const setConnectionStatus = useUIStore(state => state.setConnectionStatus)
  
  return {
    isConnected,
    connectionStatus,
    setConnectionStatus
  }
}

// Hook for dev toggles
export const useDevState = () => {
  const showCoordinates = useUIStore(state => state.showCoordinates)
  const toggleCoordinates = useUIStore(state => state.toggleCoordinates)
  
  return {
    showCoordinates,
    toggleCoordinates
  }
}