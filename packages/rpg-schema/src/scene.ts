import { z } from "zod"
import { AssetRef } from "./base.js"
import { AnyTriggerNode } from "./triggers.js"
import { EnvironmentConfig } from "./environment.js"

// ─────────────────────────────────────────────────────────────────────────────
// METADADOS DA CENA
// ─────────────────────────────────────────────────────────────────────────────

export const SceneMeta = z.object({
  id:          z.string().min(1),   // cuid do Prisma — não é UUID
  campaignId:  z.string().min(1),
  name:        z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  tags:        z.array(z.string()).default([]),   // ex: ["dungeon", "boss", "lv3"]
  thumbnail:   AssetRef.optional(),

  createdAt:   z.string().datetime(),
  updatedAt:   z.string().datetime(),
  createdBy:   z.string(),   // userId do mestre
  version:     z.number().int().positive().default(1),
})

// ─────────────────────────────────────────────────────────────────────────────
// ASSET MANIFEST — todos os assets que a cena referencia
// ─────────────────────────────────────────────────────────────────────────────

export const AssetManifest = z.object({
  models:   z.array(AssetRef).default([]),   // glTF / GLB
  textures: z.array(AssetRef).default([]),   // WebP / PNG / HDR
  audio:    z.array(AssetRef).default([]),   // MP3 / OGG
  videos:   z.array(AssetRef).default([]),   // MP4 / WEBM / AVI
})

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA CONFIG — playlist de áudio e configuração de vídeo da cena
// ─────────────────────────────────────────────────────────────────────────────

export const PlaylistItem = z.object({
  assetId:  z.string(),
  url:      z.string(),
  name:     z.string().optional(),
  mimeType: z.string().optional(),
})

export const MediaConfig = z.object({
  playlist: z.array(PlaylistItem).default([]),
  shuffle:  z.boolean().default(false),
  loop:     z.boolean().default(true),
  autoPlay: z.boolean().default(false),
  volume:   z.number().min(0).max(1).default(0.7),
})

export type PlaylistItem = z.infer<typeof PlaylistItem>
export type MediaConfig  = z.infer<typeof MediaConfig>

// ─────────────────────────────────────────────────────────────────────────────
// PASCAL NODE SNAPSHOT
// Não revalidamos toda a geometria Pascal aqui (pesado demais),
// mas preservamos o snapshot completo para o viewer reconstruir.
// ─────────────────────────────────────────────────────────────────────────────

export const PascalNodeSnapshot = z.object({
  // Flat dictionary exatamente como o useScene do Pascal persiste
  nodes:       z.record(z.string(), z.unknown()),
  rootNodeIds: z.array(z.string()),
})

// ─────────────────────────────────────────────────────────────────────────────
// CONTRATO PRINCIPAL: .rpgscene
// ─────────────────────────────────────────────────────────────────────────────

export const RpgSceneFile = z.object({

  // Cabeçalho de formato — versão do schema para migrações futuras
  $schema:  z.literal("rpg-scene/v1"),

  // Metadados
  meta:     SceneMeta,

  // Geometria da cena (snapshot do Pascal Editor)
  scene:    PascalNodeSnapshot,

  // Assets referenciados
  assets:   AssetManifest,

  // Triggers RPG (notas, armadilhas, spawns, transições, áudio)
  triggers: z.array(AnyTriggerNode).default([]),

  // Ambiente: névoa de guerra, luz, câmera, atmosfera
  environment: EnvironmentConfig,

  // Configuração de mídia: playlist de áudio da cena
  media: MediaConfig.optional(),

  // Estado de runtime — NÃO persistido no arquivo final,
  // existe só durante uma sessão ao vivo no Redis
  _runtime: z.object({
    activeSessionId: z.string().optional(),
    disarmedTraps:   z.array(z.string()).default([]),  // ids das armadilhas desarmadas
    revealedNotes:   z.array(z.string()).default([]),  // ids das notas reveladas
    revealedFog:     z.array(z.object({               // células de fog reveladas
      x: z.number(), z: z.number(),
    })).default([]),
  }).optional(),
})

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE VALIDAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida um arquivo .rpgscene completo.
 * Lança ZodError com mensagens detalhadas em caso de erro.
 */
export function parseSceneFile(raw: unknown): RpgSceneFile {
  return RpgSceneFile.parse(raw)
}

/**
 * Valida sem lançar — retorna success/error.
 * Útil no servidor para responder 400 com detalhes.
 */
export function safeParseSceneFile(raw: unknown) {
  return RpgSceneFile.safeParse(raw)
}

/**
 * Extrai só os triggers de um tipo específico.
 */
export function getTriggersOfType<T extends AnyTriggerNode["type"]>(
  scene: RpgSceneFile,
  type: T
) {
  return scene.triggers.filter(
    (t): t is Extract<AnyTriggerNode, { type: T }> => t.type === type
  )
}

export type SceneMeta          = z.infer<typeof SceneMeta>
export type AssetManifest      = z.infer<typeof AssetManifest>
export type PascalNodeSnapshot = z.infer<typeof PascalNodeSnapshot>
export type RpgSceneFile       = z.infer<typeof RpgSceneFile>
