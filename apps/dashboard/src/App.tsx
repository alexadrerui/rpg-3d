import { Routes, Route, Navigate } from "react-router-dom"
import { CampaignsPage }      from "./pages/campaigns-page"
import { CampaignDetailPage } from "./pages/campaign-detail-page"
import { CharacterPage }      from "./pages/character-page"
import { InvitePage }         from "./pages/invite-page"
import { SystemStorePage }    from "./pages/system-store-page"
import { AdminPage }          from "./pages/admin-page"
import { CookieBanner }       from "./components/cookie-banner"
import { useAuthStore }       from "./store/auth-store"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/" replace />
  return <>{children}</>
}

export function App() {
  return (
    <>
      <Routes>
        <Route path="/"                       element={<CampaignsPage />} />
        <Route path="/invite/:token"          element={<InvitePage />} />
        <Route path="/campaign/:id"           element={<ProtectedRoute><CampaignDetailPage /></ProtectedRoute>} />
        <Route path="/campaign/:id/character" element={<ProtectedRoute><CharacterPage /></ProtectedRoute>} />
        <Route path="/systems"                element={<ProtectedRoute><SystemStorePage /></ProtectedRoute>} />
        <Route path="/admin"                  element={<AdminPage />} />
      </Routes>
      <CookieBanner />
    </>
  )
}
