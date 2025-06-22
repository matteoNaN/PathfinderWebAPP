# ⚡ Guida Rapida Sviluppatore - D&D Combat Simulator

## 🚀 Setup Rapido

```bash
# Clone e setup
git clone <repository-url>
cd PathfinderWebApp
npm install --legacy-peer-deps

# Sviluppo
npm run dev          # http://localhost:5173
npm run build        # Build produzione
npm run preview      # Preview build locale
```

## 📁 Struttura File Essenziali

```
src/
├── App.tsx                          # 🏠 Entry point principale
├── Components/
│   ├── Canvas/Canvas.tsx            # 🎨 Wrapper 3D scene
│   ├── Combat/CombatUI.tsx          # ⚔️ UI gestione combattimento
│   ├── RightMenu/RightMenu.tsx      # 🛠️ Menu strumenti
│   ├── Distance/Distance.tsx        # 📏 Display misurazione
│   └── Tutorial/AppTutorial.tsx     # 📚 Sistema tutorial
├── Services/
│   ├── CombatService.ts             # 🎮 Logica combattimento
│   ├── MainRenderService.ts         # 🎨 Rendering Babylon.js
│   ├── ModelLoaderService.ts        # 🎭 Gestione modelli 3D
│   └── InputServices.ts             # 🖱️ Gestione input
├── Types/Combat.ts                  # 📝 TypeScript definitions
└── Events/misurazioneEventEmitter.ts # 📡 Sistema eventi
```

## 🎯 API Essenziali

### 🎮 CombatService

```typescript
import CombatService from './Services/CombatService';

// Setup iniziale
CombatService.initialize(scene: Scene)

// Gestione entità
CombatService.addEntity(entityData: EntityCreationData)
CombatService.removeEntity(entityId: string)
CombatService.updateEntityPosition(entityId: string, position: Vector3)

// Gestione combattimento
CombatService.startCombat()
CombatService.endCombat()
CombatService.nextTurn()

// Aree incantesimo
CombatService.createSpellArea(config: SpellAreaConfig)
CombatService.clearAllSpellAreas()

// Stato
const state = CombatService.getCombatState()
const currentEntity = CombatService.getCurrentEntity()
```

### 🎨 MainRenderService

```typescript
import MainRenderService from './Services/MainRenderService';

// Setup scena
await MainRenderService.createScene(canvas: HTMLCanvasElement)

// Controlli camera
MainRenderService.resetCameraPosition()
MainRenderService.getCameraControlsInfo()

// Integrazione ombre
MainRenderService.addShadowCaster(mesh: AbstractMesh)

// Accesso scene/camera
const scene = MainRenderService.getScene()
const camera = MainRenderService.getCamera()
```

### 🎭 ModelLoaderService

```typescript
import ModelLoaderService from './Services/ModelLoaderService';

// Caricamento modelli
const mesh = await ModelLoaderService.loadModel(
  modelPath: string,
  entityId: string,
  position?: Vector3,
  size?: CreatureSize,
  onProgress?: ProgressCallback
)

// Gestione modelli
ModelLoaderService.updateModelPosition(entityId: string, position: Vector3)
ModelLoaderService.playAnimation(entityId: string, animName: string)
ModelLoaderService.removeModel(entityId: string)

// Status check
const isLoading = ModelLoaderService.isModelLoading(entityId)
const isLoaded = ModelLoaderService.isModelLoaded(entityId)
const progress = ModelLoaderService.getLoadingProgress(entityId)
```

## 📡 Sistema Eventi

```typescript
import eventEmitter from './Events/misurazioneEventEmitter';

// Eventi combattimento
eventEmitter.on('combatStarted', () => { })
eventEmitter.on('combatEnded', () => { })
eventEmitter.on('turnChanged', () => { })

// Eventi entità
eventEmitter.on('entityAdded', (entity: CombatEntity) => { })
eventEmitter.on('entityRemoved', (entityId: string) => { })
eventEmitter.on('entitySelected', (entity: CombatEntity) => { })

// Eventi misurazione
eventEmitter.on('measurementModeChanged', (active: boolean) => { })
eventEmitter.on('liveDistanceUpdate', (distance: number) => { })
eventEmitter.on('distanceCalculated', (distance: number) => { })

// Cleanup importante!
useEffect(() => {
  const handler = (data) => { /* handle */ };
  eventEmitter.on('eventName', handler);
  
  return () => {
    eventEmitter.off('eventName', handler); // ⚠️ SEMPRE cleanup!
  };
}, []);
```

## 🎯 Types Principali

```typescript
// Entità combattimento
interface CombatEntity {
  id: string;
  name: string;
  type: 'player' | 'enemy' | 'npc';
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
  position: { x: number; z: number; gridX: number; gridZ: number };
  stats: {
    maxHP: number;
    currentHP: number;
    armorClass: number;
    initiative: number;
    speed: number;
  };
  conditions: string[];
  mesh?: AbstractMesh;
}

// Stato combattimento
interface CombatState {
  isActive: boolean;
  round: number;
  currentTurnIndex: number;
  entities: Map<string, CombatEntity>;
  turnOrder: TurnOrder[];
  spellAreas: Map<string, SpellArea>;
}

// Area incantesimo
interface SpellArea {
  id: string;
  type: 'circle' | 'cone' | 'square' | 'line';
  origin: Vector3;
  color: string;
  radius?: number;
  angle?: number;
  width?: number;
  length?: number;
}
```

