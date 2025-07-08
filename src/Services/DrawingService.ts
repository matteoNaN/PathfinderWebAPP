import { Vector3, Scene, AbstractMesh, MeshBuilder, StandardMaterial, Color3, PointerDragBehavior, ActionManager, ExecuteCodeAction, Matrix, PointerEventTypes } from '@babylonjs/core';
import eventEmitter from '../Events/misurazioneEventEmitter';

export interface DrawingAnnotation {
  id: string;
  type: 'pen' | 'marker';
  points: Vector3[];
  color: string;
  thickness?: number;
  text?: string;
  fontSize?: number;
  mesh?: AbstractMesh;
  isVisible: boolean;
  layer: 'background' | 'foreground';
  opacity: number;
}

interface DrawingSettings {
  currentTool: 'pen' | 'marker' | 'eraser';
  currentColor: string;
  currentThickness: number;
  currentOpacity: number;
  currentLayer: 'background' | 'foreground';
  fontSize: number;
  gridSnap: boolean;
}

class DrawingService {
  private _scene: Scene | null = null;
  private _annotations: Map<string, DrawingAnnotation> = new Map();
  private _settings: DrawingSettings = {
    currentTool: 'pen',
    currentColor: '#ff0000',
    currentThickness: 2,
    currentOpacity: 0.8,
    currentLayer: 'foreground',
    fontSize: 16,
    gridSnap: true
  };
  private _isDrawingModeActive: boolean = false;
  private _isDrawing: boolean = false;
  private _currentDrawing: Vector3[] = [];
  private _tempMesh: AbstractMesh | null = null;
  private _eventCounter: number = 0;

  public initialize(scene: Scene): void {
    console.log('DrawingService.initialize called with scene:', scene);
    this._scene = scene;
    this.setupDrawingEvents();
    // this.setupModeCoordination(); // Disabled mode coordination
    console.log('DrawingService initialization complete');
  }

  // Drawing Tools
  public setTool(tool: DrawingSettings['currentTool']): void {
    this._settings.currentTool = tool;
    this.clearCurrentDrawing();
    eventEmitter.emit('drawingToolChanged', tool);
  }

  public setDrawingModeActive(active: boolean): void {
    console.log('setDrawingModeActive called with:', active);
    this._isDrawingModeActive = active;
    console.log('Drawing mode is now:', this._isDrawingModeActive);
    this.clearCurrentDrawing();
    
    // Disable/enable camera controls when drawing mode changes
    this.toggleCameraControls(!active);
    
    eventEmitter.emit('drawingModeChanged', active);
  }

  public isDrawingModeActive(): boolean {
    return this._isDrawingModeActive;
  }

  public setColor(color: string): void {
    this._settings.currentColor = color;
    eventEmitter.emit('drawingColorChanged', color);
  }

  public setThickness(thickness: number): void {
    this._settings.currentThickness = Math.max(1, Math.min(10, thickness));
    eventEmitter.emit('drawingThicknessChanged', this._settings.currentThickness);
  }

  public setOpacity(opacity: number): void {
    this._settings.currentOpacity = Math.max(0.1, Math.min(1, opacity));
    eventEmitter.emit('drawingOpacityChanged', this._settings.currentOpacity);
  }

  public setLayer(layer: 'background' | 'foreground'): void {
    this._settings.currentLayer = layer;
    eventEmitter.emit('drawingLayerChanged', layer);
  }

  public setFontSize(fontSize: number): void {
    this._settings.fontSize = Math.max(8, Math.min(48, fontSize));
    eventEmitter.emit('drawingFontSizeChanged', this._settings.fontSize);
  }

  public toggleGridSnap(): void {
    this._settings.gridSnap = !this._settings.gridSnap;
    eventEmitter.emit('drawingGridSnapChanged', this._settings.gridSnap);
  }

