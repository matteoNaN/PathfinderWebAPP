import React, { useState, useEffect } from 'react';
import CombatService from '../../Services/CombatService';
import eventEmitter from '../../Events/misurazioneEventEmitter';
import './MeasurementControls.css';

const MeasurementControls: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [measurementCount, setMeasurementCount] = useState(0);

  useEffect(() => {
    const handleMeasurementMode = (active: boolean) => {
      setIsActive(active);
      if (!active) {
        setCurrentDistance(null);
      }
    };

    const handleLiveDistance = (distance: number) => {
      setCurrentDistance(distance);
    };

    const handleDistanceCalculated = () => {
      setMeasurementCount(prev => prev + 1);
      setTimeout(() => setCurrentDistance(null), 3000);
    };

    const handleMeasurementCreated = () => {
      setMeasurementCount(prev => prev + 1);
    };

    eventEmitter.on('measurementModeChanged', handleMeasurementMode);
    eventEmitter.on('liveDistanceUpdate', handleLiveDistance);
    eventEmitter.on('distanceCalculated', handleDistanceCalculated);
    eventEmitter.on('measurementCreated', handleMeasurementCreated);

    return () => {
      eventEmitter.off('measurementModeChanged', handleMeasurementMode);
      eventEmitter.off('liveDistanceUpdate', handleLiveDistance);
      eventEmitter.off('distanceCalculated', handleDistanceCalculated);
      eventEmitter.off('measurementCreated', handleMeasurementCreated);
    };
  }, []);

  const toggleMeasurement = () => {
    CombatService.getMeasurementService().toggleMeasurement();
  };

  const clearAllMeasurements = () => {
    CombatService.getMeasurementService().clearAllMeasurements();
    setMeasurementCount(0);
  };

  return (
    <div className="measurement-controls">
      <div className="measurement-header">
        <h4>📏 Strumenti di Misurazione</h4>
        {measurementCount > 0 && (
          <span className="measurement-badge">{measurementCount}</span>
        )}
      </div>

      <div className="measurement-buttons">
        <button 
          onClick={toggleMeasurement}
          className={`btn measure-btn ${isActive ? 'active' : ''}`}
        >
          {isActive ? '⏸️ Ferma' : '📏 Misura'}
        </button>
        
        {measurementCount > 0 && (
          <button 
            onClick={clearAllMeasurements}
            className="btn btn-clear-measurements"
          >
            🗑️ Cancella
          </button>
        )}
      </div>

      {isActive && (
        <div className="measurement-instructions">
          <p>
            {currentDistance === null 
              ? "📍 Clicca per posizionare il primo punto" 
              : "📍 Clicca per posizionare il secondo punto"
            }
          </p>
          <small>Premi il tasto M o clicca Ferma per uscire</small>
        </div>
      )}

      {currentDistance !== null && (
        <div className="live-distance">
          <div className="distance-display">
            <span className="distance-value">{Math.round(currentDistance)}</span>
            <span className="distance-unit">metri</span>
          </div>
          <div className="distance-breakdown">
            <small>
              {Math.round(currentDistance / 5)} quadrati • {(currentDistance / 5).toFixed(1)} unità
            </small>
          </div>
        </div>
      )}

      <div className="measurement-tips">
        <h5>💡 Suggerimenti:</h5>
        <ul>
          <li>Premi <kbd>M</kbd> per attivare/disattivare la modalità misurazione</li>
          <li>Clicca due punti per misurare la distanza</li>
          <li>Le misurazioni sono in metri D&D (quadrati da 1.5m)</li>
          <li>Usa per movimento, gittata incantesimi, posizionamento</li>
        </ul>
      </div>
    </div>
  );
};

export default MeasurementControls;