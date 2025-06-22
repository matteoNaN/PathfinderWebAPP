import { Vector3, AbstractMesh, MeshBuilder, StandardMaterial, Color3, Scene, LinesMesh, Ray, PointerInfo, PointerEventTypes } from '@babylonjs/core';
import eventEmitter from '../Events/misurazioneEventEmitter';

interface MeasurementLine {
  id: string;
  startPoint: Vector3;
  endPoint: Vector3;
  distance: number;
  mesh: LinesMesh;
  label?: AbstractMesh;
}

interface RangeIndicator {
  id: string;
  center: Vector3;
  radius: number;
  type: 'movement' | 'weapon' | 'spell';
  mesh: AbstractMesh;
}

class MeasurementService {
  private _scene: Scene | null = null;
  private _measurementLines: Map<string, MeasurementLine> = new Map();
  private _rangeIndicators: Map<string, RangeIndicator> = new Map();
  private _isActive: boolean = false;
  private _currentStartPoint: Vector3 | null = null;
  private _activeLine: LinesMesh | null = null;

  public initialize(scene: Scene): void {
    this._scene = scene;
    this._setupPointerObservables();
  }

  private _setupPointerObservables(): void {
    if (!this._scene) return;

    this._scene.onPointerObservable.add((pointerInfo: PointerInfo) => {
      if (!this._isActive) return;

      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
          this._handlePointerDown(pointerInfo);
          break;
        case PointerEventTypes.POINTERMOVE:
          this._handlePointerMove(pointerInfo);
          break;
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _handlePointerDown(_pointerInfo: PointerInfo): void {
    if (!this._scene) return;

    const pickResult = this._scene.pick(
      this._scene.pointerX,
      this._scene.pointerY
    );

    if (pickResult?.hit && pickResult.pickedPoint) {
      this.handlePointerDown(pickResult.pickedPoint);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _handlePointerMove(_pointerInfo: PointerInfo): void {
    if (!this._scene) return;

    const pickResult = this._scene.pick(
      this._scene.pointerX,
      this._scene.pointerY
    );

    if (pickResult?.hit && pickResult.pickedPoint) {
      this.handlePointerMove(pickResult.pickedPoint);
    }
  }

  // Enhanced measurement for D&D combat
  public startMeasurement(): void {
    this._isActive = true;
    this._currentStartPoint = null;
    this.clearActiveLine();
    eventEmitter.emit('measurementModeChanged', true);
  }

  public stopMeasurement(): void {
    this._isActive = false;
    this._currentStartPoint = null;
    this.clearActiveLine();
    eventEmitter.emit('measurementModeChanged', false);
  }

  public toggleMeasurement(): void {
    if (this._isActive) {
      this.stopMeasurement();
    } else {
      this.startMeasurement();
    }
  }

  public handlePointerDown(pickPoint: Vector3): void {
    if (!this._isActive || !this._scene) return;

    if (!this._currentStartPoint) {
      // Start new measurement
      this._currentStartPoint = pickPoint.clone();
      this._currentStartPoint.y = 0.02; // Slightly above ground
    } else {
      // Complete measurement
      const endPoint = pickPoint.clone();
      endPoint.y = 0.02;
      
      const distance = Vector3.Distance(this._currentStartPoint, endPoint);
      const distanceInFeet = distance * 5; // Convert to D&D feet
      
      this.createPermanentMeasurement(this._currentStartPoint, endPoint, distanceInFeet);
      
      // Reset for next measurement
      this._currentStartPoint = null;
      this.clearActiveLine();
      
      eventEmitter.emit('distanceCalculated', distanceInFeet);
    }
  }

  public handlePointerMove(pickPoint: Vector3): void {
    if (!this._isActive || !this._currentStartPoint || !this._scene) return;

    // Update active measurement line
    this.clearActiveLine();
    
    const endPoint = pickPoint.clone();
    endPoint.y = 0.02;
    
    // Create a more visible line with start/end indicators
    this._activeLine = MeshBuilder.CreateLines('activeMeasurement', {
      points: [this._currentStartPoint, endPoint],
      updatable: true
    }, this._scene);
    
    this._activeLine.color = new Color3(1, 1, 0); // Bright yellow for active measurement
    this._activeLine.alpha = 1.0;
    
    // Add start point indicator
    const startIndicator = MeshBuilder.CreateSphere('startPoint', { diameter: 0.3 }, this._scene);
    startIndicator.position = this._currentStartPoint.clone();
    startIndicator.material = this._createIndicatorMaterial('start', new Color3(0, 1, 0)); // Green
    
    // Add end point indicator
    const endIndicator = MeshBuilder.CreateSphere('endPoint', { diameter: 0.3 }, this._scene);
    endIndicator.position = endPoint;
    endIndicator.material = this._createIndicatorMaterial('end', new Color3(1, 0, 0)); // Red
    
    // Store indicators for cleanup
    (this._activeLine as any).indicators = [startIndicator, endIndicator];
    
    // Show distance in real-time
    const distance = Vector3.Distance(this._currentStartPoint, endPoint);
    const distanceInFeet = distance * 5;
    
    eventEmitter.emit('liveDistanceUpdate', distanceInFeet);
  }

  // Create movement range indicator
  public showMovementRange(entityId: string, center: Vector3, movementSpeed: number): string {
    if (!this._scene) return '';

    const rangeId = `movement-${entityId}`;
    this.removeRangeIndicator(rangeId);

    // Convert feet to world units (5 feet = 1.5 units)
    const radius = (movementSpeed / 5) * 1.5;

    const mesh = MeshBuilder.CreateDisc(`movementRange-${entityId}`, {
      radius: radius,
      tessellation: 32
    }, this._scene);

    const material = new StandardMaterial(`movementMat-${entityId}`, this._scene);
    material.diffuseColor = new Color3(0.2, 0.8, 0.2); // Green for movement
    material.alpha = 0.3;
    material.backFaceCulling = false;

    mesh.material = material;
    mesh.position = center;
    mesh.position.y = 0.01;
    mesh.rotation.x = Math.PI / 2; // Lay flat on ground

    const indicator: RangeIndicator = {
      id: rangeId,
      center: center,
      radius: movementSpeed,
      type: 'movement',
      mesh: mesh
    };

    this._rangeIndicators.set(rangeId, indicator);
    return rangeId;
  }

  // Create weapon range indicator
  public showWeaponRange(entityId: string, center: Vector3, weaponRange: number): string {
    if (!this._scene) return '';

    const rangeId = `weapon-${entityId}`;
    this.removeRangeIndicator(rangeId);

    const radius = (weaponRange / 5) * 1.5;

    const mesh = MeshBuilder.CreateDisc(`weaponRange-${entityId}`, {
      radius: radius,
      tessellation: 32
    }, this._scene);

    const material = new StandardMaterial(`weaponMat-${entityId}`, this._scene);
    material.diffuseColor = new Color3(1, 0.4, 0.2); // Orange/red for weapon range
    material.alpha = 0.25;
    material.backFaceCulling = false;

    mesh.material = material;
    mesh.position = center;
    mesh.position.y = 0.01;
    mesh.rotation.x = Math.PI / 2;

    const indicator: RangeIndicator = {
      id: rangeId,
      center: center,
      radius: weaponRange,
      type: 'weapon',
      mesh: mesh
    };

    this._rangeIndicators.set(rangeId, indicator);
    return rangeId;
  }

  // Create spell range indicator
  public showSpellRange(entityId: string, center: Vector3, spellRange: number): string {
    if (!this._scene) return '';

    const rangeId = `spell-${entityId}`;
    this.removeRangeIndicator(rangeId);

    const radius = (spellRange / 5) * 1.5;

    const mesh = MeshBuilder.CreateDisc(`spellRange-${entityId}`, {
      radius: radius,
      tessellation: 32
    }, this._scene);

    const material = new StandardMaterial(`spellMat-${entityId}`, this._scene);
    material.diffuseColor = new Color3(0.5, 0.2, 1); // Purple for spell range
    material.alpha = 0.25;
    material.backFaceCulling = false;

    mesh.material = material;
    mesh.position = center;
    mesh.position.y = 0.01;
    mesh.rotation.x = Math.PI / 2;

    const indicator: RangeIndicator = {
      id: rangeId,
      center: center,
      radius: spellRange,
      type: 'spell',
      mesh: mesh
    };

    this._rangeIndicators.set(rangeId, indicator);
    return rangeId;
  }

  // Remove specific range indicator
  public removeRangeIndicator(rangeId: string): void {
    const indicator = this._rangeIndicators.get(rangeId);
    if (indicator) {
      indicator.mesh.dispose();
      this._rangeIndicators.delete(rangeId);
    }
  }

  // Clear all range indicators
  public clearAllRangeIndicators(): void {
    this._rangeIndicators.forEach(indicator => {
      indicator.mesh.dispose();
    });
    this._rangeIndicators.clear();
  }

  // Clear range indicators by type
  public clearRangeIndicatorsByType(type: 'movement' | 'weapon' | 'spell'): void {
    const toRemove: string[] = [];
    this._rangeIndicators.forEach((indicator, id) => {
      if (indicator.type === type) {
        indicator.mesh.dispose();
        toRemove.push(id);
      }
    });
    toRemove.forEach(id => this._rangeIndicators.delete(id));
  }

  // Line of sight checker
  public checkLineOfSight(from: Vector3, to: Vector3): boolean {
    if (!this._scene) return false;

    // Simple line of sight - can be enhanced with terrain obstacles
    const direction = to.subtract(from).normalize();
    const distance = Vector3.Distance(from, to);
    
    // Cast ray to check for obstacles
    const ray = new Ray(from, direction, distance);
    const hit = this._scene.pickWithRay(ray, (mesh) => {
      // Ignore grid lines and UI elements
      return !mesh.name.includes('Line') && !mesh.name.includes('ground');
    });

    return !hit?.hit;
  }

  // Create threat range visualization (for enemies)
  public showThreatRange(entityId: string, center: Vector3, threatRadius: number = 5): string {
    if (!this._scene) return '';

    const rangeId = `threat-${entityId}`;
    this.removeRangeIndicator(rangeId);

    const radius = (threatRadius / 5) * 1.5;

    // Create a ring instead of filled circle for threat range
    const innerRadius = radius * 0.8;
    const mesh = MeshBuilder.CreateTorus(`threatRange-${entityId}`, {
      diameter: radius * 2,
      thickness: radius - innerRadius,
      tessellation: 32
    }, this._scene);

    const material = new StandardMaterial(`threatMat-${entityId}`, this._scene);
    material.diffuseColor = new Color3(1, 0.2, 0.2); // Red for threat
    material.alpha = 0.4;

    mesh.material = material;
    mesh.position = center;
    mesh.position.y = 0.05;
    mesh.rotation.x = Math.PI / 2;

    const indicator: RangeIndicator = {
      id: rangeId,
      center: center,
      radius: threatRadius,
      type: 'weapon', // Treat as weapon type for now
      mesh: mesh
    };

    this._rangeIndicators.set(rangeId, indicator);
    return rangeId;
  }

  // Get all measurements
  public getAllMeasurements(): MeasurementLine[] {
    return Array.from(this._measurementLines.values());
  }

  // Clear all measurements
  public clearAllMeasurements(): void {
    this._measurementLines.forEach(line => {
      line.mesh.dispose();
      if (line.label) line.label.dispose();
    });
    this._measurementLines.clear();
    this.clearActiveLine();
  }

  // Remove specific measurement
  public removeMeasurement(measurementId: string): void {
    const measurement = this._measurementLines.get(measurementId);
    if (measurement) {
      measurement.mesh.dispose();
      if (measurement.label) measurement.label.dispose();
      this._measurementLines.delete(measurementId);
    }
  }

  public isActive(): boolean {
    return this._isActive;
  }

  // Private methods
  private createPermanentMeasurement(start: Vector3, end: Vector3, distanceInFeet: number): void {
    if (!this._scene) return;

    const id = this.generateId();
    
    const line = MeshBuilder.CreateLines(`measurement-${id}`, {
      points: [start, end],
      updatable: false
    }, this._scene);

    line.color = new Color3(0.8, 0.8, 1); // Light blue for permanent measurements
    line.alpha = 0.9;

    const measurement: MeasurementLine = {
      id: id,
      startPoint: start,
      endPoint: end,
      distance: distanceInFeet,
      mesh: line
    };

    this._measurementLines.set(id, measurement);
    
    eventEmitter.emit('measurementCreated', measurement);
  }

  private clearActiveLine(): void {
    if (this._activeLine) {
      // Clean up indicators
      const indicators = (this._activeLine as any).indicators;
      if (indicators) {
        indicators.forEach((indicator: AbstractMesh) => indicator.dispose());
      }
      
      this._activeLine.dispose();
      this._activeLine = null;
    }
  }

  private _createIndicatorMaterial(name: string, color: Color3): StandardMaterial {
    if (!this._scene) throw new Error('Scene not available');
    
    const material = new StandardMaterial(`indicator-${name}`, this._scene);
    material.diffuseColor = color;
    material.emissiveColor = color.scale(0.3);
    material.specularColor = Color3.White();
    return material;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  public dispose(): void {
    this.clearAllMeasurements();
    this.clearAllRangeIndicators();
    this.clearActiveLine();
  }
}

export default new MeasurementService();