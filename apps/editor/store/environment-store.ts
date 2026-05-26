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
    skybox:      { kind: "color", color: "#1a1a2e" },
    fog:         { enabled: false, color: "#1a1a2e", near: 10, far: 50 },
    physicalSky: { enabled: false, timeOfDay: 10, clouds: { enabled: false, coverage: 0.35 } },
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
export type EnvPreset =
  | "dungeon" | "forest" | "tavern" | "daylit" | "void"
  | "abandoned" | "horror" | "crypt"
  | "outdoor" | "sunset"

export const ENV_PRESETS: Record<EnvPreset, EnvironmentConfig> = {
  dungeon: {
    fogOfWar:   { enabled: true, color: "#000000", opacity: 0.95, revealRadius: 4, revealMode: "circle", persistRevealed: true },
    lighting:   { ambient: { color: "#1a0a2e", intensity: 0.2 }, directional: { enabled: true, color: "#6040a0", intensity: 0.5, position: { x:5, y:15, z:5 }, castShadow: true }, toneMappingExposure: 0.8 },
    atmosphere: { skybox: { kind: "color", color: "#0a0010" }, fog: { enabled: true, color: "#0a0010", near: 8, far: 30 }, physicalSky: { enabled: false, timeOfDay: 10, clouds: { enabled: false, coverage: 0.35 } } },
    camera:     { mode: "isometric", defaultPosition: { x:0, y:20, z:20 }, defaultTarget: { x:0, y:0, z:0 }, minZoom: 5, maxZoom: 40 },
  },
  forest: {
    fogOfWar:   { enabled: true, color: "#0a1a0a", opacity: 0.85, revealRadius: 6, revealMode: "raycast", persistRevealed: true },
    lighting:   { ambient: { color: "#1a2e1a", intensity: 0.35 }, directional: { enabled: true, color: "#c8e87a", intensity: 0.7, position: { x:8, y:18, z:8 }, castShadow: true }, toneMappingExposure: 0.9 },
    atmosphere: { skybox: { kind: "color", color: "#0f1a0f" }, fog: { enabled: true, color: "#0f1a0f", near: 12, far: 40 }, physicalSky: { enabled: false, timeOfDay: 10, clouds: { enabled: false, coverage: 0.35 } } },
    camera:     { mode: "isometric", defaultPosition: { x:0, y:20, z:20 }, defaultTarget: { x:0, y:0, z:0 }, minZoom: 5, maxZoom: 45 },
  },
  tavern: {
    fogOfWar:   { enabled: false, color: "#000000", opacity: 0.9, revealRadius: 5, revealMode: "room", persistRevealed: true },
    lighting:   { ambient: { color: "#3d2a0f", intensity: 0.5 }, directional: { enabled: true, color: "#f4a030", intensity: 0.9, position: { x:0, y:10, z:0 }, castShadow: true }, toneMappingExposure: 1.1 },
    atmosphere: { skybox: { kind: "color", color: "#1a1008" }, fog: { enabled: false, color: "#1a1008", near: 15, far: 50 }, physicalSky: { enabled: false, timeOfDay: 10, clouds: { enabled: false, coverage: 0.35 } } },
    camera:     { mode: "isometric", defaultPosition: { x:0, y:18, z:18 }, defaultTarget: { x:0, y:0, z:0 }, minZoom: 6, maxZoom: 35 },
  },
  daylit: {
    fogOfWar:   { enabled: false, color: "#000000", opacity: 0.9, revealRadius: 8, revealMode: "circle", persistRevealed: false },
    lighting:   { ambient: { color: "#d0e8ff", intensity: 0.6 }, directional: { enabled: true, color: "#fff8e1", intensity: 1.2, position: { x:15, y:25, z:10 }, castShadow: true }, toneMappingExposure: 1.2 },
    atmosphere: { skybox: { kind: "color", color: "#87ceeb" }, fog: { enabled: false, color: "#87ceeb", near: 20, far: 80 }, physicalSky: { enabled: false, timeOfDay: 12 } },
    camera:     { mode: "isometric", defaultPosition: { x:0, y:22, z:22 }, defaultTarget: { x:0, y:0, z:0 }, minZoom: 5, maxZoom: 60 },
  },
  void: {
    fogOfWar:   { enabled: false, color: "#000000", opacity: 1, revealRadius: 3, revealMode: "circle", persistRevealed: false },
    lighting:   { ambient: { color: "#080808", intensity: 0.1 }, directional: { enabled: false, color: "#ffffff", intensity: 0, position: { x:0, y:10, z:0 }, castShadow: false }, toneMappingExposure: 0.5 },
    atmosphere: { skybox: { kind: "none" }, fog: { enabled: true, color: "#000000", near: 5, far: 20 }, physicalSky: { enabled: false, timeOfDay: 10, clouds: { enabled: false, coverage: 0.35 } } },
    camera:     { mode: "isometric", defaultPosition: { x:0, y:20, z:20 }, defaultTarget: { x:0, y:0, z:0 }, minZoom: 5, maxZoom: 40 },
  },

  // ── Presets horror / dark ──────────────────────────────────────────────────

  // Prédio abandonado, luz fria, névoa teal no chão (estética da imagem de referência)
  abandoned: {
    fogOfWar:   { enabled: true, color: "#000000", opacity: 0.97, revealRadius: 4, revealMode: "room", persistRevealed: true },
    lighting:   { ambient: { color: "#0a1a1f", intensity: 0.18 }, directional: { enabled: true, color: "#4cc9d0", intensity: 0.35, position: { x:-5, y:12, z:8 }, castShadow: true }, toneMappingExposure: 0.7 },
    atmosphere: { skybox: { kind: "color", color: "#050d10" }, fog: { enabled: true, color: "#061618", near: 6, far: 28 }, physicalSky: { enabled: false, timeOfDay: 10, clouds: { enabled: false, coverage: 0.35 } } },
    camera:     { mode: "isometric", defaultPosition: { x:0, y:20, z:20 }, defaultTarget: { x:0, y:0, z:0 }, minZoom: 5, maxZoom: 40 },
  },

  // Horror clássico: vermelho sangue, visibilidade mínima, névoa pesada
  horror: {
    fogOfWar:   { enabled: true, color: "#0a0000", opacity: 0.97, revealRadius: 3, revealMode: "raycast", persistRevealed: true },
    lighting:   { ambient: { color: "#1a0000", intensity: 0.12 }, directional: { enabled: true, color: "#8b0000", intensity: 0.4, position: { x:0, y:15, z:5 }, castShadow: true }, toneMappingExposure: 0.65 },
    atmosphere: { skybox: { kind: "color", color: "#080000" }, fog: { enabled: true, color: "#0a0000", near: 5, far: 18 }, physicalSky: { enabled: false, timeOfDay: 10, clouds: { enabled: false, coverage: 0.35 } } },
    camera:     { mode: "isometric", defaultPosition: { x:0, y:20, z:20 }, defaultTarget: { x:0, y:0, z:0 }, minZoom: 5, maxZoom: 35 },
  },

  // Cripta subterrânea: violeta frio, salas reveladas por modo room, névoa densa
  crypt: {
    fogOfWar:   { enabled: true, color: "#000008", opacity: 0.98, revealRadius: 3.5, revealMode: "room", persistRevealed: true },
    lighting:   { ambient: { color: "#0a0818", intensity: 0.15 }, directional: { enabled: true, color: "#5530a0", intensity: 0.3, position: { x:3, y:14, z:3 }, castShadow: true }, toneMappingExposure: 0.6 },
    atmosphere: { skybox: { kind: "color", color: "#040008" }, fog: { enabled: true, color: "#060010", near: 5, far: 22 }, physicalSky: { enabled: false, timeOfDay: 10, clouds: { enabled: false, coverage: 0.35 } } },
    camera:     { mode: "isometric", defaultPosition: { x:0, y:20, z:20 }, defaultTarget: { x:0, y:0, z:0 }, minZoom: 5, maxZoom: 38 },
  },

  // ── Presets exteriores com céu físico ─────────────────────────────────────

  // Campo aberto, tarde ensolarada — céu físico ativo
  outdoor: {
    fogOfWar:   { enabled: false, color: "#000000", opacity: 0.9, revealRadius: 10, revealMode: "circle", persistRevealed: false },
    lighting:   { ambient: { color: "#c8dff0", intensity: 0.5 }, directional: { enabled: true, color: "#fff8e1", intensity: 1.1, position: { x:30, y:60, z:20 }, castShadow: true }, toneMappingExposure: 1.1 },
    atmosphere: { skybox: { kind: "color", color: "#87ceeb" }, fog: { enabled: false, color: "#b0d8f0", near: 40, far: 120 }, physicalSky: { enabled: true, timeOfDay: 14, clouds: { enabled: true, coverage: 0.35 } } },
    camera:     { mode: "isometric", defaultPosition: { x:0, y:22, z:22 }, defaultTarget: { x:0, y:0, z:0 }, minZoom: 5, maxZoom: 70 },
  },

  // Pôr do sol: céu laranja-vermelho, luz rasante dramática
  sunset: {
    fogOfWar:   { enabled: false, color: "#200800", opacity: 0.85, revealRadius: 8, revealMode: "circle", persistRevealed: false },
    lighting:   { ambient: { color: "#2a1005", intensity: 0.4 }, directional: { enabled: true, color: "#ff6020", intensity: 0.9, position: { x:60, y:8, z:20 }, castShadow: true }, toneMappingExposure: 1.0 },
    atmosphere: { skybox: { kind: "color", color: "#331000" }, fog: { enabled: true, color: "#401808", near: 30, far: 100 }, physicalSky: { enabled: true, timeOfDay: 18.5, clouds: { enabled: true, coverage: 0.55 } } },
    camera:     { mode: "isometric", defaultPosition: { x:0, y:22, z:22 }, defaultTarget: { x:0, y:0, z:0 }, minZoom: 5, maxZoom: 65 },
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
