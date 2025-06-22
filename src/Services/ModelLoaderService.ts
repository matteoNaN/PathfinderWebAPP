import { Scene, AbstractMesh, Vector3, SceneLoader, AssetContainer, MeshBuilder } from '@babylonjs/core';
import '@babylonjs/loaders';
import { CreatureSize } from '../Types/Combat';
import MainRenderService from './MainRenderService';

interface ModelConfig {
  path: string;
  scale?: number;
  yOffset?: number;
  animations?: string[];
}

interface LoadedModel {
  mesh: AbstractMesh;
  animations: string[];
  container: AssetContainer;
  isLoaded: boolean;
  loadProgress: number;
}

interface LoadingProgress {
  entityId: string;
  progress: number;
  stage: 'downloading' | 'parsing' | 'configuring' | 'complete' | 'error';
  message: string;
}

type ProgressCallback = (progress: LoadingProgress) => void;

class ModelLoaderService {
  private _scene: Scene | null = null;
  private _loadedModels: Map<string, LoadedModel> = new Map();
  private _modelCache: Map<string, AssetContainer> = new Map();
  private _loadingEntities: Set<string> = new Set();
  private _progressCallbacks: Map<string, ProgressCallback> = new Map();

  public initialize(scene: Scene): void {
    this._scene = scene;
  }

