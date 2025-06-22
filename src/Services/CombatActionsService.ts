import { Vector3 } from '@babylonjs/core';
import { 
  CombatAction, 
  ActionType, 
  AttackRoll, 
  DamageRoll, 
  SavingThrow, 
  Weapon, 
  Spell, 
  DamageType,
  PRESET_WEAPONS,
  PRESET_SPELLS
} from '../Types/CombatActions';
import { CombatEntity } from '../Types/Combat';
import eventEmitter from '../Events/misurazioneEventEmitter';
import CombatService from './CombatService';
import MeasurementService from './MeasurementService';

class CombatActionsService {
  private _actionHistory: CombatAction[] = [];
  private _diceRandom: () => number = Math.random;

  // Dice rolling utilities
  public rollD20(advantage: boolean = false, disadvantage: boolean = false): number {
    const roll1 = Math.floor(this._diceRandom() * 20) + 1;
    
    if (advantage && !disadvantage) {
      const roll2 = Math.floor(this._diceRandom() * 20) + 1;
      return Math.max(roll1, roll2);
    } else if (disadvantage && !advantage) {
      const roll2 = Math.floor(this._diceRandom() * 20) + 1;
      return Math.min(roll1, roll2);
    }
    
    return roll1;
  }

  public rollDice(sides: number, count: number = 1): number[] {
    const rolls: number[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(this._diceRandom() * sides) + 1);
    }
    return rolls;
  }

  public parseDiceRoll(diceString: string): { count: number; sides: number; modifier: number } {
    // Parse strings like "1d8+3", "2d6", "1d4-1"
    const match = diceString.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) return { count: 1, sides: 6, modifier: 0 };
    
    return {
      count: parseInt(match[1]),
      sides: parseInt(match[2]),
      modifier: match[3] ? parseInt(match[3]) : 0
    };
  }

  // Attack actions
  public async performAttack(
    attackerId: string, 
    targetId: string, 
    weapon: Weapon,
    advantage: boolean = false,
    disadvantage: boolean = false
  ): Promise<CombatAction> {
    const attacker = CombatService.getEntity(attackerId);
    const target = CombatService.getEntity(targetId);
    
    if (!attacker || !target) {
      throw new Error('Invalid attacker or target');
    }

    // Check range
    const distance = CombatService.calculateDistance(attackerId, targetId);
    const distanceInFeet = distance * 5;
    
    if (distanceInFeet > weapon.range) {
      throw new Error(`Target is out of range (${distanceInFeet}ft > ${weapon.range}ft)`);
    }

    // Roll attack
    const attackRoll = this.rollAttack(weapon.attackBonus, target.stats.armorClass, advantage, disadvantage);
    
    let damage = 0;
    let damageRoll: DamageRoll | null = null;
    
    if (attackRoll.total >= target.stats.armorClass) {
      // Hit! Roll damage
      damageRoll = this.rollDamage(weapon.damageRoll, weapon.damageType, attackRoll.criticalHit);
      damage = damageRoll.total;
      
      // Apply damage
      this.applyDamage(targetId, damage);
    }

    const action: CombatAction = {
      id: this.generateId(),
      type: ActionType.ATTACK,
      actorId: attackerId,
      targetId: targetId,
      weapon: weapon,
      damage: damage,
      success: attackRoll.total >= target.stats.armorClass,
      criticalHit: attackRoll.criticalHit,
      timestamp: Date.now(),
      description: this.generateAttackDescription(attacker, target, weapon, attackRoll, damageRoll)
    };

    this._actionHistory.push(action);
    
    // Mark entity as having acted
    attacker.hasActed = true;
    
    eventEmitter.emit('combatActionPerformed', action);
    return action;
  }

  // Spell casting
  public async castSpell(
    casterId: string,
    spell: Spell,
    targetId?: string,
    targetPosition?: Vector3,
    spellLevel: number = spell.level
  ): Promise<CombatAction> {
    const caster = CombatService.getEntity(casterId);
    if (!caster) {
      throw new Error('Invalid caster');
    }

    let target: CombatEntity | null = null;
    if (targetId) {
      target = CombatService.getEntity(targetId) || null;
      if (!target) {
        throw new Error('Invalid target');
      }

      // Check range to target
      const distance = CombatService.calculateDistance(casterId, targetId);
      const distanceInFeet = distance * 5;
      
      if (distanceInFeet > spell.range) {
        throw new Error(`Target is out of spell range (${distanceInFeet}ft > ${spell.range}ft)`);
      }
    }

    // Create spell area if applicable
    let spellAreaId: string | null = null;
    if (spell.areaType && spell.areaSize && targetPosition) {
      spellAreaId = CombatService.createSpellArea({
        type: spell.areaType,
        radius: spell.areaType === 'circle' ? spell.areaSize : undefined,
        width: spell.areaType === 'square' ? spell.areaSize : undefined,
        length: spell.areaType === 'square' ? spell.areaSize : spell.areaType === 'line' ? spell.areaSize : undefined,
        angle: spell.areaType === 'cone' ? 60 : undefined,
        origin: targetPosition,
        color: this.getSpellColor(spell.school)
      });
    }

    let damage = 0;
    let healAmount = 0;
    let success = true;

    // Handle different spell effects
    if (spell.damageRoll && target) {
      if (spell.savingThrow) {
        // Saving throw spell
        const save = this.rollSavingThrow(target, spell.savingThrow, 13); // DC 13 for now
        if (save.success) {
          damage = this.rollSpellDamage(spell.damageRoll, spellLevel).total / 2; // Half damage on save
        } else {
          damage = this.rollSpellDamage(spell.damageRoll, spellLevel).total;
        }
      } else {
        // Spell attack or automatic hit
        damage = this.rollSpellDamage(spell.damageRoll, spellLevel).total;
      }
      
      if (damage > 0 && target) {
        this.applyDamage(targetId!, damage);
      }
    } else if (spell.name === 'Cure Wounds' && target) {
      // Healing spell
      healAmount = this.rollDice(8, spellLevel)[0] + 3; // 1d8 + spellcasting modifier
      this.applyHealing(targetId!, healAmount);
    }

    const action: CombatAction = {
      id: this.generateId(),
      type: ActionType.CAST_SPELL,
      actorId: casterId,
      targetId: targetId,
      targetPosition: targetPosition,
      spell: spell,
      damage: damage,
      healAmount: healAmount,
      success: success,
      timestamp: Date.now(),
      description: this.generateSpellDescription(caster, target, spell, damage, healAmount)
    };

    this._actionHistory.push(action);
    
    // Mark entity as having acted
    caster.hasActed = true;
    
    eventEmitter.emit('combatActionPerformed', action);
    
    // Auto-remove spell area after a delay for instantaneous spells
    if (spellAreaId && spell.duration === 'Instantaneous') {
      setTimeout(() => {
        CombatService.removeSpellArea(spellAreaId!);
      }, 3000);
    }

    return action;
  }

  // Movement action
  public performMove(entityId: string, newPosition: Vector3): CombatAction {
    const entity = CombatService.getEntity(entityId);
    if (!entity) {
      throw new Error('Invalid entity');
    }

    const oldPosition = new Vector3(entity.position.x, 0, entity.position.z);
    const distance = Vector3.Distance(oldPosition, newPosition);
    const distanceInFeet = distance * 5;

    const action: CombatAction = {
      id: this.generateId(),
      type: ActionType.MOVE,
      actorId: entityId,
      targetPosition: newPosition,
      success: true,
      timestamp: Date.now(),
      description: `${entity.name} moved ${Math.round(distanceInFeet)} feet`
    };

    this._actionHistory.push(action);
    entity.hasMoved = true;
    
    eventEmitter.emit('combatActionPerformed', action);
    return action;
  }

  // Dash action (double movement)
  public performDash(entityId: string): CombatAction {
    const entity = CombatService.getEntity(entityId);
    if (!entity) {
      throw new Error('Invalid entity');
    }

    // Show double movement range
    const entityPosition = new Vector3(entity.position.x, 0, entity.position.z);
    MeasurementService.showMovementRange(entityId, entityPosition, entity.stats.speed * 2);

    const action: CombatAction = {
      id: this.generateId(),
      type: ActionType.DASH,
      actorId: entityId,
      success: true,
      timestamp: Date.now(),
      description: `${entity.name} takes the Dash action (movement speed doubled)`
    };

    this._actionHistory.push(action);
    entity.hasActed = true;
    
    eventEmitter.emit('combatActionPerformed', action);
    return action;
  }

  // Dodge action
  public performDodge(entityId: string): CombatAction {
    const entity = CombatService.getEntity(entityId);
    if (!entity) {
      throw new Error('Invalid entity');
    }

    // Add condition (would need to track until start of next turn)
    if (!entity.conditions.includes('dodging')) {
      entity.conditions.push('dodging');
    }

    const action: CombatAction = {
      id: this.generateId(),
      type: ActionType.DODGE,
      actorId: entityId,
      success: true,
      timestamp: Date.now(),
      description: `${entity.name} takes the Dodge action (advantage on Dex saves, attacks have disadvantage)`
    };

    this._actionHistory.push(action);
    entity.hasActed = true;
    
    eventEmitter.emit('combatActionPerformed', action);
    return action;
  }

  // Damage and healing
  public applyDamage(entityId: string, damage: number): void {
    const entity = CombatService.getEntity(entityId);
    if (!entity) return;

    entity.stats.currentHP = Math.max(0, entity.stats.currentHP - damage);
    
    if (entity.stats.currentHP === 0) {
      entity.conditions.push('unconscious');
    }
    
    const position = entity.mesh ? entity.mesh.position : undefined;
    eventEmitter.emit('entityDamaged', { 
      entityId, 
      damage, 
      newHP: entity.stats.currentHP,
      position 
    });
  }

  public applyHealing(entityId: string, healing: number): void {
    const entity = CombatService.getEntity(entityId);
    if (!entity) return;

    entity.stats.currentHP = Math.min(entity.stats.maxHP, entity.stats.currentHP + healing);
    
    // Remove unconscious condition if healed above 0
    if (entity.stats.currentHP > 0) {
      entity.conditions = entity.conditions.filter(c => c !== 'unconscious');
    }
    
    const position = entity.mesh ? entity.mesh.position : undefined;
    eventEmitter.emit('entityHealed', { 
      entityId, 
      healing, 
      newHP: entity.stats.currentHP,
      position 
    });
  }

  // Utility methods
  private rollAttack(attackBonus: number, _targetAC: number, advantage: boolean, disadvantage: boolean): AttackRoll {
    const d20Roll = this.rollD20(advantage, disadvantage);
    const total = d20Roll + attackBonus;
    
    return {
      d20Roll,
      modifier: attackBonus,
      total,
      advantage,
      disadvantage,
      criticalHit: d20Roll === 20,
      criticalMiss: d20Roll === 1
    };
  }

  private rollDamage(diceString: string, damageType: DamageType, critical: boolean = false): DamageRoll {
    const { count, sides, modifier } = this.parseDiceRoll(diceString);
    let rolls = this.rollDice(sides, count);
    
    // Double dice on critical hit
    if (critical) {
      rolls = rolls.concat(this.rollDice(sides, count));
    }
    
    const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;
    
    return {
      rolls,
      modifier,
      total: Math.max(0, total),
      damageType,
      critical
    };
  }

  private rollSpellDamage(diceString: string, _spellLevel: number): DamageRoll {
    const { count, sides, modifier } = this.parseDiceRoll(diceString);
    const rolls = this.rollDice(sides, count);
    const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;
    
    return {
      rolls,
      modifier,
      total: Math.max(0, total),
      damageType: DamageType.FORCE, // Default
      critical: false
    };
  }

  private rollSavingThrow(_entity: CombatEntity, ability: string, dc: number): SavingThrow {
    const d20Roll = this.rollD20();
    const modifier = 2; // Simplified - would calculate from ability scores
    const total = d20Roll + modifier;
    
    return {
      ability: ability as any,
      d20Roll,
      modifier,
      total,
      dc,
      success: total >= dc,
      advantage: false,
      disadvantage: false
    };
  }

  private generateAttackDescription(
    attacker: CombatEntity, 
    target: CombatEntity, 
    weapon: Weapon, 
    attackRoll: AttackRoll, 
    damageRoll: DamageRoll | null
  ): string {
    if (attackRoll.criticalMiss) {
      return `${attacker.name} critically misses with ${weapon.name}!`;
    } else if (!damageRoll) {
      return `${attacker.name} attacks ${target.name} with ${weapon.name} but misses (${attackRoll.total} vs AC ${target.stats.armorClass})`;
    } else if (attackRoll.criticalHit) {
      return `${attacker.name} critically hits ${target.name} with ${weapon.name} for ${damageRoll.total} ${damageRoll.damageType} damage!`;
    } else {
      return `${attacker.name} hits ${target.name} with ${weapon.name} for ${damageRoll.total} ${damageRoll.damageType} damage`;
    }
  }

  private generateSpellDescription(
    caster: CombatEntity, 
    target: CombatEntity | null, 
    spell: Spell, 
    damage: number, 
    healing: number
  ): string {
    if (healing > 0 && target) {
      return `${caster.name} casts ${spell.name} on ${target.name}, healing ${healing} HP`;
    } else if (damage > 0 && target) {
      return `${caster.name} casts ${spell.name} on ${target.name} for ${damage} damage`;
    } else {
      return `${caster.name} casts ${spell.name}`;
    }
  }

  private getSpellColor(school: string): string {
    const colors: { [key: string]: string } = {
      'evocation': '#ff6b6b',
      'abjuration': '#4ecdc4',
      'conjuration': '#45b7d1',
      'divination': '#96ceb4',
      'enchantment': '#feca57',
      'illusion': '#a8e6cf',
      'necromancy': '#6c5ce7',
      'transmutation': '#fd79a8'
    };
    return colors[school] || '#666';
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Getters
  public getActionHistory(): CombatAction[] {
    return [...this._actionHistory];
  }

  public getPresetWeapons(): { [key: string]: Weapon } {
    return PRESET_WEAPONS;
  }

  public getPresetSpells(): { [key: string]: Spell } {
    return PRESET_SPELLS;
  }

  // Clear history
  public clearActionHistory(): void {
    this._actionHistory = [];
  }
}

export default new CombatActionsService();