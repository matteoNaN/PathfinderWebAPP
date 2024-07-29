
import './App.css'
import Canvas from './Components/Canvas/Canvas'
import Distance from './Components/Distance/Distance'
import FloatingRightMenu from './Components/RightMenu/RightMenu'

function App() {

  return (
    <>
    <div className="App">
      <Canvas></Canvas>
      <FloatingRightMenu/>
      <Distance/>
    </div>
    </>
  )
}

export default App
