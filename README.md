# 🎲 Simulatore di Combattimento D&D

Un simulatore di combattimento 3D interattivo per Dungeons & Dragons, costruito con React, TypeScript e Babylon.js.

![D&D Combat Simulator](https://img.shields.io/badge/React-19.1.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Babylon.js](https://img.shields.io/badge/Babylon.js-7.0-green) ![Tutorial](https://img.shields.io/badge/Tutorial-Interattivo-orange)

## ✨ Caratteristiche Principali

- 🗺️ **Griglia 3D Interattiva**: 40x40 quadrati (200x200 piedi D&D standard)
- ⚔️ **Gestione Combattimento Completa**: Iniziativa, turni, HP, statistiche
- 🎭 **Modelli 3D**: Supporto GLB/GLTF con fallback a forme geometriche
- 🔮 **Aree Incantesimo**: Cerchi, coni, quadrati, linee con visualizzazione 3D
- 📏 **Strumenti di Misurazione**: Distanze precise per movimento e gittata
- 🎲 **Dadi Integrati**: d20, d6, d8, d10 con risultati istantanei
- 📚 **Tutorial Interattivo**: Guida completa per nuovi utenti
- 🇮🇹 **Completamente in Italiano**: UI e tutorial localizzati

## 🚀 Quick Start

```bash
# Installazione
npm install --legacy-peer-deps

# Sviluppo locale
npm run dev

# Build produzione
npm run build
```

Apri [http://localhost:5173](http://localhost:5173) per vedere l'applicazione.

## 📚 Documentazione

### 📖 Guide Complete
- **[📋 Guida Completa](docs/COMPREHENSIVE_GUIDE.md)** - Documentazione tecnica completa
- **[🎨 Diagrammi Visivi](docs/VISUAL_DIAGRAMS.md)** - Architettura e flussi visualizzati  
- **[⚡ Guida Rapida](docs/QUICK_REFERENCE.md)** - Reference per sviluppatori

### 🎯 Sezioni Specifiche
- [Architettura dell'Applicazione](docs/COMPREHENSIVE_GUIDE.md#architettura-dellapplicazione)
- [Componenti Principali](docs/COMPREHENSIVE_GUIDE.md#componenti-principali)
- [Sistema di Eventi](docs/COMPREHENSIVE_GUIDE.md#sistema-di-eventi)
- [Gestione Modelli 3D](docs/COMPREHENSIVE_GUIDE.md#modelli-3d-e-rendering)
- [Tutorial System](docs/COMPREHENSIVE_GUIDE.md#tutorial-system)

## 🎮 Come Usare

### 🆕 Primo Avvio
1. **Tutorial Automatico**: Il sistema ti guiderà attraverso tutte le funzionalità
2. **Skip Opzionale**: Puoi saltare e ripetere il tutorial in qualsiasi momento

### ⚔️ Gestione Combattimento
1. **Aggiungi Entità**: Clicca ➕ per creare giocatori, nemici, PNG
2. **Inizia Combattimento**: Il sistema calcola automaticamente l'iniziativa
3. **Gestisci Turni**: Avanza turni e traccia HP/condizioni
4. **Aree Incantesimo**: Crea aree di effetto con forme personalizzate

### 🎯 Controlli Principali

#### ⌨️ Tastiera
- **WASD/Frecce**: Movimento camera
- **Q/E**: Zoom in/out
- **R**: Reset camera alla posizione tattica
- **M**: Attiva/disattiva misurazione distanze
- **ESC**: Esci dalla modalità corrente

#### 🖱️ Mouse
- **Click Sinistro**: Selezione entità/UI
- **Click Destro**: Menu contestuale/Ridimensiona aree
- **Trascina**: Ruota camera/Muovi entità
- **Scroll**: Zoom camera

## 🏗️ Architettura Tecnica

```
React App (TypeScript)
├── 🎨 Babylon.js (3D Engine)
├── ⚔️ Combat Management
├── 🎭 Model Loading System  
├── 📡 Event-Driven Architecture
├── 📚 Interactive Tutorial
└── 🇮🇹 Italian Localization
```

### 🔧 Stack Tecnologico
- **Frontend**: React 19, TypeScript, Vite
- **3D Engine**: Babylon.js Core + Loaders
- **Tutorial**: React Joyride
- **Events**: EventEmitter3
- **Styling**: CSS Custom + Gradients

## 🛠️ Sviluppo

### 📦 Comandi Disponibili
```bash
npm run dev      # Server sviluppo (http://localhost:5173)
npm run build    # Build produzione ottimizzato
npm run preview  # Preview build locale
npm run lint     # Controllo qualità codice
```

### 🔧 Configurazione Ambiente
- **Node.js**: >= 18.0.0
- **NPM**: >= 9.0.0
- **Browser**: Chrome/Firefox/Safari (WebGL 2.0 required)

## 📈 Performance

### ⚡ Ottimizzazioni Implementate
- **Model Caching**: Istanze condivise per performance
- **Shadow Optimization**: Shadow maps configurabili
- **Render Batching**: Raggruppamento draw calls
- **Memory Management**: Cleanup automatico risorse
- **Event Efficiency**: Sistema eventi ottimizzato

### 📊 Limiti Raccomandati
- **Entità Simultanee**: ~20 per performance ottimale
- **Aree Incantesimo**: ~10 contemporanee
- **Risoluzione Ombre**: 2048px (configurabile)

## 🐛 Troubleshooting

### ❓ Problemi Comuni

**Modelli 3D non caricano**
- ✅ Verifica percorsi file modelli
- ✅ Controlla connessione di rete
- ✅ Verifica CORS policy per risorse esterne

**Performance lenta**
- ✅ Riduci numero entità contemporanee
- ✅ Abbassa risoluzione shadow map
- ✅ Controlla specifiche hardware browser

**Tutorial non appare**
- ✅ Controlla localStorage: `tutorial-disabled`
- ✅ Reset da ⚙️ → Tutorial Settings
- ✅ Prova modalità incognito

### 🔍 Debug Tools
```javascript
// Console browser
window.combatService  // Accesso stato combattimento
window.renderService  // Accesso scena 3D
scene.debugLayer.show() // Inspector Babylon.js
```

---

### 🎮 Buon Gioco!

*Che i vostri tiri siano sempre naturali 20! 🎲*

---

*📝 README aggiornato alla versione corrente - Per documentazione tecnica completa vedi [COMPREHENSIVE_GUIDE.md](docs/COMPREHENSIVE_GUIDE.md)*
