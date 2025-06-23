/* eslint-disable @typescript-eslint/no-unused-vars */
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, DirectionalLight, SpotLight, ShadowGenerator, MeshBuilder, Color3, StandardMaterial, KeyboardEventTypes} from '@babylonjs/core';
import CombatService from "./CombatService";

// D&D grid: 1 unit = 5 feet, standard combat grid
const GRID_SIZE : number = 40; // 40x40 grid = 200x200 feet
const CELL_SIZE : number = 1.5; // Each cell represents 5 feet

class MainRenderService{
    private _engine       : Engine | null = null;
    private _scene        : Scene  | null = null;
    private _camera       : ArcRotateCamera | null = null;
    // private _inputService : InputService | null = null;
    private _shadowGenerator: ShadowGenerator | null = null;

    /**
     *
     */

    public async createScene(canvas : HTMLCanvasElement): Promise<void>
    {
        this._engine = new Engine(canvas);
        this._scene = new Scene(this._engine);
        //this.scene.debugLayer.show();
        this.createCamera(canvas);
        this.createLight()
        this.createTerrain()
        this.bindEvents()

        // Initialize Combat Service
        CombatService.initialize(this._scene);

        this._engine.runRenderLoop(()=>{
            if(this._scene)
                this._scene.render();
        })

    }
    private createTerrain() {
        // Create the ground plane for D&D combat
        const ground = MeshBuilder.CreateGround('ground', {
            width: GRID_SIZE * CELL_SIZE, 
            height: GRID_SIZE * CELL_SIZE, 
            subdivisions: 32
        }, this._scene!);

        // Enhanced ground material with stone/dungeon texture feel
        const groundMaterial = new StandardMaterial('groundMaterial', this._scene!);
        groundMaterial.diffuseColor = new Color3(0.3, 0.35, 0.4); // Dark stone color
        groundMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
        ground.material = groundMaterial;
    
        // Create D&D combat grid (5ft squares)
        this.createCombatGrid();
    }

