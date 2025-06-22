import { Vector3, AbstractMesh, MeshBuilder, StandardMaterial, Scene, DynamicTexture, Matrix } from '@babylonjs/core';
import { AdvancedDynamicTexture, TextBlock } from '@babylonjs/gui';
import { CombatEntity } from '../Types/Combat';
import eventEmitter from '../Events/misurazioneEventEmitter';

interface StatusEffect {
  id: string;
  name: string;
  description: string;
  duration: number; // rounds remaining, -1 for permanent
  color: string;
  icon?: string;
}

interface NameLabel {
  entityId: string;
  nameText: TextBlock;
}

interface FloatingText {
  id: string;
  mesh: AbstractMesh;
  startTime: number;
  duration: number;
}

class HealthStatusService {
  private _scene: Scene | null = null;
  private _guiTexture: AdvancedDynamicTexture | null = null;
  private _nameLabels: Map<string, NameLabel> = new Map();
  private _statusEffects: Map<string, StatusEffect[]> = new Map();
  private _floatingTexts: Map<string, FloatingText> = new Map();

  public initialize(scene: Scene): void {
    this._scene = scene;
    this._guiTexture = AdvancedDynamicTexture.CreateFullscreenUI('HealthStatusUI');
    this._setupEventListeners();
  }

  // Name label management
  public createNameLabel(entity: CombatEntity): void {
    if (!this._guiTexture || !entity.mesh) return;

    // Create simple name text
    const nameText = new TextBlock(`nameLabel-${entity.id}`);
    nameText.text = entity.name;
    nameText.color = 'white';
    nameText.fontSize = 16;
    nameText.fontWeight = 'bold';
    nameText.outlineWidth = 2;
    nameText.outlineColor = 'black';

    this._guiTexture.addControl(nameText);

    // Position above entity
    this._updateNameLabelPosition(entity.id, entity.mesh.position);

    const nameLabel: NameLabel = {
      entityId: entity.id,
      nameText
    };

    this._nameLabels.set(entity.id, nameLabel);
  }

  public updateNameLabel(entityId: string): void {
    const nameLabel = this._nameLabels.get(entityId);
    if (!nameLabel) return;

    const entity = this._getEntity(entityId);
    if (!entity || !entity.mesh) return;
    
    // Update position
    this._updateNameLabelPosition(entityId, entity.mesh.position);
  }

  public removeNameLabel(entityId: string): void {
    const nameLabel = this._nameLabels.get(entityId);
    if (nameLabel) {
      nameLabel.nameText.dispose();
      this._nameLabels.delete(entityId);
    }
  }

  // Status effects management
  public addStatusEffect(entityId: string, effect: StatusEffect): void {
    if (!this._statusEffects.has(entityId)) {
      this._statusEffects.set(entityId, []);
    }

    const effects = this._statusEffects.get(entityId)!;
    
    // Remove existing effect with same name
    const existingIndex = effects.findIndex(e => e.name === effect.name);
    if (existingIndex >= 0) {
      effects.splice(existingIndex, 1);
    }

    effects.push(effect);
    // Status display removed - we only show names now
    
    eventEmitter.emit('statusEffectAdded', { entityId, effect });
  }

  public removeStatusEffect(entityId: string, effectName: string): void {
    const effects = this._statusEffects.get(entityId);
    if (!effects) return;

    const index = effects.findIndex(e => e.name === effectName);
    if (index >= 0) {
      const removedEffect = effects.splice(index, 1)[0];
      // Status display removed - we only show names now
      eventEmitter.emit('statusEffectRemoved', { entityId, effect: removedEffect });
    }
  }

  public getStatusEffects(entityId: string): StatusEffect[] {
    return this._statusEffects.get(entityId) || [];
  }

  // Process end of turn effects
  public processTurnEnd(entityId: string): void {
    const effects = this._statusEffects.get(entityId);
    if (!effects) return;

    const expiredEffects: StatusEffect[] = [];
    
    for (let i = effects.length - 1; i >= 0; i--) {
      const effect = effects[i];
      if (effect.duration > 0) {
        effect.duration--;
        if (effect.duration === 0) {
          expiredEffects.push(effects.splice(i, 1)[0]);
        }
      }
    }

    if (expiredEffects.length > 0) {
      // Status display removed - we only show names now
      expiredEffects.forEach(effect => {
        eventEmitter.emit('statusEffectExpired', { entityId, effect });
      });
    }
  }

  // Floating damage/healing text
  public showFloatingText(
    position: Vector3, 
    text: string, 
    color: string = 'white', 
    duration: number = 2000
  ): void {
    if (!this._scene) return;

    const textId = this._generateId();
    
    // Create 3D text using dynamic texture
    const dynamicTexture = new DynamicTexture(`floatingText-${textId}`, {width: 256, height: 128}, this._scene);
    dynamicTexture.hasAlpha = true;
    
    // Draw text on texture
    const font = 'bold 48px Arial';
    dynamicTexture.drawText(text, null, null, font, color, 'transparent', true);

    // Create plane for text
    const textPlane = MeshBuilder.CreatePlane(`floatingTextPlane-${textId}`, {size: 2}, this._scene);
    textPlane.position = position.clone();
    textPlane.position.y += 2; // Start above entity
    textPlane.billboardMode = AbstractMesh.BILLBOARDMODE_Y;

    const material = new StandardMaterial(`floatingTextMat-${textId}`, this._scene);
    material.diffuseTexture = dynamicTexture;
    material.emissiveTexture = dynamicTexture;
    material.backFaceCulling = false;
    textPlane.material = material;

    const floatingText: FloatingText = {
      id: textId,
      mesh: textPlane,
      startTime: Date.now(),
      duration: duration
    };

    this._floatingTexts.set(textId, floatingText);

    // Animate text
    this._animateFloatingText(floatingText);
  }

