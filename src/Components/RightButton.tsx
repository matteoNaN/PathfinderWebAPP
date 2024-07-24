


// Lista di comportamenti
const behaviors = [
  () => ControllaDistanza(),
];

const RightButton = (behaviourIndex:number) => {
  // Stato per tenere traccia dell'indice del comportamento corrente

  // Funzione chiamata al click del bottone
  const handleClick = () => {
    // Esegui il comportamento corrente
    behaviors[behaviourIndex]();
    // Aggiorna l'indice del comportamento corrente, tornando a 0 se siamo alla fine della lista
  };

  return (
    <button onClick={handleClick}>
      Click me
    </button>
  );
};

export default RightButton;

function ControllaDistanza() {
    
}
