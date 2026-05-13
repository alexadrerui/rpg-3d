import { z } from "zod"

// ─── Primitivos compartilhados ────────────────────────────────────────────────

export const Vec2 = z.object({
  x: z.number(),
  y: z.number(),
})

export const Vec3 = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
})

export const ColorHex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida (use #rrggbb)")

export const AssetRef = z.object({
  id:       z.string(),          // uuid do asset no object storage
  url:      z.string().url(),    // URL pública / CDN
  mimeType: z.string(),          // "model/gltf+json" | "audio/mpeg" | "image/webp" …
  sizeBytes: z.number().int().positive().optional(),
})

// ─── Base de todo node Pascal estendido ───────────────────────────────────────

export const BaseRpgNode = z.object({
  id:       z.string(),          // prefixado pelo tipo: "wall_abc123"
  type:     z.string(),          // discriminator
  parentId: z.string().nullable(),
  visible:  z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type Vec2       = z.infer<typeof Vec2>
export type Vec3       = z.infer<typeof Vec3>
export type ColorHex   = z.infer<typeof ColorHex>
export type AssetRef   = z.infer<typeof AssetRef>
export type BaseRpgNode = z.infer<typeof BaseRpgNode>