  // Load a 3D model from file path with progress tracking
  public async loadModel(
    modelPath: string, 
    entityId: string, 
    position: Vector3 = Vector3.Zero(),
    size: CreatureSize = CreatureSize.MEDIUM,
    onProgress?: ProgressCallback
  ): Promise<AbstractMesh | null> {
    if (!this._scene) {
      console.error('ModelLoaderService not initialized');
      return null;
    }

    // Prevent multiple loads of the same entity
    if (this._loadingEntities.has(entityId)) {
      console.warn(`Model for entity ${entityId} is already loading`);
      return null;
    }

    this._loadingEntities.add(entityId);
    if (onProgress) {
      this._progressCallbacks.set(entityId, onProgress);
    }

    const reportProgress = (stage: LoadingProgress['stage'], progress: number, message: string) => {
      const progressData: LoadingProgress = { entityId, progress, stage, message };
      onProgress?.(progressData);
    };

    reportProgress('downloading', 0, 'Iniziando il caricamento del modello...');

    try {
      // Check if model is already cached
      let container = this._modelCache.get(modelPath);
      
      if (!container) {
        reportProgress('downloading', 25, 'Scaricando il modello 3D...');
        
        // Load the model for the first time with progress tracking
        const result = await SceneLoader.ImportMeshAsync(
          '', '', modelPath, this._scene,
          (progressEvent) => {
            if (progressEvent.lengthComputable) {
              const percent = Math.round((progressEvent.loaded / progressEvent.total) * 50) + 25;
              reportProgress('parsing', percent, `Caricamento modello: ${percent}%`);
            }
          }
        );
        
        reportProgress('parsing', 75, 'Elaborando il modello...');
        
        // Create container for caching
        container = new AssetContainer(this._scene);
        result.meshes.forEach(mesh => container!.meshes.push(mesh));
        if ((result as any).materials) {
          (result as any).materials.forEach((material: any) => container!.materials.push(material));
        }
        if ((result as any).textures) {
          (result as any).textures.forEach((texture: any) => container!.textures.push(texture));
        }
        result.animationGroups.forEach(anim => container!.animationGroups.push(anim));
        
        this._modelCache.set(modelPath, container);
      } else {
        reportProgress('parsing', 50, 'Modello trovato nella cache...');
      }

      reportProgress('configuring', 85, 'Configurando il modello...');
      
      // Create instance from container
      const instanceContainer = container.instantiateModelsToScene();
      
      if (instanceContainer.rootNodes.length === 0) {
        console.error('No root nodes found in model');
        reportProgress('error', 0, 'Nessun nodo radice trovato nel modello');
        this._loadingEntities.delete(entityId);
        this._progressCallbacks.delete(entityId);
        return null;
      }

      const rootMesh = instanceContainer.rootNodes[0] as AbstractMesh;
      
      // Configure the model
      this._configureModel(rootMesh, entityId, position, size);
      
      reportProgress('complete', 100, 'Modello caricato con successo!');
      
      // Store reference
      const loadedModel: LoadedModel = {
        mesh: rootMesh,
        animations: instanceContainer.animationGroups.map(ag => ag.name),
        container: new AssetContainer(this._scene!),
        isLoaded: true,
        loadProgress: 100
      };
      
      this._loadedModels.set(entityId, loadedModel);
      this._loadingEntities.delete(entityId);
      this._progressCallbacks.delete(entityId);
      
      return rootMesh;
      
    } catch (error) {
      console.error('Failed to load model:', modelPath, error);
      reportProgress('error', 0, `Errore nel caricamento del modello: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
      
      this._loadingEntities.delete(entityId);
      this._progressCallbacks.delete(entityId);
      
      // Fallback to basic shape
      reportProgress('configuring', 50, 'Creando forma base di riserva...');
      const fallbackMesh = this._createFallbackMesh(entityId, position, size);
      
      // Store fallback as loaded model
      const fallbackModel: LoadedModel = {
        mesh: fallbackMesh,
        animations: [],
        container: new AssetContainer(this._scene!),
        isLoaded: true,
        loadProgress: 100
      };
      
      this._loadedModels.set(entityId, fallbackModel);
      reportProgress('complete', 100, 'Forma base creata come riserva');
      
      return fallbackMesh;
    }
  }

  // Load model from URL (for web resources)
  public async loadModelFromUrl(
    url: string,
    entityId: string,
    position: Vector3 = Vector3.Zero(),
    size: CreatureSize = CreatureSize.MEDIUM
  ): Promise<AbstractMesh | null> {
    if (!this._scene) {
      console.error('ModelLoaderService not initialized');
      return null;
    }

    try {
      const fileName = url.split('/').pop() || 'model';
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
      
      const result = await SceneLoader.ImportMeshAsync('', baseUrl, fileName, this._scene);
      
      if (result.meshes.length === 0) {
        console.error('No meshes found in model');
        return this._createFallbackMesh(entityId, position, size);
      }

      const rootMesh = result.meshes[0] as AbstractMesh;
      this._configureModel(rootMesh, entityId, position, size);
      
      const loadedModel: LoadedModel = {
        mesh: rootMesh,
        animations: result.animationGroups.map(ag => ag.name),
        container: new AssetContainer(this._scene), // Empty container for URL models
        isLoaded: true,
        loadProgress: 100
      };
      
      this._loadedModels.set(entityId, loadedModel);
      
      return rootMesh;
      
    } catch (error) {
      console.error('Failed to load model from URL:', url, error);
      return this._createFallbackMesh(entityId, position, size);
    }
  }

  // Check if a model is currently loading
  public isModelLoading(entityId: string): boolean {
    return this._loadingEntities.has(entityId);
  }

  // Check if a model is loaded
  public isModelLoaded(entityId: string): boolean {
    const model = this._loadedModels.get(entityId);
    return model ? model.isLoaded : false;
  }

  // Get loading progress for a model
  public getLoadingProgress(entityId: string): number {
    const model = this._loadedModels.get(entityId);
    return model ? model.loadProgress : 0;
  }

  // Get all currently loading entities
  public getLoadingEntities(): string[] {
    return Array.from(this._loadingEntities);
  }

  // Get available model animations
  public getModelAnimations(entityId: string): string[] {
    const model = this._loadedModels.get(entityId);
    return model ? model.animations : [];
  }

  // Play animation
  public playAnimation(entityId: string, animationName: string, loop: boolean = true): void {
    if (!this._scene) return;
    
    const model = this._loadedModels.get(entityId);
    if (!model) return;

    const animationGroup = this._scene.getAnimationGroupByName(animationName);
    if (animationGroup) {
      animationGroup.stop();
      animationGroup.play(loop);
    }
  }

  // Stop animation
  public stopAnimation(entityId: string, animationName?: string): void {
    if (!this._scene) return;
    
    if (animationName) {
      const animationGroup = this._scene.getAnimationGroupByName(animationName);
      if (animationGroup) {
        animationGroup.stop();
      }
    } else {
      // Stop all animations for this entity
      this._scene.animationGroups.forEach(ag => {
        if (ag.name.includes(entityId)) {
          ag.stop();
        }
      });
    }
  }

  // Remove model
  public removeModel(entityId: string): void {
    const model = this._loadedModels.get(entityId);
    
    if (model) {
      model.mesh.dispose();
      model.container.dispose();
      this._loadedModels.delete(entityId);
    }
  }

  // Update model position
  public updateModelPosition(entityId: string, position: Vector3): void {
    const model = this._loadedModels.get(entityId);
    if (model) {
      model.mesh.position = position;
    }
  }

  // Get predefined model configurations
  public getPresetModels(): { [key: string]: ModelConfig } {
    return {
      'human_fighter': {
        path: '/models/characters/human_fighter.glb',
        scale: 1.0,
        yOffset: 0,
        animations: ['idle', 'walk', 'attack', 'death']
      },
      'elf_wizard': {
        path: '/models/characters/elf_wizard.glb',
        scale: 0.9,
        yOffset: 0,
        animations: ['idle', 'walk', 'cast_spell', 'death']
      },
      'dwarf_cleric': {
        path: '/models/characters/dwarf_cleric.glb',
        scale: 0.8,
        yOffset: 0,
        animations: ['idle', 'walk', 'heal', 'attack']
      },
      'orc_warrior': {
        path: '/models/enemies/orc_warrior.glb',
        scale: 1.1,
        yOffset: 0,
        animations: ['idle', 'walk', 'attack', 'roar']
      },
      'goblin': {
        path: '/models/enemies/goblin.glb',
        scale: 0.7,
        yOffset: 0,
        animations: ['idle', 'walk', 'attack', 'death']
      },
      'dragon': {
        path: '/models/enemies/dragon.glb',
        scale: 2.5,
        yOffset: 0.5,
        animations: ['idle', 'fly', 'breath_weapon', 'attack']
      }
    };
  }

  // Create fallback mesh when model loading fails
  private _createFallbackMesh(
    entityId: string, 
    position: Vector3, 
    size: CreatureSize
  ): AbstractMesh {
    if (!this._scene) throw new Error('Scene not initialized');
    
    const sizeMultiplier = this._getSizeMultiplier(size);
    
    // Create a simple colored cylinder as fallback
    const mesh = MeshBuilder.CreateCylinder(
      `fallback-${entityId}`,
      { height: 2 * sizeMultiplier, diameter: 1.5 * sizeMultiplier },
      this._scene
    );
    
    mesh.position = position;
    mesh.position.y = sizeMultiplier; // Lift to ground level
    
    return mesh;
  }

  private _configureModel(
    mesh: AbstractMesh,
    entityId: string,
    position: Vector3,
    size: CreatureSize
  ): void {
    // Set name for identification
    mesh.name = `model-${entityId}`;
    mesh.id = `model-${entityId}`;
    
    // Set position
    mesh.position = position.clone();
    
    // Scale based on creature size
    const sizeMultiplier = this._getSizeMultiplier(size);
    mesh.scaling = new Vector3(sizeMultiplier, sizeMultiplier, sizeMultiplier);
    
    // Ensure model is on the ground
    const boundingInfo = mesh.getBoundingInfo();
    const height = boundingInfo.boundingBox.maximum.y - boundingInfo.boundingBox.minimum.y;
    mesh.position.y = height * sizeMultiplier / 2;
    
    // Enable shadows and lighting
    mesh.receiveShadows = true;
    MainRenderService.addShadowCaster(mesh);
    
    // Make sure all child meshes are also configured
    mesh.getChildMeshes().forEach(childMesh => {
      childMesh.receiveShadows = true;
      MainRenderService.addShadowCaster(childMesh);
    });
  }

  private _getSizeMultiplier(size: CreatureSize): number {
    switch (size) {
      case CreatureSize.TINY: return 0.4;
      case CreatureSize.SMALL: return 0.7;
      case CreatureSize.MEDIUM: return 1.0;
      case CreatureSize.LARGE: return 1.5;
      case CreatureSize.HUGE: return 2.0;
      case CreatureSize.GARGANTUAN: return 3.0;
      default: return 1.0;
    }
  }

  // Cleanup
  public dispose(): void {
    this._loadedModels.forEach(model => {
      model.mesh.dispose();
      model.container.dispose();
    });
    this._loadedModels.clear();
    
    this._modelCache.forEach(container => {
      container.dispose();
    });
    this._modelCache.clear();
  }
}

export default new ModelLoaderService();