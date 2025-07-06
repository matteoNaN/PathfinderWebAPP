import { useState, useEffect } from 'react';
import MeasurementControls from '../Combat/MeasurementControls';
import TutorialSettings from '../Tutorial/TutorialSettings';
import MainRenderService from '../../Services/MainRenderService';
import DrawingService from '../../Services/DrawingService';
import eventEmitter from '../../Events/misurazioneEventEmitter';
import './RightMenu.css';
import '../Tutorial/TutorialSettings.css';

interface FloatingRightMenuProps {
  onStartTutorial: () => void;
}

function FloatingRightMenu({ onStartTutorial }: FloatingRightMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTutorialSettings, setShowTutorialSettings] = useState(false);
  const [showDrawingTools, setShowDrawingTools] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [drawingSettings, setDrawingSettings] = useState(DrawingService.getSettings());

  useEffect(() => {
    const updateDrawingSettings = () => {
      setDrawingSettings(DrawingService.getSettings());
    };

    eventEmitter.on('drawingToolChanged', updateDrawingSettings);
    eventEmitter.on('drawingColorChanged', updateDrawingSettings);
    eventEmitter.on('drawingThicknessChanged', updateDrawingSettings);
    eventEmitter.on('drawingOpacityChanged', updateDrawingSettings);
    eventEmitter.on('drawingLayerChanged', updateDrawingSettings);
    eventEmitter.on('drawingGridSnapChanged', updateDrawingSettings);

    return () => {
      eventEmitter.off('drawingToolChanged', updateDrawingSettings);
      eventEmitter.off('drawingColorChanged', updateDrawingSettings);
      eventEmitter.off('drawingThicknessChanged', updateDrawingSettings);
      eventEmitter.off('drawingOpacityChanged', updateDrawingSettings);
      eventEmitter.off('drawingLayerChanged', updateDrawingSettings);
      eventEmitter.off('drawingGridSnapChanged', updateDrawingSettings);
    };
  }, []);

  const toggleMenu = () => {
    setIsExpanded(!isExpanded);
  };

  const rollDice = (sides: number) => {
    const result = Math.floor(Math.random() * sides) + 1;
    alert(`🎲 d${sides}: ${result}`);
  };

  return (
    <>
      <div className={`floating-menu ${isExpanded ? 'expanded' : ''}`}>
        <button 
          className="menu-toggle"
          onClick={toggleMenu}
          title={isExpanded ? 'Chiudi Strumenti' : 'Apri Strumenti'}
        >
          {isExpanded ? '✕' : '🛠️'}
        </button>

        {isExpanded && (
          <div className="menu-content">
            <div className="menu-header">
              <h3>🎲 Strumenti GDR</h3>
            </div>
            
            <MeasurementControls />
            
            <div className="menu-section">
              <h4>🎮 Azioni Rapide</h4>
              <div className="quick-actions">
                <button 
                  className="action-btn" 
                  title="Tira d20"
                  onClick={() => rollDice(20)}
                >
                  🎲 d20
                </button>
                <button 
                  className="action-btn" 
                  title="Tira d6"
                  onClick={() => rollDice(6)}
                >
                  🎲 d6
                </button>
                <button 
                  className="action-btn" 
                  title="Tira d8"
                  onClick={() => rollDice(8)}
                >
                  🎲 d8
                </button>
                <button 
                  className="action-btn" 
                  title="Tira d10"
                  onClick={() => rollDice(10)}
                >
                  🎲 d10
                </button>
              </div>
            </div>

            <div className="menu-section">
              <h4>🎨 Strumenti Disegno</h4>
              <div className="utility-buttons">
                <button 
                  className={`utility-btn ${showDrawingTools ? 'active' : ''}`}
                  title="Strumenti di disegno per annotazioni DM"
                  onClick={() => {
                    const newState = !showDrawingTools;
                    console.log('Drawing button clicked. New state:', newState);
                    setShowDrawingTools(newState);
                    // Don't activate here, let the FloatingDrawingToolbar handle it
                  }}
                >
                  🖊️ Disegno
                </button>
                <button 
                  className="utility-btn" 
                  title="Cancella tutte le annotazioni"
                  onClick={() => {
                    if (confirm('Sei sicuro di voler cancellare tutte le annotazioni?')) {
                      DrawingService.clearAllAnnotations();
                      alert('🗑️ Tutte le annotazioni sono state cancellate!');
                    }
                  }}
                >
                  🗑️ Cancella
                </button>
              </div>
            </div>

            <div className="menu-section">
              <h4>🎯 Utilità</h4>
              <div className="utility-buttons">
                <button 
                  className="utility-btn" 
                  title="Controlli Telecamera"
                  onClick={() => {
                    MainRenderService.resetCameraPosition();
                    alert('📷 Telecamera resettata alla posizione predefinita!');
                  }}
                >
                  📷 Telecamera
                </button>
                <button 
                  className="utility-btn" 
                  title="Impostazioni Griglia"
                  onClick={() => {
                    alert('📐 Griglia: Ogni quadrato = 1.5 metri (5 piedi D&D)');
                  }}
                >
                  📐 Griglia
                </button>
                <button 
                  className="utility-btn" 
                  title="Illuminazione"
                  onClick={() => {
                    alert('💡 Sistema di illuminazione attivo:\n- Luce ambientale\n- Luce direzionale con ombre\n- Luce di riempimento');
                  }}
                >
                  💡 Luci
                </button>
                <button 
                  className={`utility-btn ${showAdvancedSettings ? 'active' : ''}`}
                  title="Impostazioni Avanzate"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                >
                  ⚙️ Impostazioni
                </button>
              </div>
            </div>

            <div className="menu-section">
              <h4>📚 Tutorial</h4>
              <div className="utility-buttons">
                <button 
                  className="utility-btn tutorial-btn" 
                  title="Avvia Tutorial"
                  onClick={() => {
                    onStartTutorial();
                    setIsExpanded(false);
                  }}
                >
                  🚀 Tutorial
                </button>
              </div>
            </div>

            <div className="menu-footer">
              <small>Premi M per misurare • Trascina le entità per muoverle</small>
            </div>
          </div>
        )}
        
        {/* Tutorial Settings Modal */}
        {showTutorialSettings && (
          <TutorialSettings 
            onStartTutorial={() => {
              setShowTutorialSettings(false);
              onStartTutorial();
            }}
            onClose={() => setShowTutorialSettings(false)}
          />
        )}
      </div>
      
      {/* Drawing Tools Toolbar - Compact floating toolbar */}
      {showDrawingTools && (
        <FloatingDrawingToolbar 
          onClose={() => {
            setShowDrawingTools(false);
            DrawingService.setDrawingModeActive(false);
          }}
          drawingSettings={drawingSettings}
        />
      )}
      
      {/* Advanced Settings Panel - Outside floating menu container */}
      {showAdvancedSettings && (
        <AdvancedSettingsPanel 
          onClose={() => setShowAdvancedSettings(false)}
          onStartTutorial={() => {
            setShowAdvancedSettings(false);
            onStartTutorial();
          }}
        />
      )}
    </>
  );
}

