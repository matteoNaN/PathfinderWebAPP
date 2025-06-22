import React, { useState } from 'react';
import { CombatEntity } from '../../Types/Combat';
import { PRESET_WEAPONS, PRESET_SPELLS } from '../../Types/CombatActions';
import CombatService from '../../Services/CombatService';
import './CombatActionsPanel.css';

interface CombatActionsPanelProps {
  currentEntity: CombatEntity | null;
  selectedTarget: CombatEntity | null;
  onActionPerformed: () => void;
}

const CombatActionsPanel: React.FC<CombatActionsPanelProps> = ({
  currentEntity,
  selectedTarget,
  onActionPerformed
}) => {
  const [activeTab, setActiveTab] = useState<'actions' | 'spells' | 'status'>('actions');
  const [selectedWeapon, setSelectedWeapon] = useState('longsword');
  const [selectedSpell, setSelectedSpell] = useState('fireball');
  const [actionFeedback, setActionFeedback] = useState<string>('');

  if (!currentEntity) {
    return null; // Don't render at all if no current entity
  }

  const handleAttack = async () => {
    if (!selectedTarget) {
      setActionFeedback('Select a target first!');
      return;
    }

    try {
      const result = await CombatService.performAttack(currentEntity.id, selectedTarget.id, selectedWeapon);
      setActionFeedback(result.description);
      onActionPerformed();
    } catch (error) {
      setActionFeedback(`Attack failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCastSpell = async () => {
    try {
      let targetId = undefined;
      if (selectedTarget && !PRESET_SPELLS[selectedSpell].areaType) {
        targetId = selectedTarget.id;
      }

      const result = await CombatService.castSpell(currentEntity.id, selectedSpell, targetId);
      setActionFeedback(result.description);
      onActionPerformed();
    } catch (error) {
      setActionFeedback(`Spell failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDash = () => {
    try {
      const result = CombatService.performDash(currentEntity.id);
      setActionFeedback(result.description);
      onActionPerformed();
    } catch (error) {
      setActionFeedback(`Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDodge = () => {
    try {
      const result = CombatService.performDodge(currentEntity.id);
      setActionFeedback(result.description);
      onActionPerformed();
    } catch (error) {
      setActionFeedback(`Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleShowRanges = (type: 'movement' | 'weapon' | 'spell') => {
    CombatService.showEntityRanges(currentEntity.id, [type]);
  };

  const handleClearRanges = () => {
    CombatService.clearEntityRanges(currentEntity.id);
  };

  const handleAddStatusEffect = (effectName: string) => {
    if (!selectedTarget) {
      setActionFeedback('Select a target first!');
      return;
    }

    CombatService.addStatusEffect(selectedTarget.id, effectName);
    setActionFeedback(`Applied ${effectName} to ${selectedTarget.name}`);
  };

  return (
    <div className="actions-panel">
      <div className="panel-header">
        <h3>Actions - {currentEntity.name}</h3>
        <div className="turn-info">
          <span className={`status-badge ${currentEntity.hasMoved ? 'used' : 'available'}`}>
            Move: {currentEntity.hasMoved ? 'Used' : 'Available'}
          </span>
          <span className={`status-badge ${currentEntity.hasActed ? 'used' : 'available'}`}>
            Action: {currentEntity.hasActed ? 'Used' : 'Available'}
          </span>
        </div>
      </div>

      {selectedTarget && (
        <div className="target-info">
          <span>Target: <strong>{selectedTarget.name}</strong></span>
          <span>Distance: {Math.round(CombatService.calculateDistance(currentEntity.id, selectedTarget.id) * 5)}ft</span>
        </div>
      )}

      <div className="action-tabs">
        <button 
          className={`tab ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          Actions
        </button>
        <button 
          className={`tab ${activeTab === 'spells' ? 'active' : ''}`}
          onClick={() => setActiveTab('spells')}
        >
          Spells
        </button>
        <button 
          className={`tab ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          Status
        </button>
      </div>

      <div className="action-content">
        {activeTab === 'actions' && (
          <div className="actions-tab">
            <div className="action-section">
              <h4>Combat Actions</h4>
              
              <div className="weapon-selection">
                <label>Weapon:</label>
                <select 
                  value={selectedWeapon} 
                  onChange={(e) => setSelectedWeapon(e.target.value)}
                >
                  {Object.entries(PRESET_WEAPONS).map(([id, weapon]) => (
                    <option key={id} value={id}>{weapon.name}</option>
                  ))}
                </select>
              </div>

              <div className="action-buttons">
                <button 
                  onClick={handleAttack}
                  disabled={currentEntity.hasActed || !selectedTarget}
                  className="btn btn-attack"
                >
                  Attack
                </button>
                
                <button 
                  onClick={handleDash}
                  disabled={currentEntity.hasActed}
                  className="btn btn-dash"
                >
                  Dash
                </button>
                
                <button 
                  onClick={handleDodge}
                  disabled={currentEntity.hasActed}
                  className="btn btn-dodge"
                >
                  Dodge
                </button>
              </div>
            </div>

            <div className="action-section">
              <h4>Range Indicators</h4>
              <div className="range-buttons">
                <button 
                  onClick={() => handleShowRanges('movement')}
                  className="btn btn-small btn-movement"
                >
                  Movement
                </button>
                <button 
                  onClick={() => handleShowRanges('weapon')}
                  className="btn btn-small btn-weapon"
                >
                  Weapon
                </button>
                <button 
                  onClick={() => handleShowRanges('spell')}
                  className="btn btn-small btn-spell"
                >
                  Spell
                </button>
                <button 
                  onClick={handleClearRanges}
                  className="btn btn-small btn-clear"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'spells' && (
          <div className="spells-tab">
            <div className="spell-selection">
              <label>Spell:</label>
              <select 
                value={selectedSpell} 
                onChange={(e) => setSelectedSpell(e.target.value)}
              >
                {Object.entries(PRESET_SPELLS).map(([id, spell]) => (
                  <option key={id} value={id}>
                    {spell.name} (Level {spell.level})
                  </option>
                ))}
              </select>
            </div>

            <div className="spell-info">
              {PRESET_SPELLS[selectedSpell] && (
                <>
                  <p><strong>Range:</strong> {PRESET_SPELLS[selectedSpell].range}ft</p>
                  <p><strong>School:</strong> {PRESET_SPELLS[selectedSpell].school}</p>
                  <p><strong>Duration:</strong> {PRESET_SPELLS[selectedSpell].duration}</p>
                  <p>{PRESET_SPELLS[selectedSpell].description}</p>
                </>
              )}
            </div>

            <div className="spell-actions">
              <button 
                onClick={handleCastSpell}
                disabled={currentEntity.hasActed}
                className="btn btn-cast"
              >
                Cast Spell
              </button>
            </div>
          </div>
        )}

        {activeTab === 'status' && (
          <div className="status-tab">
            <div className="status-effects">
              <h4>Apply Status Effect</h4>
              <div className="status-buttons">
                <button 
                  onClick={() => handleAddStatusEffect('poisoned')}
                  className="btn btn-small btn-status-poison"
                >
                  Poison
                </button>
                <button 
                  onClick={() => handleAddStatusEffect('paralyzed')}
                  className="btn btn-small btn-status-paralyze"
                >
                  Paralyze
                </button>
                <button 
                  onClick={() => handleAddStatusEffect('stunned')}
                  className="btn btn-small btn-status-stun"
                >
                  Stun
                </button>
                <button 
                  onClick={() => handleAddStatusEffect('blessed')}
                  className="btn btn-small btn-status-bless"
                >
                  Bless
                </button>
                <button 
                  onClick={() => handleAddStatusEffect('hasted')}
                  className="btn btn-small btn-status-haste"
                >
                  Haste
                </button>
                <button 
                  onClick={() => handleAddStatusEffect('frightened')}
                  className="btn btn-small btn-status-fear"
                >
                  Fear
                </button>
              </div>
            </div>

            <div className="current-effects">
              <h4>Current Effects</h4>
              <div className="effects-list">
                {currentEntity.conditions.map((condition, index) => (
                  <span key={index} className="condition-tag">
                    {condition}
                  </span>
                ))}
                {currentEntity.conditions.length === 0 && (
                  <p className="no-effects">No active conditions</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {actionFeedback && (
        <div className="action-feedback">
          <p>{actionFeedback}</p>
          <button onClick={() => setActionFeedback('')} className="close-feedback">×</button>
        </div>
      )}
    </div>
  );
};

export default CombatActionsPanel;