import { create } from "zustand"
import { persist } from "zustand/middleware"

export type MaterialPreset = "plastic" | "metal" | "glass" | "chrome" | "stone" | "wood"
export type SpeedPreset    = "slow" | "normal" | "fast"
export type ForcePreset    = "weak" | "medium" | "strong"

export interface DiceAppearance {
  diceColor:  string
  labelColor: string
  edgeColor:  string
  material:   MaterialPreset
}

export interface DiceDisplay {
  speed:         SpeedPreset
  throwingForce: ForcePreset
  autoHideDelay: number  // seconds the result stays visible after settling
}

// PBR properties per material preset (based on Dice So Nice's MeshPhysicalMaterial approach)
export const MATERIAL_PROPS: Record<MaterialPreset, {
  roughness: number
  metalness: number
  transparent?: boolean
  opacity?: number
}> = {
  plastic: { roughness: 0.70, metalness: 0.00 },
  metal:   { roughness: 0.28, metalness: 0.90 },
  glass:   { roughness: 0.04, metalness: 0.10, transparent: true, opacity: 0.78 },
  chrome:  { roughness: 0.05, metalness: 1.00 },
  stone:   { roughness: 0.92, metalness: 0.04 },
  wood:    { roughness: 0.86, metalness: 0.00 },
}

// Roll + result phase durations in ms per speed setting
export const SPEED_MS: Record<SpeedPreset, { roll: number; result: number }> = {
  slow:   { roll: 3800, result: 2400 },
  normal: { roll: 2600, result: 1600 },
  fast:   { roll: 1400, result: 1000 },
}

// Velocity multipliers per throwing force preset
export const FORCE_MUL: Record<ForcePreset, { vel: number; ang: number }> = {
  weak:   { vel: 0.50, ang: 0.55 },
  medium: { vel: 1.00, ang: 1.00 },
  strong: { vel: 1.75, ang: 1.50 },
}

// Pre-built colorsets — inspired by Dice So Nice's theme catalog
export const COLORSETS: Record<string, DiceAppearance> = {
  "Padrão":        { diceColor: "#1a1a2e", labelColor: "#ffffff", edgeColor: "#2d2d6b", material: "plastic" },
  "Lua de Sangue": { diceColor: "#7a0000", labelColor: "#ffcccc", edgeColor: "#cc2200", material: "metal"   },
  "Mar Astral":    { diceColor: "#0a0d45", labelColor: "#88ccff", edgeColor: "#1a3acc", material: "chrome"  },
  "Esmeralda":     { diceColor: "#0c3d22", labelColor: "#c8ffdd", edgeColor: "#1a7a44", material: "metal"   },
  "Obsidiana":     { diceColor: "#0d0d0d", labelColor: "#cc9900", edgeColor: "#222222", material: "stone"   },
  "Pérola":        { diceColor: "#eef4ff", labelColor: "#223344", edgeColor: "#cce0ff", material: "glass"   },
  "Fogo":          { diceColor: "#cc1e00", labelColor: "#ffdd00", edgeColor: "#ff5500", material: "metal"   },
  "Gelo":          { diceColor: "#7ab4f5", labelColor: "#002244", edgeColor: "#9dd0ff", material: "glass"   },
  "Cromo":         { diceColor: "#888888", labelColor: "#ffffff", edgeColor: "#cccccc", material: "chrome"  },
  "Floresta":      { diceColor: "#2a4518", labelColor: "#d4eebc", edgeColor: "#4a7c30", material: "wood"    },
}

interface DiceSettingsStore {
  appearance: DiceAppearance
  display:    DiceDisplay

  setAppearance: (a: Partial<DiceAppearance>) => void
  setDisplay:    (d: Partial<DiceDisplay>)    => void
  applyColorset: (name: string)               => void
}

export const useDiceSettings = create<DiceSettingsStore>()(
  persist(
    (set) => ({
      appearance: COLORSETS["Padrão"]!,
      display:    { speed: "normal", throwingForce: "medium", autoHideDelay: 4 },

      setAppearance: (a) => set((s) => ({ appearance: { ...s.appearance, ...a } })),
      setDisplay:    (d) => set((s) => ({ display:    { ...s.display,    ...d } })),
      applyColorset: (name) => {
        const cs: DiceAppearance | undefined = COLORSETS[name]
        if (!cs) return
        set({ appearance: cs })
      },
    }),
    { name: "rpg3d-dice-settings-v1" },
  ),
)
