import React, { useState, useEffect } from 'react';
import { Vector3 } from '@babylonjs/core';
import { CombatEntity, CombatState, EntityType, CreatureSize } from '../../Types/Combat';
import CombatService from '../../Services/CombatService';
import eventEmitter from '../../Events/misurazioneEventEmitter';
import './CombatUI.css';

const CombatUI: React.FC = () => {
  const [combatState, setCombatState] = useState<CombatState>(CombatService.getCombatState());
  const [, setForceUpdate] = useState(0);
  const [selectedEntity, setSelectedEntity] = useState<CombatEntity | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<CombatEntity | null>(null);
  const [showAddEntity, setShowAddEntity] = useState(false);

  const handleCombatUpdate = () => {
    setCombatState(CombatService.getCombatState());
    setForceUpdate(prev => prev + 1); // Force re-render
  };

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

    eventEmitter.on('combatStarted', handleCombatUpdate);
    eventEmitter.on('combatEnded', handleCombatUpdate);
    eventEmitter.on('turnChanged', handleCombatUpdate);
    eventEmitter.on('turnOrderChanged', handleCombatUpdate);
    eventEmitter.on('entitySelected', handleEntitySelected);
    eventEmitter.on('entityAdded', handleCombatUpdate);
    eventEmitter.on('entityRemoved', handleEntityRemoved);

    return () => {
      eventEmitter.off('combatStarted', handleCombatUpdate);
      eventEmitter.off('combatEnded', handleCombatUpdate);
      eventEmitter.off('turnChanged', handleCombatUpdate);
      eventEmitter.off('turnOrderChanged', handleCombatUpdate);
      eventEmitter.off('entitySelected', handleEntitySelected);
      eventEmitter.off('entityAdded', handleCombatUpdate);
      eventEmitter.off('entityRemoved', handleEntityRemoved);
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
    <div className={`combat-ui ${hasEntities ? 'has-entities' : 'no-entities'}`}>
      {/* Combat Status Panel */}
      <div className="combat-status">
        <div className="combat-header">
          <h2>🎲 Gestore Combattimento</h2>
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
            title="Crea area circolare (trascina per muovere, click destro per ridimensionare)"
          >
            ⭕ Cerchio
          </button>
          <button 
            onClick={() => createSpellArea('cone')}
            className="btn btn-small btn-magic"
            title="Crea area conica (click sinistro per ruotare, click destro per ridimensionare)"
          >
            🔺 Cono
          </button>
          <button 
            onClick={() => createSpellArea('square')}
            className="btn btn-small btn-magic"
            title="Crea area quadrata (trascina per muovere, click destro per ridimensionare)"
          >
            ⬜ Quadrato
          </button>
          <button 
            onClick={() => createSpellArea('line')}
            className="btn btn-small btn-magic"
            title="Crea area lineare (click sinistro per ruotare, click destro per ridimensionare)"
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
      {!hasEntities && (
        <div className="quick-start-tips">
          <h3>🚀 Avvio Rapido</h3>
          <ol>
            <li>Clicca "➕ Aggiungi Entità" per creare personaggi</li>
            <li>Inserisci le loro statistiche D&D (PF, CA, Velocità)</li>
            <li>Clicca "Inizia Combattimento" per tirare l'iniziativa</li>
            <li>Usa le frecce ↑↓ per riordinare l'iniziativa</li>
            <li>Clicca "Termina Turno" per avanzare i turni</li>
          </ol>
          <p><strong>💡 Suggerimenti:</strong> Premi 'M' per misurare le distanze • Trascina le entità per spostarle</p>
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

    </div>
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
  const handleRemove = () => {
    CombatService.removeEntity(entity.id);
  };

  return (
    <div className={`entity-card ${entity.type} ${isSelected ? 'selected' : ''}`}>
      <div className="entity-card-header">
        <div className="entity-name">{entity.name}</div>
        <button onClick={handleRemove} className="btn btn-tiny btn-danger">×</button>
      </div>
      <div className="entity-stats">
        <div className="hp-bar">
          <div 
            className="hp-fill" 
            style={{ width: `${(entity.stats.currentHP / entity.stats.maxHP) * 100}%` }}
          />
          <span className="hp-text">
            {entity.stats.currentHP}/{entity.stats.maxHP}
          </span>
        </div>
        <div className="stat-line">
          CA: {entity.stats.armorClass} | Velocità: {entity.stats.speed}mt
        </div>
      </div>
    </div>
  );
};

// Add Entity Form Component
const AddEntityForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: EntityType.PLAYER,
    size: CreatureSize.MEDIUM,
    maxHP: 20,
    armorClass: 10,
    speed: 30
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await CombatService.addEntity({
      name: formData.name,
      type: formData.type,
      size: formData.size,
      stats: {
        maxHP: formData.maxHP,
        currentHP: formData.maxHP,
        armorClass: formData.armorClass,
        initiative: 0,
        speed: formData.speed
      },
      position: { x: 0, z: 0, gridX: 0, gridZ: 0 },
      isSelected: false,
      hasMoved: false,
      hasActed: false,
      conditions: []
    });
    
    onClose();
  };

  return (
    <div className="add-entity-form">
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <input
            type="text"
            placeholder="Nome Entità"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div className="form-row">
          <select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value as EntityType})}
          >
            <option value={EntityType.PLAYER}>Giocatore</option>
            <option value={EntityType.ENEMY}>Nemico</option>
            <option value={EntityType.NPC}>PNG</option>
          </select>
          <select
            value={formData.size}
            onChange={(e) => setFormData({...formData, size: e.target.value as CreatureSize})}
          >
            <option value={CreatureSize.TINY}>Minuscola</option>
            <option value={CreatureSize.SMALL}>Piccola</option>
            <option value={CreatureSize.MEDIUM}>Media</option>
            <option value={CreatureSize.LARGE}>Grande</option>
            <option value={CreatureSize.HUGE}>Enorme</option>
            <option value={CreatureSize.GARGANTUAN}>Mastodontica</option>
          </select>
        </div>
        <div className="form-row">
          <input
            type="number"
            placeholder="PF Massimi"
            value={formData.maxHP}
            onChange={(e) => setFormData({...formData, maxHP: parseInt(e.target.value)})}
            min="1"
          />
          <input
            type="number"
            placeholder="Classe Armatura"
            value={formData.armorClass}
            onChange={(e) => setFormData({...formData, armorClass: parseInt(e.target.value)})}
            min="1"
          />
          <input
            type="number"
            placeholder="Velocità (mt)"
            value={formData.speed}
            onChange={(e) => setFormData({...formData, speed: parseInt(e.target.value)})}
            min="0"
            step="5"
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">Aggiungi Entità</button>
          <button type="button" onClick={onClose} className="btn btn-secondary">Annulla</button>
        </div>
      </form>
    </div>
  );
};

export default CombatUI;