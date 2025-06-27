/**
 * State Adapter - Clean Transformation Between Store and Engine Formats
 * 
 * This adapter handles the transformation between the UI store format and the 
 * game engine format, ensuring clean separation of concerns and eliminating
 * the tight coupling that was present in the action creators.
 */

import type { CoreGameState, CoreGamePiece, CoreGameSpace } from './types'
import type { CleanGameState, GamePiece, GameSpace, Board } from '../store/gameStore'

export class StateAdapter {
  /**
   * Convert game store state to engine format
   */
  static toEngineState(storeState: CleanGameState): CoreGameState {
    // Convert all spaces (including bridges) to engine format
    const allSpaces = { ...storeState.board.spaces, ...storeState.board.bridges }
    
    const engineSpaces = Object.fromEntries(
      Object.entries(allSpaces).map(([id, space]) => [
        id,
        this.toEngineSpace(space)
      ])
    )

    const enginePlayers = storeState.players.map(player => ({
      id: player.id,
      name: player.name,
      color: player.color,
      pieces: player.pieces.map(piece => this.toEnginePiece(piece)),
      pieceCount: player.pieceCount,
      score: player.score
    }))

    return {
      board: {
        spaces: engineSpaces,
        rings: storeState.board.rings,
        bridges: {}, // Engine format doesn't distinguish bridges separately
        rotations: storeState.board.rotations
      },
      players: enginePlayers,
      currentPlayerIndex: storeState.currentPlayerIndex,
      season: storeState.season,
      year: storeState.year,
      turn: storeState.turn,
      gamePhase: storeState.gamePhase,
      turnPhase: storeState.turnPhase,
      energyTaxPaid: storeState.energyTaxPaid
    }
  }

  /**
   * Convert engine state to game store format
   */
  static fromEngineState(engineState: CoreGameState): Partial<CleanGameState> {
    // Separate regular spaces from bridge spaces
    const allSpaces = Object.entries(engineState.board.spaces)
    const regularSpaces = allSpaces.filter(([id]) => !id.startsWith('BRIDGE-'))
    const bridgeSpaces = allSpaces.filter(([id]) => id.startsWith('BRIDGE-'))

    const board: Board = {
      spaces: Object.fromEntries(
        regularSpaces.map(([id, space]) => [id, this.fromEngineSpace(space)])
      ),
      bridges: Object.fromEntries(
        bridgeSpaces.map(([id, space]) => [id, this.fromEngineSpace(space)])
      ),
      rings: engineState.board.rings,
      rotations: engineState.board.rotations
    }

    const players = engineState.players.map(player => ({
      id: player.id,
      name: player.name,
      color: player.color,
      pieces: player.pieces.map(piece => this.fromEnginePiece(piece)),
      pieceCount: player.pieceCount,
      score: player.score
    }))

    return {
      board,
      players,
      currentPlayerIndex: engineState.currentPlayerIndex,
      season: engineState.season,
      year: engineState.year,
      turn: engineState.turn,
      gamePhase: engineState.gamePhase,
      turnPhase: engineState.turnPhase,
      energyTaxPaid: engineState.energyTaxPaid
    }
  }

  /**
   * Convert store space to engine format
   */
  private static toEngineSpace(space: GameSpace): CoreGameSpace {
    return {
      id: space.id,
      ring: space.ring,
      position: space.position,
      angle: space.angle,
      quadrant: space.quadrant,
      subArea: space.subArea,
      piece: space.piece ? this.toEnginePiece(space.piece) : null,
      canProduce: space.canProduce,
      hasHoney: space.hasHoney,
      adjacentSpaces: space.adjacentSpaces
    }
  }

  /**
   * Convert engine space to store format
   */
  private static fromEngineSpace(space: CoreGameSpace): GameSpace {
    return {
      id: space.id,
      ring: space.ring,
      position: space.position,
      angle: space.angle,
      quadrant: space.quadrant,
      subArea: space.subArea,
      piece: space.piece ? this.fromEnginePiece(space.piece) : null,
      canProduce: space.canProduce,
      hasHoney: space.hasHoney,
      adjacentSpaces: space.adjacentSpaces
    }
  }

  /**
   * Convert store piece to engine format
   */
  private static toEnginePiece(piece: GamePiece): CoreGamePiece {
    return {
      id: piece.id,
      playerId: piece.playerId,
      spaceId: piece.spaceId,
      type: piece.type,
      health: piece.health,
      resources: piece.resources,
      energy: piece.energy,
      fat: piece.fat,
      emergencyEnergy: piece.emergencyEnergy,
      isHibernating: piece.isHibernating,
      movedThisTurn: piece.movedThisTurn
    }
  }

  /**
   * Convert engine piece to store format
   */
  private static fromEnginePiece(piece: CoreGamePiece): GamePiece {
    return {
      id: piece.id,
      playerId: piece.playerId,
      spaceId: piece.spaceId,
      type: piece.type,
      health: piece.health,
      resources: piece.resources,
      energy: piece.energy,
      fat: piece.fat,
      emergencyEnergy: piece.emergencyEnergy,
      isHibernating: piece.isHibernating,
      movedThisTurn: piece.movedThisTurn
    }
  }

  /**
   * Convert store board to engine board format for setup
   */
  static toBoardForSetup(board: Board): CoreGameState['board'] {
    return {
      spaces: Object.fromEntries(
        Object.entries(board.spaces).map(([id, space]) => [
          id,
          {
            ...this.toEngineSpace(space),
            piece: null // Clear pieces for setup
          }
        ])
      ),
      rings: board.rings,
      bridges: {}, // Engine format doesn't distinguish bridges separately
      rotations: board.rotations
    }
  }

  /**
   * Convert store players to engine players format for setup
   */
  static toPlayersForSetup(players: CleanGameState['players']): CoreGameState['players'] {
    return players.map(player => ({
      id: player.id,
      name: player.name,
      color: player.color,
      pieces: [] as CoreGamePiece[], // Clear pieces for setup
      pieceCount: { bears: 0, cubs: 0, maxBears: 3, maxCubs: 6 },
      score: 0
    }))
  }
}