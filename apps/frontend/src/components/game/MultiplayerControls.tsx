'use client'

import { useState } from 'react'
import { useCoordinatedGameActions } from '@/state/StateCoordinator'
import { useMultiplayerStore } from '@/state/MultiplayerStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Users, 
  Wifi, 
  WifiOff, 
  Copy, 
  Share2,
  LogOut,
  UserPlus
} from 'lucide-react'

export function MultiplayerControls() {
  const {
    isConnected: isMultiplayer,
    roomId,
    playerName,
    playerNumber,
    connectedPlayers,
    disconnectFromRoom
  } = useMultiplayerStore()
  
  const isConnected = isMultiplayer
  
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [inputRoomId, setInputRoomId] = useState('')
  const [inputPlayerName, setInputPlayerName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const generateRoomId = () => {
    return `room-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
  }

  const handleCreateRoom = async () => {
    if (!inputPlayerName.trim()) {
      alert('Please enter your name')
      return
    }

    setIsLoading(true)
    try {
      const newRoomId = generateRoomId()
      // TODO: Implement room creation from within game
      console.log('Create room from game UI - not implemented yet:', newRoomId, inputPlayerName.trim())
      setShowCreateDialog(false)
      setInputPlayerName('')
    } catch (error) {
      console.error('Failed to create room:', error)
      alert('Failed to create room. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!inputRoomId.trim() || !inputPlayerName.trim()) {
      alert('Please enter both room ID and your name')
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement room joining from within game 
      console.log('Join room from game UI - not implemented yet:', inputRoomId.trim(), inputPlayerName.trim())
      setShowJoinDialog(false)
      setInputRoomId('')
      setInputPlayerName('')
    } catch (error) {
      console.error('Failed to join room:', error)
      alert('Failed to join room. Please check the room ID and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId)
      console.log('Room ID copied to clipboard!')
    }
  }

  const shareRoom = () => {
    if (roomId) {
      const shareUrl = `${window.location.origin}?room=${roomId}`
      navigator.clipboard.writeText(shareUrl)
      console.log('Share link copied to clipboard!')
    }
  }


  if (isMultiplayer) {
    return (
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-600">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Multiplayer Game
            {isConnected ? (
              <Badge className="bg-green-500">
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive">
                <WifiOff className="w-3 h-3 mr-1" />
                Disconnected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Player Info */}
          <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
            <div className="text-sm text-slate-300 mb-1">Your Name</div>
            <div className="font-medium text-slate-200">{playerName}</div>
          </div>

          {/* Room Info */}
          <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
            <div className="text-sm text-slate-300 mb-2">Room ID</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-slate-800 px-2 py-1 rounded text-slate-200 font-mono">
                {roomId}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyRoomId}
                className="text-slate-300 hover:text-white"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Share Controls */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={shareRoom}
              variant="outline"
              size="sm"
              className="border-slate-500 hover:bg-slate-700"
            >
              <Share2 className="w-3 h-3 mr-1" />
              Share Link
            </Button>
            
            <Button
              onClick={disconnectFromRoom}
              variant="ghost"
              size="sm"
              className="text-red-300 hover:text-red-200 hover:bg-red-500/10"
            >
              <LogOut className="w-3 h-3 mr-1" />
              Leave Room
            </Button>
          </div>

          {/* Connection Status */}
          <div className="text-xs text-slate-400">
            {isConnected ? '✅ Real-time sync active' : '❌ Attempting to reconnect...'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-600">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Multiplayer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Create Room */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
              <UserPlus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-600">
            <DialogHeader>
              <DialogTitle className="text-slate-200">Create Multiplayer Room</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Your Name</label>
                <Input
                  value={inputPlayerName}
                  onChange={(e) => setInputPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-slate-700 border-slate-600 text-slate-200"
                  disabled={isLoading}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateRoom}
                  disabled={isLoading || !inputPlayerName.trim()}
                  className="flex-1"
                >
                  {isLoading ? 'Creating...' : 'Create Room'}
                </Button>
                <Button
                  onClick={() => setShowCreateDialog(false)}
                  variant="outline"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Join Room */}
        <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full border-slate-500 hover:bg-slate-700">
              <Wifi className="w-4 h-4 mr-2" />
              Join Room
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-600">
            <DialogHeader>
              <DialogTitle className="text-slate-200">Join Multiplayer Room</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Room ID</label>
                <Input
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value)}
                  placeholder="Enter room ID"
                  className="bg-slate-700 border-slate-600 text-slate-200"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Your Name</label>
                <Input
                  value={inputPlayerName}
                  onChange={(e) => setInputPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-slate-700 border-slate-600 text-slate-200"
                  disabled={isLoading}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleJoinRoom}
                  disabled={isLoading || !inputRoomId.trim() || !inputPlayerName.trim()}
                  className="flex-1"
                >
                  {isLoading ? 'Joining...' : 'Join Room'}
                </Button>
                <Button
                  onClick={() => setShowJoinDialog(false)}
                  variant="outline"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="text-xs text-slate-400 text-center">
          Play with friends in real-time
        </div>
      </CardContent>
    </Card>
  )
}