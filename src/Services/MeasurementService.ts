import { Vector3, AbstractMesh, MeshBuilder, StandardMaterial, Color3, Scene, LinesMesh, PointerInfo, PointerEventTypes } from '@babylonjs/core';
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
  private _startIndicator: AbstractMesh | null = null;
  private _endIndicator: AbstractMesh | null = null;

  public initialize(scene: Scene): void {
    this._scene = scene;
    this._setupPointerObservables();
    this._setupModeCoordination();
  }

  private _setupPointerObservables(): void {
    if (!this._scene) return;

    // Separate observer for POINTERDOWN events with higher priority
    this._scene.onPointerObservable.add((pointerInfo: PointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
        if (this._isActive) {
          this._handlePointerDown(pointerInfo);
        }
      }
    }, -3); // Very high priority for POINTERDOWN

    // Separate observer for POINTERMOVE events
    this._scene.onPointerObservable.add((pointerInfo: PointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
        if (this._isActive) {
          this._handlePointerMove(pointerInfo);
        }
      }
    }, -2); // High priority for POINTERMOVE
  }

  private _handlePointerDown(_pointerInfo: PointerInfo): void {
    if (!this._scene || !this._scene.activeCamera) return;

    // Try picking any mesh first
    const pickResult = this._scene.pick(this._scene.pointerX, this._scene.pointerY);
    if (pickResult?.hit && pickResult.pickedPoint) {
      this.handlePointerDown(pickResult.pickedPoint);
      return;
    }

    // Fallback: intersect with Y=0 plane
    const ray = this._scene.createPickingRay(this._scene.pointerX, this._scene.pointerY, null, this._scene.activeCamera);
    if (ray && ray.direction.y !== 0) {
      const t = -ray.origin.y / ray.direction.y;
      if (t > 0) {
        const point = ray.origin.add(ray.direction.scale(t));
        this.handlePointerDown(point);
      }
    }
  }

  private _handlePointerMove(_pointerInfo: PointerInfo): void {
    if (!this._scene || !this._scene.activeCamera) return;

    // Try picking any mesh first
    const pickResult = this._scene.pick(this._scene.pointerX, this._scene.pointerY);
    if (pickResult?.hit && pickResult.pickedPoint) {
      this.handlePointerMove(pickResult.pickedPoint);
      return;
    }

    // Fallback: intersect with Y=0 plane
    const ray = this._scene.createPickingRay(this._scene.pointerX, this._scene.pointerY, null, this._scene.activeCamera);
    if (ray && ray.direction.y !== 0) {
      const t = -ray.origin.y / ray.direction.y;
      if (t > 0) {
        const point = ray.origin.add(ray.direction.scale(t));
        this.handlePointerMove(point);
      }
    }
  }

  public startMeasurement(): void {
    this._isActive = true;
    this._currentStartPoint = null;
    this.clearActiveLine();
    this.clearIndicators();
    eventEmitter.emit('measurementModeChanged', true);
  }

  public stopMeasurement(): void {
    this._isActive = false;
    this._currentStartPoint = null;
    this.clearActiveLine();
    this.clearIndicators();
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
      this._currentStartPoint = this._snapToGrid(pickPoint);
      this._currentStartPoint.y = 0.02;
      
      // Create green start indicator
      this._startIndicator = MeshBuilder.CreateSphere('startPoint', { diameter: 0.8 }, this._scene);
      this._startIndicator.position = this._currentStartPoint.clone();
      this._startIndicator.position.y = 0.5;
      
      const greenMaterial = new StandardMaterial(`greenMaterial_${Date.now()}`, this._scene);
      greenMaterial.diffuseColor = new Color3(0, 1, 0);
      greenMaterial.emissiveColor = new Color3(0, 1, 0);
      greenMaterial.disableLighting = true;
      greenMaterial.alpha = 1.0;
      this._startIndicator.material = greenMaterial;
      this._startIndicator.renderingGroupId = 1;
    } else {
      // Complete measurement
      const endPoint = this._snapToGrid(pickPoint);
      endPoint.y = 0.02;
      
      const distance = Vector3.Distance(this._currentStartPoint, endPoint);
      const distanceInFeet = (distance / 1.5) * 5; // Convert to D&D feet
      
      this.createPermanentMeasurement(this._currentStartPoint, endPoint, distanceInFeet);
      
      // Reset for next measurement
      this._currentStartPoint = null;
      this.clearActiveLine();
      this.clearIndicators();
      
      eventEmitter.emit('distanceCalculated', distanceInFeet);
    }
  }

  public handlePointerMove(pickPoint: Vector3): void {
    if (!this._isActive || !this._currentStartPoint || !this._scene) return;

    const endPoint = this._snapToGrid(pickPoint);
    endPoint.y = 0.02;
    
    // Clear previous active elements
    this.clearActiveLine();
    if (this._endIndicator) {
      this._endIndicator.dispose();
      this._endIndicator = null;
    }
    
    // Create yellow line
    this._activeLine = MeshBuilder.CreateLines('activeMeasurement', {
      points: [this._currentStartPoint, endPoint],
      updatable: false
    }, this._scene);
    this._activeLine.color = new Color3(1, 1, 0);
    this._activeLine.alpha = 1.0;
    
    // Create red end indicator
    this._endIndicator = MeshBuilder.CreateSphere('endPoint', { diameter: 0.8 }, this._scene);
    this._endIndicator.position = endPoint.clone();
    this._endIndicator.position.y = 0.5;
    
    const redMaterial = new StandardMaterial(`redMaterial_${Date.now()}`, this._scene);
    redMaterial.diffuseColor = new Color3(1, 0, 0);
    redMaterial.emissiveColor = new Color3(1, 0, 0);
    redMaterial.disableLighting = true;
    redMaterial.alpha = 1.0;
    this._endIndicator.material = redMaterial;
    this._endIndicator.renderingGroupId = 1;
    
    // Calculate distance
    const distance = Vector3.Distance(this._currentStartPoint, endPoint);
    const distanceInFeet = (distance / 1.5) * 5;
    
    eventEmitter.emit('liveDistanceUpdate', distanceInFeet);
  }

  // Range indicators
  public showMovementRange(entityId: string, center: Vector3, movementSpeed: number): string {
    if (!this._scene) return '';

    const rangeId = `movement-${entityId}`;
    this.removeRangeIndicator(rangeId);

    const radius = (movementSpeed / 5) * 1.5;
    const mesh = MeshBuilder.CreateDisc(`movementRange-${entityId}`, {
      radius: radius,
      tessellation: 32
    }, this._scene);

    const material = new StandardMaterial(`movementMat-${entityId}`, this._scene);
    material.diffuseColor = new Color3(0.2, 0.8, 0.2);
    material.alpha = 0.3;
    material.backFaceCulling = false;

    mesh.material = material;
    mesh.position = center;
    mesh.position.y = 0.01;
    mesh.rotation.x = Math.PI / 2;

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
    material.diffuseColor = new Color3(1, 0.4, 0.2);
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
    material.diffuseColor = new Color3(0.5, 0.2, 1);
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

  public removeRangeIndicator(rangeId: string): void {
    const indicator = this._rangeIndicators.get(rangeId);
    if (indicator) {
      indicator.mesh.dispose();
      this._rangeIndicators.delete(rangeId);
    }
  }

  public clearAllRangeIndicators(): void {
    this._rangeIndicators.forEach(indicator => {
      indicator.mesh.dispose();
    });
    this._rangeIndicators.clear();
  }

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

  public getAllMeasurements(): MeasurementLine[] {
    return Array.from(this._measurementLines.values());
  }

  public clearAllMeasurements(): void {
    this._measurementLines.forEach(line => {
      line.mesh.dispose();
      if (line.label) line.label.dispose();
    });
    this._measurementLines.clear();
    this.clearActiveLine();
  }

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

  private createPermanentMeasurement(start: Vector3, end: Vector3, distanceInFeet: number): void {
    if (!this._scene) return;

    const id = this.generateId();
    
    const line = MeshBuilder.CreateLines(`measurement-${id}`, {
      points: [start, end],
      updatable: false
    }, this._scene);

    line.color = new Color3(0.8, 0.8, 1);
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
      this._activeLine.dispose();
      this._activeLine = null;
    }
  }

  private clearIndicators(): void {
    if (this._startIndicator) {
      this._startIndicator.dispose();
      this._startIndicator = null;
    }
    if (this._endIndicator) {
      this._endIndicator.dispose();
      this._endIndicator = null;
    }
  }

  private _setupModeCoordination(): void {
    // Mode coordination removed - let both systems work independently
    // Focus on event priority handling instead
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private _snapToGrid(position: Vector3): Vector3 {
    const cellSize = 1.5;
    const halfCellSize = cellSize / 2;

    const snappedX = Math.round((position.x - halfCellSize) / cellSize) * cellSize + halfCellSize;
    const snappedZ = Math.round((position.z - halfCellSize) / cellSize) * cellSize + halfCellSize;

    return new Vector3(snappedX, position.y, snappedZ);
  }

  public dispose(): void {
    this.clearAllMeasurements();
    this.clearAllRangeIndicators();
    this.clearActiveLine();
    this.clearIndicators();
  }
}

export default new MeasurementService();