import { z } from "zod"
import { ColorHex, AssetRef } from "./base.js"

// ─────────────────────────────────────────────────────────────────────────────
// NÉVOA DE GUERRA
// ─────────────────────────────────────────────────────────────────────────────

export const FogOfWarConfig = z.object({
  enabled:         z.boolean().default(false),
  color:           ColorHex.default("#000000"),
  opacity:         z.number().min(0).max(1).default(0.92),
  revealRadius:    z.number().positive().default(5),   // unidades world
  revealMode:      z.enum([
    "circle",      // círculo ao redor do token
    "raycast",     // linha de visão real (mais pesado)
    "room",        // revela a sala inteira ao entrar
  ]).default("circle"),
  persistRevealed: z.boolean().default(true),  // área revelada fica visível?
})

// ─────────────────────────────────────────────────────────────────────────────
// ILUMINAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

export const AmbientLightConfig = z.object({
  color:     ColorHex.default("#ffffff"),
  intensity: z.number().min(0).max(10).default(0.4),
})

export const DirectionalLightConfig = z.object({
  enabled:   z.boolean().default(true),
  color:     ColorHex.default("#fff4e0"),
  intensity: z.number().min(0).max(10).default(0.8),
  position:  z.object({ x: z.number(), y: z.number(), z: z.number() })
              .default({ x: 10, y: 20, z: 10 }),
  castShadow: z.boolean().default(true),
})

export const LightingConfig = z.object({
  ambient:     AmbientLightConfig.default({} as any),
  directional: DirectionalLightConfig.default({} as any),
  toneMappingExposure: z.number().min(0).max(4).default(1),
})

// ─────────────────────────────────────────────────────────────────────────────
// ATMOSFERA
// ─────────────────────────────────────────────────────────────────────────────

export const AtmosphereConfig = z.object({
  skybox: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("color"),  color: ColorHex }),
    z.object({ kind: z.literal("asset"),  asset: AssetRef }),  // HDR / cubemap
    z.object({ kind: z.literal("none") }),
  ]).default({ kind: "color", color: "#1a1a2e" }),

  fog: z.object({
    enabled: z.boolean().default(false),
    color:   ColorHex.default("#1a1a2e"),
    near:    z.number().positive().default(10),
    far:     z.number().positive().default(50),
  }).default({} as any),

  ambientSound: AssetRef.optional(),  // trilha ambiente da cena
})

// ─────────────────────────────────────────────────────────────────────────────
// CÂMERA PADRÃO DA CENA
// ─────────────────────────────────────────────────────────────────────────────

export const CameraConfig = z.object({
  mode: z.enum([
    "isometric",   // RPG tático clássico (45° fixo)
    "top_down",    // visão de cima
    "free_orbit",  // câmera livre (modo editor/mestre)
    "first_person",
  ]).default("isometric"),

  defaultPosition: z.object({ x: z.number(), y: z.number(), z: z.number() })
                    .default({ x: 0, y: 20, z: 20 }),
  defaultTarget:   z.object({ x: z.number(), y: z.number(), z: z.number() })
                    .default({ x: 0, y: 0, z: 0 }),

  minZoom: z.number().positive().default(5),
  maxZoom: z.number().positive().default(50),

  // Limites de pan (undefined = sem limite)
  bounds: z.object({
    minX: z.number(), maxX: z.number(),
    minZ: z.number(), maxZ: z.number(),
  }).optional(),
})

// ─────────────────────────────────────────────────────────────────────────────
// ENVIRONMENT CONFIG (agrupador)
// ─────────────────────────────────────────────────────────────────────────────

export const EnvironmentConfig = z.object({
  fogOfWar:   FogOfWarConfig.default({} as any),
  lighting:   LightingConfig.default({} as any),
  atmosphere: AtmosphereConfig.default({} as any),
  camera:     CameraConfig.default({} as any),
})

export type FogOfWarConfig      = z.infer<typeof FogOfWarConfig>
export type LightingConfig      = z.infer<typeof LightingConfig>
export type AtmosphereConfig    = z.infer<typeof AtmosphereConfig>
export type CameraConfig        = z.infer<typeof CameraConfig>
export type EnvironmentConfig   = z.infer<typeof EnvironmentConfig>
