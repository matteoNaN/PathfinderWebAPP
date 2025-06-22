import { Vector3, AbstractMesh, MeshBuilder, StandardMaterial, Color3, Scene, ActionManager, ExecuteCodeAction, PointerDragBehavior, Mesh } from '@babylonjs/core';
import { CombatEntity, CombatState, EntityType, CreatureSize, Position, SpellArea } from '../Types/Combat';
import eventEmitter from '../Events/misurazioneEventEmitter';
import ModelLoaderService from './ModelLoaderService';
import MeasurementService from './MeasurementService';
import CombatActionsService from './CombatActionsService';
import HealthStatusService, { HealthStatusService as HealthStatusServiceClass } from './HealthStatusService';
import SaveLoadService from './SaveLoadService';

class CombatService {
  private _combatState: CombatState;
  private _scene: Scene | null = null;

  constructor() {
    this._combatState = {
      entities: new Map(),
      turnOrder: [],
      currentTurnIndex: 0,
      round: 1,
      isActive: false,
      spellAreas: new Map()
    };
  }

  public initialize(scene: Scene): void {
    this._scene = scene;
    ModelLoaderService.initialize(scene);
    MeasurementService.initialize(scene);
    HealthStatusService.initialize(scene);
    
    // Set up event listener for HealthStatusService to get entity data
    eventEmitter.on('getEntity', (entityId: string, callback: (entity: CombatEntity | undefined) => void) => {
      callback(this._combatState.entities.get(entityId));
    });
  }

  // Entity Management
  public async addEntity(entity: Omit<CombatEntity, 'id'>): Promise<string> {
    const id = this._generateId();
    const newEntity: CombatEntity = {
      ...entity,
      id,
      isSelected: false,
      hasMoved: false,
      hasActed: false,
      conditions: []
    };

    this._combatState.entities.set(id, newEntity);
    
    // Create 3D representation
    await this._createEntityMesh(newEntity);
    
    // Update turn order if combat is active
    if (this._combatState.isActive) {
      this._updateTurnOrder();
    }

    eventEmitter.emit('entityAdded', newEntity);
    return id;
  }

  public removeEntity(entityId: string): void {
    const entity = this._combatState.entities.get(entityId);
    if (!entity) {
      return;
    }

    // Remove 3D model
    if (entity.modelPath) {
      ModelLoaderService.removeModel(entityId);
    } else if (entity.mesh) {
      entity.mesh.dispose();
    }

    // Remove from selected entity if it's currently selected
    if (this._combatState.selectedEntityId === entityId) {
      this._combatState.selectedEntityId = undefined;
    }
    
    // Remove from combat state
    this._combatState.entities.delete(entityId);
    this._combatState.turnOrder = this._combatState.turnOrder.filter(t => t.entityId !== entityId);
    
    // Adjust current turn index if needed
    if (this._combatState.currentTurnIndex >= this._combatState.turnOrder.length) {
      this._combatState.currentTurnIndex = 0;
    }
    
    eventEmitter.emit('entityRemoved', entityId);
  }

  public moveEntity(entityId: string, newPosition: Position): boolean {
    const entity = this._combatState.entities.get(entityId);
    if (!entity) return false;

    // Check if movement is valid (within movement speed, etc.)
    if (this._combatState.isActive && !this._canMove(entity, newPosition)) {
      return false;
    }

    entity.position = newPosition;
    
    if (entity.mesh) {
      entity.mesh.position = new Vector3(newPosition.x, entity.mesh.position.y, newPosition.z);
    }

    if (this._combatState.isActive) {
      entity.hasMoved = true;
    }

    eventEmitter.emit('entityMoved', { entityId, position: newPosition });
    return true;
  }

  // Combat Management
  public startCombat(): void {
    if (this._combatState.entities.size === 0) {
      return;
    }

    this._combatState.isActive = true;
    this._combatState.round = 1;
    this._combatState.currentTurnIndex = 0;
    
    // Roll initiative for all entities
    this._rollInitiative();
    this._updateTurnOrder();
    
    eventEmitter.emit('combatStarted', this._combatState);
  }

