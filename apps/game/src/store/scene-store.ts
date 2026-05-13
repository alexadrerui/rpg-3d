import { create }  from "zustand"
import type { RpgSceneFile, AnyTriggerNode, EnvironmentConfig } from "@rpg3d/schema"

type LoadState = "idle" | "loading" | "ready" | "error"

type SceneStore = {
  loadState:    LoadState
  error:        string | null
  sceneFile:    RpgSceneFile | null
  triggers:     AnyTriggerNode[]
  environment:  EnvironmentConfig | null
  disarmedTraps:  Set<string>
  revealedNotes:  Set<string>
  load:         (url: string) => Promise<void>
  clear:        () => void
  disarmTrap:   (id: string) => void
  revealNote:   (id: string) => void
}

export const useSceneStore = create<SceneStore>((set) => ({
  loadState:     "idle",
  error:         null,
  sceneFile:     null,
  triggers:      [],
  environment:   null,
  disarmedTraps: new Set(),
  revealedNotes: new Set(),

  load: async (url: string) => {
    set({ loadState: "loading", error: null })
    try {
      const res  = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as RpgSceneFile
      set({
        loadState:   "ready",
        sceneFile:   data,
        triggers:    data.triggers ?? [],
        environment: data.environment ?? null,
      })
    } catch (err) {
      set({ loadState: "error", error: String(err) })
    }
  },

  clear: () => set({
    loadState: "idle", error: null, sceneFile: null,
    triggers: [], environment: null,
    disarmedTraps: new Set(), revealedNotes: new Set(),
  }),

  disarmTrap: (id) => set(s => ({ disarmedTraps: new Set([...s.disarmedTraps, id]) })),
  revealNote: (id) => set(s => ({ revealedNotes: new Set([...s.revealedNotes, id]) })),
}))
