import { useState, useEffect } from 'react'
import { useDistance } from '../../Hooks/useDistance'
import eventEmitter from '../../Events/misurazioneEventEmitter'
import './Distance.css'

function Distance() {
  const distance = useDistance()
  const [liveDistance, setLiveDistance] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const handleLiveDistance = (dist: number) => {
      setLiveDistance(dist)
      setIsVisible(true)
    }

    const handleDistanceCalculated = () => {
      setLiveDistance(null)
      // Keep showing the final distance for a few seconds
      setTimeout(() => {
        if (!liveDistance) setIsVisible(false)
      }, 3000)
    }

    const handleMeasurementMode = (active: boolean) => {
      if (!active) {
        setLiveDistance(null)
        setIsVisible(false)
      }
    }

    eventEmitter.on('liveDistanceUpdate', handleLiveDistance)
    eventEmitter.on('distanceCalculated', handleDistanceCalculated)
    eventEmitter.on('measurementModeChanged', handleMeasurementMode)

    return () => {
      eventEmitter.off('liveDistanceUpdate', handleLiveDistance)
      eventEmitter.off('distanceCalculated', handleDistanceCalculated)
      eventEmitter.off('measurementModeChanged', handleMeasurementMode)
    }
  }, [liveDistance])

  useEffect(() => {
    if (distance) {
      setIsVisible(true)
      const timer = setTimeout(() => setIsVisible(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [distance])

  const displayDistance = liveDistance || distance
  
  if (!displayDistance || !isVisible) return null
  
  return (
    <div className={`distance-display ${liveDistance ? 'live' : 'final'}`}>
      <div className="distance-content">
        <div className="distance-icon">📏</div>
        <div className="distance-info">
          <div className="distance-value">
            {Math.round(displayDistance)} <span className="unit">feet</span>
          </div>
          <div className="distance-details">
            {Math.round(displayDistance / 5)} squares • ~{Math.ceil(displayDistance / 5)} moves
          </div>
          {liveDistance && (
            <div className="distance-status">Measuring...</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Distance