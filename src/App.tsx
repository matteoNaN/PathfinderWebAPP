import { useState, useEffect } from 'react';
import './App.css'
import Canvas from './Components/Canvas/Canvas'
import Distance from './Components/Distance/Distance'
import FloatingRightMenu from './Components/RightMenu/RightMenu'
import CombatUI from './Components/Combat/CombatUI'
import AppTutorial from './Components/Tutorial/AppTutorial'
import NotesPanel from './Components/Notes/NotesPanel'
// import AdBanner from './Components/Ads/AdBanner'
// import { initializeAdSense } from './config/adsConfig'
import MainRenderService from './Services/MainRenderService';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading application...');
  const [error, setError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [, setIsTutorialComplete] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoadingMessage('Initializing 3D engine...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
        
        // setLoadingMessage('Initializing ads...');
        // initializeAdSense(); // Initialize Google AdSense
        
        setLoadingMessage('Loading complete!');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIsLoading(false);
        
        // Check if tutorial should be shown
        const tutorialDisabled = localStorage.getItem('dnd-combat-tutorial-disabled') === 'true';
        const hasSeenTutorial = localStorage.getItem('dnd-combat-tutorial-seen') === 'true';
        
        if (!tutorialDisabled && !hasSeenTutorial) {
          setTimeout(() => {
            setShowTutorial(true);
          }, 1000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error during initialization');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    setIsTutorialComplete(true);
    localStorage.setItem('dnd-combat-tutorial-seen', 'true');
  };

  const startTutorial = () => {
    setShowTutorial(true);
  };

  if (error) {
    return (
      <div className="App error-state">
        <div className="error-container">
          <h2>❌ Loading Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            🔄 Ricarica Applicazione
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="App loading-state">
        <div className="loading-container">
          <div className="loading-spinner">⚡</div>
          <h2>🎲 Simulatore di Combattimento GDR</h2>
          <p>{loadingMessage}</p>
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Ads hidden for future integration */}
      {/* <AdBanner type="banner" className="top-ad" /> */}
      
      {/* Main 3D Canvas */}
      <Canvas />
      
      {/* Combat Management UI */}
      <CombatUI />
      
      {/* Floating Tools Menu */}
      <FloatingRightMenu onStartTutorial={startTutorial} />
      
      {/* Distance Measurement Display */}
      <Distance />
      
      {/* Notes Panel */}
      <NotesPanel />
      
      {/* Ads hidden for future integration */}
      {/* <AdBanner type="sidebar" className="sidebar-ad" /> */}
      
      {/* Camera Controls Info */}
      <div className="camera-controls-info">
        <small>{MainRenderService.getCameraControlsInfo()}</small>
      </div>
      
      {/* Ads hidden for future integration */}
      {/* <AdBanner type="mobile-banner" className="bottom-mobile-ad" /> */}
      
      {/* Tutorial Component */}
      <AppTutorial 
        runTutorial={showTutorial}
        onTutorialComplete={handleTutorialComplete}
      />
    </div>
  )
}

export default App