  public endCombat(): void {
    this._combatState.isActive = false;
    this._resetEntityStates();
    eventEmitter.emit('combatEnded');
  }

  public nextTurn(): void {
    if (!this._combatState.isActive) return;

    const currentEntity = this._getCurrentEntity();
    if (currentEntity) {
      // Process end of turn effects
      HealthStatusService.processTurnEnd(currentEntity.id);
      
      // Clear range indicators for previous entity
      MeasurementService.clearRangeIndicatorsByType('movement');
      MeasurementService.clearRangeIndicatorsByType('weapon');
      MeasurementService.clearRangeIndicatorsByType('spell');
      
      // Reset turn flags
      currentEntity.hasMoved = false;
      currentEntity.hasActed = false;
    }

    this._combatState.currentTurnIndex++;
    
    if (this._combatState.currentTurnIndex >= this._combatState.turnOrder.length) {
      this._combatState.currentTurnIndex = 0;
      this._combatState.round++;
      eventEmitter.emit('newRound', this._combatState.round);
    }

    const nextEntity = this._getCurrentEntity();
    if (nextEntity) {
      this._combatState.selectedEntityId = nextEntity.id;
      
      // Show movement range for new turn
      const entityPosition = new Vector3(nextEntity.position.x, 0, nextEntity.position.z);
      MeasurementService.showMovementRange(nextEntity.id, entityPosition, nextEntity.stats.speed);
      
      eventEmitter.emit('turnChanged', { entity: nextEntity, round: this._combatState.round });
    }
  }

  // Spell Areas
  public createSpellArea(area: Omit<SpellArea, 'id' | 'mesh'>): string {
    if (!this._scene) return '';

    const id = this._generateId();
    const spellArea: SpellArea = { ...area, id };
    
    spellArea.mesh = this._createSpellAreaMesh(spellArea);
    this._combatState.spellAreas.set(id, spellArea);
    
    eventEmitter.emit('spellAreaCreated', spellArea);
    return id;
  }

  public removeSpellArea(areaId: string): void {
    const area = this._combatState.spellAreas.get(areaId);
    if (area && area.mesh) {
      area.mesh.dispose();
    }
    this._combatState.spellAreas.delete(areaId);
    eventEmitter.emit('spellAreaRemoved', areaId);
  }

  public clearAllSpellAreas(): void {
    this._combatState.spellAreas.forEach(area => {
      if (area.mesh) area.mesh.dispose();
    });
    this._combatState.spellAreas.clear();
    eventEmitter.emit('allSpellAreasCleared');
  }

  // Utility Methods
  public getEntity(entityId: string): CombatEntity | undefined {
    return this._combatState.entities.get(entityId);
  }

  public getAllEntities(): CombatEntity[] {
    return Array.from(this._combatState.entities.values());
  }

  public getCurrentEntity(): CombatEntity | null {
    return this._getCurrentEntity();
  }

  public getCombatState(): CombatState {
    return this._combatState;
  }

  public setEntityInitiative(entityId: string, initiative: number): void {
    const entity = this._combatState.entities.get(entityId);
    if (entity) {
      entity.stats.initiative = initiative;
      // Re-sort turn order
      this._updateTurnOrder();
      eventEmitter.emit('turnOrderChanged', this._combatState);
    }
  }

  public swapInitiativeOrder(fromIndex: number, toIndex: number): void {
    if (fromIndex >= 0 && toIndex >= 0 && 
        fromIndex < this._combatState.turnOrder.length && 
        toIndex < this._combatState.turnOrder.length) {
      
      // Swap the turn order positions
      const temp = this._combatState.turnOrder[fromIndex];
      this._combatState.turnOrder[fromIndex] = this._combatState.turnOrder[toIndex];
      this._combatState.turnOrder[toIndex] = temp;
      
      // Adjust current turn index if needed
      if (this._combatState.currentTurnIndex === fromIndex) {
        this._combatState.currentTurnIndex = toIndex;
      } else if (this._combatState.currentTurnIndex === toIndex) {
        this._combatState.currentTurnIndex = fromIndex;
      }
      
      eventEmitter.emit('turnOrderChanged', this._combatState);
    }
  }

