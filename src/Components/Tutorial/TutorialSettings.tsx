import React from 'react';

interface TutorialSettingsProps {
  onStartTutorial: () => void;
  onClose: () => void;
}

const TutorialSettings: React.FC<TutorialSettingsProps> = ({ onStartTutorial, onClose }) => {
  const handleDisableTutorial = () => {
    localStorage.setItem('dnd-combat-tutorial-disabled', 'true');
    alert('✅ Tutorial disabilitato. Puoi riattivarlo dalle impostazioni.');
    onClose();
  };

  const handleEnableTutorial = () => {
    localStorage.setItem('dnd-combat-tutorial-disabled', 'false');
    alert('✅ Tutorial riabilitato. Verrà mostrato al prossimo avvio.');
    onClose();
  };

  const isTutorialDisabled = localStorage.getItem('dnd-combat-tutorial-disabled') === 'true';

  return (
    <div className="tutorial-settings-overlay">
      <div className="tutorial-settings-modal">
        <div className="tutorial-settings-header">
          <h3>📚 Impostazioni Tutorial</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <div className="tutorial-settings-content">
          <div className="tutorial-option">
            <h4>🎯 Avvia Tutorial</h4>
            <p>Ripeti il tutorial interattivo dell'applicazione</p>
            <button onClick={onStartTutorial} className="btn btn-primary">
              🚀 Inizia Tutorial
            </button>
          </div>

          <div className="tutorial-option">
            <h4>⚙️ Impostazioni Automatiche</h4>
            <p>Controlla se il tutorial deve apparire automaticamente</p>
            
            {isTutorialDisabled ? (
              <div>
                <p className="status-disabled">❌ Tutorial automatico disabilitato</p>
                <button onClick={handleEnableTutorial} className="btn btn-success">
                  ✅ Abilita Tutorial Automatico
                </button>
              </div>
            ) : (
              <div>
                <p className="status-enabled">✅ Tutorial automatico abilitato</p>
                <button onClick={handleDisableTutorial} className="btn btn-warning">
                  ❌ Disabilita Tutorial Automatico
                </button>
              </div>
            )}
          </div>

          <div className="tutorial-info">
            <h4>ℹ️ Informazioni</h4>
            <p>Il tutorial ti guida attraverso:</p>
            <ul>
              <li>🗺️ Controlli della griglia 3D</li>
              <li>⚔️ Gestione del combattimento</li>
              <li>➕ Aggiunta di entità</li>
              <li>🔮 Creazione aree incantesimo</li>
              <li>🛠️ Utilizzo degli strumenti</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialSettings;