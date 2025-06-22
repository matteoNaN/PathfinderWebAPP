# 🎲 Simulatore di Combattimento D&D - Guida Completa

## 📋 Indice

1. [Panoramica Generale](#panoramica-generale)
2. [Architettura dell'Applicazione](#architettura-dellapplicazione)
3. [Componenti Principali](#componenti-principali)
4. [Servizi di Backend](#servizi-di-backend)
5. [Flusso di Interazione](#flusso-di-interazione)
6. [Sistema di Eventi](#sistema-di-eventi)
7. [Gestione dello Stato](#gestione-dello-stato)
8. [Modelli 3D e Rendering](#modelli-3d-e-rendering)
9. [Tutorial System](#tutorial-system)
10. [Configurazione e Sviluppo](#configurazione-e-sviluppo)

---

## 🎯 Panoramica Generale

Il **Simulatore di Combattimento D&D** è un'applicazione web React/TypeScript che utilizza Babylon.js per creare un ambiente 3D immersivo per gestire combattimenti di Dungeons & Dragons.

### 🌟 Caratteristiche Principali

- **🗺️ Griglia di Combattimento 3D**: 40x40 quadrati (200x200 piedi)
- **⚔️ Gestione Combattimento**: Iniziativa, turni, HP, statistiche
- **🎭 Entità Multiple**: Giocatori, nemici, PNG con modelli 3D
- **🔮 Aree Incantesimo**: Cerchi, coni, quadrati, linee
- **📏 Strumenti di Misurazione**: Distanze precise per tattiche
- **🎲 Dadi Virtuali**: d20, d6, d8, d10 integrati
- **📚 Tutorial Interattivo**: Guida completa per nuovi utenti

---

## 🏗️ Architettura dell'Applicazione

```
📁 PathfinderWebApp/
├── 📁 src/
│   ├── 📁 Components/           # Componenti React UI
│   │   ├── 📁 Canvas/          # Wrapper per scena 3D
│   │   ├── 📁 Combat/          # UI gestione combattimento
│   │   ├── 📁 Distance/        # Display misurazione
│   │   ├── 📁 RightMenu/       # Menu strumenti fluttuante
│   │   └── 📁 Tutorial/        # Sistema tutorial
│   ├── 📁 Services/            # Logica business e 3D
│   │   ├── CombatService.ts    # Gestione combattimento
│   │   ├── ModelLoaderService.ts # Caricamento modelli 3D
│   │   ├── MainRenderService.ts # Rendering Babylon.js
│   │   ├── InputServices.ts    # Gestione input utente
│   │   └── MeasurementService.ts # Misurazione distanze
│   ├── 📁 Types/               # Definizioni TypeScript
│   ├── 📁 Events/              # Sistema eventi
│   └── 📁 Hooks/               # Custom React hooks
```

### 🔄 Flusso Architetturale

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │◄──►│   Services      │◄──►│   Babylon.js    │
│   Components    │    │   (Business)    │    │   3D Engine     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Event System  │    │   State Mgmt    │    │   Input Handler │
│   (EventEmitter)│    │   (Combat/UI)   │    │   (Mouse/Kbd)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🧩 Componenti Principali

### 📱 App.tsx - Componente Radice

```typescript
// Struttura principale dell'applicazione
App Component
├── Loading State (con spinner e messaggi)
├── Error State (gestione errori)
├── Main Application
│   ├── Canvas (Scena 3D)
│   ├── CombatUI (Gestione combattimento)
│   ├── FloatingRightMenu (Strumenti)
│   ├── Distance (Misurazione)
│   └── AppTutorial (Tutorial)
```

**Responsabilità:**
- Inizializzazione app
- Gestione stati di caricamento/errore
- Orchestrazione componenti principali
- Gestione tutorial automatico

### ⚔️ CombatUI - Gestione Combattimento

```
CombatUI Component
├── Combat Status Panel
│   ├── Header con titolo
│   ├── Pulsanti Start/End Combat
│   └── Informazioni round corrente
├── Initiative Tracker
│   ├── Lista ordine turni
│   ├── Controlli riordino (↑↓)
│   └── Modifica iniziativa
├── Entity Management
│   ├── Lista entità
│   ├── Form aggiunta entità
│   └── Controlli rimozione
├── Selected Entity Details
│   ├── Statistiche (HP, CA, Velocità)
│   ├── Condizioni stato
│   └── Informazioni taglia
├── Spell Area Controls
│   ├── Pulsanti creazione aree
│   ├── Controlli forma (cerchio, cono, etc.)
│   └── Cancellazione aree
└── Quick Tips & Help
```

**Caratteristiche:**
- Gestione completa ciclo combattimento
- Interfaccia drag-and-drop per entità
- Integrazione con sistema 3D
- Tracciamento HP e condizioni

### 🛠️ FloatingRightMenu - Menu Strumenti

```
FloatingRightMenu
├── Toggle Button (🛠️/✕)
├── Menu Content (quando espanso)
│   ├── D&D Tools Header
│   ├── Measurement Controls
│   ├── Quick Actions
│   │   ├── Dadi (d20, d6, d8, d10)
│   │   └── Risultati random
│   ├── Utilities
│   │   ├── Camera (reset posizione)
│   │   ├── Grid (info griglia)
│   │   ├── Lights (info illuminazione)
│   │   └── Settings (tutorial)
│   ├── Tutorial Section
│   │   └── Avvio tutorial manuale
│   └── Footer con suggerimenti
└── Tutorial Settings Modal
```

### 📏 Distance - Display Misurazione

```
Distance Component
├── Live Distance (durante misurazione)
├── Final Distance (risultato)
├── Conversion Info
│   ├── Piedi/Metri
│   ├── Quadrati griglia
│   └── Unità di gioco
└── Status Messages
```

### 📚 AppTutorial - Sistema Tutorial

```
Tutorial System
├── Step Definitions (8 passi)
├── Italian Localization
├── Progress Tracking
├── Skip/Complete Handlers
├── Custom Styling
└── Joyride Integration
```

---

## ⚙️ Servizi di Backend

### 🎮 CombatService - Nucleo Combattimento

```typescript
class CombatService {
  // Stato combattimento
  private _combatState: CombatState
  private _scene: Scene
  
  // Metodi principali
  + initialize(scene: Scene)
  + addEntity(entityData: EntityCreationData)
  + removeEntity(entityId: string)
  + startCombat()
  + endCombat()
  + nextTurn()
  + createSpellArea(config: SpellAreaConfig)
  
  // Gestione entità
  + updateEntityPosition(entityId: string, position: Vector3)
  + setEntityInitiative(entityId: string, initiative: number)
  + updateEntityHP(entityId: string, newHP: number)
}
```

**Responsabilità:**
- Gestione stato combattimento globale
- Creazione/rimozione entità 3D
- Calcolo iniziativa e turni
- Integrazione con rendering 3D

### 🎨 MainRenderService - Rendering 3D

```typescript
class MainRenderService {
  // Core Babylon.js
  private _engine: Engine
  private _scene: Scene
  private _camera: ArcRotateCamera
  private _shadowGenerator: ShadowGenerator
  
  // Setup scena
  + createScene(canvas: HTMLCanvasElement)
  + createCamera(canvas: HTMLCanvasElement)
  + createLight()
  + createTerrain()
  + createCombatGrid()
  
  // Controlli camera
  + setupCameraKeyboardControls()
  + resetCameraPosition()
  + getCameraControlsInfo()
}
```

**Caratteristiche:**
- Griglia combattimento professionale
- Illuminazione avanzata con ombre
- Controlli camera tattici
- Ottimizzazione performance

### 🎭 ModelLoaderService - Modelli 3D

```typescript
class ModelLoaderService {
  // Cache e storage
  private _loadedModels: Map<string, LoadedModel>
  private _modelCache: Map<string, AssetContainer>
  private _loadingEntities: Set<string>
  
  // Caricamento
  + loadModel(path: string, entityId: string, ...)
  + loadModelFromUrl(url: string, ...)
  
  // Gestione
  + getModelAnimations(entityId: string)
  + playAnimation(entityId: string, animName: string)
  + updateModelPosition(entityId: string, position: Vector3)
  
  // Monitoring
  + isModelLoading(entityId: string)
  + getLoadingProgress(entityId: string)
}
```

**Funzionalità Avanzate:**
- Caricamento asincrono con progress
- Cache intelligente modelli
- Fallback a forme base
- Gestione animazioni
- Scaling automatico per taglie D&D

---

## 🔄 Flusso di Interazione

### 🎯 Scenario Tipico: Avvio Combattimento

```
1. 👤 Utente apre applicazione
   ↓
2. 🔄 App.tsx carica e inizializza
   ↓
3. 📚 Tutorial automatico (se primo avvio)
   ↓
4. ➕ Utente aggiunge entità tramite CombatUI
   ↓
5. 🎨 CombatService crea mesh 3D
   ↓
6. 🎲 Utente clicca "Inizia Combattimento"
   ↓
7. 🎯 Sistema calcola iniziativa
   ↓
8. ⚔️ Inizia ciclo turni
   ↓
9. 🔄 Gestione azioni per turno
   ↓
10. 🏁 Fine combattimento
```

### 🖱️ Interazioni Utente Principali

```
Interazioni Mouse/Tastiera
├── 🖱️ Mouse
│   ├── Drag → Rotazione camera
│   ├── Scroll → Zoom in/out
│   ├── Click entità → Selezione
│   ├── Drag entità → Movimento
│   └── Right-click → Context menu
├── ⌨️ Tastiera
│   ├── WASD/Arrows → Movimento camera
│   ├── Q/E → Zoom
│   ├── R → Reset camera
│   ├── M → Modalità misurazione
│   └── ESC → Esci da modalità
└── 🔘 UI Controls
    ├── Pulsanti interfaccia
    ├── Form input
    ├── Slider e controlli
    └── Menu dropdown
```

---

## 📡 Sistema di Eventi

### 🎯 EventEmitter Central Hub

```typescript
// Eventi principali gestiti
Events {
  // Combattimento
  'combatStarted' → Inizio combattimento
  'combatEnded' → Fine combattimento
  'turnChanged' → Cambio turno
  'turnOrderChanged' → Riordino iniziativa
  
  // Entità
  'entityAdded' → Nuova entità
  'entityRemoved' → Rimozione entità
  'entitySelected' → Selezione entità
  'entityMoved' → Movimento entità
  
  // Misurazione
  'measurementModeChanged' → Toggle misurazione
  'liveDistanceUpdate' → Aggiornamento distanza live
  'distanceCalculated' → Calcolo finale distanza
  'measurementCreated' → Nuova misurazione
  
  // UI
  'spellAreaCreated' → Nuova area incantesimo
  'spellAreaRemoved' → Rimozione area
}
```

### 🔄 Flusso Eventi Tipico

```
User Action → Component → Service → Event → Update UI
     ↓            ↓         ↓        ↓        ↓
[Click Add] → [CombatUI] → [Combat] → [Event] → [Re-render]
             → [Form]     → [3D]     → [Emit]  → [Update]
```

---

## 🗃️ Gestione dello Stato

### 📊 CombatState - Stato Principale

```typescript
interface CombatState {
  isActive: boolean                    // Combattimento attivo
  round: number                       // Round corrente
  currentTurnIndex: number            // Indice turno attuale
  entities: Map<string, CombatEntity> // Mappa entità
  turnOrder: TurnOrder[]              // Ordine iniziativa
  spellAreas: Map<string, SpellArea>  // Aree incantesimo attive
}

interface CombatEntity {
  id: string                          // ID unico
  name: string                        // Nome visualizzato
  type: EntityType                    // player/enemy/npc
  size: CreatureSize                  // Taglia D&D
  position: EntityPosition            // Posizione griglia/mondo
  stats: EntityStats                  // HP, CA, Velocità, etc.
  conditions: StatusEffect[]          // Condizioni stato
  mesh?: AbstractMesh                 // Mesh 3D associato
  hasActed: boolean                   // Ha agito questo turno
  hasMoved: boolean                   // Si è mosso questo turno
}
```

### 🔄 Flusso Aggiornamenti Stato

```
State Change Flow:
User Input → Service Method → State Update → Event Emission → UI Re-render

Esempio - Aggiunta Entità:
1. User fills form in CombatUI
2. Form calls CombatService.addEntity()
3. CombatService updates _combatState
4. Service creates 3D mesh
5. Service emits 'entityAdded' event
6. CombatUI receives event and re-renders
7. Other components update accordingly
```

---

## 🎨 Modelli 3D e Rendering

### 🏗️ Architettura Rendering

```
Babylon.js Scene Hierarchy
├── 🎥 Camera (ArcRotateCamera)
│   ├── Position controls (WASD, mouse)
│   ├── Zoom limits (8-80 units)
│   └── Tactical angle optimization
├── 💡 Lighting System
│   ├── HemisphericLight (ambient)
│   ├── DirectionalLight (sun + shadows)
│   └── SpotLight (fill lighting)
├── 🗺️ Ground & Grid
│   ├── Terrain plane (40x40 units)
│   ├── Grid lines (5ft squares)
│   └── Center marker
├── 🎭 Entity Meshes
│   ├── Player models (blue tint)
│   ├── Enemy models (red tint)
│   ├── NPC models (green tint)
│   └── Fallback shapes
└── 🔮 Spell Areas
    ├── Transparent materials
    ├── Color-coded effects
    └── Interactive controls
```

### 🎯 Sistema Coordinate

```
Coordinate System:
- World Units: 1.5 = 5 feet D&D
- Grid: 40x40 = 200x200 feet battlefield
- Origin (0,0,0) = Center of battlefield
- Y-axis = Height (models on ground)
- X/Z plane = Movement area

Conversions:
Grid Position → World Position: gridPos * 1.5
World Position → Grid Position: worldPos / 1.5
Feet → Grid Squares: feet / 5
Grid Squares → Feet: squares * 5
```

### 🎭 Gestione Modelli

```
Model Loading Pipeline:
1. Request model for entity
2. Check cache for existing model
3. Load from file/URL if needed
4. Create instance from cached data
5. Apply size scaling (Tiny→Gargantuan)
6. Position on grid
7. Enable shadows and lighting
8. Store reference for animations
9. Add to scene and render

Supported Formats:
- GLB/GLTF (preferred)
- OBJ (basic support)
- Fallback to geometric shapes
```

---

## 📚 Tutorial System

### 🎯 Architettura Tutorial

```
Tutorial Flow:
├── 🚀 Auto-start (first launch)
├── 📝 8 Interactive Steps
│   ├── Welcome & Overview
│   ├── 3D Grid Navigation
│   ├── Combat Management
│   ├── Entity Creation
│   ├── Spell Areas
│   ├── Tools Menu
│   ├── Camera Controls
│   └── Completion
├── ⚙️ Settings Management
│   ├── Enable/Disable auto-start
│   ├── Manual restart option
│   └── LocalStorage persistence
└── 🎨 Styling & UX
    ├── Italian localization
    ├── Custom Joyride theme
    └── Progress indicators
```

### 💾 Persistenza Settings

```
LocalStorage Keys:
- 'dnd-combat-tutorial-disabled': 'true'/'false'
- 'dnd-combat-tutorial-seen': 'true'/'false'

Tutorial Logic:
if (!disabled && !seen) {
  showTutorial = true
}
```

---

## ⚡ Performance & Ottimizzazione

### 🚀 Strategie di Performance

```
Rendering Optimizations:
├── 🎭 Model Caching
│   ├── AssetContainer reuse
│   ├── Instance creation vs loading
│   └── Memory management
├── 🎨 Texture Optimization
│   ├── Texture atlas usage
│   ├── Compression formats
│   └── LOD (Level of Detail)
├── 🔄 Update Cycles
│   ├── Event-driven updates
│   ├── Batch state changes
│   └── Selective re-rendering
└── 💡 Lighting
    ├── Shadow map optimization
    ├── Light culling
    └── Material sharing
```

### 📊 Memory Management

```
Memory Strategy:
- Dispose unused meshes immediately
- Cache frequently used models
- Use object pooling for temporary objects
- Clean up event listeners on unmount
- Optimize texture sizes and formats
```

---

## 🔧 Configurazione e Sviluppo

### 📦 Stack Tecnologico

```
Frontend Stack:
├── ⚛️ React 19 (UI Framework)
├── 📘 TypeScript (Type Safety)
├── 🎨 Babylon.js (3D Engine)
├── ⚡ Vite (Build Tool)
├── 🎯 React Joyride (Tutorial)
└── 🎪 EventEmitter3 (Events)

Development Tools:
├── ESLint (Code Quality)
├── TypeScript Compiler
├── Vite Dev Server
└── Browser DevTools
```

### 🚀 Comandi Sviluppo

```bash
# Installazione dipendenze
npm install

# Sviluppo locale
npm run dev

# Build produzione
npm run build

# Preview build
npm run preview

# Linting
npm run lint
```

### 🔧 Configurazione Ambiente

```typescript
// Configurazioni principali
export const CONFIG = {
  GRID_SIZE: 40,           // 40x40 grid
  CELL_SIZE: 1.5,          // 5 feet per cell
  CAMERA_DISTANCE: 25,     // Default camera distance
  SHADOW_MAP_SIZE: 2048,   // Shadow quality
  MAX_ENTITIES: 20,        // Performance limit
  AUTOSAVE_INTERVAL: 30000 // 30 seconds
}
```

---

## 🎯 Casi d'Uso Principali

### 🏰 Scenario 1: Setup Combattimento

```
1. 👥 DM apre l'applicazione
2. ➕ Aggiunge 4 giocatori
3. ➕ Aggiunge 6 goblin nemici
4. 🎲 Clicca "Inizia Combattimento"
5. 🎯 Sistema calcola iniziativa automaticamente
6. 📊 Ordine turni visualizzato
7. ⚔️ Combattimento inizia
```

### 🔮 Scenario 2: Lancio Incantesimo

```
1. 🧙 Wizard selezionato (turno attivo)
2. 🔮 DM clicca "Cerchio" in Spell Areas
3. 🎯 Posiziona area 6x6 (Fireball)
4. 👥 Identifica nemici nell'area
5. 🎲 Tira danni
6. ❤️ Aggiorna HP entità colpite
7. 🗑️ Rimuove area dopo risoluzione
```

### 📏 Scenario 3: Misurazione Movimento

```
1. 🏃 Giocatore vuole muoversi
2. 📏 DM preme 'M' (misurazione)
3. 🎯 Clicca posizione attuale
4. 🎯 Clicca destinazione desiderata
5. 📊 Sistema mostra: "30 feet / 6 squares"
6. ✅ Conferma movimento entro velocità
7. 🚶 Trascina entità alla destinazione
```

---

## 🐛 Debugging e Troubleshooting

### 🔍 Problemi Comuni

```
Common Issues & Solutions:

🎭 Modelli non caricano
→ Check console for loading errors
→ Verify model file paths
→ Check network connectivity

📊 Performance lenta
→ Reduce shadow map size
→ Limit number of entities
→ Check browser performance

🎮 Controlli non responsivi
→ Verify event listeners attached
→ Check for JavaScript errors
→ Restart application

🔄 Stato non aggiorna
→ Check EventEmitter connections
→ Verify state update calls
→ Look for component re-render issues
```

### 🛠️ Tools Debug

```
Debug Commands (Browser Console):
- window.combatService // Access combat state
- window.renderService // Access 3D scene
- scene.debugLayer.show() // Babylon.js inspector
- eventEmitter.listenerCount() // Event debug
```

---

## 🎉 Conclusione

Questo documento fornisce una panoramica completa del **Simulatore di Combattimento D&D**. L'applicazione combina:

- 🎨 **Tecnologie Moderne** (React 19, Babylon.js, TypeScript)
- 🎯 **UX Ottimizzata** (Tutorial interattivo, interfaccia intuitiva)
- ⚔️ **Funzionalità Complete** (Gestione combattimento end-to-end)
- 🌍 **Localizzazione** (Completamente in italiano)
- 🚀 **Performance** (Ottimizzazioni per esperienza fluida)

L'architettura modulare e il sistema di eventi permettono facili estensioni e manutenzione, mentre il tutorial integrato garantisce un'eccellente esperienza utente per nuovi utilizzatori.

---

*📝 Documento generato automaticamente - Aggiornato alla versione corrente dell'applicazione*