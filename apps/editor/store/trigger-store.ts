import { create } from "zustand"
import type { AnyTriggerNode, NoteNode, TrapNode, SpawnNode, TransitionNode, AmbientAudioNode } from "@rpg3d/schema"

// ─────────────────────────────────────────────────────────────────────────────
// Trigger store do editor — gerencia os triggers colocados na cena
// ─────────────────────────────────────────────────────────────────────────────

type TriggerTool =
  | "select"
  | "note"
  | "trap"
  | "spawn"
  | "transition"
  | "ambient_audio"
  | null

type TriggerStore = {
  // Triggers colocados na cena atual
  triggers:        AnyTriggerNode[]

  // Tool ativa na toolbar
  activeTool:      TriggerTool
  setActiveTool:   (t: TriggerTool) => void

  // Trigger selecionado no painel de edição
  selectedId:      string | null
  setSelectedId:   (id: string | null) => void

  // CRUD
  addTrigger:      (t: AnyTriggerNode) => void
  updateTrigger:   (id: string, patch: Partial<AnyTriggerNode>) => void
  removeTrigger:   (id: string) => void
  setTriggers:     (triggers: AnyTriggerNode[]) => void
}

export const useTriggerStore = create<TriggerStore>((set, get) => ({
  triggers:      [],
  activeTool:    null,
  selectedId:    null,

  setActiveTool: (activeTool) => set({ activeTool, selectedId: null }),
  setSelectedId: (selectedId) => set({ selectedId }),

  addTrigger: (trigger) =>
    set(s => ({ triggers: [...s.triggers, trigger] })),

  updateTrigger: (id, patch) =>
    set(s => ({
      triggers: s.triggers.map(t => t.id === id ? { ...t, ...patch } as AnyTriggerNode : t)
    })),

  removeTrigger: (id) =>
    set(s => ({
      triggers:   s.triggers.filter(t => t.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  setTriggers: (triggers) => set({ triggers }),
}))

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de criação com defaults sensatos
// ─────────────────────────────────────────────────────────────────────────────

export function makeNote(pos: { x: number; y: number; z: number }): NoteNode {
  return {
    id:       `trigger_note_${uid()}`,
    type:     "trigger_note",
    parentId: null,
    visible:  true,
    position: pos,
    rotation: { x: 0, y: 0, z: 0 },
    shape:    { kind: "sphere", radius: 1.5 },
    visibility:  "master_only",
    oneShot:     false,
    cooldownMs:  0,
    title:       "Nova nota",
    content:     "",
    iconColor:   "#f59e0b",
    revealOn:    "never",
  }
}

export function makeTrap(pos: { x: number; y: number; z: number }): TrapNode {
  return {
    id:       `trigger_trap_${uid()}`,
    type:     "trigger_trap",
    parentId: null,
    visible:  true,
    position: pos,
    rotation: { x: 0, y: 0, z: 0 },
    shape:    { kind: "box", width: 1, depth: 1, height: 2 },
    visibility:  "master_only",
    oneShot:     false,
    cooldownMs:  0,
    effects:     [{
      kind:       "damage",
      diceCount:  1,
      diceFaces:  6,
      modifier:   0,
      damageType: "piercing",
    }],
    isHidden:    true,
    isDisarmed:  false,
  }
}

export function makeSpawn(pos: { x: number; y: number; z: number }): SpawnNode {
  return {
    id:       `trigger_spawn_${uid()}`,
    type:     "trigger_spawn",
    parentId: null,
    visible:  true,
    position: pos,
    rotation: { x: 0, y: 0, z: 0 },
    shape:    { kind: "cylinder", radius: 1, height: 0.1 },
    visibility: "master_only",
    oneShot:    false,
    cooldownMs: 0,
    forRole:    "any",
    facing:     0,
  }
}

export function makeTransition(pos: { x: number; y: number; z: number }): TransitionNode {
  return {
    id:       `trigger_transition_${uid()}`,
    type:     "trigger_transition",
    parentId: null,
    visible:  true,
    position: pos,
    rotation: { x: 0, y: 0, z: 0 },
    shape:    { kind: "box", width: 0.5, depth: 2, height: 3 },
    visibility:     "always",
    oneShot:        false,
    cooldownMs:     0,
    targetSceneId:  "",
    transitionFx:   "fade",
  }
}

export function makeAmbientAudio(pos: { x: number; y: number; z: number }): AmbientAudioNode {
  return {
    id:       `trigger_ambient_audio_${uid()}`,
    type:     "trigger_ambient_audio",
    parentId: null,
    visible:  true,
    position: pos,
    rotation: { x: 0, y: 0, z: 0 },
    shape:    { kind: "sphere", radius: 8 },
    visibility: "master_only",
    oneShot:    false,
    cooldownMs: 0,
    asset:      { id: "", url: "https://", mimeType: "audio/ogg" },
    volume:     0.6,
    loop:       true,
    fadeInMs:   1000,
    fadeOutMs:  1000,
    spatial:    false,
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}
