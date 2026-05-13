import { Routes, Route } from "react-router-dom"
import { LobbyPage }   from "./pages/lobby-page"
import { SessionPage } from "./pages/session-page"

export function App() {
  return (
    <Routes>
      <Route path="/"                    element={<LobbyPage />} />
      <Route path="/session/:sessionId"  element={<SessionPage />} />
    </Routes>
  )
}