  public calculateDistance(entity1Id: string, entity2Id: string): number {
    const entity1 = this._combatState.entities.get(entity1Id);
    const entity2 = this._combatState.entities.get(entity2Id);
    
    if (!entity1 || !entity2) return 0;
    
    const pos1 = new Vector3(entity1.position.x, 0, entity1.position.z);
    const pos2 = new Vector3(entity2.position.x, 0, entity2.position.z);
    
    return Vector3.Distance(pos1, pos2);
  }

  // Service access methods
  public getMeasurementService(): typeof MeasurementService { return MeasurementService; }
  public getCombatActionsService(): typeof CombatActionsService { return CombatActionsService; }
  public getSaveLoadService(): typeof SaveLoadService { return SaveLoadService; }

  // Combat actions shortcuts
  public async performAttack(attackerId: string, targetId: string, weaponId: string): Promise<any> {
    const weapon = CombatActionsService.getPresetWeapons()[weaponId];
    if (!weapon) throw new Error('Invalid weapon');
    
    return await CombatActionsService.performAttack(attackerId, targetId, weapon);
  }

  public async castSpell(casterId: string, spellId: string, targetId?: string, targetPosition?: Vector3): Promise<any> {
    const spell = CombatActionsService.getPresetSpells()[spellId];
    if (!spell) throw new Error('Invalid spell');
    
    return await CombatActionsService.castSpell(casterId, spell, targetId, targetPosition);
  }

  public performDash(entityId: string): any {
    return CombatActionsService.performDash(entityId);
  }

  public performDodge(entityId: string): any {
    return CombatActionsService.performDodge(entityId);
  }

  // Range indicators
  public showEntityRanges(entityId: string, types: ('movement' | 'weapon' | 'spell')[] = ['movement']): void {
    const entity = this._combatState.entities.get(entityId);
    if (!entity) return;

    const position = new Vector3(entity.position.x, 0, entity.position.z);
    
    if (types.includes('movement')) {
      MeasurementService.showMovementRange(entityId, position, entity.stats.speed);
    }
    if (types.includes('weapon')) {
      MeasurementService.showWeaponRange(entityId, position, 60); // Default weapon range
    }
    if (types.includes('spell')) {
      MeasurementService.showSpellRange(entityId, position, 120); // Default spell range
    }
  }

  public clearEntityRanges(entityId: string): void {
    MeasurementService.removeRangeIndicator(`movement-${entityId}`);
    MeasurementService.removeRangeIndicator(`weapon-${entityId}`);
    MeasurementService.removeRangeIndicator(`spell-${entityId}`);
  }

  // Status effects
  public addStatusEffect(entityId: string, effectName: string, duration: number = 3): void {
    const presetEffects = HealthStatusServiceClass.getPresetStatusEffects();
    const effectTemplate = presetEffects[effectName];
    
    if (effectTemplate) {
      const effect = {
        ...effectTemplate,
        id: this._generateId(),
        duration: duration
      };
      HealthStatusService.addStatusEffect(entityId, effect);
    }
  }

  // Save/Load
  public saveEncounter(name: string, description: string): string {
    return SaveLoadService.saveEncounter(
      name, 
      description, 
      this._combatState, 
      CombatActionsService.getActionHistory()
    );
  }

  public loadEncounter(encounterId: string): boolean {
    const savedEncounter = SaveLoadService.loadEncounter(encounterId);
    if (!savedEncounter) return false;

    // Clear current state
    this.endCombat();
    this._combatState.entities.forEach(entity => {
      if (entity.mesh) entity.mesh.dispose();
    });
    this._combatState.entities.clear();
    this._combatState.spellAreas.clear();

    // Load saved state
    this._combatState = savedEncounter.combatState;
    
    // Recreate 3D representations
    this._combatState.entities.forEach(async (entity) => {
      await this._createEntityMesh(entity);
    });

    return true;
  }

