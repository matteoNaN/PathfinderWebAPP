import { Vector3, AbstractMesh, MeshBuilder, StandardMaterial, Scene, DynamicTexture } from '@babylonjs/core';
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
  nameMesh: AbstractMesh;
}

interface FloatingText {
  id: string;
  mesh: AbstractMesh;
  startTime: number;
  duration: number;
}

class HealthStatusService {
  private _scene: Scene | null = null;
  private _nameLabels: Map<string, NameLabel> = new Map();
  private _statusEffects: Map<string, StatusEffect[]> = new Map();
  private _floatingTexts: Map<string, FloatingText> = new Map();

  public initialize(scene: Scene): void {
    this._scene = scene;
    this._setupEventListeners();
  }

  // Name label management
  public createNameLabel(entity: CombatEntity): void {
    if (!this._scene || !entity.mesh) return;

    // Create 3D text mesh using dynamic texture with improved styling
    const dynamicTexture = new DynamicTexture(`nameTexture-${entity.id}`, {width: 512, height: 128}, this._scene);
    dynamicTexture.hasAlpha = true;
    
    // Clear texture and get context
    const context = dynamicTexture.getContext() as CanvasRenderingContext2D;
    context.clearRect(0, 0, 512, 128);
    
    // Draw background with rounded rectangle and gradient
    const gradient = context.createLinearGradient(0, 0, 0, 128);
    gradient.addColorStop(0, 'rgba(99, 91, 255, 0.9)');
    gradient.addColorStop(1, 'rgba(124, 58, 237, 0.9)');
    
    // Draw rounded background
    this._drawRoundedRect(context, 32, 24, 448, 80, 20, gradient);
    
    // Add subtle border (instead of black border)
    context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    context.lineWidth = 1;
    this._drawRoundedRect(context, 32, 24, 448, 80, 20);
    context.stroke();
    
    // Draw text with improved styling
    const font = 'bold 32px Arial';
    context.font = font;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Draw text shadow
    context.fillStyle = 'rgba(0, 0, 0, 0.4)';
    context.fillText(entity.name, 258, 66);
    
    // Draw main text
    context.fillStyle = 'white';
    context.fillText(entity.name, 256, 64);
    
    dynamicTexture.update();

    // Create plane for text
    const namePlane = MeshBuilder.CreatePlane(`nameLabel-${entity.id}`, {size: 3}, this._scene);
    
    // Position above entity
    const entityPos = entity.mesh.position;
    namePlane.position = new Vector3(entityPos.x, entityPos.y + 2.5, entityPos.z);
    
    // Set billboard mode so text always faces camera
    namePlane.billboardMode = AbstractMesh.BILLBOARDMODE_Y;

    // Create and apply material
    const material = new StandardMaterial(`nameMaterial-${entity.id}`, this._scene);
    material.diffuseTexture = dynamicTexture;
    material.emissiveTexture = dynamicTexture;
    material.backFaceCulling = false;
    material.alpha = 0.9;
    namePlane.material = material;

    const nameLabel: NameLabel = {
      entityId: entity.id,
      nameMesh: namePlane
    };

    this._nameLabels.set(entity.id, nameLabel);
  }

  public updateNameLabel(entityId: string): void {
    const nameLabel = this._nameLabels.get(entityId);
    if (!nameLabel) return;

    const entity = this._getEntity(entityId);
    if (!entity || !entity.mesh) return;
    
    // Update 3D position - name mesh follows entity mesh
    const entityPos = entity.mesh.position;
    nameLabel.nameMesh.position = new Vector3(entityPos.x, entityPos.y + 2.5, entityPos.z);
  }

  public removeNameLabel(entityId: string): void {
    const nameLabel = this._nameLabels.get(entityId);
    if (nameLabel) {
      nameLabel.nameMesh.dispose();
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
      this.updateNameLabel(entityId);
    });
  }

  // Update single entity name label position (more efficient for drag operations)
  public updateEntityPosition(entityId: string): void {
    this.updateNameLabel(entityId);
  }

  // Cleanup
  public dispose(): void {
    this._nameLabels.forEach(nameLabel => {
      nameLabel.nameMesh.dispose();
    });
    this._nameLabels.clear();

    this._floatingTexts.forEach(text => {
      text.mesh.dispose();
    });
    this._floatingTexts.clear();
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

  private _drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fillStyle?: string | CanvasGradient): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
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