import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { App } from "./App"
import { systemRegistry, genericSystem, dnd5eSystem, ordemParanormalSystem } from "@rpg3d/game-systems"
import "./index.css"

systemRegistry.register(genericSystem)
systemRegistry.register(dnd5eSystem)
systemRegistry.register(ordemParanormalSystem)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