  // Private Methods
  private _generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private _getCurrentEntity(): CombatEntity | null {
    if (this._combatState.turnOrder.length === 0) return null;
    
    const currentTurn = this._combatState.turnOrder[this._combatState.currentTurnIndex];
    return this._combatState.entities.get(currentTurn.entityId) || null;
  }

  private _rollInitiative(): void {
    this._combatState.entities.forEach(entity => {
      // Roll d20 + initiative modifier (DEX modifier, simplified to +2 for now)
      const roll = Math.floor(Math.random() * 20) + 1;
      const dexModifier = 2; // Simplified, would normally calculate from DEX score
      entity.stats.initiative = roll + dexModifier;
    });
  }

  private _updateTurnOrder(): void {
    const entities = Array.from(this._combatState.entities.values());
    this._combatState.turnOrder = entities
      .map(entity => ({
        entityId: entity.id,
        initiative: entity.stats.initiative,
        hasGone: false
      }))
      .sort((a, b) => b.initiative - a.initiative);
  }

  private _resetEntityStates(): void {
    this._combatState.entities.forEach(entity => {
      entity.hasMoved = false;
      entity.hasActed = false;
      entity.isSelected = false;
    });
  }

  private _canMove(entity: CombatEntity, newPosition: Position): boolean {
    const currentPos = new Vector3(entity.position.x, 0, entity.position.z);
    const targetPos = new Vector3(newPosition.x, 0, newPosition.z);
    const distance = Vector3.Distance(currentPos, targetPos);
    
    // Convert to feet (assuming 1 unit = 5 feet for D&D)
    const distanceInFeet = distance * 5;
    
    return distanceInFeet <= entity.stats.speed;
  }

  private async _createEntityMesh(entity: CombatEntity): Promise<void> {
    if (!this._scene) return;

    const position = new Vector3(entity.position.x, 0, entity.position.z);
    let mesh: AbstractMesh | null = null;

    // Try to load 3D model if modelPath is provided
    if (entity.modelPath) {
      try {
        mesh = await ModelLoaderService.loadModelFromUrl(
          entity.modelPath,
          entity.id,
          position,
          entity.size
        );
      } catch (error) {
        console.warn(`Failed to load model for entity ${entity.id}:`, error);
        mesh = null;
      }
    }

    // Fallback to basic shape if no model or loading failed
    if (!mesh) {
      const sizeMultiplier = this._getSizeMultiplier(entity.size);
      
      mesh = MeshBuilder.CreateCylinder(
        `entity-${entity.id}`, 
        { 
          height: 2 * sizeMultiplier, 
          diameter: 1.5 * sizeMultiplier 
        }, 
        this._scene
      );

      const material = new StandardMaterial(`entityMat-${entity.id}`, this._scene);
      material.diffuseColor = this._getEntityColor(entity.type);
      material.specularColor = new Color3(0.2, 0.2, 0.2);
      mesh.material = material;

      mesh.position = new Vector3(entity.position.x, sizeMultiplier, entity.position.z);
    }

    entity.mesh = mesh;

    // Add click interaction
    mesh.actionManager = new ActionManager(this._scene);
    mesh.actionManager.registerAction(new ExecuteCodeAction(
      ActionManager.OnPickTrigger,
      () => {
        this._selectEntity(entity.id);
      }
    ));

    // Add drag behavior for moving entities
    this._addDragBehavior(entity);
  }

  private _getSizeMultiplier(size: CreatureSize): number {
    switch (size) {
      case CreatureSize.TINY: return 0.5;
      case CreatureSize.SMALL: return 1;
      case CreatureSize.MEDIUM: return 1;
      case CreatureSize.LARGE: return 2;
      case CreatureSize.HUGE: return 3;
      case CreatureSize.GARGANTUAN: return 4;
      default: return 1;
    }
  }

