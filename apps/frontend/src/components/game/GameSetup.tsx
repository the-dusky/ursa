/**
 * Game Setup Component - Local Game or Multiplayer Room
 */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useGameStore } from '@/store/gameStore'
import { useRouter, useSearchParams } from 'next/navigation'

// Generate unique player ID per browser tab
function generatePlayerId(): string {
  // Get base player identity from localStorage (persists across browser restarts)
  let basePlayerId = localStorage.getItem('base-player-id')
  if (!basePlayerId) {
    basePlayerId = `player-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    localStorage.setItem('base-player-id', basePlayerId)
  }
  
  // Add tab-specific identifier (unique per tab, even from same browser)
  const tabId = crypto.randomUUID ? crypto.randomUUID().substring(0, 8) : Math.random().toString(36).substring(2, 8)
  return `${basePlayerId}-tab-${tabId}`
}

export function GameSetup() {
  const [selectedPlayerCount, setSelectedPlayerCount] = useState(1)
  const [roomId, setRoomId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { 
    initializeGameWithPlayerCount, 
    startMultiplayerGame, 
    isConnected, 
    roomPlayerCount, 
    maxRoomPlayers,
    roomId: currentRoomId,
    playerName: currentPlayerName,
    playerNumber,
    gamePhase,
    createdRooms,
    addCreatedRoom,
    removeCreatedRoom,
    updateRoomLastUsed
  } = useGameStore()

  const handleJoinRoom = useCallback(async (customRoomId?: string, customPlayerName?: string, isCreatingRoom?: boolean) => {
    const targetRoomId = customRoomId || roomId.trim()
    const targetPlayerName = customPlayerName || playerName.trim()
    
    if (!targetRoomId || !targetPlayerName) return
    
    setIsJoining(true)
    try {
      // Store player name for future sessions
      sessionStorage.setItem('player-name', targetPlayerName)
      
      // Generate/get player session ID
      const playerId = generatePlayerId()
      
      await startMultiplayerGame(targetRoomId, targetPlayerName, playerId)
      
      // Only update URL if joining an existing room (not creating)
      if (!isCreatingRoom && !searchParams?.get('room')) {
        router.push(`/?room=${targetRoomId}`)
      }
    } catch (error) {
      console.error('Failed to join room:', error)
      setIsJoining(false)
    }
  }, [roomId, playerName, searchParams, router, startMultiplayerGame])

  // Check for room in URL on mount and load saved player name
  useEffect(() => {
    // Load saved player name
    const savedName = sessionStorage.getItem('player-name') || ''
    if (!playerName && savedName) {
      setPlayerName(savedName)
    }

    if (searchParams) {
      const urlRoomId = searchParams.get('room')
      if (urlRoomId) {
        setRoomId(urlRoomId)
        
        // Auto-rejoin room if we have a saved name (likely a refresh/hot reload)
        if (savedName && !isConnected) {
          console.log('Auto-rejoining room after page refresh')
          handleJoinRoom(urlRoomId, savedName)
        }
      }
    }
  }, [searchParams, playerName, isConnected, handleJoinRoom])

  // Redirect to game when it starts
  useEffect(() => {
    if (gamePhase === 'playing' && isConnected) {
      // For multiplayer games, we're already on the right page
      // The main page will show the game instead of setup
      console.log('Game started - transitioning to game view')
    }
  }, [gamePhase, isConnected])

  const handleStartLocalGame = () => {
    if (selectedPlayerCount === 1) {
      initializeGameWithPlayerCount(1)
    } else {
      // Create multiplayer room for 2-4 player game
      if (!playerName.trim()) return
      
      const newRoomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
      
      // Add to created rooms list
      addCreatedRoom(newRoomId, `${playerName}'s Game`)
      
      // Set up room state
      setRoomId(newRoomId)
      
      // Start multiplayer game (don't redirect when creating)
      handleJoinRoom(newRoomId, playerName.trim(), true)
    }
  }

  const generateRoomId = () => {
    const randomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    setRoomId(randomId)
  }

  const copyRoomLink = () => {
    const roomLink = `${window.location.origin}/?room=${roomId}`
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
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg font-semibold">You: {currentPlayerName}</span>
                  <span className="px-2 py-1 bg-blue-500 text-white text-sm font-bold rounded-full">
                    Player {playerNumber}
                  </span>
                </div>
                
                <div className="flex items-center justify-center space-x-4 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Player 1 (You)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse"></div>
                    <span className="text-gray-500">Waiting for Player 2...</span>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                    Share this link to invite others:
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/?room=${currentRoomId}`}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md"
                    />
                    <Button onClick={copyRoomLink} variant="outline" size="sm">
                      Copy
                    </Button>
                  </div>
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
              disabled={selectedPlayerCount === 2 && !playerName.trim()}
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
            {!isConnected ? (
              <>
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
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-green-600 dark:text-green-400">
                  ✅ Connected to Room {currentRoomId}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Players: {roomPlayerCount}/{maxRoomPlayers}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Playing as: <span className="font-medium">{currentPlayerName}</span>
                    {playerNumber && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                        Player {playerNumber}
                      </span>
                    )}
                  </p>
                  {roomPlayerCount < maxRoomPlayers ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Waiting for {maxRoomPlayers - roomPlayerCount} more player{maxRoomPlayers - roomPlayerCount !== 1 ? 's' : ''}...
                      </p>
                      <Button
                        onClick={copyRoomLink}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        📋 Share Room Link
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      🎮 Room full - game starting!
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        {/* My Created Rooms Section */}
        {createdRooms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📂 My Created Rooms</CardTitle>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Rooms you've created recently
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {createdRooms.slice(0, 5).map((room) => (
                  <div key={room.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{room.name}</span>
                        <span className="text-xs text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                          {room.id}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Created: {new Date(room.createdAt).toLocaleDateString()}
                        {room.lastUsed !== room.createdAt && (
                          <span className="ml-2">
                            • Last used: {new Date(room.lastUsed).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => {
                          setRoomId(room.id)
                          updateRoomLastUsed(room.id)
                          if (playerName.trim()) {
                            handleJoinRoom(room.id, playerName.trim())
                          }
                        }}
                        disabled={!playerName.trim()}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        🎮 Join
                      </Button>
                      <Button
                        onClick={() => {
                          const roomLink = `${window.location.origin}/?room=${room.id}`
                          navigator.clipboard.writeText(roomLink)
                        }}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        📋 Copy Link
                      </Button>
                      <Button
                        onClick={() => removeCreatedRoom(room.id)}
                        variant="outline"
                        size="sm"
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                ))}
                {createdRooms.length > 5 && (
                  <p className="text-center text-sm text-slate-500">
                    ...and {createdRooms.length - 5} more
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
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