    private createCombatGrid(): void {
        const halfGrid = (GRID_SIZE * CELL_SIZE) / 2;
        
        for (let i = 0; i <= GRID_SIZE; i++) {
            const position = i * CELL_SIZE - halfGrid;
            
            // Vertical grid lines
            const vLine = MeshBuilder.CreateLines(`vGridLine_${i}`, {
                points: [
                    new Vector3(position, 0.02, -halfGrid),
                    new Vector3(position, 0.02, halfGrid)
                ],
                updatable: false
            }, this._scene!);
            
            // Make every 5th line (25ft) more prominent
            if (i % 5 === 0) {
                vLine.color = new Color3(0.8, 0.8, 0.8); // Bright lines for major grid
            } else {
                vLine.color = new Color3(0.4, 0.4, 0.4); // Dim lines for 5ft grid
            }
            vLine.alpha = 0.7;
    
            // Horizontal grid lines
            const hLine = MeshBuilder.CreateLines(`hGridLine_${i}`, {
                points: [
                    new Vector3(-halfGrid, 0.02, position),
                    new Vector3(halfGrid, 0.02, position)
                ],
                updatable: false
            }, this._scene!);
            
            if (i % 5 === 0) {
                hLine.color = new Color3(0.8, 0.8, 0.8);
            } else {
                hLine.color = new Color3(0.4, 0.4, 0.4);
            }
            hLine.alpha = 0.7;
        }

        // Center marker removed for cleaner scene
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // private snapToGrid(position: Vector3) {
    //     const halfCellSize = CELL_SIZE / 2;

    //     const snappedX = Math.round((position.x - halfCellSize) / CELL_SIZE) * CELL_SIZE + halfCellSize;
    //     const snappedZ = Math.round((position.z - halfCellSize) / CELL_SIZE) * CELL_SIZE + halfCellSize;
    
    //     return new Vector3(snappedX, position.y, snappedZ);
    // }

    private createCamera(canvas : HTMLCanvasElement) : void
    {
        // Enhanced camera setup for D&D combat view
        this._camera = new ArcRotateCamera(
            "combatCamera", 
            -Math.PI / 2,  // Alpha: side view angle
            Math.PI / 3,   // Beta: elevation angle for tactical view
            25,            // Radius: distance from target
            new Vector3(0, 0, 0), // Target center of grid
            this._scene!
        );
        
        this._camera.attachControl(canvas, true);
        
        // Enhanced camera limits for better D&D experience
        this._camera.upperBetaLimit = Math.PI / 2.2;  // Prevent going too flat
        this._camera.lowerBetaLimit = 0.1;            // Prevent going under ground
        this._camera.lowerRadiusLimit = 8;            // Minimum zoom
        this._camera.upperRadiusLimit = 80;           // Maximum zoom for battlefield overview
        
        // Smooth camera movements
        this._camera.inertia = 0.8;
        this._camera.wheelDeltaPercentage = 0.01;
        this._camera.pinchDeltaPercentage = 0.01;
        
        // Pan limits to keep view within reasonable bounds
        this._camera.panningSensibility = 100;
        this._camera.panningDistanceLimit = 50;
        
        // Add camera keyboard controls
        this.setupCameraKeyboardControls();
    }

    private createLight() : void
    {
        // Enhanced lighting setup for better 3D visualization
        
        // Ambient light for general illumination
        const ambientLight = new HemisphericLight(
            "ambientLight", 
            new Vector3(0, 1, 0), 
            this._scene!
        );
        ambientLight.intensity = 0.4;
        ambientLight.diffuse = new Color3(0.8, 0.8, 1.0);  // Slight blue tint
        ambientLight.specular = new Color3(0.1, 0.1, 0.1);
        
        // Main directional light (like sun) for shadows and definition
        const sunLight = new DirectionalLight(
            "sunLight", 
            new Vector3(-1, -2, -1), 
            this._scene!
        );
        sunLight.intensity = 1.2;
        sunLight.diffuse = new Color3(1.0, 0.95, 0.8);  // Warm sunlight
        sunLight.specular = new Color3(0.2, 0.2, 0.2);
        
        // Setup shadows
        this._shadowGenerator = new ShadowGenerator(2048, sunLight);
        this._shadowGenerator.useExponentialShadowMap = true;
        this._shadowGenerator.darkness = 0.3;
        
        // Additional fill light for better character visibility
        const fillLight = new SpotLight(
            "fillLight",
            new Vector3(10, 15, 10),
            new Vector3(-0.5, -1, -0.5),
            Math.PI / 3,
            2,
            this._scene!
        );
        fillLight.intensity = 0.6;
        fillLight.diffuse = new Color3(0.9, 0.9, 1.0);  // Cool fill light
    }

    private resize(): void {
        if (this._engine) {
            this._engine.resize();
        }
    }

    // Add a mesh to shadow casting
    public addShadowCaster(mesh: any): void {
        if (this._shadowGenerator && mesh) {
            this._shadowGenerator.addShadowCaster(mesh, true);
        }
    }
    
    // Get camera instance for external use
    public getCamera(): ArcRotateCamera | null {
        return this._camera;
    }
    
    // Get scene instance for external use
    public getScene(): Scene | null {
        return this._scene;
    }

    public dispose(): void {
        window.removeEventListener('resize', this.resize.bind(this));
        if (this._shadowGenerator) {
            this._shadowGenerator.dispose();
        }
        if (this._scene) {
            this._scene.dispose();
        }
        if (this._engine) {
            this._engine.dispose();
        }
    }

    // Setup keyboard controls for camera
    private setupCameraKeyboardControls(): void {
        if (!this._scene || !this._camera) return;
        
        this._scene.onKeyboardObservable.add((kbInfo) => {
            if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
                const key = kbInfo.event.code;
                const moveSpeed = 2;
                const rotateSpeed = 0.1;
                
                switch (key) {
                    case 'ArrowUp':
                    case 'KeyW':
                        // Move camera forward
                        this._camera!.setTarget(
                            this._camera!.getTarget().add(
                                this._camera!.getForwardRay().direction.scale(moveSpeed)
                            )
                        );
                        break;
                    case 'ArrowDown':
                    case 'KeyS':
                        // Move camera backward
                        this._camera!.setTarget(
                            this._camera!.getTarget().subtract(
                                this._camera!.getForwardRay().direction.scale(moveSpeed)
                            )
                        );
                        break;
                    case 'ArrowLeft':
                    case 'KeyA':
                        // Rotate camera left
                        this._camera!.alpha -= rotateSpeed;
                        break;
                    case 'ArrowRight':
                    case 'KeyD':
                        // Rotate camera right
                        this._camera!.alpha += rotateSpeed;
                        break;
                    case 'KeyQ':
                        // Zoom in
                        this._camera!.radius = Math.max(
                            this._camera!.lowerRadiusLimit || 5,
                            this._camera!.radius - 3
                        );
                        break;
                    case 'KeyE':
                        // Zoom out
                        this._camera!.radius = Math.min(
                            this._camera!.upperRadiusLimit || 50,
                            this._camera!.radius + 3
                        );
                        break;
                    case 'KeyR':
                        // Reset camera to default position
                        this.resetCameraPosition();
                        break;
                }
            }
        });
    }
    
    // Reset camera to default tactical view
    public resetCameraPosition(): void {
        if (!this._camera) return;
        
        this._camera.setTarget(Vector3.Zero());
        this._camera.alpha = -Math.PI / 2;
        this._camera.beta = Math.PI / 3;
        this._camera.radius = 25;
    }
    
    // Get camera controls info for UI
    public getCameraControlsInfo(): string {
        return 'Controlli Telecamera: WASD/Frecce - Muovi | Q/E - Zoom | R - Reset';
    }

    public bindEvents() {
        // this._inputService = new InputService(this._scene);
    }

}

export default new MainRenderService();