// Floating Drawing Toolbar Component - Compact and non-intrusive
const FloatingDrawingToolbar: React.FC<{
  onClose: () => void;
  drawingSettings: any;
}> = ({ onClose, drawingSettings }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Activate drawing mode when toolbar is mounted
  useEffect(() => {
    console.log('FloatingDrawingToolbar mounted - activating drawing mode');
    console.log('Current drawing settings:', drawingSettings);
    DrawingService.setDrawingModeActive(true);
    
    // Also ensure we have a valid tool selected
    if (!drawingSettings.currentTool) {
      console.log('No current tool, setting to pen');
      DrawingService.setTool('pen');
    }
    
    return () => {
      console.log('FloatingDrawingToolbar unmounted - deactivating drawing mode');
      DrawingService.setDrawingModeActive(false);
    };
  }, [drawingSettings]);

  const handleToolChange = (tool: string) => {
    DrawingService.setTool(tool as any);
  };

  const handleColorChange = (color: string) => {
    DrawingService.setColor(color);
  };

  const clearAll = () => {
    if (confirm('Cancellare tutte le annotazioni?')) {
      DrawingService.clearAllAnnotations();
      alert('🗑️ Annotazioni cancellate!');
    }
  };

  const tools = [
    { tool: 'pen', icon: '🖊️', name: 'Penna' },
    { tool: 'marker', icon: '📍', name: 'Pin' },
  ];

  return (
    <div className="floating-drawing-toolbar">
      <div className="toolbar-header">
        <div className="current-tool-display">
          <span className="tool-icon">
            {tools.find(t => t.tool === drawingSettings.currentTool)?.icon || '🖊️'}
          </span>
          <span className="tool-name">{drawingSettings.currentTool.toUpperCase()}</span>
        </div>
        <div className="toolbar-controls">
          <button 
            className="expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Chiudi opzioni' : 'Apri opzioni'}
          >
            {isExpanded ? '◀' : '▶'}
          </button>
          <button 
            className="close-btn"
            onClick={onClose}
            title="Chiudi strumenti disegno"
          >
            ✕
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="toolbar-content">
          <div className="quick-tools">
            {tools.map(({ tool, icon, name }) => (
              <button
                key={tool}
                className={`quick-tool ${drawingSettings.currentTool === tool ? 'active' : ''}`}
                onClick={() => handleToolChange(tool)}
                title={name}
              >
                {icon}
              </button>
            ))}
          </div>
          
          <div className="quick-settings">
            <div className="setting-item">
              <input
                type="color"
                value={drawingSettings.currentColor}
                onChange={(e) => handleColorChange(e.target.value)}
                title="Colore"
              />
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={drawingSettings.gridSnap}
                  onChange={() => DrawingService.toggleGridSnap()}
                />
                📐
              </label>
            </div>
            <button 
              className="clear-btn"
              onClick={clearAll}
              title="Cancella tutto"
            >
              🗑️
            </button>
          </div>

          <div className="drawing-hint">
            🖊️ Clicca e trascina sulla mappa per disegnare
            <br />
            📍 Usa PIN per inserire marcatori
            <br />
            <small style={{ color: '#f39c12' }}>⚠️ Camera bloccata durante il disegno</small>
          </div>
          
          {/* Debug button for development */}
          <div style={{ marginTop: '10px', padding: '10px', fontSize: '0.8rem' }}>
            <button 
              onClick={() => {
                const debugInfo = DrawingService.getDebugInfo();
                console.log('Drawing Service Debug Info:', debugInfo);
                alert(JSON.stringify(debugInfo, null, 2));
              }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '5px'
              }}
            >
              🐛 Debug Info
            </button>
            <button 
              onClick={() => {
                const result = DrawingService.testCreateMarker();
                console.log('Test marker result:', result);
                alert(`Test marker: ${result}`);
              }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🧪 Test Marker
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Advanced Settings Panel Component
const AdvancedSettingsPanel: React.FC<{
  onClose: () => void;
  onStartTutorial: () => void;
}> = ({ onClose, onStartTutorial }) => {
  const [settings, setSettings] = useState({
    showFPS: localStorage.getItem('dnd-show-fps') === 'true',
    enableShadows: localStorage.getItem('dnd-enable-shadows') !== 'false',
    highQuality: localStorage.getItem('dnd-high-quality') !== 'false',
    enableAudio: localStorage.getItem('dnd-enable-audio') !== 'false',
    showGridNumbers: localStorage.getItem('dnd-show-grid-numbers') === 'true',
    autoSave: localStorage.getItem('dnd-auto-save') !== 'false'
  });

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    localStorage.setItem(`dnd-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value.toString());
    
    // Apply settings immediately
    // Note: Some settings may require a page reload to take effect
    if (key === 'enableShadows' || key === 'highQuality' || key === 'showGridNumbers') {
      // These settings would need to be implemented in MainRenderService
      console.log(`Setting ${key} changed to ${value} - may require reload`);
    }
  };

  const resetAllSettings = () => {
    if (confirm('Ripristinare tutte le impostazioni ai valori predefiniti?')) {
      localStorage.removeItem('dnd-show-fps');
      localStorage.removeItem('dnd-enable-shadows');
      localStorage.removeItem('dnd-high-quality');
      localStorage.removeItem('dnd-enable-audio');
      localStorage.removeItem('dnd-show-grid-numbers');
      localStorage.removeItem('dnd-auto-save');
      localStorage.removeItem('dnd-combat-tutorial-disabled');
      localStorage.removeItem('dnd-combat-tutorial-seen');
      
      setSettings({
        showFPS: false,
        enableShadows: true,
        highQuality: true,
        enableAudio: true,
        showGridNumbers: false,
        autoSave: true
      });
      
      alert('⚙️ Impostazioni ripristinate! Ricarica la pagina per applicare tutte le modifiche.');
    }
  };

  return (
    <div className="advanced-settings-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div className="advanced-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚙️ Impostazioni Avanzate</h3>
          <button onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }} className="btn btn-tiny">✕</button>
        </div>
        
        <div className="modal-content">
          <div className="settings-section">
            <h4>🎮 Prestazioni & Grafica</h4>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.showFPS}
                  onChange={(e) => updateSetting('showFPS', e.target.checked)}
                />
                Mostra FPS
              </label>
              <p>Visualizza i frame per secondo nell'angolo dello schermo</p>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.enableShadows}
                  onChange={(e) => updateSetting('enableShadows', e.target.checked)}
                />
                Abilita Ombre
              </label>
              <p>Ombre realistiche per entità e oggetti (impatto prestazioni)</p>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.highQuality}
                  onChange={(e) => updateSetting('highQuality', e.target.checked)}
                />
                Alta Qualità
              </label>
              <p>Migliore qualità visiva (maggiore uso GPU)</p>
            </div>
          </div>

          <div className="settings-section">
            <h4>🔊 Audio & Interfaccia</h4>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.enableAudio}
                  onChange={(e) => updateSetting('enableAudio', e.target.checked)}
                />
                Effetti Audio
              </label>
              <p>Suoni per azioni e notifiche</p>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.showGridNumbers}
                  onChange={(e) => updateSetting('showGridNumbers', e.target.checked)}
                />
                Numeri Griglia
              </label>
              <p>Mostra coordinate numeriche sulla griglia</p>
            </div>
          </div>

          <div className="settings-section">
            <h4>💾 Salvataggio</h4>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => updateSetting('autoSave', e.target.checked)}
                />
                Salvataggio Automatico
              </label>
              <p>Salva automaticamente lo stato ogni 5 minuti</p>
            </div>
          </div>

          <div className="settings-section">
            <h4>📚 Tutorial & Aiuto</h4>
            <div className="setting-buttons">
              <button className="btn btn-primary" onClick={onStartTutorial}>
                🚀 Avvia Tutorial
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  localStorage.removeItem('dnd-combat-tutorial-disabled');
                  localStorage.removeItem('dnd-combat-tutorial-seen');
                  alert('✅ Tutorial reset! Apparirà al prossimo caricamento.');
                }}
              >
                🔄 Reset Tutorial
              </button>
            </div>
          </div>

          <div className="settings-section">
            <h4>⚠️ Zona Pericolosa</h4>
            <div className="danger-buttons">
              <button 
                className="btn btn-warning"
                onClick={resetAllSettings}
              >
                🔄 Ripristina Impostazioni
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => {
                  if (confirm('Eliminare TUTTI i dati salvati? Questa azione è irreversibile!')) {
                    localStorage.clear();
                    alert('🗑️ Tutti i dati eliminati! Ricarica la pagina.');
                  }
                }}
              >
                🗑️ Elimina Tutti i Dati
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingRightMenu;