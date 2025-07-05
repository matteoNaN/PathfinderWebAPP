import { Vector3, AbstractMesh, Node } from '@babylonjs/core';

export enum EntityType {
  PLAYER = 'player',
  ENEMY = 'enemy',
  NPC = 'npc'
}

export enum CreatureSize {
  TINY = 'tiny',        // 2.5x2.5 ft
  SMALL = 'small',      // 5x5 ft  
  MEDIUM = 'medium',    // 5x5 ft
  LARGE = 'large',      // 10x10 ft
  HUGE = 'huge',        // 15x15 ft
  GARGANTUAN = 'gargantuan' // 20x20 ft or larger
}

export interface CombatStats {
  maxHP: number;
  currentHP: number;
  armorClass: number;
  initiative: number;
  speed: number; // movement speed in feet
}

export interface Position {
  x: number;
  z: number;
  gridX: number;
  gridZ: number;
  y?: number; // Height for flying entities
}

export interface CombatEntity {
  id: string;
  name: string;
  type: EntityType;
  size: CreatureSize;
  stats: CombatStats;
  position: Position;
  mesh?: AbstractMesh;
  modelPath?: string;
  isSelected: boolean;
  hasMoved: boolean;
  hasActed: boolean;
  conditions: string[]; // status effects like poisoned, paralyzed, etc.
  isFlying?: boolean;
  flyingHeight?: number; // Height in feet above ground
  heightIndicator?: Node; // Arrow and height display
}

export interface SpellArea {
  id: string;
  type: 'circle' | 'cone' | 'square' | 'line';
  radius?: number;
  width?: number;
  length?: number;
  angle?: number; // for cones
  origin: Vector3;
  color: string;
  mesh?: AbstractMesh;
  centerIndicator?: AbstractMesh;
}

export interface TurnOrder {
  entityId: string;
  initiative: number;
  hasGone: boolean;
}

export interface CombatState {
  entities: Map<string, CombatEntity>;
  turnOrder: TurnOrder[];
  currentTurnIndex: number;
  round: number;
  isActive: boolean;
  selectedEntityId?: string;
  spellAreas: Map<string, SpellArea>;
}