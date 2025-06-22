import React, { useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

interface AppTutorialProps {
  runTutorial: boolean;
  onTutorialComplete: () => void;
}

const AppTutorial: React.FC<AppTutorialProps> = ({ runTutorial, onTutorialComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h2>🎲 Benvenuto nel Simulatore di Combattimento D&D!</h2>
          <p>Questo tutorial ti guiderà attraverso le funzionalità principali dell'applicazione.</p>
          <p>Puoi saltare il tutorial in qualsiasi momento cliccando "Salta" o premendo ESC.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: 'canvas',
      content: (
        <div>
          <h3>🗺️ Griglia di Combattimento 3D</h3>
          <p>Questa è la griglia di combattimento principale (40x40 quadrati = 200x200 piedi).</p>
          <p><strong>Controlli:</strong></p>
          <ul>
            <li>🖱️ <strong>Mouse:</strong> Ruota e ingrandisci la vista</li>
            <li>⌨️ <strong>WASD/Frecce:</strong> Muovi la telecamera</li>
            <li>⌨️ <strong>Q/E:</strong> Zoom in/out</li>
            <li>⌨️ <strong>R:</strong> Reset telecamera</li>
          </ul>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.combat-ui',
      content: (
        <div>
          <h3>⚔️ Gestore Combattimento</h3>
          <p>Da qui puoi gestire tutto il combattimento:</p>
          <ul>
            <li>➕ <strong>Aggiungere entità</strong> (giocatori, nemici, PNG)</li>
            <li>🎲 <strong>Iniziare il combattimento</strong> e tirare l'iniziativa</li>
            <li>📊 <strong>Tracciare l'ordine dei turni</strong></li>
            <li>❤️ <strong>Monitorare HP e statistiche</strong></li>
          </ul>
        </div>
      ),
      placement: 'left',
    },
    {
      target: '.entity-management .btn-primary',
      content: (
        <div>
          <h3>➕ Aggiungere Entità</h3>
          <p>Clicca qui per aggiungere nuovi personaggi al combattimento.</p>
          <p>Puoi inserire:</p>
          <ul>
            <li>📝 Nome del personaggio</li>
            <li>👥 Tipo (Giocatore/Nemico/PNG)</li>
            <li>📏 Taglia (da Minuscola a Mastodontica)</li>
            <li>❤️ Punti Ferita, Classe Armatura, Velocità</li>
          </ul>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '.spell-controls',
      content: (
        <div>
          <h3>🔮 Aree Incantesimo</h3>
          <p>Crea aree di effetto per incantesimi e abilità:</p>
          <ul>
            <li>⭕ <strong>Cerchio:</strong> Per incantesimi ad area circolare</li>
            <li>🔺 <strong>Cono:</strong> Per soffio del drago, incantesimi conici</li>
            <li>⬜ <strong>Quadrato:</strong> Per aree quadrate</li>
            <li>📏 <strong>Linea:</strong> Per fulmini e raggi</li>
          </ul>
          <p><small>💡 Trascina per spostare, click destro per ridimensionare!</small></p>
        </div>
      ),
      placement: 'left',
    },
    {
      target: '.floating-menu',
      content: (
        <div>
          <h3>🛠️ Menu Strumenti</h3>
          <p>Clicca sull'icona degli strumenti per accedere a:</p>
          <ul>
            <li>🎲 <strong>Dadi:</strong> Tira d20, d6, d8, d10</li>
            <li>📏 <strong>Misurazione:</strong> Misura distanze sulla griglia</li>
            <li>📷 <strong>Telecamera:</strong> Reset vista</li>
            <li>⚙️ <strong>Impostazioni:</strong> Info sull'app</li>
          </ul>
        </div>
      ),
      placement: 'left',
    },
    {
      target: '.camera-controls-info',
      content: (
        <div>
          <h3>📷 Controlli Telecamera</h3>
          <p>Questa barra mostra sempre i controlli della telecamera disponibili.</p>
          <p><strong>Ricorda:</strong></p>
          <ul>
            <li>⌨️ <strong>M:</strong> Modalità misurazione</li>
            <li>🖱️ <strong>Trascina entità:</strong> Per spostarle sulla griglia</li>
            <li>📐 <strong>Snap alla griglia:</strong> Posizionamento automatico</li>
          </ul>
        </div>
      ),
      placement: 'top',
    },
    {
      target: 'body',
      content: (
        <div>
          <h2>🎉 Tutorial Completato!</h2>
          <p>Ora sei pronto per gestire epici combattimenti D&D!</p>
          <p><strong>Suggerimenti finali:</strong></p>
          <ul>
            <li>🆚 Inizia aggiungendo alcuni personaggi</li>
            <li>⚔️ Clicca "Inizia Combattimento" per cominciare</li>
            <li>📏 Usa gli strumenti di misurazione per tattiche precise</li>
            <li>🔮 Sperimenta con le aree incantesimo</li>
          </ul>
          <p><em>Puoi riattivare questo tutorial dalle impostazioni!</em></p>
        </div>
      ),
      placement: 'center',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data;
    
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      onTutorialComplete();
    }
    
    if (type === 'step:after') {
      setStepIndex(index + 1);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={runTutorial}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#4facfe',
          backgroundColor: '#fff',
          textColor: '#333',
          overlayColor: 'rgba(0, 0, 0, 0.6)',
          spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
          width: 400,
          zIndex: 10000,
        },
        tooltip: {
          fontSize: '14px',
          fontFamily: 'Arial, sans-serif',
        },
        tooltipTitle: {
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#2a5298',
        },
        tooltipContent: {
          padding: '20px',
        },
        buttonNext: {
          backgroundColor: '#28a745',
        },
        buttonBack: {
          backgroundColor: '#6c757d',
        },
        buttonSkip: {
          backgroundColor: '#dc3545',
        },
        spotlight: {
          borderRadius: '8px',
        },
      }}
      locale={{
        back: 'Indietro',
        close: 'Chiudi',
        last: 'Termina',
        next: 'Avanti',
        skip: 'Salta',
        open: 'Apri finestra di dialogo',
      }}
      floaterProps={{
        disableAnimation: true,
      }}
    />
  );
};

export default AppTutorial;