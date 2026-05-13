import { Routes, Route } from "react-router-dom"
import { CampaignsPage } from "./pages/campaigns-page"
import { CharacterPage } from "./pages/character-page"
import { InvitePage }    from "./pages/invite-page"

export function App() {
  return (
    <Routes>
      <Route path="/"                        element={<CampaignsPage />} />
      <Route path="/campaign/:id"            element={<CampaignsPage />} />
      <Route path="/campaign/:id/character"  element={<CharacterPage />} />
      <Route path="/invite/:token"           element={<InvitePage />} />
    </Routes>
  )
}
