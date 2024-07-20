/* eslint-disable @typescript-eslint/no-unused-vars */
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder, Color3, StandardMaterial, DynamicTexture } from '@babylonjs/core';

const GRID_SIZE : number = 50;
const CELL_SIZE     : number = 1.5;

class MainRenderService{

    private engine : Engine | null = null;
    private scene  : Scene  | null = null;

    public async createScene(canvas : HTMLCanvasElement): Promise<void>
    {
        this.engine = new Engine(canvas);
        this.scene = new Scene(this.engine);

        this.createCamera(canvas);
        this.createLight()
        this.createTerrain()


        this.engine.runRenderLoop(()=>{
            if(this.scene)
                this.scene.render();
        })

    }
    private createTerrain() {
        const ground = MeshBuilder.CreateGround('ground', {width: GRID_SIZE*1.5, height: GRID_SIZE*1.5, subdivisions: 10}, this.scene!);

        // Materiale per il terreno
        const groundMaterial = new StandardMaterial('groundMaterial', this.scene!);
        groundMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5); // Colore grigio
        ground.material = groundMaterial;
    
        // Crea la griglia

    
        for (let i = 0; i <= GRID_SIZE; i++) {
            // Linee verticali
            const vLine = MeshBuilder.CreateLines('vLine', {
                points: [
                    new Vector3(i * CELL_SIZE - (GRID_SIZE * CELL_SIZE) / 2, 0.01, -(GRID_SIZE * CELL_SIZE) / 2),
                    new Vector3(i * CELL_SIZE - (GRID_SIZE * CELL_SIZE) / 2, 0.01, (GRID_SIZE * CELL_SIZE) / 2)
                ],
                updatable: false
            }, this.scene!);
            vLine.color = Color3.Black();
    
            // Linee orizzontali
            const hLine = MeshBuilder.CreateLines('hLine', {
                points: [
                    new Vector3(-(GRID_SIZE * CELL_SIZE) / 2, 0.01, i * CELL_SIZE - (GRID_SIZE * CELL_SIZE) / 2),
                    new Vector3((GRID_SIZE * CELL_SIZE) / 2, 0.01, i * CELL_SIZE - (GRID_SIZE * CELL_SIZE) / 2)
                ],
                updatable: false
            }, this.scene!);
            hLine.color = Color3.Black();
        }


    }

    private createCamera(canvas : HTMLCanvasElement) : void
    {
        const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2, 5, new Vector3(0, 0, 0), this.scene!);
        camera.attachControl(canvas, true);
        camera.upperBetaLimit = Math.PI / 2.5;
        
    }

    private createLight() : void
    {
        const light = new HemisphericLight("light", new Vector3(1, 1, 0), this.scene!);
    }

    private resize(): void {
        if (this.engine) {
            this.engine.resize();
        }
    }

    public dispose(): void {
        window.removeEventListener('resize', this.resize.bind(this));
        if (this.scene) {
            this.scene.dispose();
        }
        if (this.engine) {
            this.engine.dispose();
        }
    }
}

export default new MainRenderService();