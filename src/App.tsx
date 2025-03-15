import { Analytics } from "@vercel/analytics/react"

import Game from './components/game/Game'
import './App.css'

function App() {
  return (
    <>
      <Game />
      <Analytics />
    </>
  )
}

export default App