  public showDamageText(position: Vector3, damage: number): void {
    this.showFloatingText(position, `-${damage}`, '#ff4444', 2000);
  }

  public showHealingText(position: Vector3, healing: number): void {
    this.showFloatingText(position, `+${healing}`, '#44ff44', 2000);
  }

  public showStatusText(position: Vector3, status: string): void {
    this.showFloatingText(position, status, '#ffff44', 3000);
  }

  // Update all name label positions
  public updateAllPositions(): void {
    this._nameLabels.forEach((_nameLabel, entityId) => {
      const entity = this._getEntity(entityId);
      if (entity && entity.mesh) {
        // Use the entity's current mesh position directly
        this._updateNameLabelPosition(entityId, entity.mesh.position);
      }
    });
  }

  // Cleanup
  public dispose(): void {
    this._nameLabels.forEach(nameLabel => {
      nameLabel.nameText.dispose();
    });
    this._nameLabels.clear();

    this._floatingTexts.forEach(text => {
      text.mesh.dispose();
    });
    this._floatingTexts.clear();

    if (this._guiTexture) {
      this._guiTexture.dispose();
    }
  }

  // Private methods
  private _setupEventListeners(): void {
    eventEmitter.on('entityDamaged', (data: { entityId: string; damage: number; newHP: number; position?: Vector3 }) => {
      this.updateNameLabel(data.entityId);
      
      if (data.position) {
        this.showDamageText(data.position, data.damage);
      }
    });

    eventEmitter.on('entityHealed', (data: { entityId: string; healing: number; newHP: number; position?: Vector3 }) => {
      this.updateNameLabel(data.entityId);
      
      if (data.position) {
        this.showHealingText(data.position, data.healing);
      }
    });

    eventEmitter.on('entityAdded', (entity: CombatEntity) => {
      this.createNameLabel(entity);
    });

    eventEmitter.on('entityRemoved', (entityId: string) => {
      this.removeNameLabel(entityId);
      this._statusEffects.delete(entityId);
    });

    eventEmitter.on('turnChanged', () => {
      this.updateAllPositions();
    });
  }

  private _updateNameLabelPosition(entityId: string, worldPosition: Vector3): void {
    const nameLabel = this._nameLabels.get(entityId);
    if (!nameLabel || !this._scene) return;

    // Project 3D position to screen space
    const engine = this._scene.getEngine();
    const camera = this._scene.activeCamera;
    if (!camera) return;

    // Create a position slightly above the entity
    const labelWorldPos = worldPosition.clone();
    labelWorldPos.y += 2.0; // Fixed offset above entity

    const screenPos = Vector3.Project(
      labelWorldPos,
      Matrix.Identity(),
      this._scene.getTransformMatrix(),
      camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
    );

    // Position name label centered above entity
    nameLabel.nameText.leftInPixels = screenPos.x;
    nameLabel.nameText.topInPixels = screenPos.y;
  }

  // Status display removed - we only show names now

  private _animateFloatingText(floatingText: FloatingText): void {
    const startY = floatingText.mesh.position.y;
    const targetY = startY + 3;
    const startTime = floatingText.startTime;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / floatingText.duration;
      
      if (progress >= 1) {
        // Animation complete, remove text
        floatingText.mesh.dispose();
        this._floatingTexts.delete(floatingText.id);
        return;
      }
      
      // Update position and opacity
      const easeOut = 1 - Math.pow(1 - progress, 3);
      floatingText.mesh.position.y = startY + (targetY - startY) * easeOut;
      
      if (floatingText.mesh.material) {
        floatingText.mesh.material.alpha = 1 - progress;
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  private _getEntity(entityId: string): CombatEntity | undefined {
    // Access entities through the global event emitter to avoid circular dependency
    let entity: CombatEntity | undefined;
    
    // Use synchronous event to get entity data
    const listeners = eventEmitter.listenerCount('getEntity');
    if (listeners > 0) {
      eventEmitter.emit('getEntity', entityId, (result: CombatEntity | undefined) => {
        entity = result;
      });
    }
    
    return entity;
  }

  private _generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Preset status effects
  public static getPresetStatusEffects(): { [key: string]: Omit<StatusEffect, 'id'> } {
    return {
      poisoned: {
        name: 'Poisoned',
        description: 'Disadvantage on attack rolls and ability checks',
        duration: 10,
        color: '#8BC34A'
      },
      paralyzed: {
        name: 'Paralyzed',
        description: 'Incapacitated and cannot move or speak',
        duration: 5,
        color: '#9C27B0'
      },
      stunned: {
        name: 'Stunned',
        description: 'Incapacitated and cannot move',
        duration: 1,
        color: '#FF9800'
      },
      unconscious: {
        name: 'Unconscious',
        description: 'Incapacitated and unaware of surroundings',
        duration: -1,
        color: '#607D8B'
      },
      bleeding: {
        name: 'Bleeding',
        description: 'Takes 1d4 damage at start of turn',
        duration: 5,
        color: '#F44336'
      },
      blessed: {
        name: 'Blessed',
        description: '+1d4 to attack rolls and saving throws',
        duration: 10,
        color: '#FFD700'
      },
      hasted: {
        name: 'Hasted',
        description: 'Additional action and movement',
        duration: 10,
        color: '#00BCD4'
      },
      frightened: {
        name: 'Frightened',
        description: 'Disadvantage on ability checks and attacks',
        duration: 3,
        color: '#795548'
      }
    };
  }
}

export { HealthStatusService };
export default new HealthStatusService();