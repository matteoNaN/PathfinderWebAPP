import { Vector3 } from '@babylonjs/core';

export enum ActionType {
  MOVE = 'move',
  ATTACK = 'attack',
  CAST_SPELL = 'cast_spell',
  DASH = 'dash',
  DODGE = 'dodge',
  HELP = 'help',
  HIDE = 'hide',
  READY = 'ready',
  SEARCH = 'search',
  USE_OBJECT = 'use_object'
}

export enum DamageType {
  SLASHING = 'slashing',
  PIERCING = 'piercing',
  BLUDGEONING = 'bludgeoning',
  FIRE = 'fire',
  COLD = 'cold',
  LIGHTNING = 'lightning',
  ACID = 'acid',
  POISON = 'poison',
  PSYCHIC = 'psychic',
  NECROTIC = 'necrotic',
  RADIANT = 'radiant',
  FORCE = 'force'
}

export enum SpellSchool {
  ABJURATION = 'abjuration',
  CONJURATION = 'conjuration',
  DIVINATION = 'divination',
  ENCHANTMENT = 'enchantment',
  EVOCATION = 'evocation',
  ILLUSION = 'illusion',
  NECROMANCY = 'necromancy',
  TRANSMUTATION = 'transmutation'
}

export interface Weapon {
  id: string;
  name: string;
  damageRoll: string; // e.g., "1d8+3"
  damageType: DamageType;
  range: number; // in feet
  properties: string[]; // finesse, heavy, light, etc.
  attackBonus: number;
}

export interface Spell {
  id: string;
  name: string;
  level: number;
  school: SpellSchool;
  castingTime: string;
  range: number; // in feet
  duration: string;
  concentration: boolean;
  damageRoll?: string;
  damageType?: DamageType;
  savingThrow?: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
  areaType?: 'circle' | 'cone' | 'square' | 'line';
  areaSize?: number;
  description: string;
}

export interface CombatAction {
  id: string;
  type: ActionType;
  actorId: string;
  targetId?: string;
  targetPosition?: Vector3;
  weapon?: Weapon;
  spell?: Spell;
  damage?: number;
  healAmount?: number;
  success: boolean;
  criticalHit?: boolean;
  timestamp: number;
  description: string;
}

export interface AttackRoll {
  d20Roll: number;
  modifier: number;
  total: number;
  advantage: boolean;
  disadvantage: boolean;
  criticalHit: boolean;
  criticalMiss: boolean;
}

export interface DamageRoll {
  rolls: number[];
  modifier: number;
  total: number;
  damageType: DamageType;
  critical: boolean;
}

export interface SavingThrow {
  ability: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
  d20Roll: number;
  modifier: number;
  total: number;
  dc: number;
  success: boolean;
  advantage: boolean;
  disadvantage: boolean;
}

// Preset weapons
export const PRESET_WEAPONS: { [key: string]: Weapon } = {
  'longsword': {
    id: 'longsword',
    name: 'Longsword',
    damageRoll: '1d8+3',
    damageType: DamageType.SLASHING,
    range: 5,
    properties: ['versatile'],
    attackBonus: 5
  },
  'shortbow': {
    id: 'shortbow',
    name: 'Shortbow',
    damageRoll: '1d6+3',
    damageType: DamageType.PIERCING,
    range: 80,
    properties: ['ammunition', 'two-handed'],
    attackBonus: 5
  },
  'dagger': {
    id: 'dagger',
    name: 'Dagger',
    damageRoll: '1d4+3',
    damageType: DamageType.PIERCING,
    range: 20,
    properties: ['finesse', 'light', 'thrown'],
    attackBonus: 5
  },
  'greataxe': {
    id: 'greataxe',
    name: 'Greataxe',
    damageRoll: '1d12+3',
    damageType: DamageType.SLASHING,
    range: 5,
    properties: ['heavy', 'two-handed'],
    attackBonus: 5
  }
};

// Preset spells
export const PRESET_SPELLS: { [key: string]: Spell } = {
  'fireball': {
    id: 'fireball',
    name: 'Fireball',
    level: 3,
    school: SpellSchool.EVOCATION,
    castingTime: '1 action',
    range: 150,
    duration: 'Instantaneous',
    concentration: false,
    damageRoll: '8d6',
    damageType: DamageType.FIRE,
    savingThrow: 'DEX',
    areaType: 'circle',
    areaSize: 20,
    description: 'A bright flash and explosion of fire at a point within range.'
  },
  'cure_wounds': {
    id: 'cure_wounds',
    name: 'Cure Wounds',
    level: 1,
    school: SpellSchool.EVOCATION,
    castingTime: '1 action',
    range: 5,
    duration: 'Instantaneous',
    concentration: false,
    description: 'Restore hit points to a creature you touch.'
  },
  'magic_missile': {
    id: 'magic_missile',
    name: 'Magic Missile',
    level: 1,
    school: SpellSchool.EVOCATION,
    castingTime: '1 action',
    range: 120,
    duration: 'Instantaneous',
    concentration: false,
    damageRoll: '1d4+1',
    damageType: DamageType.FORCE,
    description: 'Three glowing darts of magical force strike their target.'
  },
  'burning_hands': {
    id: 'burning_hands',
    name: 'Burning Hands',
    level: 1,
    school: SpellSchool.EVOCATION,
    castingTime: '1 action',
    range: 15,
    duration: 'Instantaneous',
    concentration: false,
    damageRoll: '3d6',
    damageType: DamageType.FIRE,
    savingThrow: 'DEX',
    areaType: 'cone',
    areaSize: 15,
    description: 'A thin sheet of flames shoots forth from your fingertips.'
  }
};