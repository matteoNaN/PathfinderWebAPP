import {
  Nullable,
  Scene,
  PointerInfo,
  PointerEventTypes,
  Vector3,
  MeshBuilder,
  LinesMesh,
  AbstractMesh,
} from "@babylonjs/core";
import eventEmitter from "../Events/misurazioneEventEmitter.ts";

type ActionCallback = () => void;

// inputService.ts
export class InputService {
  private _actions: Map<string, ActionCallback> = new Map();
  private _sceneRef: Nullable<Scene> = null;

  private _firstPoint: Nullable<Vector3> = null;
  private _secondPoint: Nullable<Vector3> = null;
  private _lineMesh: Nullable<LinesMesh> = null;
  private _isMeasuringEnabled: boolean = false;
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
      this.handleMeasurementPointerDown()
    );
    this._actions.set("POINTER_MOVE_MEASUREMENT", () =>
      this.handleMeasuremetPointerMove()
    );

    this._actions.set("POINTER_DOWN_SPHERE", () =>
      this.handleSpherePointerDown()
    );
    this._actions.set("POINTER_MOVE_SPHERE", () =>
      this.handleSpherePointerMove()
    );
  }

  private handleSpherePointerMove(): void {
    
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
          console.log(`Radius set: ${this._sphereRadius}`);
          const circle: AbstractMesh = MeshBuilder.CreateDisc("disc-mesh", {
            radius: this._sphereRadius,
            tessellation: 32,
          },this._sceneRef);
            
          circle.position = this._firstPoint;
          circle.rotation.x = Math.PI;
          
          

        }
      }
    }
  }

  private setupPointerObservables() {
    if (this._sceneRef) {
      this._sceneRef.onPointerObservable.add((pointerInfo: PointerInfo) => {
        if (this._isMeasuringEnabled) {
          switch (pointerInfo.type) {
            case PointerEventTypes.POINTERDOWN:
              this._executeAction("POINTER_DOWN_MEASUREMENT");
              break;
            case PointerEventTypes.POINTERMOVE:
              this._executeAction("POINTER_MOVE_MEASUREMENT");
              break;
          }
        }
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
      });
    }
  }

  private setupKeyboardListener() {
    window.addEventListener("keydown", (event) => {
      if (event.key === "m") {
        this._isMeasuringEnabled = !this._isMeasuringEnabled;
        console.log(
          `Measuring mode: ${this._isMeasuringEnabled ? "enabled" : "disabled"}`
        );
      }
      if (event.key === "s") {
        this._drawSphereEnabled = !this._drawSphereEnabled;
        console.log("disegnando la sfera");
      }
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

  private handleMeasurementPointerDown() {
    if (this._sceneRef) {
      const pickResult = this._sceneRef.pick(
        this._sceneRef.pointerX,
        this._sceneRef.pointerY
      );
      if (pickResult && pickResult.hit) {
        if (!this._firstPoint) {
          this._firstPoint = pickResult.pickedPoint;
          console.log("First point set:", this._firstPoint);
        } else {
          this._secondPoint = pickResult.pickedPoint;
          console.log("Second point set:", this._secondPoint);
          this.calculateDistance();
          // Reset points after calculation
          this._firstPoint = null;
          this._secondPoint = null;
        }
      }
    }
  }

  private handleMeasuremetPointerMove(): void {
    if (this._firstPoint && !this._secondPoint && this._sceneRef) {
      const pickResult = this._sceneRef.pick(
        this._sceneRef.pointerX,
        this._sceneRef.pointerY
      );

      if (this._lineMesh) {
        this._sceneRef.removeMesh(this._lineMesh);
      }

      this._lineMesh = MeshBuilder.CreateLines(
        "linea_misura",
        {
          points: [this._firstPoint, pickResult.pickedPoint!],
        },
        this._sceneRef
      );
    }
  }

  private calculateDistance() {
    if (this._firstPoint && this._secondPoint) {
      const distance = Vector3.Distance(this._firstPoint, this._secondPoint);
      console.log(`Distance between points: ${distance}`);
      eventEmitter.emit("distanceCalculated", distance);
    }
  }

  private Cleanup() {
     this._firstPoint= null;
     this._secondPoint = null;
     this._lineMesh= null;
     this._isMeasuringEnabled= false;
     this._drawSphereEnabled= false;
     this._sphereRadius= null;

  }
}