  private _getEntityColor(type: EntityType): Color3 {
    switch (type) {
      case EntityType.PLAYER: return new Color3(0, 0.5, 1); // Blue
      case EntityType.ENEMY: return new Color3(1, 0.2, 0.2); // Red
      case EntityType.NPC: return new Color3(0.2, 1, 0.2); // Green
      default: return new Color3(0.5, 0.5, 0.5); // Gray
    }
  }

  private _selectEntity(entityId: string): void {
    // Deselect all entities first
    this._combatState.entities.forEach(entity => {
      entity.isSelected = false;
      if (entity.mesh) {
        (entity.mesh.material as StandardMaterial).emissiveColor = Color3.Black();
      }
    });

    // Select the clicked entity
    const entity = this._combatState.entities.get(entityId);
    if (entity) {
      entity.isSelected = true;
      this._combatState.selectedEntityId = entityId;
      
      // Highlight selected entity
      if (entity.mesh && entity.mesh.material) {
        (entity.mesh.material as StandardMaterial).emissiveColor = new Color3(1, 1, 0); // Yellow glow
      }
      
      eventEmitter.emit('entitySelected', entity);
    }
  }

  private _createSpellAreaMesh(area: SpellArea): AbstractMesh | undefined {
    if (!this._scene) return;

    let mesh: AbstractMesh;
    const material = new StandardMaterial(`spellAreaMat-${area.id}`, this._scene);
    material.diffuseColor = Color3.FromHexString(area.color);
    material.alpha = 0.3;

    switch (area.type) {
      case 'circle':
        // Convert feet to world units (5 feet = 1.5 world units)
        const circleRadius = (area.radius || 5) / 5 * 1.5;
        mesh = MeshBuilder.CreateDisc(`spellArea-${area.id}`, {
          radius: circleRadius,
          tessellation: 32
        }, this._scene);
        // Rotate to lay flat on ground
        mesh.rotation.x = Math.PI / 2;
        break;
      
      case 'square':
        // Convert feet to world units
        const squareWidth = (area.width || 10) / 5 * 1.5;
        const squareHeight = (area.length || 10) / 5 * 1.5;
        mesh = MeshBuilder.CreateGround(`spellArea-${area.id}`, {
          width: squareWidth,
          height: squareHeight
        }, this._scene);
        break;
      
      case 'line':
        // Convert feet to world units
        const lineWidth = (area.width || 5) / 5 * 1.5;
        const lineLength = (area.length || 30) / 5 * 1.5;
        mesh = MeshBuilder.CreateGround(`spellArea-${area.id}`, {
          width: lineWidth,
          height: lineLength
        }, this._scene);
        break;
      
      case 'cone':
        // Create a proper cone shape using custom geometry
        const radius = (area.radius || 15) / 5 * 1.5; // Convert feet to world units
        const angle = (area.angle || 60) * Math.PI / 180;
        
        // Create vertices for cone manually
        const positions: number[] = [0, 0, 0]; // Center point
        const indices: number[] = [];
        const normals: number[] = [0, 1, 0]; // Up normal for center
        
        const segments = 32;
        for (let i = 0; i <= segments; i++) {
          const currentAngle = -angle / 2 + (angle * i) / segments;
          const x = radius * Math.cos(currentAngle);
          const z = radius * Math.sin(currentAngle);
          positions.push(x, 0, z);
          normals.push(0, 1, 0);
          
          if (i > 0) {
            indices.push(0, i, i + 1);
          }
        }
        
        mesh = new Mesh(`spellArea-${area.id}`, this._scene);
        mesh.setVerticesData('position', positions);
        mesh.setVerticesData('normal', normals);
        mesh.setIndices(indices, null);
        break;
      
      default:
        const defaultRadius = 5 / 5 * 1.5; // Convert 5 feet to world units
        mesh = MeshBuilder.CreateDisc(`spellArea-${area.id}`, { radius: defaultRadius }, this._scene);
        mesh.rotation.x = Math.PI / 2;
    }

    mesh.material = material;
    mesh.position = area.origin;
    mesh.position.y = 0.01; // Slightly above ground

    // Add drag behavior for movement
    this._addSpellAreaInteractivity(mesh, area);

    return mesh;
  }

