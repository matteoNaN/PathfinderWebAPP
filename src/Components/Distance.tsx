// Distance.tsx
import React from 'react';
import { useDistance } from '../Hooks/useDistance';
import './Distance.css'; // Creeremo questo file

function Distance() {
  const distance = useDistance();

  return (
    <div className="distance-overlay">
      {distance !== null ? (
        <p>Distanza: <span className="distance-value">{distance.toFixed(2)}</span> unità</p>
      ) : (
        <p>In attesa di misurazione...</p>
      )}
    </div>
  );
}

export default Distance;