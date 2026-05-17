import { create } from "zustand"

const TOKEN_KEY      = "rpg3d-editor-token"
const API_URL_KEY    = "rpg3d-editor-api-url"
const CAMPAIGN_KEY   = "rpg3d-editor-campaign"
const SCENE_NAME_KEY = "rpg3d-editor-scene-name"

function ls(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback
  return localStorage.getItem(key) ?? fallback
}

interface EditorAuthState {
  token:      string | null
  apiUrl:     string
  campaignId: string
  sceneName:  string
  setToken:      (t: string) => void
  setApiUrl:     (u: string) => void
  setCampaignId: (id: string) => void
  setSceneName:  (n: string) => void
  clear:         () => void
}

export const useEditorAuthStore = create<EditorAuthState>((set) => ({
  token:      ls(TOKEN_KEY,      ""),
  apiUrl:     ls(API_URL_KEY,    "http://localhost:4000"),
  campaignId: ls(CAMPAIGN_KEY,   ""),
  sceneName:  ls(SCENE_NAME_KEY, "Cenário exportado"),

  setToken: (token) => {
    if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token)
    set({ token: token || null })
  },
  setApiUrl: (apiUrl) => {
    if (typeof window !== "undefined") localStorage.setItem(API_URL_KEY, apiUrl)
    set({ apiUrl })
  },
  setCampaignId: (campaignId) => {
    if (typeof window !== "undefined") localStorage.setItem(CAMPAIGN_KEY, campaignId)
    set({ campaignId })
  },
  setSceneName: (sceneName) => {
    if (typeof window !== "undefined") localStorage.setItem(SCENE_NAME_KEY, sceneName)
    set({ sceneName })
  },
  clear: () => {
    if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY)
    set({ token: null })
  },
}))