  private _addSpellAreaInteractivity(mesh: AbstractMesh, area: SpellArea): void {
    if (!this._scene) return;

    // Add drag behavior for movement
    const dragBehavior = new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 1, 0) });
    dragBehavior.useObjectOrientationForDragging = false;
    
    dragBehavior.onDragObservable.add(() => {
      // Update the area origin when dragged
      area.origin = mesh.position.clone();
      eventEmitter.emit('spellAreaMoved', { areaId: area.id, newPosition: mesh.position });
    });

    mesh.addBehavior(dragBehavior);

    // Add action manager for right-click context menu (resize)
    mesh.actionManager = new ActionManager(this._scene);
    
    // Right click to show resize options
    mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnRightPickTrigger, () => {
      this._showSpellAreaResizeMenu(area, mesh);
    }));

    // Left click to rotate (for cones and rectangles)
    mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
      if (area.type === 'cone' || area.type === 'line') {
        mesh.rotation.y += Math.PI / 8; // Rotate by 22.5 degrees
        eventEmitter.emit('spellAreaRotated', { areaId: area.id, rotation: mesh.rotation.y });
      }
    }));

    // Add visual feedback on hover
    mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
      if (mesh.material) {
        (mesh.material as StandardMaterial).alpha = 0.5;
      }
    }));

    mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
      if (mesh.material) {
        (mesh.material as StandardMaterial).alpha = 0.3;
      }
    }));
  }

  private _showSpellAreaResizeMenu(area: SpellArea, mesh: AbstractMesh): void {
    if (area.type === 'cone') {
      // Cone has radius, angle, and rotation
      const currentRadius = area.radius || 15;
      const currentAngle = area.angle || 60;
      
      const params = prompt(
        `Cone Settings (current: radius=${currentRadius}, angle=${currentAngle}°)\nEnter: radius,angle (e.g., "20,90"):`,
        `${currentRadius},${currentAngle}`
      );
      
      if (params) {
        const [radiusStr, angleStr] = params.split(',');
        if (radiusStr && angleStr) {
          const newRadius = Math.max(5, Math.min(50, Number(radiusStr.trim())));
          const newAngle = Math.max(15, Math.min(180, Number(angleStr.trim())));
          this._resizeCone(area, mesh, newRadius, newAngle);
        }
      }
    } else if (area.type === 'square') {
      // Square has width and length
      const currentWidth = area.width || 10;
      const currentLength = area.length || 10;
      
      const params = prompt(
        `Square Settings (current: width=${currentWidth}, length=${currentLength})\nEnter: width,length (e.g., "15,20"):`,
        `${currentWidth},${currentLength}`
      );
      
      if (params) {
        const [widthStr, lengthStr] = params.split(',');
        if (widthStr && lengthStr) {
          const newWidth = Math.max(5, Math.min(50, Number(widthStr.trim())));
          const newLength = Math.max(5, Math.min(50, Number(lengthStr.trim())));
          this._resizeSquare(area, mesh, newWidth, newLength);
        }
      }
    } else {
      // Circle or line - simple radius/width
      const currentSize = area.radius || area.width || 10;
      const sizeType = area.type === 'circle' ? 'radius' : 'width';
      
      const newSizeStr = prompt(
        `Resize ${area.type} ${sizeType} (current: ${currentSize} feet).\nEnter new size (5-50 feet):`, 
        currentSize.toString()
      );
      
      if (newSizeStr && !isNaN(Number(newSizeStr))) {
        const newSize = Math.max(5, Math.min(50, Number(newSizeStr)));
        this._resizeSpellArea(area, mesh, newSize);
      }
    }
  }

  private _resizeSpellArea(area: SpellArea, mesh: AbstractMesh, newSize: number): void {
    if (!this._scene) return;

    // Update area properties
    if (area.type === 'circle' || area.type === 'cone') {
      area.radius = newSize;
    } else {
      area.width = newSize;
      if (area.type === 'square') {
        area.length = newSize;
      }
    }

    // Store old properties
    const oldPosition = mesh.position.clone();
    const oldRotation = mesh.rotation.clone();
    
    // Dispose old mesh
    mesh.dispose();
    
    // Recreate mesh with new size
    area.mesh = this._createSpellAreaMesh(area);
    if (area.mesh) {
      area.mesh.position = oldPosition;
      area.mesh.rotation = oldRotation;
      
      // Re-add interactivity
      this._addSpellAreaInteractivity(area.mesh, area);
    }

    // Update the area reference
    this._combatState.spellAreas.set(area.id, area);

    eventEmitter.emit('spellAreaResized', { areaId: area.id, newSize });
  }

  private _resizeCone(area: SpellArea, mesh: AbstractMesh, newRadius: number, newAngle: number): void {
    if (!this._scene) return;

    area.radius = newRadius;
    area.angle = newAngle;

    // Store old properties
    const oldPosition = mesh.position.clone();
    const oldRotation = mesh.rotation.clone();
    
    // Dispose old mesh
    mesh.dispose();
    
    // Recreate mesh with new parameters
    area.mesh = this._createSpellAreaMesh(area);
    if (area.mesh) {
      area.mesh.position = oldPosition;
      area.mesh.rotation = oldRotation;
      this._addSpellAreaInteractivity(area.mesh, area);
    }

    this._combatState.spellAreas.set(area.id, area);
    eventEmitter.emit('spellAreaResized', { areaId: area.id, newRadius, newAngle });
  }

  private _resizeSquare(area: SpellArea, mesh: AbstractMesh, newWidth: number, newLength: number): void {
    if (!this._scene) return;

    area.width = newWidth;
    area.length = newLength;

    // Store old properties
    const oldPosition = mesh.position.clone();
    const oldRotation = mesh.rotation.clone();
    
    // Dispose old mesh
    mesh.dispose();
    
    // Recreate mesh with new dimensions
    area.mesh = this._createSpellAreaMesh(area);
    if (area.mesh) {
      area.mesh.position = oldPosition;
      area.mesh.rotation = oldRotation;
      this._addSpellAreaInteractivity(area.mesh, area);
    }

    this._combatState.spellAreas.set(area.id, area);
    eventEmitter.emit('spellAreaResized', { areaId: area.id, newWidth, newLength });
  }

  private _addDragBehavior(entity: CombatEntity): void {
    if (!entity.mesh) return;

    const dragBehavior = new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 1, 0) });
    dragBehavior.useObjectOrientationForDragging = false;

    // Update health bar position while dragging
    dragBehavior.onDragObservable.add(() => {
      if (!entity.mesh) return;
      
      // Update health bar position in real-time during drag
      HealthStatusService.updateAllPositions();
    });

    dragBehavior.onDragEndObservable.add(() => {
      if (!entity.mesh) return;
      
      // Snap to grid
      const snappedPosition = this._snapToGrid(entity.mesh.position);
      entity.mesh.position = snappedPosition;
      
      // Update entity position
      const newPosition: Position = {
        x: snappedPosition.x,
        z: snappedPosition.z,
        gridX: Math.round(snappedPosition.x / 1.5), // Convert to grid coordinates
        gridZ: Math.round(snappedPosition.z / 1.5)
      };
      
      entity.position = newPosition;
      
      // Mark as moved if in combat
      if (this._combatState.isActive) {
        entity.hasMoved = true;
      }
      
      // Final health bar position update
      HealthStatusService.updateAllPositions();
      
      eventEmitter.emit('entityMoved', { entityId: entity.id, position: newPosition });
    });

    entity.mesh.addBehavior(dragBehavior);
  }

  private _snapToGrid(position: Vector3): Vector3 {
    const cellSize = 1.5; // Same as CELL_SIZE in MainRenderService
    const halfCellSize = cellSize / 2;

    const snappedX = Math.round((position.x - halfCellSize) / cellSize) * cellSize + halfCellSize;
    const snappedZ = Math.round((position.z - halfCellSize) / cellSize) * cellSize + halfCellSize;

    return new Vector3(snappedX, position.y, snappedZ);
  }
}

export default new CombatService();