import React, { useState, useEffect } from 'react';
import { Vector3 } from '@babylonjs/core';
import { CombatEntity, CombatState, EntityType, CreatureSize } from '../../Types/Combat';
import CombatService from '../../Services/CombatService';
import eventEmitter from '../../Events/misurazioneEventEmitter';
// import AdBanner from '../Ads/AdBanner';
import './CombatUI.css';

const CombatUI: React.FC = () => {
  const [combatState, setCombatState] = useState<CombatState>(CombatService.getCombatState());
  const [, setForceUpdate] = useState(0);
  const [selectedEntity, setSelectedEntity] = useState<CombatEntity | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<CombatEntity | null>(null);
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(true);
  const [spellAreaControls, setSpellAreaControls] = useState<any>(null);
  const [showSaveLoadMenu, setShowSaveLoadMenu] = useState(false);

  const handleCombatUpdate = () => {
    setCombatState(CombatService.getCombatState());
    setForceUpdate(prev => prev + 1); // Force re-render
  };

  // Handle initial mobile detection and window resize
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768;
      setIsCollapsed(isMobile);
    };
    
    checkMobile(); // Check on mount
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {

    const handleEntitySelected = (entity: CombatEntity) => {
      // If no entity is currently selected, select this one
      if (!selectedEntity) {
        setSelectedEntity(entity);
      } 
      // If this entity is already selected, deselect it
      else if (selectedEntity.id === entity.id) {
        setSelectedEntity(null);
        setSelectedTarget(null);
      }
      // If a different entity is selected, make this one the target
      else {
        setSelectedTarget(entity);
      }
    };

    const handleEntityRemoved = (entityId: string) => {
      // Clear selected entity if it was removed
      if (selectedEntity && selectedEntity.id === entityId) {
        setSelectedEntity(null);
      }
      // Clear target if it was removed
      if (selectedTarget && selectedTarget.id === entityId) {
        setSelectedTarget(null);
      }
      // Update combat state
      handleCombatUpdate();
    };

    const handleShowSpellAreaControls = (data: any) => {
      setSpellAreaControls(data);
    };

    eventEmitter.on('combatStarted', handleCombatUpdate);
    eventEmitter.on('combatEnded', handleCombatUpdate);
    eventEmitter.on('turnChanged', handleCombatUpdate);
    eventEmitter.on('turnOrderChanged', handleCombatUpdate);
    eventEmitter.on('entitySelected', handleEntitySelected);
    eventEmitter.on('entityAdded', handleCombatUpdate);
    eventEmitter.on('entityRemoved', handleEntityRemoved);
    eventEmitter.on('showSpellAreaControls', handleShowSpellAreaControls);

    return () => {
      eventEmitter.off('combatStarted', handleCombatUpdate);
      eventEmitter.off('combatEnded', handleCombatUpdate);
      eventEmitter.off('turnChanged', handleCombatUpdate);
      eventEmitter.off('turnOrderChanged', handleCombatUpdate);
      eventEmitter.off('entitySelected', handleEntitySelected);
      eventEmitter.off('entityAdded', handleCombatUpdate);
      eventEmitter.off('entityRemoved', handleEntityRemoved);
      eventEmitter.off('showSpellAreaControls', handleShowSpellAreaControls);
    };
  }, [selectedEntity, handleCombatUpdate]);

  const handleStartCombat = () => {
    CombatService.startCombat();
    // Force UI update after combat starts
    setTimeout(() => handleCombatUpdate(), 50);
  };

  const handleEndCombat = () => {
    CombatService.endCombat();
  };

  const handleNextTurn = () => {
    CombatService.nextTurn();
  };

  const handleClearSpellAreas = () => {
    CombatService.clearAllSpellAreas();
  };

  const adjustInitiative = (entityId: string, currentInitiative: number) => {
    const newInitiativeStr = prompt(`Modifica iniziativa (attuale: ${currentInitiative}):`, currentInitiative.toString());
    if (newInitiativeStr && !isNaN(Number(newInitiativeStr))) {
      const newInitiative = Number(newInitiativeStr);
      CombatService.setEntityInitiative(entityId, newInitiative);
    }
  };

  const moveInitiativeUp = (index: number) => {
    if (index > 0) {
      CombatService.swapInitiativeOrder(index, index - 1);
    }
  };

  const moveInitiativeDown = (index: number) => {
    if (index < combatState.turnOrder.length - 1) {
      CombatService.swapInitiativeOrder(index, index + 1);
    }
  };

  const currentEntity = CombatService.getCurrentEntity();

  const hasEntities = combatState.entities.size > 0;
  
  return (
    <>
      {/* Floating Action Button - Always visible when UI is collapsed */}
      {isCollapsed && (
        <button 
          className="combat-fab"
          onClick={() => setIsCollapsed(false)}
          aria-label="Open Combat UI"
          title="Open Combat Manager"
        >
          ⚔️
        </button>
      )}
      
      <div className={`combat-ui ${hasEntities ? 'has-entities' : 'no-entities'} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Mobile Toggle Button */}
        <button 
          className="mobile-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand menu" : "Collapse menu"}
        >
          {isCollapsed ? '☰' : '✕'}
        </button>
      
      <div className="combat-ui-content">
        {/* Combat Status Panel */}
        <div className="combat-status">
        <div className="combat-header">
          <h2>⚔️ Gestore Combattimento</h2>
          <div className="combat-controls">
            {!combatState.isActive ? (
              <button 
                onClick={handleStartCombat}
                className="btn btn-primary"
                disabled={combatState.entities.size === 0}
                title={combatState.entities.size === 0 ? "Aggiungi prima le entità" : "Tira l'iniziativa e inizia il combattimento"}
              >
                Inizia Combattimento
              </button>
            ) : (
              <>
                <button onClick={handleEndCombat} className="btn btn-danger">
                  Termina Combattimento
                </button>
                <div className="round-info">Round {combatState.round}</div>
              </>
            )}
            <button 
              onClick={() => setShowSaveLoadMenu(!showSaveLoadMenu)}
              className="btn btn-secondary"
              title="Salva/Carica partita"
            >
              💾 Partita
            </button>
          </div>
        </div>
      </div>

      {/* Initiative Tracker */}
      {combatState.isActive && (
        <div className="initiative-tracker">
          <h3>⚔️ Ordine di Iniziativa</h3>
          <div className="initiative-help">
            <small>Clicca i numeri per modificare • Usa ↑↓ per riordinare</small>
          </div>
          <div className="initiative-list">
            {combatState.turnOrder.map((turn, index) => {
              const entity = combatState.entities.get(turn.entityId);
              if (!entity) return null;
              
              return (
                <div 
                  key={turn.entityId}
                  className={`initiative-item ${index === combatState.currentTurnIndex ? 'current' : ''} ${entity.type}`}
                >
                  <div 
                    className="initiative-number clickable" 
                    onClick={() => adjustInitiative(turn.entityId, turn.initiative)}
                    title="Clicca per modificare l'iniziativa"
                  >
                    {turn.initiative}
                  </div>
                  <div className="entity-info">
                    <div className="entity-name">{entity.name}</div>
                    <div className="entity-type">{entity.type}</div>
                  </div>
                  <div className="entity-hp">
                    {entity.stats.currentHP} / {entity.stats.maxHP}
                  </div>
                  <div className="initiative-controls">
                    <button 
                      onClick={() => moveInitiativeUp(index)}
                      className="btn btn-tiny"
                      disabled={index === 0}
                      title="Sposta su"
                    >
                      ↑
                    </button>
                    <button 
                      onClick={() => moveInitiativeDown(index)}
                      className="btn btn-tiny"
                      disabled={index === combatState.turnOrder.length - 1}
                      title="Sposta giù"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Entity Management */}
      <div className="entity-management">
        <div className="section-header">
          <h3>Entità</h3>
          <button 
            onClick={() => setShowAddEntity(!showAddEntity)}
            className="btn btn-small btn-primary"
          >
            ➕ Aggiungi Entità
          </button>
        </div>

        {showAddEntity && (
          <AddEntityForm onClose={() => setShowAddEntity(false)} />
        )}

        <div className="entity-list">
          {Array.from(combatState.entities.values()).map(entity => (
            <EntityCard 
              key={entity.id} 
              entity={entity} 
              isSelected={entity.id === selectedEntity?.id}
            />
          ))}
        </div>
      </div>

      {/* Selected Entity Details */}
      {selectedEntity && (
        <div className="selected-entity">
          <h3>Selezionato: {selectedEntity.name}</h3>
          <div className="entity-details">
            <div className="stat-row">
              <span>PF:</span>
              <span>{selectedEntity.stats.currentHP} / {selectedEntity.stats.maxHP}</span>
            </div>
            <div className="stat-row">
              <span>CA:</span>
              <span>{selectedEntity.stats.armorClass}</span>
            </div>
            <div className="stat-row">
              <span>Velocità:</span>
              <span>{selectedEntity.stats.speed} mt</span>
            </div>
            <div className="stat-row">
              <span>Taglia:</span>
              <span>{selectedEntity.size}</span>
            </div>
            {selectedEntity.conditions.length > 0 && (
              <div className="conditions">
                <span>Condizioni:</span>
                <div className="condition-list">
                  {selectedEntity.conditions.map(condition => (
                    <span key={condition} className="condition-tag">{condition}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spell Area Controls */}
      <div className="spell-controls">
        <h3>🔮 Aree Incantesimo</h3>
        <div className="spell-buttons">
          <button 
            onClick={() => createSpellArea('circle')}
            className="btn btn-small btn-magic"
            title="Crea area circolare (trascina per muovere, click destro per controlli)"
          >
            ⭕ Cerchio
          </button>
          <button 
            onClick={() => createSpellArea('cone')}
            className="btn btn-small btn-magic"
            title="Crea area conica (click sinistro per ruotare, click destro per controlli)"
          >
            🔺 Cono
          </button>
          <button 
            onClick={() => createSpellArea('square')}
            className="btn btn-small btn-magic"
            title="Crea area quadrata (trascina per muovere, click destro per controlli)"
          >
            ⬜ Quadrato
          </button>
          <button 
            onClick={() => createSpellArea('line')}
            className="btn btn-small btn-magic"
            title="Crea area lineare (click sinistro per ruotare, click destro per controlli)"
          >
            📏 Linea
          </button>
          <button 
            onClick={handleClearSpellAreas}
            className="btn btn-small btn-warning"
          >
            🗑️ Cancella Tutto
          </button>
        </div>
      </div>

      {/* Quick Tips */}
      {!hasEntities && showQuickStart && (
        <div className="quick-start-tips">
          <div className="quick-start-header">
            <h3>🚀 Avvio Rapido</h3>
            <button 
              onClick={() => setShowQuickStart(false)} 
              className="btn btn-tiny btn-secondary"
              title="Nascondi pannello avvio rapido"
            >
              ✕
            </button>
          </div>
          <ol>
            <li>Clicca "➕ Aggiungi Entità" per creare personaggi</li>
            <li>Inserisci nome, tipo e iniziativa</li>
            <li>Clicca "Inizia Combattimento" per tirare l'iniziativa</li>
            <li>Usa le frecce ↑↓ per riordinare l'iniziativa</li>
            <li>Clicca "Termina Turno" per avanzare i turni</li>
          </ol>
          <p><strong>💡 Suggerimenti:</strong> Premi 'M' per misurare le distanze • Trascina le entità per spostarle</p>
        </div>
      )}
      
      {/* Show Quick Start Button if hidden */}
      {!hasEntities && !showQuickStart && (
        <div className="quick-start-toggle">
          <button 
            onClick={() => setShowQuickStart(true)} 
            className="btn btn-small btn-secondary"
          >
            📖 Mostra Guida Rapida
          </button>
        </div>
      )}

      {/* Simple Combat Info */}
      {combatState.isActive && currentEntity && (
        <div className="simple-combat-info">
          <h4>Turno Corrente</h4>
          <div className="current-entity-display">
            <span className="entity-name">{currentEntity.name}</span>
            <span className="entity-type">({currentEntity.type})</span>
          </div>
          <div className="turn-actions">
            <button onClick={handleNextTurn} className="btn btn-primary">
              Termina Turno
            </button>
          </div>
        </div>
      )}

      {/* Ads hidden for future integration */}
      {/* {hasEntities && (
        <div className="combat-ad-section">
          <AdBanner type="square" className="combat-square-ad" showLabel={false} />
        </div>
      )} */}

      </div>
    </div>
    
    {/* Spell Area Controls Modal */}
    {spellAreaControls && (
      <SpellAreaControlsModal
        controls={spellAreaControls}
        onClose={() => setSpellAreaControls(null)}
      />
    )}
    
    {/* Save/Load Menu */}
    {showSaveLoadMenu && (
      <SaveLoadMenu
        onClose={() => setShowSaveLoadMenu(false)}
        onSaved={() => {
          setShowSaveLoadMenu(false);
          handleCombatUpdate();
        }}
        onLoaded={() => {
          setShowSaveLoadMenu(false);
          handleCombatUpdate();
        }}
      />
    )}
    </>
  );

  function createSpellArea(type: 'circle' | 'cone' | 'square' | 'line') {
    // Default values for different spell types
    const defaults = {
      circle: { radius: 10, color: '#ff6b6b' },
      cone: { radius: 15, angle: 60, color: '#4ecdc4' },
      square: { width: 10, length: 10, color: '#45b7d1' },
      line: { width: 5, length: 30, color: '#96ceb4' }
    };

    const config = defaults[type];
    
    // Use Vector3 for proper positioning
    const origin = new Vector3(0, 0.01, 0);
    
    CombatService.createSpellArea({
      type,
      origin,
      ...config
    });
  }
};

// Entity Card Component
const EntityCard: React.FC<{ entity: CombatEntity; isSelected: boolean }> = ({ entity, isSelected }) => {
  const [showDebuffForm, setShowDebuffForm] = useState(false);
  const [newDebuff, setNewDebuff] = useState('');
  const [showEditTools, setShowEditTools] = useState(false);
  const [showFlyingControls, setShowFlyingControls] = useState(false);
  const [flyingHeight, setFlyingHeight] = useState(entity.flyingHeight || 10);
  const [, forceUpdate] = useState(0);

  const handleRemove = () => {
    CombatService.removeEntity(entity.id);
  };

  const handleAddDebuff = () => {
    if (newDebuff.trim()) {
      // Allow multiple of the same debuff type by adding a counter or unique identifier
      const debuffName = newDebuff.trim();
      const existingCount = entity.conditions.filter(condition => 
        condition.startsWith(debuffName)
      ).length;
      
      const finalDebuffName = existingCount > 0 ? 
        `${debuffName} (${existingCount + 1})` : 
        debuffName;
      
      const updatedConditions = [...entity.conditions, finalDebuffName];
      entity.conditions = updatedConditions;
      setNewDebuff('');
      setShowDebuffForm(false);
      
      // Force re-render
      forceUpdate(prev => prev + 1);
      eventEmitter.emit('entityUpdated', entity);
    }
  };

  const handleRemoveDebuff = (debuffToRemove: string) => {
    entity.conditions = entity.conditions.filter(condition => condition !== debuffToRemove);
    // Force re-render by updating the local state
    forceUpdate(prev => prev + 1);
    // Also emit event for other components that might be listening
    eventEmitter.emit('entityUpdated', entity);
  };

  const handleSetFlying = () => {
    CombatService.setEntityFlying(entity.id, flyingHeight);
    entity.isFlying = true;
    entity.flyingHeight = flyingHeight;
    setShowFlyingControls(false);
    forceUpdate(prev => prev + 1);
  };

  const handleLand = () => {
    CombatService.landEntity(entity.id);
    entity.isFlying = false;
    entity.flyingHeight = 0;
    forceUpdate(prev => prev + 1);
  };

  const handleEditHP = () => {
    const newHP = prompt(`Modifica PF (max: ${entity.stats.maxHP}):`, entity.stats.currentHP.toString());
    if (newHP && !isNaN(Number(newHP))) {
      const hp = Math.max(0, Math.min(entity.stats.maxHP, Number(newHP)));
      entity.stats.currentHP = hp;
      forceUpdate(prev => prev + 1);
      eventEmitter.emit('entityUpdated', entity);
    }
  };

  const handleEditAC = () => {
    const newAC = prompt(`Modifica CA:`, entity.stats.armorClass.toString());
    if (newAC && !isNaN(Number(newAC))) {
      entity.stats.armorClass = Math.max(1, Number(newAC));
      forceUpdate(prev => prev + 1);
      eventEmitter.emit('entityUpdated', entity);
    }
  };

  const handleEditSpeed = () => {
    const newSpeed = prompt(`Modifica Velocità (piedi):`, entity.stats.speed.toString());
    if (newSpeed && !isNaN(Number(newSpeed))) {
      entity.stats.speed = Math.max(0, Number(newSpeed));
      forceUpdate(prev => prev + 1);
      eventEmitter.emit('entityUpdated', entity);
    }
  };

  const handleEditName = () => {
    const newName = prompt(`Modifica Nome:`, entity.name);
    if (newName && newName.trim()) {
      entity.name = newName.trim();
      forceUpdate(prev => prev + 1);
      eventEmitter.emit('entityUpdated', entity);
    }
  };

  return (
    <div className={`entity-card ${entity.type} ${isSelected ? 'selected' : ''} ${entity.isFlying ? 'flying' : ''}`}>
      <div className="entity-card-header">
        <div className="entity-name" onClick={handleEditName} title="Clicca per modificare nome">
          {entity.name}
          {entity.isFlying && <span className="flying-indicator">✈️ {entity.flyingHeight}ft</span>}
        </div>
        <div className="entity-actions">
          <button 
            onClick={() => setShowEditTools(!showEditTools)} 
            className="btn btn-tiny btn-secondary"
            title="Strumenti di modifica"
          >
            ⚙️
          </button>
          <button 
            onClick={() => setShowDebuffForm(!showDebuffForm)} 
            className="btn btn-tiny btn-warning"
            title="Aggiungi Debuff"
          >
            🎯
          </button>
          <button onClick={handleRemove} className="btn btn-tiny btn-danger">×</button>
        </div>
      </div>
      
      <div className="entity-stats">
        <div className="stat-line">
          <span onClick={handleEditHP} title="Clicca per modificare" className="editable-stat">
            PF: {entity.stats.currentHP}/{entity.stats.maxHP}
          </span> | 
          <span onClick={handleEditAC} title="Clicca per modificare" className="editable-stat">
            CA: {entity.stats.armorClass}
          </span> | 
          <span onClick={handleEditSpeed} title="Clicca per modificare" className="editable-stat">
            Velocità: {entity.stats.speed}mt
          </span>
        </div>
      </div>

      {/* Edit Tools Panel */}
      {showEditTools && (
        <div className="edit-tools-panel">
          <div className="edit-tools-header">
            <h4>🛠️ Strumenti di Modifica</h4>
          </div>
          <div className="edit-tools-grid">
            <button onClick={handleEditHP} className="btn btn-small">📊 Modifica PF</button>
            <button onClick={handleEditAC} className="btn btn-small">🛡️ Modifica CA</button>
            <button onClick={handleEditSpeed} className="btn btn-small">🏃 Modifica Velocità</button>
            <button onClick={handleEditName} className="btn btn-small">📝 Modifica Nome</button>
            
            {/* Flying Controls */}
            {entity.isFlying ? (
              <button onClick={handleLand} className="btn btn-small btn-warning">
                ⬇️ Atterra
              </button>
            ) : (
              <button 
                onClick={() => setShowFlyingControls(!showFlyingControls)} 
                className="btn btn-small btn-magic"
              >
                ✈️ Vola
              </button>
            )}
          </div>
          
          {/* Flying Height Controls */}
          {showFlyingControls && !entity.isFlying && (
            <div className="flying-controls">
              <h5>Controlli Volo</h5>
              <div className="height-control">
                <label>Altezza (piedi):</label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  step="5"
                  value={flyingHeight}
                  onChange={(e) => setFlyingHeight(Number(e.target.value))}
                />
                <button onClick={handleSetFlying} className="btn btn-small btn-primary">
                  Decolla
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Debuffs */}
      {entity.conditions.length > 0 && (
        <div className="conditions">
          <div className="condition-list">
            {entity.conditions.map((condition, index) => (
              <span key={index} className="condition-tag">
                {condition}
                <button 
                  onClick={() => handleRemoveDebuff(condition)}
                  className="condition-remove"
                >×</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add Debuff Form */}
      {showDebuffForm && (
        <div className="debuff-form">
          <input
            type="text"
            placeholder="Inserisci nome debuff"
            value={newDebuff}
            onChange={(e) => setNewDebuff(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddDebuff()}
            autoFocus
          />
          <div className="debuff-actions">
            <button onClick={handleAddDebuff} className="btn btn-tiny btn-primary">Aggiungi</button>
            <button onClick={() => setShowDebuffForm(false)} className="btn btn-tiny btn-secondary">Annulla</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Add Entity Form Component
const AddEntityForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<EntityType>(EntityType.PLAYER);
  const [initiative, setInitiative] = useState(10);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [showModelUpload, setShowModelUpload] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf') || file.name.endsWith('.stl'))) {
      setModelFile(file);
    } else {
      alert('Seleziona un file GLB, GLTF o STL valido');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    let modelPath = undefined;
    if (modelFile) {
      // Create object URL for the uploaded file
      modelPath = URL.createObjectURL(modelFile);
    }
    
    // Generate a random position around the center to avoid stacking
    const randomOffset = () => (Math.random() - 0.5) * 10; // Random position within 5 units of center
    const spawnX = randomOffset();
    const spawnZ = randomOffset();
    const gridX = Math.round(spawnX / 1.5); // Convert to grid coordinates
    const gridZ = Math.round(spawnZ / 1.5);
    
    await CombatService.addEntity({
      name: name.trim(),
      type: type,
      size: CreatureSize.MEDIUM,
      stats: {
        maxHP: 25,
        currentHP: 25,
        armorClass: 12,
        initiative: initiative,
        speed: 30
      },
      position: { x: spawnX, z: spawnZ, gridX: gridX, gridZ: gridZ },
      isSelected: false,
      hasMoved: false,
      hasActed: false,
      conditions: [],
      modelPath: modelPath
    });
    
    setName('');
    setModelFile(null);
    onClose();
  };

  return (
    <div className="add-entity-form">
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <input
            type="text"
            placeholder="Nome Entità"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as EntityType)}
          >
            <option value={EntityType.PLAYER}>Giocatore</option>
            <option value={EntityType.ENEMY}>Nemico</option>
            <option value={EntityType.NPC}>PNG</option>
          </select>
          <input
            type="number"
            placeholder="Iniziativa"
            value={initiative}
            onChange={(e) => setInitiative(Number(e.target.value))}
            min="1"
            max="30"
            title="Modificatore di iniziativa (1-30)"
          />
        </div>
        
        <div className="form-row">
          <button 
            type="button" 
            onClick={() => setShowModelUpload(!showModelUpload)}
            className="btn btn-small btn-secondary"
          >
            {showModelUpload ? '📁 Nascondi Modello' : '🎨 Carica Modello 3D'}
          </button>
        </div>

        {showModelUpload && (
          <div className="form-row model-upload">
            <input
              type="file"
              accept=".glb,.gltf,.stl"
              onChange={handleFileChange}
              className="file-input"
            />
            {modelFile && (
              <div className="file-info">
                <span>📎 {modelFile.name}</span>
                <button type="button" onClick={() => setModelFile(null)} className="btn btn-tiny">×</button>
              </div>
            )}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">Aggiungi Entità</button>
          <button type="button" onClick={onClose} className="btn btn-secondary">Annulla</button>
        </div>
      </form>
    </div>
  );
};

// Spell Area Controls Modal Component
const SpellAreaControlsModal: React.FC<{
  controls: any;
  onClose: () => void;
}> = ({ controls, onClose }) => {
  const [values, setValues] = useState(() => {
    const area = controls.area;
    return {
      radius: area.radius || 15,
      width: area.width || 10,
      length: area.length || 10,
      angle: area.angle || 60,
      rotation: 0
    };
  });

  const handleApply = () => {
    controls.onResize(values);
    onClose();
  };

  const handleRotate = (direction: number) => {
    const newRotation = values.rotation + (direction * 30 * Math.PI / 180); // 30 degrees
    setValues(prev => ({ ...prev, rotation: newRotation }));
    controls.onRotate(newRotation);
  };

  const handleQuickSize = (multiplier: number) => {
    const area = controls.area;
    const newValues = { ...values };
    
    if (area.type === 'circle' || area.type === 'cone') {
      newValues.radius = Math.max(5, Math.min(50, values.radius * multiplier));
    } else {
      newValues.width = Math.max(5, Math.min(50, values.width * multiplier));
      if (area.type === 'square') {
        newValues.length = Math.max(5, Math.min(50, values.length * multiplier));
      }
    }
    
    setValues(newValues);
  };

  const area = controls.area;
  
  return (
    <div className="spell-area-controls-modal">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <div className="modal-header">
          <h3>🔮 Controlli Area Incantesimo</h3>
          <button onClick={onClose} className="btn btn-tiny">✕</button>
        </div>
        
        <div className="modal-body">
          <div className="area-info">
            <span className="area-type">{area.type.toUpperCase()}</span>
            <span className="area-color" style={{ backgroundColor: area.color }}></span>
          </div>
          
          {/* Size Controls */}
          <div className="size-controls">
            <h4>Dimensioni</h4>
            <div className="quick-size-buttons">
              <button onClick={() => handleQuickSize(0.5)} className="btn btn-small">½</button>
              <button onClick={() => handleQuickSize(0.75)} className="btn btn-small">¾</button>
              <button onClick={() => handleQuickSize(1.25)} className="btn btn-small">1.25×</button>
              <button onClick={() => handleQuickSize(1.5)} className="btn btn-small">1.5×</button>
              <button onClick={() => handleQuickSize(2)} className="btn btn-small">2×</button>
            </div>
            
            {area.type === 'circle' && (
              <div className="control-row">
                <label>Raggio: {values.radius} piedi</label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={values.radius}
                  onChange={(e) => setValues(prev => ({ ...prev, radius: Number(e.target.value) }))}
                />
              </div>
            )}
            
            {area.type === 'cone' && (
              <>
                <div className="control-row">
                  <label>Raggio: {values.radius} piedi</label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={values.radius}
                    onChange={(e) => setValues(prev => ({ ...prev, radius: Number(e.target.value) }))}
                  />
                </div>
                <div className="control-row">
                  <label>Angolo: {values.angle}°</label>
                  <input
                    type="range"
                    min="15"
                    max="180"
                    value={values.angle}
                    onChange={(e) => setValues(prev => ({ ...prev, angle: Number(e.target.value) }))}
                  />
                </div>
              </>
            )}
            
            {area.type === 'square' && (
              <>
                <div className="control-row">
                  <label>Larghezza: {values.width} piedi</label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={values.width}
                    onChange={(e) => setValues(prev => ({ ...prev, width: Number(e.target.value) }))}
                  />
                </div>
                <div className="control-row">
                  <label>Lunghezza: {values.length} piedi</label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={values.length}
                    onChange={(e) => setValues(prev => ({ ...prev, length: Number(e.target.value) }))}
                  />
                </div>
              </>
            )}
            
            {area.type === 'line' && (
              <>
                <div className="control-row">
                  <label>Larghezza: {values.width} piedi</label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={values.width}
                    onChange={(e) => setValues(prev => ({ ...prev, width: Number(e.target.value) }))}
                  />
                </div>
                <div className="control-row">
                  <label>Lunghezza: {values.length} piedi</label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={values.length}
                    onChange={(e) => setValues(prev => ({ ...prev, length: Number(e.target.value) }))}
                  />
                </div>
              </>
            )}
          </div>
          
          {/* Rotation Controls */}
          {(area.type === 'cone' || area.type === 'line') && (
            <div className="rotation-controls">
              <h4>Rotazione</h4>
              <div className="rotation-buttons">
                <button onClick={() => handleRotate(-1)} className="btn btn-small">↶ -30°</button>
                <button onClick={() => handleRotate(1)} className="btn btn-small">↷ +30°</button>
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button onClick={handleApply} className="btn btn-primary">Applica</button>
          <button onClick={controls.onDelete} className="btn btn-danger">Elimina</button>
          <button onClick={onClose} className="btn btn-secondary">Chiudi</button>
        </div>
      </div>
    </div>
  );
};

// Save/Load Menu Component
const SaveLoadMenu: React.FC<{
  onClose: () => void;
  onSaved: () => void;
  onLoaded: () => void;
}> = ({ onClose, onSaved, onLoaded }) => {
  const [activeTab, setActiveTab] = useState<'save' | 'load' | 'export'>('save');
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [savedEncounters, setSavedEncounters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSavedEncounters();
  }, []);

  const loadSavedEncounters = () => {
    const encounters = CombatService.getSaveLoadService().getSavedEncounters();
    setSavedEncounters(encounters);
  };

  const handleSave = async () => {
    if (!saveName.trim()) {
      alert('Per favore inserisci un nome per il salvataggio');
      return;
    }

    setIsLoading(true);
    try {
      CombatService.saveEncounter(saveName, saveDescription);
      alert('💾 Partita salvata con successo!');
      setSaveName('');
      setSaveDescription('');
      loadSavedEncounters();
      onSaved();
    } catch (error) {
      alert('❌ Errore nel salvataggio: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async (encounterId: string) => {
    setIsLoading(true);
    try {
      const success = CombatService.loadEncounter(encounterId);
      if (success) {
        alert('📂 Partita caricata con successo!');
        onLoaded();
      } else {
        alert('❌ Errore nel caricamento della partita');
      }
    } catch (error) {
      alert('❌ Errore nel caricamento: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (encounterId: string) => {
    try {
      CombatService.getSaveLoadService().exportEncounter(encounterId);
      alert('📤 Partita esportata con successo!');
    } catch (error) {
      alert('❌ Errore nell\'esportazione: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    }
  };

  const handleImport = () => {
    const input = CombatService.getSaveLoadService().createFileInput();
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setIsLoading(true);
        try {
          await CombatService.getSaveLoadService().importEncounter(file);
          alert('📥 Partita importata con successo!');
          loadSavedEncounters();
          onLoaded();
        } catch (error) {
          alert('❌ Errore nell\'importazione: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
        } finally {
          setIsLoading(false);
        }
      }
    };
    input.click();
  };

  const handleDelete = (encounterId: string, encounterName: string) => {
    if (confirm(`Sei sicuro di voler eliminare "${encounterName}"?`)) {
      const success = CombatService.getSaveLoadService().deleteEncounter(encounterId);
      if (success) {
        alert('🗑️ Partita eliminata con successo!');
        loadSavedEncounters();
      } else {
        alert('❌ Errore nell\'eliminazione della partita');
      }
    }
  };

  const handleQuickSave = () => {
    setIsLoading(true);
    try {
      CombatService.getSaveLoadService().quickSave(CombatService.getCombatState(), []);
      alert('⚡ Salvataggio rapido completato!');
      loadSavedEncounters();
      onSaved();
    } catch (error) {
      alert('❌ Errore nel salvataggio rapido: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="save-load-menu-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="save-load-menu-modal">
        <div className="modal-header">
          <h3>💾 Gestione Salvataggi</h3>
          <button onClick={onClose} className="btn btn-tiny">✕</button>
        </div>
        
        <div className="modal-tabs">
          <button 
            className={`tab-button ${activeTab === 'save' ? 'active' : ''}`}
            onClick={() => setActiveTab('save')}
          >
            💾 Salva
          </button>
          <button 
            className={`tab-button ${activeTab === 'load' ? 'active' : ''}`}
            onClick={() => setActiveTab('load')}
          >
            📂 Carica
          </button>
          <button 
            className={`tab-button ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            📤 Esporta/Importa
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'save' && (
            <div className="save-tab">
              <div className="form-group">
                <label>Nome Partita:</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Inserisci nome partita..."
                  maxLength={50}
                />
              </div>
              <div className="form-group">
                <label>Descrizione (opzionale):</label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Descrizione della partita..."
                  rows={3}
                  maxLength={200}
                />
              </div>
              <div className="save-buttons">
                <button 
                  onClick={handleSave}
                  className="btn btn-primary"
                  disabled={isLoading || !saveName.trim()}
                >
                  {isLoading ? '⏳ Salvataggio...' : '💾 Salva Partita'}
                </button>
                <button 
                  onClick={handleQuickSave}
                  className="btn btn-secondary"
                  disabled={isLoading}
                >
                  {isLoading ? '⏳ Salvataggio...' : '⚡ Salvataggio Rapido'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'load' && (
            <div className="load-tab">
              <div className="encounters-list">
                {savedEncounters.length === 0 ? (
                  <div className="no-encounters">
                    <p>📂 Nessuna partita salvata</p>
                    <p>Crea il tuo primo salvataggio per iniziare!</p>
                  </div>
                ) : (
                  savedEncounters.map((encounter) => (
                    <div key={encounter.id} className="encounter-item">
                      <div className="encounter-info">
                        <h4>{encounter.name}</h4>
                        <p>{encounter.description}</p>
                        <div className="encounter-meta">
                          <span>🏴‍☠️ {encounter.entityCount} entità</span>
                          <span>📅 {CombatService.getSaveLoadService().formatTimestamp(encounter.timestamp)}</span>
                        </div>
                      </div>
                      <div className="encounter-actions">
                        <button 
                          onClick={() => handleLoad(encounter.id)}
                          className="btn btn-primary btn-small"
                          disabled={isLoading}
                        >
                          📂 Carica
                        </button>
                        <button 
                          onClick={() => handleDelete(encounter.id, encounter.name)}
                          className="btn btn-danger btn-small"
                          disabled={isLoading}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="export-tab">
              <div className="export-section">
                <h4>📤 Esporta Partite</h4>
                <p>Esporta le tue partite salvate come file JSON per condividerle o fare backup.</p>
                <div className="encounters-list">
                  {savedEncounters.length === 0 ? (
                    <p>📂 Nessuna partita da esportare</p>
                  ) : (
                    savedEncounters.map((encounter) => (
                      <div key={encounter.id} className="encounter-item">
                        <div className="encounter-info">
                          <h4>{encounter.name}</h4>
                          <span>📅 {CombatService.getSaveLoadService().formatTimestamp(encounter.timestamp)}</span>
                        </div>
                        <button 
                          onClick={() => handleExport(encounter.id)}
                          className="btn btn-secondary btn-small"
                        >
                          📤 Esporta
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="import-section">
                <h4>📥 Importa Partite</h4>
                <p>Importa partite salvate da file JSON.</p>
                <button 
                  onClick={handleImport}
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? '⏳ Importazione...' : '📥 Importa da File'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CombatUI;