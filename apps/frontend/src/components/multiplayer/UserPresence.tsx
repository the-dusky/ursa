/**
 * User Presence Component - Shows online users and their activity
 * 
 * This component displays:
 * - List of online users
 * - User activity indicators
 * - Cursor positions
 * - Current actions being performed
 */

import React from 'react'
import { UserPresence as UserPresenceType } from '../../state/YjsAwareness'

interface UserPresenceProps {
  users: Map<string, UserPresenceType>
  currentUserId: string
  showCursors?: boolean
  showActions?: boolean
  compact?: boolean
}

/**
 * Individual user presence indicator
 */
const UserIndicator: React.FC<{
  user: UserPresenceType
  showAction?: boolean
  compact?: boolean
}> = ({ user, showAction = true, compact = false }) => {
  const timeAgo = React.useMemo(() => {
    const diff = Date.now() - user.lastSeen
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'now'
  }, [user.lastSeen])

  return (
    <div className={`user-indicator ${compact ? 'compact' : ''}`}>
      <div className="user-info">
        <div 
          className="user-avatar"
          style={{ backgroundColor: user.userColor }}
        >
          {user.userName.charAt(0).toUpperCase()}
        </div>
        
        {!compact && (
          <div className="user-details">
            <div className="user-name">{user.userName}</div>
            <div className="user-status">
              <span className={`status-dot ${user.isActive ? 'active' : 'inactive'}`} />
              <span className="last-seen">{timeAgo}</span>
            </div>
          </div>
        )}
      </div>
      
      {showAction && user.currentAction && (
        <div className="user-action">
          <span className="action-text">{user.currentAction}</span>
          {user.selectedPiece && (
            <span className="selected-piece">({user.selectedPiece})</span>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * User cursor overlay
 */
const UserCursor: React.FC<{
  user: UserPresenceType
  containerRef: React.RefObject<HTMLElement>
}> = ({ user, containerRef }) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0, visible: false })
  
  React.useEffect(() => {
    if (!user.cursor || !containerRef.current) return
    
    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    
    setPosition({
      x: user.cursor.x - rect.left,
      y: user.cursor.y - rect.top,
      visible: user.cursor.visible
    })
  }, [user.cursor, containerRef])
  
  if (!position.visible) return null
  
  return (
    <div
      className="user-cursor"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        pointerEvents: 'none',
        zIndex: 1000
      }}
    >
      <div 
        className="cursor-pointer"
        style={{ borderColor: user.userColor }}
      />
      <div 
        className="cursor-label"
        style={{ backgroundColor: user.userColor }}
      >
        {user.userName}
      </div>
    </div>
  )
}

/**
 * Main user presence component
 */
export const UserPresence: React.FC<UserPresenceProps> = ({
  users,
  currentUserId,
  showCursors = true,
  showActions = true,
  compact = false
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  
  const activeUsers = React.useMemo(() => {
    return Array.from(users.values()).filter(user => 
      user.userId !== currentUserId && user.isActive
    )
  }, [users, currentUserId])
  
  const usersWithCursors = React.useMemo(() => {
    return activeUsers.filter(user => 
      user.cursor?.visible && showCursors
    )
  }, [activeUsers, showCursors])
  
  if (activeUsers.length === 0) {
    return (
      <div className="user-presence empty">
        <div className="no-users">No other users online</div>
      </div>
    )
  }
  
  return (
    <div className="user-presence" ref={containerRef}>
      <div className="presence-header">
        <h3>Online Users ({activeUsers.length})</h3>
      </div>
      
      <div className="users-list">
        {activeUsers.map(user => (
          <UserIndicator
            key={user.userId}
            user={user}
            showAction={showActions}
            compact={compact}
          />
        ))}
      </div>
      
      {/* Cursor overlays */}
      {usersWithCursors.map(user => (
        <UserCursor
          key={`cursor-${user.userId}`}
          user={user}
          containerRef={containerRef}
        />
      ))}
    </div>
  )
}

/**
 * Compact user presence for header/toolbar
 */
export const CompactUserPresence: React.FC<{
  users: Map<string, UserPresenceType>
  currentUserId: string
  onClick?: () => void
}> = ({ users, currentUserId, onClick }) => {
  const activeUsers = React.useMemo(() => {
    return Array.from(users.values()).filter(user => 
      user.userId !== currentUserId && user.isActive
    )
  }, [users, currentUserId])
  
  if (activeUsers.length === 0) return null
  
  return (
    <div className="compact-user-presence" onClick={onClick}>
      <div className="user-count">
        {activeUsers.length} online
      </div>
      
      <div className="user-avatars">
        {activeUsers.slice(0, 3).map(user => (
          <div
            key={user.userId}
            className="compact-avatar"
            style={{ backgroundColor: user.userColor }}
            title={user.userName}
          >
            {user.userName.charAt(0).toUpperCase()}
          </div>
        ))}
        {activeUsers.length > 3 && (
          <div className="more-users">+{activeUsers.length - 3}</div>
        )}
      </div>
    </div>
  )
}

/**
 * User activity indicator for game board
 */
export const UserActivityIndicator: React.FC<{
  users: Map<string, UserPresenceType>
  currentUserId: string
  spaceId?: string
  pieceId?: string
}> = ({ users, currentUserId, spaceId, pieceId }) => {
  const relevantUsers = React.useMemo(() => {
    return Array.from(users.values()).filter(user => {
      if (user.userId === currentUserId || !user.isActive) return false
      
      if (spaceId && user.hoveredSpace === spaceId) return true
      if (pieceId && user.selectedPiece === pieceId) return true
      
      return false
    })
  }, [users, currentUserId, spaceId, pieceId])
  
  if (relevantUsers.length === 0) return null
  
  return (
    <div className="user-activity-indicator">
      {relevantUsers.map(user => (
        <div
          key={user.userId}
          className="activity-dot"
          style={{ backgroundColor: user.userColor }}
          title={`${user.userName} ${user.currentAction || 'is here'}`}
        />
      ))}
    </div>
  )
}

export default UserPresence