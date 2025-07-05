import { Scene, AbstractMesh, Vector3, MeshBuilder, StandardMaterial, Color3, DynamicTexture, Mesh, TransformNode } from '@babylonjs/core';
import { CombatEntity } from '../Types/Combat';
import eventEmitter from '../Events/misurazioneEventEmitter';

class FlyingService {
  private _scene: Scene | null = null;

  public initialize(scene: Scene): void {
    this._scene = scene;
  }

  // Set entity flying height
  public setEntityFlying(entity: CombatEntity, height: number): void {
    if (!this._scene || !entity.mesh) return;

    entity.isFlying = true;
    entity.flyingHeight = height;
    
    // Convert feet to world units (5 feet = 1.5 world units)
    const worldHeight = (height / 5) * 1.5;
    entity.position.y = worldHeight;

    // Update mesh position
    entity.mesh.position.y = worldHeight;

    // Create or update height indicator
    this._createHeightIndicator(entity);

    eventEmitter.emit('entityFlying', { entityId: entity.id, height });
  }

  // Land entity
  public landEntity(entity: CombatEntity): void {
    if (!this._scene || !entity.mesh) return;

    entity.isFlying = false;
    entity.flyingHeight = 0;
    entity.position.y = 0;

    // Reset mesh to ground level
    const sizeMultiplier = this._getSizeMultiplier(entity.size);
    entity.mesh.position.y = sizeMultiplier;

    // Remove height indicator
    this._removeHeightIndicator(entity);

    eventEmitter.emit('entityLanded', { entityId: entity.id });
  }

  // Create height indicator (arrow + text)
  private _createHeightIndicator(entity: CombatEntity): void {
    if (!this._scene || !entity.mesh) return;

    // Remove existing indicator if present
    this._removeHeightIndicator(entity);

    const height = entity.flyingHeight || 0;
    const worldHeight = (height / 5) * 1.5;

    // Create parent node for the indicator
    const indicatorParent = new TransformNode(`heightIndicator-${entity.id}`, this._scene);
    indicatorParent.position = new Vector3(
      entity.mesh.position.x,
      0,
      entity.mesh.position.z
    );

    // Create vertical line (arrow shaft)
    const line = MeshBuilder.CreateCylinder(`heightLine-${entity.id}`, {
      height: worldHeight,
      diameter: 0.05
    }, this._scene);
    
    line.position.y = worldHeight / 2;
    line.parent = indicatorParent;

    // Create arrow material
    const lineMaterial = new StandardMaterial(`heightLineMat-${entity.id}`, this._scene);
    lineMaterial.diffuseColor = new Color3(1, 0.5, 0); // Orange
    lineMaterial.emissiveColor = new Color3(0.3, 0.15, 0);
    line.material = lineMaterial;

    // Create arrow head
    const arrowHead = MeshBuilder.CreateCylinder(`arrowHead-${entity.id}`, {
      height: 0.3,
      diameterTop: 0,
      diameterBottom: 0.15
    }, this._scene);
    
    arrowHead.position.y = worldHeight - 0.15;
    arrowHead.parent = indicatorParent;
    arrowHead.material = lineMaterial;

    // Create ground marker
    const groundMarker = MeshBuilder.CreateDisc(`groundMarker-${entity.id}`, {
      radius: 0.3,
      tessellation: 8
    }, this._scene);
    
    groundMarker.rotation.x = Math.PI / 2;
    groundMarker.position.y = 0.01;
    groundMarker.parent = indicatorParent;

    const groundMaterial = new StandardMaterial(`groundMarkerMat-${entity.id}`, this._scene);
    groundMaterial.diffuseColor = new Color3(1, 0.5, 0); // Orange
    groundMaterial.alpha = 0.7;
    groundMarker.material = groundMaterial;

    // Create height text
    const heightText = this._createHeightText(entity, height, worldHeight);
    if (heightText) {
      heightText.parent = indicatorParent;
    }

    entity.heightIndicator = indicatorParent as AbstractMesh;
  }

  // Create height text display
  private _createHeightText(entity: CombatEntity, height: number, worldHeight: number): AbstractMesh | null {
    if (!this._scene) return null;

    // Create dynamic texture for text
    const textureSize = 256;
    const texture = new DynamicTexture(`heightText-${entity.id}`, textureSize, this._scene);
    
    const text = `${height}ft`;
    const font = "bold 60px Arial";
    
    texture.drawText(text, null, null, font, "#ffffff", "#000000", true);

    // Create plane for text
    const textPlane = MeshBuilder.CreatePlane(`heightTextPlane-${entity.id}`, {
      width: 1,
      height: 0.5
    }, this._scene);

    const textMaterial = new StandardMaterial(`heightTextMat-${entity.id}`, this._scene);
    textMaterial.diffuseTexture = texture;
    textMaterial.emissiveTexture = texture;
    textMaterial.emissiveColor = new Color3(0.3, 0.3, 0.3);
    textMaterial.useAlphaFromDiffuseTexture = true;
    textPlane.material = textMaterial;

    // Position text at middle of arrow
    textPlane.position.y = worldHeight / 2;
    textPlane.position.x = 0.7; // Offset to the side

    // Make text always face camera
    textPlane.billboardMode = Mesh.BILLBOARDMODE_ALL;

    return textPlane;
  }

  // Remove height indicator
  private _removeHeightIndicator(entity: CombatEntity): void {
    if (entity.heightIndicator) {
      entity.heightIndicator.dispose();
      entity.heightIndicator = undefined;
    }
  }

  // Update height indicator position when entity moves
  public updateHeightIndicator(entity: CombatEntity): void {
    if (!entity.isFlying || !entity.heightIndicator || !entity.mesh) return;

    (entity.heightIndicator as TransformNode).position = new Vector3(
      entity.mesh.position.x,
      0,
      entity.mesh.position.z
    );
  }

  // Get size multiplier for entity
  private _getSizeMultiplier(size: string): number {
    switch (size) {
      case 'tiny': return 0.5;
      case 'small': return 1;
      case 'medium': return 1;
      case 'large': return 2;
      case 'huge': return 3;
      case 'gargantuan': return 4;
      default: return 1;
    }
  }

  // Clean up when entity is removed
  public removeEntity(entity: CombatEntity): void {
    this._removeHeightIndicator(entity);
  }

  // Get all flying entities
  public getFlyingEntities(entities: Map<string, CombatEntity>): CombatEntity[] {
    return Array.from(entities.values()).filter(entity => entity.isFlying);
  }

  // Cleanup
  public dispose(): void {
    // Height indicators will be disposed when entities are removed
  }
}

export default new FlyingService();