  // Annotation Management
  public createAnnotation(type: DrawingAnnotation['type'], points: Vector3[], text?: string): string {
    console.log('createAnnotation called with type:', type, 'points:', points);
    if (!this._scene) {
      console.log('createAnnotation failed - no scene');
      return '';
    }

    const id = this.generateId();
    console.log('Generated annotation ID:', id);
    
    const annotation: DrawingAnnotation = {
      id,
      type,
      points: [...points],
      color: this._settings.currentColor,
      thickness: this._settings.currentThickness,
      text,
      fontSize: this._settings.fontSize,
      isVisible: true,
      layer: this._settings.currentLayer,
      opacity: this._settings.currentOpacity
    };
    
    console.log('Created annotation object:', annotation);

    const mesh = this.createAnnotationMesh(annotation);
    console.log('Created annotation mesh:', mesh);
    if (mesh) {
      annotation.mesh = mesh;
      console.log('Mesh assigned to annotation');
    } else {
      console.log('Failed to create annotation mesh');
    }
    this._annotations.set(id, annotation);
    console.log('Annotation stored in map. Total annotations:', this._annotations.size);
    
    eventEmitter.emit('annotationCreated', annotation);
    return id;
  }

  public removeAnnotation(annotationId: string): void {
    const annotation = this._annotations.get(annotationId);
    if (annotation) {
      if (annotation.mesh) {
        annotation.mesh.dispose();
      }
      this._annotations.delete(annotationId);
      eventEmitter.emit('annotationRemoved', annotationId);
    }
  }

  public clearAllAnnotations(): void {
    this._annotations.forEach(annotation => {
      if (annotation.mesh) {
        annotation.mesh.dispose();
      }
    });
    this._annotations.clear();
    eventEmitter.emit('allAnnotationsCleared');
  }

  public clearLayer(layer: 'background' | 'foreground'): void {
    const toRemove: string[] = [];
    this._annotations.forEach((annotation, id) => {
      if (annotation.layer === layer) {
        if (annotation.mesh) {
          annotation.mesh.dispose();
        }
        toRemove.push(id);
      }
    });
    
    toRemove.forEach(id => this._annotations.delete(id));
    eventEmitter.emit('layerCleared', layer);
  }

  public toggleAnnotationVisibility(annotationId: string): void {
    const annotation = this._annotations.get(annotationId);
    if (annotation) {
      annotation.isVisible = !annotation.isVisible;
      if (annotation.mesh) {
        annotation.mesh.setEnabled(annotation.isVisible);
      }
      eventEmitter.emit('annotationVisibilityChanged', { id: annotationId, visible: annotation.isVisible });
    }
  }

  public toggleLayerVisibility(layer: 'background' | 'foreground'): void {
    this._annotations.forEach(annotation => {
      if (annotation.layer === layer) {
        annotation.isVisible = !annotation.isVisible;
        if (annotation.mesh) {
          annotation.mesh.setEnabled(annotation.isVisible);
        }
      }
    });
    eventEmitter.emit('layerVisibilityChanged', layer);
  }

  // Getters
  public getSettings(): DrawingSettings {
    return { ...this._settings };
  }

  public getAnnotations(): DrawingAnnotation[] {
    return Array.from(this._annotations.values());
  }

  public getAnnotation(id: string): DrawingAnnotation | undefined {
    return this._annotations.get(id);
  }

  // Debug methods
  public getDebugInfo(): any {
    return {
      hasScene: !!this._scene,
      isDrawingModeActive: this._isDrawingModeActive,
      isDrawing: this._isDrawing,
      currentTool: this._settings.currentTool,
      currentDrawingPoints: this._currentDrawing.length,
      annotationsCount: this._annotations.size,
      hasTempMesh: !!this._tempMesh,
      eventCounter: this._eventCounter,
      settings: this._settings
    };
  }

  public testCreateMarker(): string {
    console.log('testCreateMarker called');
    if (!this._scene) {
      console.log('testCreateMarker failed - no scene');
      return 'No scene available';
    }
    
    // Create a test marker at origin
    const testPoint = new Vector3(0, 0, 0);
    console.log('Creating test marker at:', testPoint);
    const id = this.createAnnotation('marker', [testPoint]);
    console.log('Test marker created with ID:', id);
    return id || 'Failed to create marker';
  }

  // Export/Import
  public exportAnnotations(): string {
    const exportData = {
      annotations: Array.from(this._annotations.values()).map(ann => ({
        ...ann,
        mesh: undefined // Remove mesh references
      })),
      settings: this._settings,
      version: '1.0.0',
      timestamp: Date.now()
    };
    return JSON.stringify(exportData, null, 2);
  }

