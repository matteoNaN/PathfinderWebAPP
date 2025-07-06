import {
  Nullable,
  Scene,
  PointerInfo,
  PointerEventTypes,
  Vector3,
  MeshBuilder,
  AbstractMesh,
} from "@babylonjs/core";
import { GUI3DManager, Slider3D, StackPanel3D } from '@babylonjs/gui';
import MeasurementService from "./MeasurementService";

type ActionCallback = () => void;

// inputService.ts
export class InputService {
  private _actions: Map<string, ActionCallback> = new Map();
  private _sceneRef: Nullable<Scene> = null;

  private _firstPoint: Nullable<Vector3> = null;
  // private _secondPoint: Nullable<Vector3> = null;
  // private _lineMesh: Nullable<LinesMesh> = null;
  // private _isMeasuringEnabled: boolean = false;
  private _drawSphereEnabled: boolean = false;
  private _sphereRadius: Nullable<number> = null;

  constructor(sceneRef: Nullable<Scene>) {
    this._sceneRef = sceneRef;
    this.initActions();
    this.setupPointerObservables();
    this.setupKeyboardListener();
  }

  private initActions() {
    // Inizializza le azioni qui
    this._actions.set("POINTER_DOWN_MEASUREMENT", () =>
      this.handleSpherePointerDown()
    );
    this._actions.set("POINTER_MOVE_MEASUREMENT", () =>
      this.handleSpherePointerMove()
    );

    this._actions.set("POINTER_DOWN_SPHERE", () =>
      this.handleSpherePointerDown()
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private handleSpherePointerMove(): void {
    // Implementation for sphere pointer move
  }
  private handleSpherePointerDown(): void {
    if (this._sceneRef) {
      const pickResult = this._sceneRef.pick(
        this._sceneRef.pointerX,
        this._sceneRef.pointerY
      );

      if (pickResult && pickResult.hit) {
        if (!this._firstPoint) {
          this._firstPoint = pickResult.pickedPoint;
        } else {
          this._sphereRadius = Vector3.Distance(
            this._firstPoint,
            pickResult.pickedPoint!
          );
          const circle: AbstractMesh = MeshBuilder.CreateSphere(
            "disc-mesh",
            {
              diameter: this._sphereRadius,
              segments: 32,
            },
            this._sceneRef
          );

          circle.position = this._firstPoint;
          this._addUISlider(circle);
           this._drawSphereEnabled = false;
        }
      }
    }
  }
private _addUISlider(targetMesh: AbstractMesh): void {
  const manager = new GUI3DManager(this._sceneRef!);
  const panel = new StackPanel3D();
  manager.addControl(panel);

  const sliderPosition:Vector3 = targetMesh.position;
  sliderPosition.y += 1

  // Posiziona il pannello vicino alla sfera
  panel.position = sliderPosition // spostalo a lato

  const slider = new Slider3D();
  panel.addControl(slider);

  slider.minimum = 0.5;
  slider.maximum = 30;
  slider.value = 1;

  // Ridimensiona la sfera al cambio dello slider
  slider.onValueChangedObservable.add((value:number) => {
    targetMesh.scaling = new Vector3(value, value, value);
    panel.position.y = value + 1
  });
}


  private setupPointerObservables() {
    if (this._sceneRef) {
      this._sceneRef.onPointerObservable.add((pointerInfo: PointerInfo) => {
        // Let MeasurementService handle its own pointer events directly
        // Remove conflicting handlers that were causing issues
        
        if (this._drawSphereEnabled) {
          switch (pointerInfo.type) {
            case PointerEventTypes.POINTERDOWN:
              this._executeAction("POINTER_DOWN_SPHERE");
              break;
            case PointerEventTypes.POINTERMOVE:
              this._executeAction("POINTER_MOVE_SPHERE");
              break;
          }
        }
      }, 2); // Use lower priority (2) to avoid conflicts with drawing (-1) and measurement (1)
    }
  }

  // Removed duplicate measurement handlers - MeasurementService now handles its own pointer events

  private setupKeyboardListener() {
    window.addEventListener("keydown", (event) => {
      if (event.key === "m") {
        MeasurementService.toggleMeasurement();
      }
      // Disabled sphere drawing to prevent unwanted sphere spawning
      // if (event.key === "s") {
      //   this._drawSphereEnabled = !this._drawSphereEnabled;
      //   console.log("disegnando la sfera");
      // }
    });
  }

  private _executeAction(action: string) {
    const callback = this._actions.get(action);
    if (callback) {
      try {
        callback();
      } catch (error) {
        console.error(`Error executing action ${action}:`, error);
      }
    } else {
      console.warn(`No action found for ${action}`);
    }
  }

  // Old measurement methods removed - now handled by MeasurementService

  // private cleanup() {
  //   this._firstPoint = null;
  //   this._secondPoint = null;
  //   this._lineMesh = null;
  //   this._isMeasuringEnabled = false;
  //   this._drawSphereEnabled = false;
  //   this._sphereRadius = null;
  // }
}
