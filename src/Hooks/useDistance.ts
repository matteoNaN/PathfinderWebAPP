// useDistance.ts
import { useState, useEffect } from 'react';
import eventEmitter from '../Events/misurazioneEventEmitter';

export function useDistance() {
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    const handleDistanceCalculated = (newDistance: number) => {
      setDistance(newDistance);
    };

    eventEmitter.on('distanceCalculated', handleDistanceCalculated);

    return () => {
      eventEmitter.off('distanceCalculated', handleDistanceCalculated);
    };
  }, []);

  return distance;
}