  public importAnnotations(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      // Clear existing annotations
      this.clearAllAnnotations();
      
      // Import annotations
      data.annotations.forEach((annData: any) => {
        const annotation: DrawingAnnotation = {
          ...annData,
          mesh: undefined
        };
        
        // Recreate mesh
        const mesh = this.createAnnotationMesh(annotation);
        if (mesh) {
          annotation.mesh = mesh;
        }
        this._annotations.set(annotation.id, annotation);
      });
      
      // Import settings if available
      if (data.settings) {
        this._settings = { ...this._settings, ...data.settings };
      }
      
      eventEmitter.emit('annotationsImported', this._annotations.size);
      return true;
    } catch (error) {
      console.error('Failed to import annotations:', error);
      return false;
    }
  }

  // Private Methods
  private setupDrawingEvents(): void {
    if (!this._scene) return;

    // Listen for ground clicks to start/continue drawing - use higher priority
    this._scene.onPointerObservable.add((pointerInfo) => {
      this._eventCounter++;
      
      // Always log pointer events to see if we're receiving them (reduced logging)
      if (this._eventCounter % 50 === 0) { // Log every 50th event to avoid spam
        console.log(`Drawing - Event ${this._eventCounter}: type=${pointerInfo.type}, drawing mode=${this._isDrawingModeActive}`);
      }
      
      // Only handle events when drawing mode is active
      if (!this._isDrawingModeActive) {
        // Don't consume events when drawing mode is not active
        // This allows other services (like MeasurementService) to handle them
        return;
      }
      
      // Log to see if drawing service is consuming all pointer events
      if (pointerInfo.type === PointerEventTypes.POINTERMOVE && Math.random() < 0.001) {
        console.log('DrawingService: Processing POINTERMOVE event');
      }
      
      if (this._settings.currentTool === 'eraser') {
        console.log('Drawing - Ignoring event, eraser tool selected');
        return;
      }
      
      if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
        console.log('Drawing - POINTERDOWN detected');
        this.handlePointerDown(pointerInfo.pickInfo?.pickedPoint);
      } else if (pointerInfo.type === PointerEventTypes.POINTERUP) {
        console.log('Drawing - POINTERUP detected');
        this.handlePointerUp();
      } else if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
        // Reduce move logging to avoid spam
        this.handlePointerMove(pointerInfo.pickInfo?.pickedPoint);
      }
    }, -1); // Use higher priority (-1)
  }

  private handlePointerDown(point: Vector3 | undefined | null): void {
    console.log('handlePointerDown called with point:', point);
    
    if (!this._scene) {
      console.log('No scene available');
      return;
    }
    
    // Always try to get a valid point, preferring the passed point
    let worldPoint = point;
    if (!worldPoint) {
      console.log('No point provided, trying to pick from scene...');
      // Force a new pick against all meshes, including the ground
      const pickResult = this._scene.pick(this._scene.pointerX, this._scene.pointerY);
      console.log('Pick result:', pickResult);
      if (pickResult?.hit && pickResult.pickedPoint) {
        worldPoint = pickResult.pickedPoint;
        console.log('Got point from pick:', worldPoint);
      } else {
        console.log('Pick failed, using ray casting to ground plane...');
        // Create a point on the ground plane at y=0 using ray casting
        const ray = this._scene.createPickingRay(this._scene.pointerX, this._scene.pointerY, Matrix.Identity(), this._scene.activeCamera);
        console.log('Ray:', ray);
        // Intersect with y=0 plane (ground level)
        if (ray.direction.y !== 0) {
          const t = -ray.origin.y / ray.direction.y;
          worldPoint = ray.origin.add(ray.direction.scale(t));
          console.log('Created point on ground plane:', worldPoint);
        } else {
          console.log('Ray direction y is 0, cannot intersect ground plane');
        }
      }
    }
    
    if (!worldPoint) {
      console.log('Could not determine world point');
      return;
    }

    const snappedPoint = this._settings.gridSnap ? this.snapToGrid(worldPoint) : worldPoint;
    console.log('Final snapped point:', snappedPoint);

    switch (this._settings.currentTool) {
      case 'pen':
        console.log('Starting pen drawing...');
        this.startPenDrawing(snappedPoint);
        break;
      case 'marker':
        console.log('Creating marker...');
        // Only create marker on pointer down, don't track movement
        this.createMarker(snappedPoint);
        break;
    }
  }

  private handlePointerUp(): void {
    if (!this._isDrawing) return;

    // Finalize the current drawing
    if (this._currentDrawing.length >= 2) {
      this.finalizeDrawing();
    } else {
      this.clearCurrentDrawing();
    }
  }

  private handlePointerMove(point: Vector3 | undefined | null): void {
    // Only handle movement for pen tool when drawing
    if (!this._isDrawing || this._settings.currentTool !== 'pen') {
      return;
    }

    let worldPoint = point;
    if (!worldPoint) {
      // Try to get point from ground plane
      const pickResult = this._scene?.pick(this._scene.pointerX, this._scene.pointerY);
      if (pickResult?.hit && pickResult.pickedPoint) {
        worldPoint = pickResult.pickedPoint;
      } else if (this._scene) {
        // Create a point on the ground plane at y=0
        const ray = this._scene.createPickingRay(this._scene.pointerX, this._scene.pointerY, Matrix.Identity(), this._scene.activeCamera);
        if (ray.direction.y !== 0) {
          const t = -ray.origin.y / ray.direction.y;
          worldPoint = ray.origin.add(ray.direction.scale(t));
        }
      }
    }

    if (!worldPoint) {
      return;
    }

    const snappedPoint = this._settings.gridSnap ? this.snapToGrid(worldPoint) : worldPoint;
    
    // Only add point if it's different enough from the last point to avoid too many points
    const lastPoint = this._currentDrawing[this._currentDrawing.length - 1];
    const minDistance = this._settings.gridSnap ? 0.3 : 0.2; // Reasonable threshold for smooth drawing
    if (!lastPoint || Vector3.Distance(lastPoint, snappedPoint) > minDistance) {
      this._currentDrawing.push(snappedPoint);
      this.updateTempMesh();
    }
  }

  private startPenDrawing(point: Vector3): void {
    console.log('Starting pen drawing at:', point);
    this._isDrawing = true;
    this._currentDrawing = [point];
    console.log('Pen drawing state - isDrawing:', this._isDrawing, 'currentDrawing length:', this._currentDrawing.length);
    
    // Create a temporary preview mesh immediately
    this.updateTempMesh();
  }

  private createMarker(point: Vector3): void {
    console.log('Creating marker at:', point);
    if (!this._scene) {
      console.log('Cannot create marker - no scene available');
      return;
    }
    const id = this.createAnnotation('marker', [point]);
    console.log('Created marker with ID:', id);
    if (id) {
      console.log('Marker successfully created and added to annotations');
    } else {
      console.log('Failed to create marker annotation');
    }
  }


  private finalizeDrawing(): void {
    console.log('finalizeDrawing called. Points:', this._currentDrawing.length, 'Tool:', this._settings.currentTool);
    
    if (this._currentDrawing.length >= 1 && this._settings.currentTool === 'pen') {
      console.log('Creating final pen annotation');
      const id = this.createAnnotation('pen', this._currentDrawing);
      console.log('Finalized drawing with ID:', id);
    } else {
      console.log('Not finalizing - insufficient points or wrong tool');
    }
    this.clearCurrentDrawing();
  }

  private clearCurrentDrawing(): void {
    this._isDrawing = false;
    this._currentDrawing = [];
    if (this._tempMesh) {
      this._tempMesh.dispose();
      this._tempMesh = null;
    }
  }

  private updateTempMesh(): void {
    console.log('updateTempMesh called. Current drawing length:', this._currentDrawing.length);
    if (!this._scene) {
      console.log('updateTempMesh failed - no scene');
      return;
    }
    
    if (this._currentDrawing.length < 1) {
      console.log('updateTempMesh failed - no points in current drawing');
      return;
    }

    // Throttle mesh updates to improve performance and reduce visual glitches
    if (this._tempMesh && this._currentDrawing.length > 2) {
      // Only update every few points to reduce flickering
      if (this._currentDrawing.length % 3 !== 0) {
        return;
      }
    }

    if (this._tempMesh) {
      console.log('Disposing previous temp mesh');
      this._tempMesh.dispose();
      this._tempMesh = null;
    }

    // Create temporary mesh to show preview
    this._tempMesh = this.createPreviewMesh();
    console.log('Created temp mesh:', this._tempMesh);
  }

  private createPreviewMesh(): AbstractMesh | null {
    console.log('createPreviewMesh called. Points:', this._currentDrawing.length, 'Tool:', this._settings.currentTool);
    
    if (!this._scene) {
      console.log('createPreviewMesh failed - no scene');
      return null;
    }
    
    if (this._currentDrawing.length < 1) {
      console.log('createPreviewMesh failed - no points');
      return null;
    }

    let mesh: AbstractMesh;

    try {
      switch (this._settings.currentTool) {
        case 'pen':
          mesh = this.createPenMesh(this._currentDrawing, true);
          break;
        default:
          console.log('createPreviewMesh - unsupported tool:', this._settings.currentTool);
          return null;
      }

      console.log('Created preview mesh:', mesh);

      // Apply preview material
      const material = new StandardMaterial('tempMaterial', this._scene);
      material.diffuseColor = Color3.FromHexString(this._settings.currentColor);
      material.alpha = 0.7;
      mesh.material = material;
      
      console.log('Applied preview material');
      return mesh;
    } catch (error) {
      console.error('Error creating preview mesh:', error);
      return null;
    }
  }

  private createAnnotationMesh(annotation: DrawingAnnotation): AbstractMesh | null {
    console.log('createAnnotationMesh called for annotation:', annotation);
    if (!this._scene) {
      console.log('createAnnotationMesh failed - no scene');
      return null;
    }

    let mesh: AbstractMesh;

    try {
      switch (annotation.type) {
        case 'pen':
          console.log('Creating pen mesh with points:', annotation.points);
          mesh = this.createPenMesh(annotation.points);
          break;
        case 'marker':
          console.log('Creating marker mesh at point:', annotation.points[0]);
          mesh = this.createMarkerMesh(annotation.points[0]);
          break;
        default:
          console.log('Unknown annotation type:', annotation.type);
          return null;
      }
      
      console.log('Base mesh created:', mesh);

      // Apply or update material
      const material = new StandardMaterial(`annotationMat-${annotation.id}`, this._scene);
      material.diffuseColor = Color3.FromHexString(annotation.color);
      material.alpha = annotation.opacity;
      
      // For markers, also add emissive color for better visibility
      if (annotation.type === 'marker') {
        material.emissiveColor = Color3.FromHexString(annotation.color).scale(0.3);
      }
      
      mesh.material = material;
      console.log('Material applied:', material);

      // Set layer height (but don't override markers which have specific positioning)
      if (annotation.type !== 'marker') {
        mesh.position.y = annotation.layer === 'background' ? 0.005 : 0.015;
        console.log('Layer height set to:', mesh.position.y);
      } else {
        console.log('Skipping layer height for marker, keeping y position:', mesh.position.y);
      }

      // Add interactivity
      this.addAnnotationInteractivity(mesh, annotation);
      console.log('Interactivity added');

      return mesh;
    } catch (error) {
      console.error('Error creating annotation mesh:', error);
      return null;
    }
  }

  private createPenMesh(points: Vector3[], isPreview: boolean = false): AbstractMesh {
    console.log('createPenMesh called with points:', points.length, 'points, isPreview:', isPreview);
    if (!this._scene) throw new Error('Scene not initialized');

    if (points.length < 2) {
      console.log('Not enough points for line creation, creating a single point marker');
      // Create a small sphere for single point
      const pointMesh = MeshBuilder.CreateSphere(`${isPreview ? 'temp' : 'annotation'}-point`, {
        diameter: 0.15
      }, this._scene);
      pointMesh.position = points[0];
      pointMesh.position.y += 0.02;
      return pointMesh;
    }

    // Create a continuous line path for pen drawing with better visibility
    const penLine = MeshBuilder.CreateLines(`${isPreview ? 'temp' : 'annotation'}-pen-${Date.now()}`, {
      points: points,
      updatable: false
    }, this._scene);

    console.log('Created pen line mesh with', points.length, 'points');

    // Make lines more visible by setting alpha and color
    penLine.alpha = isPreview ? 0.8 : 1.0;
    penLine.color = Color3.FromHexString(this._settings.currentColor);
    
    // Position slightly above ground to ensure visibility
    penLine.position.y = 0.01;

    console.log('Set pen line color to:', this._settings.currentColor);

    return penLine;
  }

  private createMarkerMesh(point: Vector3): AbstractMesh {
    console.log('createMarkerMesh called with point:', point);
    if (!this._scene) throw new Error('Scene not initialized');

    // Create a more visible marker - larger sphere with better positioning
    const marker = MeshBuilder.CreateSphere('annotation-marker', {
      diameter: 0.5, // Larger diameter for visibility
      segments: 16
    }, this._scene);

    console.log('Created marker sphere:', marker);

    // Position the marker properly above the ground
    marker.position = point.clone();
    marker.position.y = 0.25; // Fixed height above ground

    console.log('Set marker position to:', marker.position);

    // Material will be applied in createAnnotationMesh

    return marker;
  }


  private addAnnotationInteractivity(mesh: AbstractMesh, annotation: DrawingAnnotation): void {
    if (!this._scene) return;

    // Add action manager for right-click context menu
    mesh.actionManager = new ActionManager(this._scene);
    
    mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnRightPickTrigger, () => {
      this.showAnnotationContextMenu(annotation);
    }));

    // Add drag behavior for movement
    const dragBehavior = new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 1, 0) });
    dragBehavior.useObjectOrientationForDragging = false;
    
    dragBehavior.onDragEndObservable.add(() => {
      // Update annotation position
      const offset = mesh.position.subtract(annotation.points[0]);
      annotation.points = annotation.points.map(p => p.add(offset));
      eventEmitter.emit('annotationMoved', { id: annotation.id, newPosition: mesh.position });
    });

    mesh.addBehavior(dragBehavior);
  }

  private showAnnotationContextMenu(annotation: DrawingAnnotation): void {
    eventEmitter.emit('showAnnotationContextMenu', {
      annotation,
      onDelete: () => this.removeAnnotation(annotation.id),
      onToggleVisibility: () => this.toggleAnnotationVisibility(annotation.id),
      onChangeColor: (color: string) => this.changeAnnotationColor(annotation.id, color),
      onChangeOpacity: (opacity: number) => this.changeAnnotationOpacity(annotation.id, opacity)
    });
  }

  private changeAnnotationColor(annotationId: string, color: string): void {
    const annotation = this._annotations.get(annotationId);
    if (annotation && annotation.mesh) {
      annotation.color = color;
      const material = annotation.mesh.material as StandardMaterial;
      if (material) {
        material.diffuseColor = Color3.FromHexString(color);
      }
      eventEmitter.emit('annotationColorChanged', { id: annotationId, color });
    }
  }

  private changeAnnotationOpacity(annotationId: string, opacity: number): void {
    const annotation = this._annotations.get(annotationId);
    if (annotation && annotation.mesh) {
      annotation.opacity = opacity;
      const material = annotation.mesh.material as StandardMaterial;
      if (material) {
        material.alpha = opacity;
      }
      eventEmitter.emit('annotationOpacityChanged', { id: annotationId, opacity });
    }
  }

  private snapToGrid(point: Vector3): Vector3 {
    const cellSize = 1.5; // Same as CELL_SIZE in MainRenderService
    const snappedX = Math.round(point.x / cellSize) * cellSize;
    const snappedZ = Math.round(point.z / cellSize) * cellSize;
    return new Vector3(snappedX, point.y, snappedZ);
  }

  private toggleCameraControls(enabled: boolean): void {
    if (!this._scene) return;
    
    const camera = this._scene.activeCamera;
    if (camera && 'attachControl' in camera && 'detachControl' in camera) {
      console.log('Toggling camera controls:', enabled);
      if (enabled) {
        // Re-enable camera controls
        (camera as any).attachControl(this._scene.getEngine().getRenderingCanvas(), true);
      } else {
        // Disable camera controls to prevent interference with drawing
        (camera as any).detachControl();
      }
    }
  }

  // private setupModeCoordination(): void {
  //   // Mode coordination removed - let both systems work independently
  //   // Focus on event priority handling instead
  // }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default new DrawingService();