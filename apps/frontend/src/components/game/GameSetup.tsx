/**
 * Game Setup Component - Local Game or Multiplayer Room
 */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCoordinatedGameActions, useStateCoordinator } from '@/state/StateCoordinator'
import { useMultiplayerStore } from '@/state/MultiplayerStore'
import { useGameStateStore } from '@/state/GameStateStore'
import { useRouter, useSearchParams } from 'next/navigation'

// Generate consistent player ID for multiplayer games
function generatePlayerId(): string {
  // Only run on client side
  if (typeof window === 'undefined') {
    return ''
  }
  
  // For multiplayer games, use consistent ID across tabs so the same person
  // doesn't get multiple player numbers when refreshing or opening new tabs
  let playerId = localStorage.getItem('multiplayer-player-id')
  if (!playerId) {
    playerId = `player-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    localStorage.setItem('multiplayer-player-id', playerId)
  }
  
  return playerId
}

// Get invite links for a room from localStorage
function getRoomInviteLinks(roomId: string): { [playerNumber: number]: { id: string; inviteLink: string } } | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(`room-${roomId}-invites`)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function GameSetup() {
  const [selectedPlayerCount, setSelectedPlayerCount] = useState(1)
  const [roomId, setRoomId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [origin, setOrigin] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const gameActions = useCoordinatedGameActions()
  const gameState = useGameStateStore(state => state.gameState)
  
  // Initialize StateCoordinator for automatic sync
  useStateCoordinator()
  const {
    isConnected,
    isConnecting,
    roomId: currentRoomId,
    playerName: currentPlayerName,
    playerNumber,
    connectedPlayers,
    roomConfig,
    connectToRoom,
    createRoom,
    createRoomWithSlots,
    startGameInRoom,
    disconnectFromRoom,
    getAllPlayersInRoom,
    getRoomConfig
  } = useMultiplayerStore()

  // Derived state
  const isMultiplayer = isConnected
  const roomPlayerCount = Object.keys(connectedPlayers).length
  const maxRoomPlayers = roomConfig?.playerCount || 2
  const gamePhase = 'setup' // TODO: Get from game state
  const createdRooms: any[] = [] // TODO: Implement created rooms management

  const handleJoinRoom = useCallback(async (customRoomId?: string, customPlayerName?: string, isCreatingRoom?: boolean, customPlayerId?: string) => {
    const targetRoomId = customRoomId || roomId.trim()
    const targetPlayerName = customPlayerName || playerName.trim()
    
    if (!targetRoomId || !targetPlayerName) return
    
    console.log(`\n👋 ===== USER JOINING ROOM =====`)
    console.log(`🏠 Target Room ID: ${targetRoomId}`)
    console.log(`👤 Target Player Name: ${targetPlayerName}`)
    console.log(`🏗️ Is Creating Room: ${isCreatingRoom}`)
    console.log(`🆔 Custom Player ID: ${customPlayerId || 'none - will generate'}`)
    
    setIsJoining(true)
    try {
      // Store player name and room ID for future sessions
      sessionStorage.setItem('player-name', targetPlayerName)
      sessionStorage.setItem('last-room-id', targetRoomId)
      
      // Use provided player ID or generate one
      const playerId = customPlayerId || generatePlayerId()
      
      console.log(`🆔 Final Player ID: ${playerId}`)
      console.log(`\n🚪 Calling multiplayer room join...`)
      
      // Use the actual connectToRoom method from MultiplayerStore
      await connectToRoom(targetRoomId, targetPlayerName, playerId)
      
      // Only update URL if joining an existing room (not creating)
      if (!isCreatingRoom && !searchParams?.get('room')) {
        router.push(`/?room=${targetRoomId}`)
      }
    } catch (error) {
      console.error('Failed to join room:', error)
      setJoinError(error instanceof Error ? error.message : 'Failed to join room')
      setIsJoining(false)
    }
  }, [roomId, playerName, searchParams, router])

  // Set origin on client side and load created rooms
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
      // TODO: Load created rooms
    }
  }, [])

  // Check for room in URL on mount and load saved player name
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    // Load saved player name
    const savedName = sessionStorage.getItem('player-name') || ''
    if (!playerName && savedName) {
      setPlayerName(savedName)
    }

    if (searchParams) {
      const urlRoomId = searchParams.get('room')
      if (urlRoomId) {
        setRoomId(urlRoomId)
        
        // Only auto-rejoin if we were previously in THIS specific room
        const lastRoomId = sessionStorage.getItem('last-room-id')
        if (savedName && !isConnected && lastRoomId === urlRoomId) {
          console.log('Auto-rejoining same room after page refresh')
          handleJoinRoom(urlRoomId, savedName)
        }
      }
    }
  }, [searchParams, playerName, isConnected, handleJoinRoom])

  // Watch for game start in multiplayer rooms
  useEffect(() => {
    // If we're in a multiplayer room and the game has been started by another player
    if (isConnected && roomConfig?.gameStarted && !gameState.isGameStarted) {
      console.log('🎮 Game started by room creator, waiting for game state sync via Y.js')
      // The game state will be synced via Y.js automatically
      // The StateCoordinator will handle updating our local state
    }
  }, [isConnected, roomConfig?.gameStarted, gameState.isGameStarted])

  const handleStartLocalGame = async () => {
    if (selectedPlayerCount === 1) {
      // Start single player game
      try {
        await gameActions.initializeGame(1)
      } catch (error) {
        console.error('Failed to start single player game:', error)
      }
    } else {
      // Create multiplayer room for 2-4 player game
      if (!playerName.trim()) return
      
      try {
        console.log(`\n🎮 ===== USER CREATING GAME =====`)
        console.log(`👤 Creator Name: ${playerName.trim()}`)
        console.log(`👥 Player Count: ${selectedPlayerCount}`)
        
        const newRoomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
        const creatorId = generatePlayerId()
        
        console.log(`🏠 Generated Room ID: ${newRoomId}`)
        console.log(`🆔 Generated Creator ID: ${creatorId}`)
        
        // Use the new createRoomWithSlots method for advanced room creation
        console.log(`\n🏗️ Calling createRoomWithSlots...`)
        const inviteLinks = await createRoomWithSlots(newRoomId, selectedPlayerCount, playerName.trim(), creatorId)
        
        console.log(`✅ Room created successfully! Received invite links:`, inviteLinks)
        
        // Store invite links for sharing (optional - could be used for UI display)
        if (typeof window !== 'undefined') {
          localStorage.setItem(`room-${newRoomId}-invites`, JSON.stringify(inviteLinks))
          console.log(`✅ Stored invite links in localStorage`)
        }
        
        // Don't initialize the game yet - wait for all players to join
        // The game will be initialized when the room creator clicks "Start Game"
        
        // Update URL to include the room and player ID
        router.push(`/?room=${newRoomId}&player=${creatorId}`)
        
      } catch (error) {
        console.error('Failed to create room:', error)
        // Fall back to local game
        await gameActions.initializeGame(selectedPlayerCount)
      }
    }
  }

  const generateRoomId = () => {
    if (typeof window === 'undefined') return
    const randomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    setRoomId(randomId)
  }

  const copyRoomLink = () => {
    if (typeof window === 'undefined') return
    
    const roomLink = `${origin}/?room=${currentRoomId || roomId}`
    navigator.clipboard.writeText(roomLink).then(() => {
      // Could add a toast notification here
      console.log('Room link copied to clipboard')
    })
  }

  // Show waiting room if connected to multiplayer room but game hasn't started
  if (isConnected && isMultiplayer && currentRoomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">🏠 Room: {currentRoomId}</CardTitle>
              <p className="text-slate-600 dark:text-slate-400">
                Waiting for players to join...
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Shareable Link Section */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                  Share this link with your friend:
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${origin}/?room=${currentRoomId}`}
                    className="flex-1 px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border rounded-md select-all"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyRoomLink}
                    className="whitespace-nowrap"
                  >
                    📋 Copy
                  </Button>
                </div>
              </div>
              
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg font-semibold">You: {currentPlayerName}</span>
                  <span className="px-2 py-1 bg-blue-500 text-white text-sm font-bold rounded-full">
                    Player {playerNumber}
                  </span>
                </div>
                
                <div className="flex flex-col items-center space-y-2 py-4">
                  {(() => {
                    const allPlayers = getAllPlayersInRoom()
                    const roomConfig = getRoomConfig()
                    const actualRoomSize = roomConfig?.playerCount || maxRoomPlayers || 2
                    
                    // Debug logging to console
                    console.log('🐛 PLAYER DISPLAY DEBUG:')
                    console.log(`  roomConfig:`, roomConfig)
                    console.log(`  roomConfig?.playerCount:`, roomConfig?.playerCount)
                    console.log(`  maxRoomPlayers:`, maxRoomPlayers)
                    console.log(`  actualRoomSize:`, actualRoomSize)
                    console.log(`  allPlayers count:`, Object.keys(allPlayers).length)
                    
                    const playerList = []
                    
                    // Create array of player slots (1 to actualRoomSize)
                    for (let playerNum = 1; playerNum <= actualRoomSize; playerNum++) {
                      const playerData = Object.values(allPlayers).find(p => p.playerNumber === playerNum && p.isActive)
                      const isCurrentPlayer = playerData && playerNumber === playerNum
                      
                      if (playerData) {
                        // Player slot is filled
                        playerList.push(
                          <div key={playerNum} className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span>Player {playerNum}{isCurrentPlayer ? ' (You)' : ''}: {playerData.name}</span>
                          </div>
                        )
                      } else {
                        // Player slot is empty
                        playerList.push(
                          <div key={playerNum} className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse"></div>
                            <span className="text-gray-500">Waiting for Player {playerNum}...</span>
                          </div>
                        )
                      }
                    }
                    
                    return playerList
                  })()}
                </div>
                
                {/* Show player-specific invite links if available */}
                {(() => {
                  const inviteLinks = getRoomInviteLinks(currentRoomId)
                  if (inviteLinks && Object.keys(inviteLinks).length > 1) {
                    return (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          🎫 Player-specific invite links:
                        </p>
                        {Object.entries(inviteLinks).slice(1).map(([playerNum, linkInfo]) => (
                          <div key={playerNum} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Player {playerNum}</span>
                              <Button
                                onClick={() => {
                                  navigator.clipboard.writeText(linkInfo.inviteLink)
                                }}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                📋 Copy
                              </Button>
                            </div>
                            <input
                              type="text"
                              value={linkInfo.inviteLink}
                              readOnly
                              className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-700 border rounded font-mono"
                            />
                          </div>
                        ))}
                      </div>
                    )
                  } else {
                    return (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                          Share this link to invite others:
                        </p>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={origin ? `${origin}/?room=${currentRoomId}` : `Loading...`}
                            readOnly
                            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md"
                          />
                          <Button onClick={copyRoomLink} variant="outline" size="sm">
                            Copy
                          </Button>
                        </div>
                      </div>
                    )
                  }
                })()}
                
                {/* Start Game Button - show when enough players joined and current player is creator */}
                {(() => {
                  const allPlayers = getAllPlayersInRoom()
                  const roomConfig = getRoomConfig()
                  const actualRoomSize = roomConfig?.playerCount || maxRoomPlayers || 2
                  const activePlayerCount = Object.values(allPlayers).filter(p => p.isActive).length
                  const isRoomCreator = playerNumber === 1
                  const hasEnoughPlayers = activePlayerCount >= actualRoomSize
                  
                  if (hasEnoughPlayers) {
                    if (isRoomCreator) {
                      return (
                        <div className="pt-4 border-t">
                          <Button 
                            onClick={async () => {
                              try {
                                console.log('🎮 Player 1 starting multiplayer game...')
                                // Initialize the game state locally (StateCoordinator will sync automatically)
                                await gameActions.initializeGame(actualRoomSize)
                                console.log('✅ Local game state initialized')
                                
                                // Notify other players that the game has started
                                await startGameInRoom()
                                console.log('✅ Room marked as game started')
                                
                                console.log('🔄 StateCoordinator will handle automatic sync to Y.js')
                              } catch (error) {
                                console.error('Failed to start game:', error)
                              }
                            }}
                            className="w-full bg-green-600 hover:bg-green-700"
                            size="lg"
                          >
                            🎮 Start Game ({activePlayerCount} Players)
                          </Button>
                        </div>
                      )
                    } else {
                      return (
                        <div className="pt-4 border-t text-center">
                          <p className="text-slate-600 dark:text-slate-400">
                            Waiting for Player 1 to start the game...
                          </p>
                        </div>
                      )
                    }
                  }
                  return null
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show simplified join interface if accessing a room via URL
  const urlRoomId = searchParams?.get('room')
  const urlPlayerId = searchParams?.get('player')
  if (urlRoomId && !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">🎮 Join Game</CardTitle>
              <p className="text-slate-600 dark:text-slate-400">
                You&apos;ve been invited to join a game!
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                    Room ID:
                  </p>
                  <p className="text-lg font-mono bg-white dark:bg-slate-800 px-3 py-2 rounded border">
                    {urlRoomId}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Name</label>
                  <Input
                    placeholder="Enter your player name"
                    value={playerName}
                    onChange={(e) => {
                      setPlayerName(e.target.value)
                      if (joinError) setJoinError(null) // Clear error when typing
                    }}
                    maxLength={20}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && playerName.trim()) {
                        const playerId = urlPlayerId || generatePlayerId()
                        handleJoinRoom(urlRoomId, playerName.trim(), false, playerId)
                      }
                    }}
                  />
                </div>
                
                {/* Show error message if join failed */}
                {joinError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      ❌ {joinError}
                    </p>
                  </div>
                )}
                
                <Button 
                  onClick={() => {
                    // Use URL player ID if provided, otherwise generate one
                    const playerId = urlPlayerId || generatePlayerId()
                    handleJoinRoom(urlRoomId, playerName.trim(), false, playerId)
                  }}
                  disabled={!playerName.trim() || isJoining}
                  className="w-full h-12 text-lg font-semibold"
                  size="lg"
                >
                  {isJoining ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Joining Game...
                    </>
                  ) : (
                    `Join Game as ${playerName.trim() || '[Name]'}`
                  )}
                </Button>
                
                <div className="text-center pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Remove room from URL and go to main lobby
                      router.push('/')
                    }}
                    className="text-slate-600 hover:text-slate-700"
                  >
                    ← Back to Lobby
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl space-y-6">
        
        {/* Main setup cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Local Game Section */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">🐻 Start New Game</CardTitle>
            <p className="text-slate-600 dark:text-slate-400">
              Play locally on this device
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Player Count Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold">Number of Players</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={selectedPlayerCount === 1 ? "default" : "outline"}
                  onClick={() => setSelectedPlayerCount(1)}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <span className="text-2xl">🐻</span>
                  <span className="text-sm font-medium">1 Player</span>
                  <span className="text-xs text-slate-500">Solo Practice</span>
                </Button>
                
                <Button
                  variant={selectedPlayerCount === 2 ? "default" : "outline"}
                  onClick={() => setSelectedPlayerCount(2)}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <span className="text-2xl">🐻🐻</span>
                  <span className="text-sm font-medium">2 Players</span>
                  <span className="text-xs text-slate-500">Local Game</span>
                </Button>

                <Button
                  variant={selectedPlayerCount === 3 ? "default" : "outline"}
                  onClick={() => setSelectedPlayerCount(3)}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <span className="text-2xl">🐻🐻🐻</span>
                  <span className="text-sm font-medium">3 Players</span>
                  <span className="text-xs text-slate-500">Multiplayer</span>
                </Button>

                <Button
                  variant={selectedPlayerCount === 4 ? "default" : "outline"}
                  onClick={() => setSelectedPlayerCount(4)}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <span className="text-2xl">🐻🐻🐻🐻</span>
                  <span className="text-sm font-medium">4 Players</span>
                  <span className="text-xs text-slate-500">Full House</span>
                </Button>
              </div>
            </div>

            {/* Player Name Input for Multiplayer Games */}
            {selectedPlayerCount >= 2 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Name</label>
                <Input
                  placeholder="Enter your player name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                />
              </div>
            )}

            {/* Game Mode Description */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-medium mb-2">
                {selectedPlayerCount === 1 ? "Solo Mode" : "Multiplayer Mode"}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {selectedPlayerCount === 1 
                  ? "Practice the game mechanics and test strategies. Perfect for learning the rules and trying different approaches."
                  : "Create a room and share the link with a friend. Real-time multiplayer with synchronized game state."
                }
              </p>
            </div>

            {/* Start Game Button */}
            <Button 
              onClick={handleStartLocalGame}
              disabled={selectedPlayerCount >= 2 && !playerName.trim()}
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              {selectedPlayerCount === 1 ? "Start Solo Game" : `Create Room${playerName.trim() ? ` as ${playerName}` : ""}`}
            </Button>
          </CardContent>
        </Card>

        {/* Multiplayer Room Section */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">🌐 Join Game Room</CardTitle>
            <p className="text-slate-600 dark:text-slate-400">
              Play with friends online
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Player Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Name</label>
              <Input
                placeholder="Enter your player name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
              />
            </div>

            {/* Room ID Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Room ID</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter room ID or generate one"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  maxLength={50}
                />
                <Button
                  onClick={generateRoomId}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  Generate
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Share this room ID with friends to play together
              </p>
            </div>

            {/* Multiplayer Info */}
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
              <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">
                🌐 Online Multiplayer
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Create or join a room to play with friends anywhere. Real-time synchronization 
                keeps everyone&apos;s game state in sync.
              </p>
              <p className="text-xs text-orange-600 mt-2">
                Note: Multiplayer features are being adapted to the new architecture
              </p>
            </div>

            {/* Room Actions */}
            <div className="space-y-3">
              <Button 
                onClick={() => handleJoinRoom(undefined, undefined, false)}
                disabled={!roomId.trim() || !playerName.trim() || isJoining}
                className="w-full h-12 text-lg font-semibold"
                size="lg"
              >
                {isJoining ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  `Join Room ${roomId || ''}`
                )}
              </Button>
              
              {roomId && (
                <Button
                  onClick={copyRoomLink}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  📋 Copy Room Link
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Footer Links */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="flex justify-center space-x-6 text-sm">
          <a 
            href="/simulation"
            className="text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
          >
            🧪 Simulation Lab
          </a>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-slate-700"
            onClick={() => {/* TODO: Open rules */}}
          >
            📖 Rules
          </Button>
        </div>
      </div>
    </div>
  )
}