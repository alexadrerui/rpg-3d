import { z } from "zod"
import { BaseRpgNode, Vec3, ColorHex, AssetRef } from "./base"

// ─────────────────────────────────────────────────────────────────────────────
// ZONA BASE — toda trigger é uma zona no espaço 3D
// ─────────────────────────────────────────────────────────────────────────────

export const TriggerVisibility = z.enum([
  "master_only",    // só o mestre vê o ícone no editor e no jogo
  "always",         // todos veem (ex: porta marcada)
  "on_trigger",     // aparece para o jogador ao ativar
])

export const TriggerShape = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("box"),    width: z.number(), depth: z.number(), height: z.number() }),
  z.object({ kind: z.literal("sphere"), radius: z.number() }),
  z.object({ kind: z.literal("cylinder"), radius: z.number(), height: z.number() }),
])

export const BaseTriggerNode = BaseRpgNode.extend({
  position:   Vec3,
  rotation:   Vec3.default({ x: 0, y: 0, z: 0 }),
  shape:      TriggerShape,
  visibility: TriggerVisibility.default("master_only"),
  oneShot:    z.boolean().default(false),   // dispara só uma vez por sessão?
  cooldownMs: z.number().int().min(0).default(0), // ms entre disparos
})

// ─────────────────────────────────────────────────────────────────────────────
// 1. NOTA — mestre anotou algo naquele ponto do mapa
// ─────────────────────────────────────────────────────────────────────────────

export const NoteNode = BaseTriggerNode.extend({
  type: z.literal("trigger_note"),

  title:   z.string().max(120),
  content: z.string().max(4000),   // markdown aceito
  iconColor: ColorHex.default("#f59e0b"),

  // Quando os jogadores verão essa nota?
  revealOn: z.enum([
    "never",           // só mestre lê (sempre)
    "enter_zone",      // todos veem ao entrar na zona
    "master_reveal",   // mestre escolhe revelar manualmente
  ]).default("never"),
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. ARMADILHA — efeito automático ao entrar na zona
// ─────────────────────────────────────────────────────────────────────────────

export const DamageType = z.enum([
  "piercing", "slashing", "bludgeoning",
  "fire", "cold", "lightning", "acid",
  "poison", "psychic", "necrotic", "radiant",
  "force", "thunder",
])

export const TrapEffect = z.discriminatedUnion("kind", [

  // Dano: rola dados automaticamente ao pisar
  z.object({
    kind:       z.literal("damage"),
    diceCount:  z.number().int().min(1).max(20),
    diceFaces:  z.union([z.literal(4), z.literal(6), z.literal(8), z.literal(10), z.literal(12), z.literal(20)]),
    modifier:   z.number().int().default(0),
    damageType: DamageType,
  }),

  // Condição: aplica status no personagem
  z.object({
    kind:      z.literal("condition"),
    condition: z.enum(["poisoned", "blinded", "paralyzed", "restrained", "frightened", "stunned"]),
    durationRounds: z.number().int().min(1).default(1),
  }),

  // Som: toca um áudio posicional
  z.object({
    kind:   z.literal("sound"),
    asset:  AssetRef,
    volume: z.number().min(0).max(1).default(1),
    loop:   z.boolean().default(false),
  }),

  // Animação: reproduz uma animação na cena (ex: flecha saindo da parede)
  z.object({
    kind:      z.literal("animation"),
    assetId:   z.string(),   // ref ao node que será animado
    clipName:  z.string(),   // nome do AnimationClip no glTF
    durationMs: z.number().int().positive(),
  }),

  // Custom: payload livre para o game interpreter
  z.object({
    kind:    z.literal("custom"),
    eventId: z.string(),           // identificador que o game escuta
    payload: z.record(z.string(), z.unknown()),
  }),
])

export const TrapNode = BaseTriggerNode.extend({
  type: z.literal("trigger_trap"),

  label:      z.string().max(80).optional(),    // nome interno (só mestre)
  effects:    z.array(TrapEffect).min(1).max(8), // múltiplos efeitos simultâneos
  savingThrow: z.object({                        // teste de resistência opcional
    attribute: z.enum(["strength","dexterity","constitution","intelligence","wisdom","charisma"]),
    dc:        z.number().int().min(1).max(30),
    onSuccess: z.enum(["no_effect","half_effect"]).default("half_effect"),
  }).optional(),

  isHidden:    z.boolean().default(true),        // armadilha detectável (Percepção)?
  detectDc:    z.number().int().min(1).max(30).optional(),
  disarmDc:    z.number().int().min(1).max(30).optional(),
  isDisarmed:  z.boolean().default(false),       // estado em tempo de execução
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. SPAWN POINT — posição inicial de personagem ou NPC
// ─────────────────────────────────────────────────────────────────────────────

export const SpawnNode = BaseTriggerNode.extend({
  type: z.literal("trigger_spawn"),

  label:        z.string().max(80).optional(),
  forRole:      z.enum(["player", "npc", "enemy", "any"]).default("any"),
  characterId:  z.string().optional(),    // pré-atribuir a um personagem específico
  facing:       z.number().min(0).max(360).default(0), // graus Y
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. ZONA DE TRANSIÇÃO — porta para outra cena
// ─────────────────────────────────────────────────────────────────────────────

export const TransitionNode = BaseTriggerNode.extend({
  type: z.literal("trigger_transition"),

  label:          z.string().max(80).optional(),
  targetSceneId:  z.string(),        // id da cena destino no banco
  targetSpawnId:  z.string().optional(), // spawn point de chegada
  transitionFx:   z.enum(["fade", "dissolve", "none"]).default("fade"),
  requiresKey:    z.string().optional(), // item/flag que o jogador precisa ter
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. ZONA DE ÁUDIO AMBIENTE — muda o áudio ao entrar na área
// ─────────────────────────────────────────────────────────────────────────────

export const AmbientAudioNode = BaseTriggerNode.extend({
  type: z.literal("trigger_ambient_audio"),

  asset:      AssetRef,
  volume:     z.number().min(0).max(1).default(0.6),
  loop:       z.boolean().default(true),
  fadeInMs:   z.number().int().min(0).default(1000),
  fadeOutMs:  z.number().int().min(0).default(1000),
  spatial:    z.boolean().default(false), // 3D posicional ou global?
})

// ─────────────────────────────────────────────────────────────────────────────
// UNION — qualquer trigger node
// ─────────────────────────────────────────────────────────────────────────────

export const AnyTriggerNode = z.discriminatedUnion("type", [
  NoteNode,
  TrapNode,
  SpawnNode,
  TransitionNode,
  AmbientAudioNode,
])

export type TriggerVisibility  = z.infer<typeof TriggerVisibility>
export type TriggerShape       = z.infer<typeof TriggerShape>
export type TrapEffect         = z.infer<typeof TrapEffect>
export type NoteNode           = z.infer<typeof NoteNode>
export type TrapNode           = z.infer<typeof TrapNode>
export type SpawnNode          = z.infer<typeof SpawnNode>
export type TransitionNode     = z.infer<typeof TransitionNode>
export type AmbientAudioNode   = z.infer<typeof AmbientAudioNode>
export type AnyTriggerNode     = z.infer<typeof AnyTriggerNode>
