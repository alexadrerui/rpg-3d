import { Routes, Route, Navigate } from "react-router-dom"
import { LobbyPage }   from "./pages/lobby-page"
import { SessionPage } from "./pages/session-page"
import { useAuthStore } from "./store/auth-store"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { campaignId } = useAuthStore()
  if (!campaignId) return <Navigate to="/" replace />
  return <>{children}</>
}

export function App() {
  return (
    <Routes>
      <Route path="/"                   element={<LobbyPage />} />
      <Route path="/session/:sessionId" element={<ProtectedRoute><SessionPage /></ProtectedRoute>} />
    </Routes>
  )
}
