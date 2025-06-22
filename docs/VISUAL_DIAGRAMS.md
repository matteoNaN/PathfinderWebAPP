# 🎨 Diagrammi Visivi - Simulatore di Combattimento D&D

## 📋 Indice Diagrammi

1. [Architettura Sistema](#architettura-sistema)
2. [Flusso Componenti](#flusso-componenti)
3. [Mappa Interazioni](#mappa-interazioni)
4. [Schema Database](#schema-database)
5. [Pipeline Rendering](#pipeline-rendering)
6. [Flusso Tutorial](#flusso-tutorial)

---

## 🏗️ Architettura Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    🎲 D&D Combat Simulator                     │
│                        React Application                        │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         📱 App.tsx                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │   Loading   │ │    Error    │ │  Tutorial   │ │    Main     ││
│  │   Screen    │ │   Handler   │ │   System    │ │   Content   ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            ▼                     ▼                     ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   🎨 Canvas     │    │  ⚔️ CombatUI    │    │  🛠️ RightMenu   │
│   (3D Scene)    │    │  (Management)   │    │   (Tools)       │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Babylon.js  │ │    │ │ Entity Mgmt │ │    │ │ Quick Tools │ │
│ │   Engine    │ │    │ │ Initiative  │ │    │ │ Measurement │ │
│ │   Scene     │ │    │ │ Spell Areas │ │    │ │ Tutorial    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
         ┌─────────────────────────────────────────────────┐
         │              📡 Event System                    │
         │            (EventEmitter Hub)                   │
         └─────────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  🎮 Combat      │    │  🎨 Render      │    │  🎭 Model       │
│   Service       │    │   Service       │    │   Loader        │
│                 │    │                 │    │                 │
│ • Entity Mgmt   │    │ • 3D Scene      │    │ • 3D Models     │
│ • Turn System   │    │ • Camera        │    │ • Animations    │
│ • Spell Areas   │    │ • Lighting      │    │ • Cache         │
│ • Combat State  │    │ • Grid System   │    │ • Fallbacks     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🔄 Flusso Componenti

```
┌─────────────────────────────────────────────────────────────────┐
│                    🔄 Component Flow Diagram                    │
└─────────────────────────────────────────────────────────────────┘

👤 User Action
    │
    ▼
┌─────────────────┐
│   React UI      │ ──┐
│   Component     │   │ Props/Events
└─────────────────┘   │
    │                 │
    │ Event/Call       │
    ▼                 │
┌─────────────────┐   │
│   Service       │   │
│   Layer         │   │ State Update
│                 │   │
│ • Business      │   │
│ • Logic         │   │
│ • 3D Ops        │   │
└─────────────────┘   │
    │                 │
    │ State Change    │
    ▼                 │
┌─────────────────┐   │
│   Event         │   │
│   Emitter       │ ──┘
│                 │
│ • Broadcast     │
│ • Notify        │
│ • Update        │
└─────────────────┘
    │
    │ Event
    ▼
┌─────────────────┐
│   All           │
│   Components    │
│                 │
│ • Re-render     │
│ • Update UI     │
│ • Sync State    │
└─────────────────┘

Example Flow - Add Entity:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ User clicks     │───▶│ CombatUI calls  │───▶│ CombatService   │
│ "Add Entity"    │    │ addEntity()     │    │ creates entity  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
┌─────────────────┐    ┌─────────────────┐           │
│ UI re-renders   │◀───│ Event received  │◀──────────┘
│ shows new entity│    │ 'entityAdded'   │
└─────────────────┘    └─────────────────┘
```

---

## 🎯 Mappa Interazioni

```
┌─────────────────────────────────────────────────────────────────┐
│                   🎯 User Interaction Map                       │
└─────────────────────────────────────────────────────────────────┘

🖱️ MOUSE INTERACTIONS
├── Left Click
│   ├── Entity Selection ────┐
│   ├── UI Button Press      │
│   ├── Measurement Point    │
│   └── Spell Area Place     │
├── Right Click              │
│   ├── Context Menu ────────┼─── 📍 3D SCENE
│   └── Spell Area Resize    │   ├── Grid: 40x40 squares
├── Drag                     │   ├── Entities: 3D models
│   ├── Camera Rotation ─────┘   ├── Spell Areas: Colored shapes
│   └── Entity Movement          └── Measurements: Lines/Distance
├── Scroll
│   └── Camera Zoom

⌨️ KEYBOARD INTERACTIONS
├── WASD / Arrow Keys
│   └── Camera Movement
├── Q/E
│   └── Zoom In/Out
├── R
│   └── Reset Camera
├── M
│   └── Toggle Measurement
├── ESC
│   └── Exit Current Mode
└── Space
    └── Pause/Resume

🔘 UI INTERACTIONS                    📱 COMPONENT AREAS
├── Combat Panel                     ┌─────────────────┐
│   ├── Start/End Combat             │   ⚔️ Combat     │
│   ├── Add Entity                   │     Panel       │
│   ├── Initiative Order             │                 │
│   └── Turn Management              │ • Entity List   │
├── Entity Management                │ • Initiative    │
│   ├── Create New                   │ • Actions       │
│   ├── Edit Stats                   │ • HP Tracking   │
│   └── Remove Entity                └─────────────────┘
├── Spell Areas                      ┌─────────────────┐
│   ├── Create Circle                │  🔮 Spell       │
│   ├── Create Cone                  │    Areas        │
│   ├── Create Square                │                 │
│   └── Clear All                    │ • Shape Tools   │
├── Tools Menu                       │ • Positioning   │
│   ├── Dice Roller                  │ • Visualization │
│   ├── Measurement                  └─────────────────┘
│   ├── Camera Reset                 ┌─────────────────┐
│   └── Tutorial                     │  🛠️ Tools       │
└── Tutorial                         │     Menu        │
    ├── Step Navigation              │                 │
    ├── Skip/Complete                │ • Dice Roller   │
    └── Settings                     │ • Utilities     │
                                     │ • Tutorial      │
                                     └─────────────────┘

🔄 INTERACTION FLOW EXAMPLES

Scenario: Move Entity
👤 User ────┐
            ▼
🖱️ Drag Entity ────┐
                   ▼
🎨 3D Scene Update ────┐
                       ▼
📊 Position Calculate ────┐
                          ▼
🎯 Snap to Grid ────┐
                    ▼
💾 Save New Position ────┐
                         ▼
📡 Emit 'entityMoved' ────┐
                          ▼
🔄 Update All UI Components

Scenario: Cast Spell
👤 Select Caster ────┐
                     ▼
🔮 Choose Spell Area ────┐
                         ▼
🎯 Position Area ────┐
                     ▼
👥 Identify Targets ────┐
                        ▼
🎲 Roll Effects ────┐
                    ▼
❤️ Apply Damage/Effects ────┐
                            ▼
📊 Update Entity States ────┐
                            ▼
🔄 Refresh UI
```

---

## 🗃️ Schema Stato Applicazione

```
┌─────────────────────────────────────────────────────────────────┐
│                    🗃️ Application State Schema                  │
└─────────────────────────────────────────────────────────────────┘

💾 GLOBAL STATE STRUCTURE

App State
├── 🔄 Loading State
│   ├── isLoading: boolean
│   ├── loadingMessage: string
│   └── error: string | null
├── 📚 Tutorial State
│   ├── showTutorial: boolean
│   ├── tutorialStep: number
│   └── tutorialComplete: boolean
└── ⚔️ Combat State
    ├── isActive: boolean
    ├── round: number
    ├── currentTurnIndex: number
    ├── entities: Map<id, Entity>
    ├── turnOrder: TurnOrder[]
    └── spellAreas: Map<id, SpellArea>

📊 ENTITY DATA MODEL

CombatEntity {
  ├── 🆔 Core Identity
  │   ├── id: string (UUID)
  │   ├── name: string
  │   ├── type: 'player'|'enemy'|'npc'
  │   └── size: 'tiny'|'small'|'medium'|'large'|'huge'|'gargantuan'
  │
  ├── 📍 Position Data
  │   ├── position: {x, z, gridX, gridZ}
  │   ├── rotation: number
  │   └── elevation: number
  │
  ├── 📊 D&D Statistics
  │   ├── stats: {
  │   │   ├── maxHP: number
  │   │   ├── currentHP: number
  │   │   ├── armorClass: number
  │   │   ├── initiative: number
  │   │   ├── speed: number (feet)
  │   │   └── temporaryHP: number
  │   |}
  │
  ├── 🎭 3D Representation
  │   ├── mesh?: AbstractMesh
  │   ├── modelPath?: string
  │   ├── animations: string[]
  │   └── currentAnimation?: string
  │
  ├── 🔄 Combat Status
  │   ├── hasActed: boolean
  │   ├── hasMoved: boolean
  │   ├── movementRemaining: number
  │   └── actionsRemaining: number
  │
  └── 🎯 Status Effects
      ├── conditions: StatusEffect[]
      ├── spellEffects: SpellEffect[]
      └── temporaryModifiers: Modifier[]
}

🔮 SPELL AREA MODEL

SpellArea {
  ├── 🆔 Identity
  │   ├── id: string
  │   ├── name: string
  │   └── casterEntityId?: string
  │
  ├── 📐 Geometry
  │   ├── type: 'circle'|'cone'|'square'|'line'
  │   ├── origin: Vector3
  │   ├── radius?: number
  │   ├── angle?: number (for cones)
  │   ├── width?: number
  │   ├── length?: number
  │   └── rotation: number
  │
  ├── 🎨 Visual Properties
  │   ├── color: string
  │   ├── opacity: number
  │   ├── material: Material
  │   └── mesh: AbstractMesh
  │
  └── 🎲 Game Properties
      ├── spellName?: string
      ├── damageType?: string
      ├── savingThrow?: string
      ├── duration?: number
      └── concentration?: boolean
}

💾 PERSISTENCE SCHEMA

localStorage Keys:
├── 'dnd-combat-tutorial-disabled': boolean
├── 'dnd-combat-tutorial-seen': boolean
├── 'dnd-combat-last-session': CombatState
├── 'dnd-combat-preferences': UserPreferences
└── 'dnd-combat-custom-entities': CustomEntity[]

🔄 STATE SYNCHRONIZATION

State Flow:
User Action ──▶ Component ──▶ Service ──▶ State Update
    ▲                                        │
    │                                        ▼
UI Update ◀── Event Listener ◀── Event Emission

Components that listen to state:
├── CombatUI → Combat state changes
├── Canvas → Entity position changes
├── Distance → Measurement updates
├── RightMenu → General app state
└── Tutorial → Tutorial state changes
```

---

## 🎨 Pipeline Rendering 3D

```
┌─────────────────────────────────────────────────────────────────┐
│                  🎨 3D Rendering Pipeline                       │
└─────────────────────────────────────────────────────────────────┘

🚀 INITIALIZATION PIPELINE

App Start
    │
    ▼
┌─────────────────┐
│  Create Engine  │ ──▶ new Engine(canvas)
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  Create Scene   │ ──▶ new Scene(engine)
└─────────────────┘
    │
    ▼
┌─────────────────┐     🎥 Camera Setup
│ Setup Camera    │ ──▶ ArcRotateCamera
└─────────────────┘     ├── Tactical angle
    │                   ├── Zoom limits
    ▼                   └── WASD controls
┌─────────────────┐     
│ Setup Lighting  │ ──▶ 💡 Lighting System
└─────────────────┘     ├── HemisphericLight (ambient)
    │                   ├── DirectionalLight (sun)
    ▼                   └── SpotLight (fill)
┌─────────────────┐     
│ Create Terrain  │ ──▶ 🗺️ Ground & Grid
└─────────────────┘     ├── 40x40 plane
    │                   ├── Grid lines
    ▼                   └── Center marker
┌─────────────────┐     
│ Setup Shadows   │ ──▶ 🌑 Shadow System
└─────────────────┘     ├── ShadowGenerator
    │                   ├── 2048px maps
    ▼                   └── Exponential shadows
┌─────────────────┐     
│ Start Render    │ ──▶ 🔄 Render Loop
└─────────────────┘     └── scene.render()

🎭 ENTITY RENDERING PIPELINE

Add Entity Request
    │
    ▼
┌─────────────────┐
│ Check Model     │ ──▶ ModelLoaderService
│ Cache           │     ├── Cache hit? Use instance
└─────────────────┘     └── Cache miss? Load model
    │
    ▼
┌─────────────────┐     📦 Model Loading
│ Load 3D Model   │ ──▶ ├── GLB/GLTF preferred
└─────────────────┘     ├── Progress tracking
    │                   └── Fallback shapes
    ▼
┌─────────────────┐     
│ Create Instance │ ──▶ 🎭 Model Processing
└─────────────────┘     ├── Size scaling
    │                   ├── Position setting
    ▼                   └── Ground alignment
┌─────────────────┐     
│ Apply Materials │ ──▶ 🎨 Visual Setup
└─────────────────┘     ├── Team colors
    │                   ├── Shadow casting
    ▼                   └── Lighting response
┌─────────────────┐     
│ Add to Scene    │ ──▶ 👁️ Scene Integration
└─────────────────┘     ├── Render queue
    │                   ├── Culling setup
    ▼                   └── Performance opts
┌─────────────────┐     
│ Setup           │ ──▶ 🎮 Interaction Setup
│ Interactions    │     ├── Picking enabled
└─────────────────┘     ├── Drag behavior
                        └── Selection highlight

🔮 SPELL AREA RENDERING

Create Spell Area
    │
    ▼
┌─────────────────┐     📐 Geometry Creation
│ Generate Mesh   │ ──▶ ├── Circle: CreateDisc
└─────────────────┘     ├── Cone: CreateCylinder
    │                   ├── Square: CreateBox
    ▼                   └── Line: CreateTube
┌─────────────────┐     
│ Apply Material  │ ──▶ 🎨 Visual Properties
└─────────────────┘     ├── Semi-transparent
    │                   ├── Color-coded
    ▼                   └── Emissive glow
┌─────────────────┐     
│ Position Area   │ ──▶ 📍 Placement
└─────────────────┘     ├── Grid snapping
    │                   ├── Height offset
    ▼                   └── Rotation
┌─────────────────┐     
│ Enable Controls │ ──▶ 🎛️ Interaction
└─────────────────┘     ├── Drag to move
                        ├── Right-click resize
                        └── Delete option

⚡ PERFORMANCE OPTIMIZATIONS

🎯 Rendering Optimizations:
├── Frustum Culling ──▶ Only render visible objects
├── LOD System ──▶ Distance-based detail
├── Instancing ──▶ Reuse geometry for same models  
├── Texture Atlas ──▶ Reduce draw calls
├── Material Sharing ──▶ Reuse materials
└── Batch Updates ──▶ Group state changes

💾 Memory Management:
├── Asset Disposal ──▶ Clean up unused resources
├── Texture Compression ──▶ Reduce VRAM usage
├── Model Caching ──▶ Avoid redundant loads
├── GC Optimization ──▶ Minimize allocations
└── Resource Pooling ──▶ Reuse objects

🔄 Update Cycle:
Game Loop (60 FPS)
├── Input Processing ──▶ Handle user input
├── State Updates ──▶ Update game state  
├── Animation Updates ──▶ Advance animations
├── Physics Step ──▶ Movement/collision
├── Render Frame ──▶ Draw scene
└── GC Check ──▶ Memory cleanup
```

---

## 📚 Flusso Tutorial

```
┌─────────────────────────────────────────────────────────────────┐
│                   📚 Tutorial Flow Diagram                      │
└─────────────────────────────────────────────────────────────────┘

🚀 TUTORIAL ACTIVATION FLOW

App Launch
    │
    ▼
┌─────────────────┐
│ Check Settings  │ ──▶ localStorage.getItem('tutorial-disabled')
└─────────────────┘
    │
    ▼
┌─────────────────┐     ❌ Disabled
│ Tutorial        │ ────┐
│ Disabled?       │     │
└─────────────────┘     │
    │ ✅ Enabled         │
    ▼                   │
┌─────────────────┐     │    ❌ Seen Before
│ First Time      │ ────┼──┐
│ User?           │     │  │
└─────────────────┘     │  │
    │ ✅ New User        │  │
    ▼                   │  │
┌─────────────────┐     │  │
│ Show Tutorial   │     │  │
│ After 1 Second  │     │  │
└─────────────────┘     │  │
    │                   │  │
    ▼                   │  │
🎉 Tutorial Starts      │  │
                        │  │
                        ▼  ▼
                    Skip Tutorial
                        │
                        ▼
                   Normal App Usage

📖 TUTORIAL STEP SEQUENCE

Step 1: Welcome & Overview
├── Target: body (fullscreen)
├── Content: Welcome message
├── Action: Set expectations
└── Duration: 10-15 seconds

Step 2: 3D Combat Grid
├── Target: canvas
├── Content: Grid explanation + controls
├── Action: Show camera controls
└── Highlight: WASD, mouse controls

Step 3: Combat Management
├── Target: .combat-ui
├── Content: Combat panel overview
├── Action: Explain entity management
└── Highlight: Add entities, initiative

Step 4: Add Entity
├── Target: .btn-primary (Add button)
├── Content: Entity creation form
├── Action: Show form fields
└── Highlight: Name, type, stats input

Step 5: Spell Areas
├── Target: .spell-controls
├── Content: Spell area tools
├── Action: Demonstrate area creation
└── Highlight: Circle, cone, square, line

Step 6: Tools Menu
├── Target: .floating-menu
├── Content: Utility tools
├── Action: Show dice, measurement
└── Highlight: Menu expansion

Step 7: Camera Info
├── Target: .camera-controls-info
├── Content: Camera controls summary
├── Action: Reinforce controls
└── Highlight: Persistent info bar

Step 8: Completion
├── Target: body (fullscreen)
├── Content: Tutorial complete + tips
├── Action: Set tutorial as seen
└── Duration: Final encouragement

🎛️ TUTORIAL CONTROLS

Navigation Controls:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    ⏮️ Back      │    │   ⏭️ Next      │    │   ⏯️ Skip      │
│                 │    │                 │    │                 │
│ • Previous step │    │ • Advance step  │    │ • Exit tutorial │
│ • Undo action   │    │ • Continue flow │    │ • Mark as seen  │
│ • Review info   │    │ • Progress bar  │    │ • Go to app     │
└─────────────────┘    └─────────────────┘    └─────────────────┘

Escape Sequences:
├── ESC Key ──▶ Exit tutorial immediately
├── Click Skip ──▶ Confirm skip dialog  
├── Click Outside ──▶ Pause tutorial
└── Browser Navigation ──▶ Cancel tutorial

🎨 TUTORIAL STYLING & UX

Visual Design:
├── 🎯 Spotlight Effect
│   ├── Semi-transparent overlay
│   ├── Bright highlight on target
│   └── Smooth transitions
├── 🎨 Custom Tooltip
│   ├── Italian localization
│   ├── Brand colors (blue gradient)
│   ├── Large, readable text
│   └── Progress indicators
├── 🔘 Interactive Elements
│   ├── Hover effects
│   ├── Click feedback
│   ├── Smooth animations
│   └── Accessibility support
└── 📱 Responsive Design
    ├── Mobile-friendly sizing
    ├── Touch-friendly buttons
    ├── Readable on small screens
    └── Adaptive positioning

Settings Integration:
┌─────────────────────────────────────────────────────────────────┐
│                    ⚙️ Tutorial Settings Panel                   │
├─────────────────────────────────────────────────────────────────┤
│ 🚀 Manual Start                                                │
│ ├── "Inizia Tutorial" button                                   │
│ ├── Available from tools menu                                  │
│ └── Restart anytime                                            │
│                                                                 │
│ 🔧 Auto-Start Control                                          │
│ ├── Enable/Disable toggle                                      │
│ ├── localStorage persistence                                   │
│ └── Clear "seen" status                                        │
│                                                                 │
│ ℹ️ Information Panel                                            │
│ ├── Tutorial content overview                                  │
│ ├── Feature list covered                                       │
│ └── Estimated completion time                                  │
└─────────────────────────────────────────────────────────────────┘

💾 PERSISTENCE LOGIC

Tutorial State Management:
```javascript
// Check if tutorial should show
const shouldShowTutorial = () => {
  const isDisabled = localStorage.getItem('tutorial-disabled') === 'true';
  const hasSeenBefore = localStorage.getItem('tutorial-seen') === 'true';
  
  return !isDisabled && !hasSeenBefore;
};

// Mark tutorial as completed
const completeTutorial = () => {
  localStorage.setItem('tutorial-seen', 'true');
  // Optional: analytics tracking
  // trackEvent('tutorial_completed');
};

// Reset tutorial (from settings)
const resetTutorial = () => {
  localStorage.setItem('tutorial-seen', 'false');
  localStorage.setItem('tutorial-disabled', 'false');
};
```

🔄 Tutorial Event Flow:
User Action ──▶ Joyride Callback ──▶ State Update ──▶ Progress Track
    ▲                                     │
    │                                     ▼
localStorage Update ◀── Completion Check ◀── Step Validation
```

---

## 🎯 Conclusione Diagrammi

Questi diagrammi visivi forniscono una rappresentazione completa di:

- 🏗️ **Architettura Sistema**: Come i componenti si integrano
- 🔄 **Flussi di Interazione**: Come l'utente interagisce con l'app
- 💾 **Gestione Stato**: Come i dati fluiscono nell'applicazione
- 🎨 **Pipeline 3D**: Come vengono renderizzati gli elementi visivi
- 📚 **Sistema Tutorial**: Come funziona l'onboarding utente

Ogni diagramma è progettato per essere:
- ✅ **Comprensibile**: Simboli chiari e layout logico
- 📊 **Informativo**: Dettagli tecnici sufficienti
- 🎯 **Pratico**: Utile per sviluppo e manutenzione
- 🔄 **Aggiornabile**: Facile da modificare con evoluzioni

---

*📊 Diagrammi generati per supportare la documentazione tecnica completa*