## 🎨 Configurazioni 3D

```typescript
// Configurazioni griglia
const GRID_SIZE = 40;        // 40x40 quadrati
const CELL_SIZE = 1.5;       // 1.5 unità = 5 piedi D&D

// Conversioni coordinate
const gridToWorld = (gridPos: number) => gridPos * CELL_SIZE;
const worldToGrid = (worldPos: number) => Math.round(worldPos / CELL_SIZE);

// Configurazioni camera
const CAMERA_CONFIG = {
  alpha: -Math.PI / 2,       // Angolo laterale
  beta: Math.PI / 3,         // Angolo elevazione
  radius: 25,                // Distanza
  lowerRadiusLimit: 8,       // Zoom minimo
  upperRadiusLimit: 80,      // Zoom massimo
};

// Materiali team
const TEAM_COLORS = {
  player: new Color3(0.2, 0.6, 1.0),  // Blu
  enemy: new Color3(1.0, 0.3, 0.3),   // Rosso
  npc: new Color3(0.3, 1.0, 0.3),     // Verde
};
```

## 🛠️ Debugging Tips

```typescript
// Debug console access
window.combatService = CombatService;
window.renderService = MainRenderService;
window.modelLoader = ModelLoaderService;

// Babylon.js inspector
scene.debugLayer.show();

// Event monitoring
eventEmitter.eventNames(); // Lista eventi attivi
eventEmitter.listenerCount('eventName'); // Numero listener

// Performance monitoring
const stats = scene.getEngine().getFps();
const drawCalls = scene.getActiveMeshes().length;

// Memory debugging
scene.dispose(); // Cleanup completo scena
ModelLoaderService.dispose(); // Cleanup modelli
```

## ⚡ Performance Best Practices

```typescript
// ✅ Fare
const mesh = ModelLoaderService.loadModel(path, id); // Cache automatica
eventEmitter.off('event', handler); // Cleanup eventi
mesh.dispose(); // Cleanup mesh non utilizzati

// ❌ Non fare
new Mesh(...); // Crea mesh senza cache
eventEmitter.on('event', handler); // Senza cleanup
scene.render(); // Render manuali (usa render loop)

// 🎯 Ottimizzazioni
mesh.freezeWorldMatrix(); // Freeze oggetti statici
material.freeze(); // Freeze materiali costanti
engine.setHardwareScalingLevel(0.8); // Riduce risoluzione
```

## 🎮 Controlli Utente

```typescript
// Controlli tastiera
const KEYBOARD_CONTROLS = {
  'KeyW': 'Camera forward',
  'KeyS': 'Camera backward', 
  'KeyA': 'Camera left',
  'KeyD': 'Camera right',
  'KeyQ': 'Zoom in',
  'KeyE': 'Zoom out',
  'KeyR': 'Reset camera',
  'KeyM': 'Toggle measurement',
  'Escape': 'Exit current mode'
};

// Controlli mouse
const MOUSE_CONTROLS = {
  leftClick: 'Select entity/UI interaction',
  rightClick: 'Context menu/Resize spell area',
  drag: 'Rotate camera/Move entity',
  scroll: 'Zoom camera'
};
```

## 📚 Tutorial Integration

```typescript
// Check tutorial status
const shouldShowTutorial = !localStorage.getItem('tutorial-disabled') && 
                          !localStorage.getItem('tutorial-seen');

// Manual tutorial start
import AppTutorial from './Components/Tutorial/AppTutorial';

const [showTutorial, setShowTutorial] = useState(false);

// Tutorial component
<AppTutorial 
  runTutorial={showTutorial}
  onTutorialComplete={() => {
    setShowTutorial(false);
    localStorage.setItem('tutorial-seen', 'true');
  }}
/>

// Settings integration
import TutorialSettings from './Components/Tutorial/TutorialSettings';
```

## 🐛 Troubleshooting Comune

```typescript
// Modelli non caricano
// ✅ Check: File path exists, network connectivity, CORS policy

// Performance lenta  
// ✅ Check: Numero entità, shadow map size, hardware scaling

// Eventi non funzionano
// ✅ Check: Event listener cleanup, component lifecycle

// UI non aggiorna
// ✅ Check: State mutation, event emission, re-render triggers

// Camera non risponde
// ✅ Check: Canvas focus, event listeners, camera controls attached
```

## 📦 Build & Deploy

```bash
# Build ottimizzato
npm run build

# Controllo bundle size
npx vite-bundle-analyzer dist

# Test build locale
npm run preview

# Deploy checklist
# ✅ Assets path corretti
# ✅ Environment variables
# ✅ Model files accessibili
# ✅ CORS configurato per modelli esterni
```

---

*⚡ Questa guida copre l'80% dei casi d'uso comuni. Per dettagli completi, consulta COMPREHENSIVE_GUIDE.md*