import { create } from "zustand"
import { persist }  from "zustand/middleware"

// ─────────────────────────────────────────────────────────────────────────────
// Auth store — token JWT + dados do usuário atual
// Em produção: token vem do login no dashboard
// Em dev: gerado automaticamente como guest
// ─────────────────────────────────────────────────────────────────────────────

type AuthStore = {
  token:       string
  userId:      string
  name:        string
  campaignId:  string
  characterId: string | undefined
  isMaster:    boolean

  setAuth: (data: {
    token: string; userId: string; name: string
    campaignId: string; characterId?: string; isMaster?: boolean
  }) => void
  clear: () => void
}

// Dev: gera um token fake que o game-server aceita em mode dev
function devToken(): string {
  return "dev-token-" + Math.random().toString(36).slice(2)
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token:       devToken(),
      userId:      "dev-user",
      name:        "Aventureiro",
      campaignId:  "",
      characterId: undefined,
      isMaster:    false,

      setAuth: (data) => set({
        token:       data.token,
        userId:      data.userId,
        name:        data.name,
        campaignId:  data.campaignId,
        characterId: data.characterId,
        isMaster:    data.isMaster ?? false,
      }),

      clear: () => set({
        token:       devToken(),
        userId:      "dev-user",
        name:        "Aventureiro",
        campaignId:  "",
        characterId: undefined,
        isMaster:    false,
      }),
    }),
    { name: "rpg3d-auth" }
  )
)
