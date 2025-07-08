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
        <h4>📏 Measurement Tools</h4>
        {measurementCount > 0 && (
          <span className="measurement-badge">{measurementCount}</span>
        )}
      </div>

      <div className="measurement-buttons">
        <button 
          onClick={toggleMeasurement}
          className={`btn measure-btn ${isActive ? 'active' : ''}`}
        >
          {isActive ? '⏸️ Stop' : '📏 Measure'}
        </button>
        
        {measurementCount > 0 && (
          <button 
            onClick={clearAllMeasurements}
            className="btn btn-clear-measurements"
          >
            🗑️ Clear
          </button>
        )}
      </div>

      {isActive && (
        <div className="measurement-instructions">
          <p>
            {currentDistance === null 
              ? "📍 Click to place the first point" 
              : "📍 Click to place the second point"
            }
          </p>
          <small>Press M key or click Stop to exit</small>
        </div>
      )}

      {currentDistance !== null && (
        <div className="live-distance">
          <div className="distance-display">
            <span className="distance-value">{Math.round(currentDistance)}</span>
            <span className="distance-unit">feet</span>
          </div>
          <div className="distance-breakdown">
            <small>
              {Math.round(currentDistance / 5)} squares • {(currentDistance / 5).toFixed(1)} units
            </small>
          </div>
        </div>
      )}

      <div className="measurement-tips">
        <h5>💡 Tips:</h5>
        <ul>
          <li>Press <kbd>M</kbd> to toggle measurement mode</li>
          <li>Click two points to measure distance</li>
          <li>Measurements are in D&D feet (5-foot squares)</li>
          <li>Use for movement, spell range, positioning</li>
        </ul>
      </div>
    </div>
  );
};

export default MeasurementControls;