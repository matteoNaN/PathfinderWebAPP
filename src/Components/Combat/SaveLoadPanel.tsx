import React, { useState, useEffect } from 'react';
import CombatService from '../../Services/CombatService';
import './SaveLoadPanel.css';

interface SaveLoadPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EncounterMetadata {
  id: string;
  name: string;
  description: string;
  timestamp: number;
  entityCount: number;
  version: string;
}

const SaveLoadPanel: React.FC<SaveLoadPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'save' | 'load' | 'import'>('save');
  const [savedEncounters, setSavedEncounters] = useState<EncounterMetadata[]>([]);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (isOpen) {
      refreshEncounterList();
    }
  }, [isOpen]);

  const refreshEncounterList = () => {
    const encounters = CombatService.getSaveLoadService().getSavedEncounters();
    setSavedEncounters(encounters);
  };

  const handleSave = () => {
    if (!saveName.trim()) {
      setFeedback('Please enter a name for the encounter');
      return;
    }

    try {
      CombatService.saveEncounter(saveName, saveDescription);
      setFeedback(`Encounter saved successfully!`);
      setSaveName('');
      setSaveDescription('');
      refreshEncounterList();
    } catch (error) {
      setFeedback(`Failed to save encounter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleLoad = (encounterId: string) => {
    try {
      const success = CombatService.loadEncounter(encounterId);
      if (success) {
        setFeedback('Encounter loaded successfully!');
        onClose();
      } else {
        setFeedback('Failed to load encounter');
      }
    } catch (error) {
      setFeedback(`Failed to load encounter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = (encounterId: string) => {
    if (window.confirm('Are you sure you want to delete this encounter?')) {
      const success = CombatService.getSaveLoadService().deleteEncounter(encounterId);
      if (success) {
        setFeedback('Encounter deleted successfully');
        refreshEncounterList();
      } else {
        setFeedback('Failed to delete encounter');
      }
    }
  };

  const handleExport = (encounterId: string) => {
    try {
      CombatService.getSaveLoadService().exportEncounter(encounterId);
      setFeedback('Encounter exported successfully!');
    } catch (error) {
      setFeedback(`Failed to export encounter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    CombatService.getSaveLoadService().importEncounter(file)
      .then(() => {
        setFeedback('Encounter imported successfully!');
        refreshEncounterList();
      })
      .catch((error) => {
        setFeedback(`Failed to import encounter: ${error instanceof Error ? error.message : 'Unknown error'}`);
      });

    // Reset file input
    event.target.value = '';
  };

  const handleQuickSave = () => {
    try {
      CombatService.getSaveLoadService().quickSave(
        CombatService.getCombatState(),
        CombatService.getCombatActionsService().getActionHistory()
      );
      setFeedback('Quick save completed!');
      refreshEncounterList();
    } catch (error) {
      setFeedback(`Quick save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStorageInfo = () => {
    return CombatService.getSaveLoadService().getStorageInfo();
  };

  if (!isOpen) return null;

  const storageInfo = getStorageInfo();

  return (
    <div className="save-load-overlay">
      <div className="save-load-panel">
        <div className="panel-header">
          <h2>Save & Load Encounters</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="storage-info">
          <div className="storage-bar">
            <div 
              className="storage-fill" 
              style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
            />
          </div>
          <small>
            Storage: {CombatService.getSaveLoadService().formatFileSize(storageInfo.used)} used 
            ({storageInfo.percentage.toFixed(1)}%)
          </small>
        </div>

        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'save' ? 'active' : ''}`}
            onClick={() => setActiveTab('save')}
          >
            Save
          </button>
          <button 
            className={`tab-btn ${activeTab === 'load' ? 'active' : ''}`}
            onClick={() => setActiveTab('load')}
          >
            Load
          </button>
          <button 
            className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            Import/Export
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'save' && (
            <div className="save-tab">
              <div className="quick-actions">
                <button onClick={handleQuickSave} className="btn btn-quick-save">
                  Quick Save
                </button>
              </div>

              <div className="save-form">
                <div className="form-group">
                  <label>Encounter Name:</label>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Enter encounter name..."
                    maxLength={50}
                  />
                </div>

                <div className="form-group">
                  <label>Description (optional):</label>
                  <textarea
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    placeholder="Enter description..."
                    rows={3}
                    maxLength={200}
                  />
                </div>

                <button onClick={handleSave} className="btn btn-save">
                  Save Encounter
                </button>
              </div>
            </div>
          )}

          {activeTab === 'load' && (
            <div className="load-tab">
              {savedEncounters.length === 0 ? (
                <div className="no-encounters">
                  <p>No saved encounters found.</p>
                  <p>Create and save an encounter first!</p>
                </div>
              ) : (
                <div className="encounters-list">
                  {savedEncounters.map((encounter) => (
                    <div key={encounter.id} className="encounter-item">
                      <div className="encounter-info">
                        <h4>{encounter.name}</h4>
                        <p className="encounter-description">{encounter.description}</p>
                        <div className="encounter-meta">
                          <span>{encounter.entityCount} entities</span>
                          <span>{formatDate(encounter.timestamp)}</span>
                        </div>
                      </div>
                      <div className="encounter-actions">
                        <button 
                          onClick={() => handleLoad(encounter.id)}
                          className="btn btn-small btn-load"
                        >
                          Load
                        </button>
                        <button 
                          onClick={() => handleExport(encounter.id)}
                          className="btn btn-small btn-export"
                        >
                          Export
                        </button>
                        <button 
                          onClick={() => handleDelete(encounter.id)}
                          className="btn btn-small btn-delete"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="import-tab">
              <div className="import-section">
                <h3>Import Encounter</h3>
                <p>Select a JSON file exported from this application:</p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="file-input"
                />
              </div>

              <div className="export-section">
                <h3>Export Options</h3>
                <p>Use the Export button next to saved encounters in the Load tab to download them as JSON files.</p>
                
                <div className="danger-zone">
                  <h4>⚠️ Danger Zone</h4>
                  <p>Clear all saved data (cannot be undone):</p>
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure? This will delete ALL saved encounters permanently!')) {
                        CombatService.getSaveLoadService().clearAllData();
                        setFeedback('All data cleared successfully');
                        refreshEncounterList();
                      }
                    }}
                    className="btn btn-danger"
                  >
                    Clear All Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {feedback && (
          <div className="feedback-message">
            <p>{feedback}</p>
            <button onClick={() => setFeedback('')} className="close-feedback">×</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaveLoadPanel;