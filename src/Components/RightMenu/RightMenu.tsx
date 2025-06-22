import { useState } from 'react';
import MeasurementControls from '../Combat/MeasurementControls';
import TutorialSettings from '../Tutorial/TutorialSettings';
import MainRenderService from '../../Services/MainRenderService';
import './RightMenu.css';
import '../Tutorial/TutorialSettings.css';

interface FloatingRightMenuProps {
  onStartTutorial: () => void;
}

function FloatingRightMenu({ onStartTutorial }: FloatingRightMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTutorialSettings, setShowTutorialSettings] = useState(false);

  const toggleMenu = () => {
    setIsExpanded(!isExpanded);
  };

  const rollDice = (sides: number) => {
    const result = Math.floor(Math.random() * sides) + 1;
    alert(`🎲 d${sides}: ${result}`);
  };

  return (
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
            <h3>🎲 Strumenti D&D</h3>
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
                className="utility-btn" 
                title="Impostazioni"
                onClick={() => {
                  setShowTutorialSettings(true);
                  setIsExpanded(false);
                }}
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
  );
}

export default FloatingRightMenu;