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
          title={isExpanded ? 'Close Tools' : 'Open Tools'}
        >
          {isExpanded ? '✕' : '🛠️'}
        </button>

        {isExpanded && (
          <div className="menu-content">
            <div className="menu-header">
              <h3>🎲 RPG Tools</h3>
            </div>
            
            <MeasurementControls />
            
            <div className="menu-section">
              <h4>🎮 Quick Actions</h4>
              <div className="quick-actions">
                <button 
                  className="action-btn" 
                  title="Roll d20"
                  onClick={() => rollDice(20)}
                >
                  🎲 d20
                </button>
                <button 
                  className="action-btn" 
                  title="Roll d6"
                  onClick={() => rollDice(6)}
                >
                  🎲 d6
                </button>
                <button 
                  className="action-btn" 
                  title="Roll d8"
                  onClick={() => rollDice(8)}
                >
                  🎲 d8
                </button>
                <button 
                  className="action-btn" 
                  title="Roll d10"
                  onClick={() => rollDice(10)}
                >
                  🎲 d10
                </button>
              </div>
            </div>

            <div className="menu-section">
              <h4>🎨 Drawing Tools</h4>
              <div className="utility-buttons">
                <button 
                  className={`utility-btn ${showDrawingTools ? 'active' : ''}`}
                  title="Drawing tools for DM annotations"
                  onClick={() => {
                    const newState = !showDrawingTools;
                    console.log('Drawing button clicked. New state:', newState);
                    setShowDrawingTools(newState);
                    // Don't activate here, let the FloatingDrawingToolbar handle it
                  }}
                >
                  🖊️ Drawing
                </button>
                <button 
                  className="utility-btn" 
                  title="Clear all annotations"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all annotations?')) {
                      DrawingService.clearAllAnnotations();
                      alert('🗑️ All annotations have been cleared!');
                    }
                  }}
                >
                  🗑️ Clear
                </button>
              </div>
            </div>

            <div className="menu-section">
              <h4>🎯 Utilities</h4>
              <div className="utility-buttons">
                <button 
                  className="utility-btn" 
                  title="Camera Controls"
                  onClick={() => {
                    MainRenderService.resetCameraPosition();
                    alert('📷 Camera reset to default position!');
                  }}
                >
                  📷 Camera
                </button>
                <button 
                  className="utility-btn" 
                  title="Grid Settings"
                  onClick={() => {
                    alert('📐 Grid: Each square = 1.5 meters (5 feet D&D)');
                  }}
                >
                  📐 Grid
                </button>
                <button 
                  className="utility-btn" 
                  title="Lighting"
                  onClick={() => {
                    alert('💡 Active lighting system:\n- Ambient light\n- Directional light with shadows\n- Fill light');
                  }}
                >
                  💡 Lights
                </button>
                <button 
                  className={`utility-btn ${showAdvancedSettings ? 'active' : ''}`}
                  title="Advanced Settings"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                >
                  ⚙️ Settings
                </button>
              </div>
            </div>

            <div className="menu-section">
              <h4>📚 Tutorial</h4>
              <div className="utility-buttons">
                <button 
                  className="utility-btn tutorial-btn" 
                  title="Start Tutorial"
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
              <small>Press M to measure • Drag entities to move them</small>
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
    if (confirm('Clear all annotations?')) {
      DrawingService.clearAllAnnotations();
      alert('🗑️ Annotations cleared!');
    }
  };

  const tools = [
    { tool: 'pen', icon: '🖊️', name: 'Pen' },
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
            title={isExpanded ? 'Close options' : 'Open options'}
          >
            {isExpanded ? '◀' : '▶'}
          </button>
          <button 
            className="close-btn"
            onClick={onClose}
            title="Close drawing tools"
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
                title="Color"
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
              title="Clear all"
            >
              🗑️
            </button>
          </div>

          <div className="drawing-hint">
            🖊️ Click and drag on the map to draw
            <br />
            📍 Use PIN to place markers
            <br />
            <small style={{ color: '#f39c12' }}>⚠️ Camera locked during drawing</small>
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
    if (confirm('Reset all settings to default values?')) {
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
      
      alert('⚙️ Settings reset! Reload the page to apply all changes.');
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
          <h3>⚙️ Advanced Settings</h3>
          <button onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }} className="btn btn-tiny">✕</button>
        </div>
        
        <div className="modal-content">
          <div className="settings-section">
            <h4>🎮 Performance & Graphics</h4>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.showFPS}
                  onChange={(e) => updateSetting('showFPS', e.target.checked)}
                />
                Show FPS
              </label>
              <p>Display frames per second in the screen corner</p>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.enableShadows}
                  onChange={(e) => updateSetting('enableShadows', e.target.checked)}
                />
                Enable Shadows
              </label>
              <p>Realistic shadows for entities and objects (performance impact)</p>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.highQuality}
                  onChange={(e) => updateSetting('highQuality', e.target.checked)}
                />
                High Quality
              </label>
              <p>Better visual quality (higher GPU usage)</p>
            </div>
          </div>

          <div className="settings-section">
            <h4>🔊 Audio & Interface</h4>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.enableAudio}
                  onChange={(e) => updateSetting('enableAudio', e.target.checked)}
                />
                Audio Effects
              </label>
              <p>Sounds for actions and notifications</p>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.showGridNumbers}
                  onChange={(e) => updateSetting('showGridNumbers', e.target.checked)}
                />
                Grid Numbers
              </label>
              <p>Show numerical coordinates on the grid</p>
            </div>
          </div>

          <div className="settings-section">
            <h4>💾 Saving</h4>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => updateSetting('autoSave', e.target.checked)}
                />
                Auto Save
              </label>
              <p>Automatically save state every 5 minutes</p>
            </div>
          </div>

          <div className="settings-section">
            <h4>📚 Tutorial & Help</h4>
            <div className="setting-buttons">
              <button className="btn btn-primary" onClick={onStartTutorial}>
                🚀 Start Tutorial
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  localStorage.removeItem('dnd-combat-tutorial-disabled');
                  localStorage.removeItem('dnd-combat-tutorial-seen');
                  alert('✅ Tutorial reset! Will appear on next load.');
                }}
              >
                🔄 Reset Tutorial
              </button>
            </div>
          </div>

          <div className="settings-section">
            <h4>⚠️ Danger Zone</h4>
            <div className="danger-buttons">
              <button 
                className="btn btn-warning"
                onClick={resetAllSettings}
              >
                🔄 Reset Settings
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => {
                  if (confirm('Delete ALL saved data? This action is irreversible!')) {
                    localStorage.clear();
                    alert('🗑️ All data deleted! Reload the page.');
                  }
                }}
              >
                🗑️ Delete All Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingRightMenu;