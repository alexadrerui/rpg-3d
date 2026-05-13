"use client"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { EnvironmentConfig, FogOfWarConfig, LightingConfig, AtmosphereConfig, CameraConfig } from "@rpg3d/schema"

// ─────────────────────────────────────────────────────────────────────────────
// Defaults — espelha os defaults do schema Zod
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_ENVIRONMENT: EnvironmentConfig = {
  fogOfWar: {
    enabled:         false,
    color:           "#000000",
    opacity:         0.92,
    revealRadius:    5,
    revealMode:      "circle",
    persistRevealed: true,
  },
  lighting: {
    ambient:     { color: "#ffffff", intensity: 0.4 },
    directional: {
      enabled:    true,
      color:      "#fff4e0",
      intensity:  0.8,
      position:   { x: 10, y: 20, z: 10 },
      castShadow: true,
    },
    toneMappingExposure: 1,
  },
  atmosphere: {
    skybox: { kind: "color", color: "#1a1a2e" },
    fog:    { enabled: false, color: "#1a1a2e", near: 10, far: 50 },
  },
  camera: {
    mode:            "isometric",
    defaultPosition: { x: 0, y: 20, z: 20 },
    defaultTarget:   { x: 0, y: 0,  z: 0  },
    minZoom: 5,
    maxZoom: 50,
  },
}

// Presets rápidos — aplicados de uma vez
export type EnvPreset = "dungeon" | "forest" | "tavern" | "daylit" | "void"

export const ENV_PRESETS: Record<EnvPreset, EnvironmentConfig> = {
  dungeon: {
    fogOfWar:   { enabled: true, color: "#000000", opacity: 0.95, revealRadius: 4, revealMode: "circle", persistRevealed: true },
    lighting:   { ambient: { color: "#1a0a2e", intensity: 0.2 }, directional: { enabled: true, color: "#6040a0", intensity: 0.5, position: { x:5, y:15, z:5 }, castShadow: true }, toneMappingExposure: 0.8 },
    atmosphere: { skybox: { kind: "color", color: "#0a0010" }, fog: { enabled: true, color: "#0a0010", near: 8, far: 30 } },
    camera:     { mode: "isometric", defaultPosition: { x:0, y:20, z:20 }, defaultTarget: { x:0, y:0, z:0 }, minZoom: 5, maxZoom: 40 },
  },
  forest: {
    fogOfWar:   { enabled: true, color: "#0a1a0a", opacity: 0.85, revealRadius: 6, revealMode: "raycast", persistRevealed: true },
    lighting:   { ambient: { color: "#1a2e1a", intensity: 0.35 }, directional: { enabled: true, color: "#c8e87a", intensity: 0.7, position: { x:8, y:18, z:8 }, castShadow: true }, toneMappingExposure: 0.9 },
    atmosphere: { skybox: { kind: "color", color: "#0f1a0f" }, fog: { enabled: true, color: "#0f1a0f", near: 12, far: 40 } },
    camera:     { mode: "isometric", defaultPosition: { x:0, y:20, z:20 }, defaultTarget: { x:0, y:0, z:0 }, minZoom: 5, maxZoom: 45 },
  },
  tavern: {
    fogOfWar:   { enabled: false, color: "#000000", opacity: 0.9, revealRadius: 5, revealMode: "room", persistRevealed: true },
    lighting:   { ambient: { color: "#3d2a0f", intensity: 0.5 }, directional: { enabled: true, color: "#f4a030", intensity: 0.9, position: { x:0, y:10, z:0 }, castShadow: true }, toneMappingExposure: 1.1 },
    atmosphere: { skybox: { kind: "color", color: "#1a1008" }, fog: { enabled: false, color: "#1a1008", near: 15, far: 50 } },
    camera:     { mode: "isometric", defaultPosition: { x:0, y:18, z:18 }, defaultTarget: { x:0, y:0, z:0 }, minZoom: 6, maxZoom: 35 },
  },
  daylit: {
    fogOfWar:   { enabled: false, color: "#000000", opacity: 0.9, revealRadius: 8, revealMode: "circle", persistRevealed: false },
    lighting:   { ambient: { color: "#d0e8ff", intensity: 0.6 }, directional: { enabled: true, color: "#fff8e1", intensity: 1.2, position: { x:15, y:25, z:10 }, castShadow: true }, toneMappingExposure: 1.2 },
    atmosphere: { skybox: { kind: "color", color: "#87ceeb" }, fog: { enabled: false, color: "#87ceeb", near: 20, far: 80 } },
    camera:     { mode: "isometric", defaultPosition: { x:0, y:22, z:22 }, defaultTarget: { x:0, y:0, z:0 }, minZoom: 5, maxZoom: 60 },
  },
  void: {
    fogOfWar:   { enabled: false, color: "#000000", opacity: 1, revealRadius: 3, revealMode: "circle", persistRevealed: false },
    lighting:   { ambient: { color: "#080808", intensity: 0.1 }, directional: { enabled: false, color: "#ffffff", intensity: 0, position: { x:0, y:10, z:0 }, castShadow: false }, toneMappingExposure: 0.5 },
    atmosphere: { skybox: { kind: "none" }, fog: { enabled: true, color: "#000000", near: 5, far: 20 } },
    camera:     { mode: "isometric", defaultPosition: { x:0, y:20, z:20 }, defaultTarget: { x:0, y:0, z:0 }, minZoom: 5, maxZoom: 40 },
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

type EnvironmentStore = {
  env: EnvironmentConfig

  // Setters granulares
  setFogOfWar:   (patch: Partial<FogOfWarConfig>)   => void
  setLighting:   (patch: Partial<LightingConfig>)   => void
  setAtmosphere: (patch: Partial<AtmosphereConfig>) => void
  setCamera:     (patch: Partial<CameraConfig>)     => void

  // Preset
  applyPreset: (preset: EnvPreset) => void
  reset:       () => void
}

export const useEnvironmentStore = create<EnvironmentStore>()(
  persist(
    (set) => ({
      env: { ...DEFAULT_ENVIRONMENT },

      setFogOfWar:   (patch) => set(s => ({ env: { ...s.env, fogOfWar:   { ...s.env.fogOfWar,   ...patch } } })),
      setLighting:   (patch) => set(s => ({ env: { ...s.env, lighting:   { ...s.env.lighting,   ...patch } } })),
      setAtmosphere: (patch) => set(s => ({ env: { ...s.env, atmosphere: { ...s.env.atmosphere, ...patch } } })),
      setCamera:     (patch) => set(s => ({ env: { ...s.env, camera:     { ...s.env.camera,     ...patch } } })),

      applyPreset: (preset) => set({ env: { ...ENV_PRESETS[preset] } }),
      reset:       ()       => set({ env: { ...DEFAULT_ENVIRONMENT } }),
    }),
    { name: "rpg3d-editor-environment" }
  )
)
