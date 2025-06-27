/**
 * Game Action Types
 * 
 * These define the structure of actions that can be performed in the game.
 * Actions are pure data structures that describe what the player wants to do.
 */

import type { ResourceType, ConversionType } from './GameState'

export interface BaseAction {
  type: string
  playerId: string | number
}

export interface MovementAction extends BaseAction {
  type: 'movement'
  pieceId: string
  fromSpaceId: string
  toSpaceId: string
}

export interface EatingAction extends BaseAction {
  type: 'eating'
  pieceId: string
  resourceType: ResourceType
  amount: number
  convertTo: ConversionType
}

export interface HibernationAction extends BaseAction {
  type: 'hibernation'
  pieceId: string
}

export interface HarvestAction extends BaseAction {
  type: 'harvest'
  pieceId: string
  spaceId: string
}

export interface EnergyTaxAction extends BaseAction {
  type: 'energy_tax'
  pieceId: string
}

export interface EmergencyEnergyAction extends BaseAction {
  type: 'emergency_energy'
  pieceId: string
  fatAmount: number
}

export interface TurnAdvancementAction extends BaseAction {
  type: 'turn_advancement'
}

export interface PhaseAdvancementAction extends BaseAction {
  type: 'phase_advancement'
}

export interface DeathAction extends BaseAction {
  type: 'death'
  pieceId: string
}

export interface TradingAction extends BaseAction {
  type: 'trading'
  fromPieceId: string
  toPieceId: string
  fromResourceType: ResourceType
  toResourceType: ResourceType
  fromAmount: number
  toAmount: number
}

/**
 * Union type of all possible game actions
 */
export type GameAction = 
  | MovementAction
  | EatingAction
  | HibernationAction
  | HarvestAction
  | EnergyTaxAction
  | EmergencyEnergyAction
  | TurnAdvancementAction
  | PhaseAdvancementAction
  | DeathAction
  | TradingAction

/**
 * Action creators - helper functions to create properly typed actions
 */
export const ActionCreators = {
  movement: (playerId: string | number, pieceId: string, fromSpaceId: string, toSpaceId: string): MovementAction => ({
    type: 'movement',
    playerId,
    pieceId,
    fromSpaceId,
    toSpaceId
  }),

  eating: (playerId: string | number, pieceId: string, resourceType: ResourceType, amount: number, convertTo: ConversionType): EatingAction => ({
    type: 'eating',
    playerId,
    pieceId,
    resourceType,
    amount,
    convertTo
  }),

  hibernation: (playerId: string | number, pieceId: string): HibernationAction => ({
    type: 'hibernation',
    playerId,
    pieceId
  }),

  harvest: (playerId: string | number, pieceId: string, spaceId: string): HarvestAction => ({
    type: 'harvest',
    playerId,
    pieceId,
    spaceId
  }),

  energyTax: (playerId: string | number, pieceId: string): EnergyTaxAction => ({
    type: 'energy_tax',
    playerId,
    pieceId
  }),

  emergencyEnergy: (playerId: string | number, pieceId: string, fatAmount: number): EmergencyEnergyAction => ({
    type: 'emergency_energy',
    playerId,
    pieceId,
    fatAmount
  }),

  turnAdvancement: (playerId: string | number): TurnAdvancementAction => ({
    type: 'turn_advancement',
    playerId
  }),

  phaseAdvancement: (playerId: string | number): PhaseAdvancementAction => ({
    type: 'phase_advancement',
    playerId
  }),

  death: (playerId: string | number, pieceId: string): DeathAction => ({
    type: 'death',
    playerId,
    pieceId
  }),

  trading: (
    playerId: string | number, 
    fromPieceId: string, 
    toPieceId: string, 
    fromResourceType: ResourceType, 
    toResourceType: ResourceType, 
    fromAmount: number, 
    toAmount: number
  ): TradingAction => ({
    type: 'trading',
    playerId,
    fromPieceId,
    toPieceId,
    fromResourceType,
    toResourceType,
    fromAmount,
    toAmount
  })
}