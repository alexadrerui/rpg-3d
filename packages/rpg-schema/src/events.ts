import { z } from "zod"
import { AnyTriggerNode } from "./triggers.js"
import { Vec3 } from "./base.js"

// ─────────────────────────────────────────────────────────────────────────────
// EVENTOS WEBSOCKET — contrato entre game-server e clientes
// Cada evento tem: direção (C→S cliente para server, S→C server para cliente)
// ─────────────────────────────────────────────────────────────────────────────

// ── SESSÃO ──────────────────────────────────────────────────────────────────

export const AvatarType = z.enum(["none", "image", "model"])
export type AvatarType = z.infer<typeof AvatarType>

/** C→S: jogador/mestre entra na sala */
export const EvJoinRoom = z.object({
  campaignId:  z.string().uuid(),
  sessionId:   z.string().uuid(),
  characterId: z.string().optional(),   // undefined = mestre
  token:       z.string(),              // JWT
  avatarType:  AvatarType.optional(),
  avatarUrl:   z.string().optional(),   // URL da imagem ou modelo .glb
})

/** Participante serializado nos eventos de sala */
export const EvParticipant = z.object({
  userId:      z.string(),
  characterId: z.string().optional(),
  isMaster:    z.boolean(),
  isOnline:    z.boolean(),
  name:        z.string().optional(),
  avatarType:  AvatarType.optional(),
  avatarUrl:   z.string().optional(),
})
export type EvParticipant = z.infer<typeof EvParticipant>

/** S→C: confirmação de entrada com estado atual */
export const EvRoomJoined = z.object({
  sessionId:    z.string().uuid(),
  sceneId:      z.string().uuid(),
  participants: z.array(EvParticipant),
})

// ── CENA ─────────────────────────────────────────────────────────────────────

/** C→S (mestre): carrega uma cena na sala */
export const EvLoadScene = z.object({
  sceneId:      z.string().uuid(),
  transitionFx: z.enum(["fade", "dissolve", "none"]).default("fade"),
})

/** S→C: broadcast para todos carregarem a cena */
export const EvSceneLoaded = z.object({
  sceneId:      z.string().uuid(),
  sceneUrl:     z.string().url(),       // URL do .rpgscene no storage
  transitionFx: z.enum(["fade", "dissolve", "none"]),
})

// ── TOKENS DE PERSONAGEM ─────────────────────────────────────────────────────

/** C→S: jogador moveu seu token */
export const EvMoveToken = z.object({
  characterId: z.string(),
  position:    Vec3,
  rotation:    z.number(),   // graus Y
})

/** S→C: broadcast de posição de token */
export const EvTokenMoved = EvMoveToken.extend({
  userId: z.string(),
})

// ── CHAT ─────────────────────────────────────────────────────────────────────

export const ChatChannel = z.enum([
  "general",   // todos veem
  "master",    // só mestre vê (canal de pensamentos)
  "whisper",   // só remetente + destinatário
  "game_log",  // eventos automáticos (dados, triggers)
])

/** C→S: enviar mensagem */
export const EvSendMessage = z.object({
  channel:     ChatChannel,
  content:     z.string().min(1).max(2000),
  toUserId:    z.string().optional(),   // obrigatório se channel = "whisper"
  speakAs:     z.enum(["player", "character", "narrator"]).default("character"),
})

/** S→C: mensagem entregue */
export const EvMessageReceived = EvSendMessage.extend({
  id:          z.string().uuid(),
  fromUserId:  z.string(),
  fromName:    z.string(),
  timestamp:   z.string().datetime(),
})

// ── DADOS ─────────────────────────────────────────────────────────────────────

export const DiceFace = z.union([
  z.literal(4), z.literal(6), z.literal(8),
  z.literal(10), z.literal(12), z.literal(20), z.literal(100),
])

/** C→S: solicitar rolagem */
export const EvRollDice = z.object({
  diceCount:   z.number().int().min(1).max(20),
  diceFaces:   DiceFace,
  modifier:    z.number().int().default(0),
  label:       z.string().max(80).optional(),   // ex: "Ataque com espada longa"
  isSecret:    z.boolean().default(false),       // só mestre e remetente veem
  characterId: z.string().optional(),
})

/** S→C: resultado de rolagem (broadcast ou privado) */
export const EvDiceResult = EvRollDice.extend({
  id:           z.string().uuid(),
  fromUserId:   z.string(),
  fromName:     z.string(),
  rolls:        z.array(z.number().int().positive()),  // resultado individual de cada dado
  total:        z.number().int(),                      // soma + modifier
  timestamp:    z.string().datetime(),
})

// ── TRIGGERS ─────────────────────────────────────────────────────────────────

/** S→C: um trigger foi ativado (token entrou na zona) */
export const EvTriggerActivated = z.object({
  trigger:     AnyTriggerNode,
  activatedBy: z.string(),   // characterId
  position:    Vec3,
})

/** C→S (mestre): revelar nota manualmente */
export const EvRevealNote = z.object({
  triggerId: z.string(),
  toAll:     z.boolean().default(true),
})

/** C→S (mestre): desarmar armadilha manualmente */
export const EvDisarmTrap = z.object({
  triggerId: z.string(),
})

// ── TOKENS NPC / ENEMY ───────────────────────────────────────────────────────

export const NpcRole = z.enum(["npc", "enemy"])
export type  NpcRole = z.infer<typeof NpcRole>

/** C→S (mestre): spawna um token NPC/enemy no mapa */
export const EvSpawnNpc = z.object({
  role:       NpcRole,
  name:       z.string().min(1).max(80),
  position:   Vec3,
  rotation:   z.number().default(0),
  avatarType: AvatarType.optional(),
  avatarUrl:  z.string().optional(),
})

/** S→C: broadcast — NPC foi spawnado */
export const EvNpcSpawned = EvSpawnNpc.extend({
  tokenId: z.string().uuid(),   // gerado pelo server
})

/** C→S (mestre): remove um NPC do mapa */
export const EvDespawnNpc = z.object({
  tokenId: z.string().uuid(),
})

/** S→C: broadcast — NPC foi removido */
export const EvNpcDespawned = z.object({
  tokenId: z.string().uuid(),
})

// ── MÍDIA (playlist de áudio) ────────────────────────────────────────────────

/** C→S (mestre): inicia ou retoma reprodução; trackIndex pula para faixa específica */
export const EvMediaPlay = z.object({
  trackIndex: z.number().int().min(0).optional(),
})

/** C→S (mestre): pausa reprodução */
export const EvMediaPause = z.object({})

/** C→S (mestre): avança para próxima faixa */
export const EvMediaNext = z.object({})

/** C→S (mestre): volta para faixa anterior */
export const EvMediaPrev = z.object({})

/** C→S (mestre): para reprodução e reseta */
export const EvMediaStop = z.object({})

/** S→C: estado atual da playlist — enviado em broadcast e ao entrar na sala */
export const EvMediaState = z.object({
  playing:    z.boolean(),
  trackIndex: z.number().int(),
  trackUrl:   z.string().nullable(),
  trackName:  z.string().nullable(),
})

// ── VÍDEO ─────────────────────────────────────────────────────────────────────

/** Efeitos de transição cinematográfica disponíveis */
export const VideoTransitionEffect = z.enum([
  "none",
  "fade",
  "dissolve",   // noise dissolve com faíscas
  "melt",       // liquify — colunas derretendo
  "ripple",     // ondas radiais de água
  "wipe_right", // varredura esquerda→direita com brilho
  "wipe_down",  // varredura cima→baixo com brilho
  "zoom_in",    // zoom do centro para fora
  "burn",       // queima diagonal com fogo
  "dream",      // aberração cromática + ondas
])
export type VideoTransitionEffect = z.infer<typeof VideoTransitionEffect>

/** Modo de exibição do vídeo */
export const VideoMode = z.enum([
  "panel",      // painel flutuante arrastável (existente)
  "cinematic",  // tela cheia com transição shader
  "overlay",    // sobreposição semi-transparente sobre o jogo
])
export type VideoMode = z.infer<typeof VideoMode>

/** Blend modes para overlay */
export const OverlayBlend = z.enum(["normal", "multiply", "screen", "overlay", "lighten"])
export type OverlayBlend = z.infer<typeof OverlayBlend>

/** C→S (mestre): inicia reprodução de vídeo */
export const EvVideoPlay = z.object({
  url:                z.string().url(),
  name:               z.string().optional(),
  mode:               VideoMode.optional().default("panel"),
  transitionIn:       VideoTransitionEffect.optional().default("fade"),
  transitionOut:      VideoTransitionEffect.optional().default("fade"),
  transitionDuration: z.number().int().min(0).max(5000).optional().default(1500),
  overlayOpacity:     z.number().min(0).max(1).optional().default(1.0),
  overlayBlend:       OverlayBlend.optional().default("normal"),
})

/** C→S (mestre): pausa vídeo */
export const EvVideoPause = z.object({})

/** C→S (mestre): encerra e fecha o vídeo */
export const EvVideoStop = z.object({})

/** S→C: estado do vídeo — enviado em broadcast e ao entrar na sala */
export const EvVideoState = z.object({
  playing:            z.boolean(),
  url:                z.string().nullable(),
  name:               z.string().nullable(),
  mode:               VideoMode.nullable(),
  transitionIn:       VideoTransitionEffect.nullable(),
  transitionOut:      VideoTransitionEffect.nullable(),
  transitionDuration: z.number().nullable(),
  overlayOpacity:     z.number().nullable(),
  overlayBlend:       OverlayBlend.nullable(),
})

// ── FOG OF WAR ───────────────────────────────────────────────────────────────

/** S→C: células de fog reveladas (delta, não o mapa inteiro) */
export const EvFogRevealed = z.object({
  cells: z.array(z.object({ x: z.number(), z: z.number() })),
})

/** C→S (mestre): limpar todo o fog de guerra */
export const EvClearFog = z.object({
  confirm: z.literal(true),
})

// ─────────────────────────────────────────────────────────────────────────────
// MAP DE EVENTOS — usado pelo sync-client para tipagem dos listeners
// ─────────────────────────────────────────────────────────────────────────────

export const ServerToClientEvents = {
  "room:joined":         EvRoomJoined,
  "scene:loaded":        EvSceneLoaded,
  "token:moved":         EvTokenMoved,
  "npc:spawned":         EvNpcSpawned,
  "npc:despawned":       EvNpcDespawned,
  "chat:message":        EvMessageReceived,
  "dice:result":         EvDiceResult,
  "trigger:activated":   EvTriggerActivated,
  "fog:revealed":        EvFogRevealed,
  "media:state":         EvMediaState,
  "video:state":         EvVideoState,
} as const

export const ClientToServerEvents = {
  "room:join":       EvJoinRoom,
  "scene:load":      EvLoadScene,
  "token:move":      EvMoveToken,
  "npc:spawn":       EvSpawnNpc,
  "npc:despawn":     EvDespawnNpc,
  "chat:send":       EvSendMessage,
  "dice:roll":       EvRollDice,
  "note:reveal":     EvRevealNote,
  "trap:disarm":     EvDisarmTrap,
  "fog:clear":       EvClearFog,
  "media:play":      EvMediaPlay,
  "media:pause":     EvMediaPause,
  "media:next":      EvMediaNext,
  "media:prev":      EvMediaPrev,
  "media:stop":      EvMediaStop,
  "video:play":      EvVideoPlay,
  "video:pause":     EvVideoPause,
  "video:stop":      EvVideoStop,
} as const

export type EvMediaPlay         = z.infer<typeof EvMediaPlay>
export type EvMediaPause        = z.infer<typeof EvMediaPause>
export type EvMediaNext         = z.infer<typeof EvMediaNext>
export type EvMediaPrev         = z.infer<typeof EvMediaPrev>
export type EvMediaStop         = z.infer<typeof EvMediaStop>
export type EvMediaState        = z.infer<typeof EvMediaState>
export type EvVideoPlay         = z.infer<typeof EvVideoPlay>
export type EvVideoPause        = z.infer<typeof EvVideoPause>
export type EvVideoStop         = z.infer<typeof EvVideoStop>
export type EvVideoState        = z.infer<typeof EvVideoState>
export type VideoTransitionEffect = z.infer<typeof VideoTransitionEffect>
export type VideoMode           = z.infer<typeof VideoMode>
export type OverlayBlend        = z.infer<typeof OverlayBlend>
export type EvJoinRoom          = z.infer<typeof EvJoinRoom>
export type EvRoomJoined        = z.infer<typeof EvRoomJoined>
export type EvLoadScene         = z.infer<typeof EvLoadScene>
export type EvSceneLoaded       = z.infer<typeof EvSceneLoaded>
export type EvMoveToken         = z.infer<typeof EvMoveToken>
export type EvTokenMoved        = z.infer<typeof EvTokenMoved>
export type EvSendMessage       = z.infer<typeof EvSendMessage>
export type EvMessageReceived   = z.infer<typeof EvMessageReceived>
export type EvRollDice          = z.infer<typeof EvRollDice>
export type EvDiceResult        = z.infer<typeof EvDiceResult>
export type EvTriggerActivated  = z.infer<typeof EvTriggerActivated>
export type EvRevealNote        = z.infer<typeof EvRevealNote>
export type EvDisarmTrap        = z.infer<typeof EvDisarmTrap>
export type EvClearFog          = z.infer<typeof EvClearFog>
export type EvFogRevealed       = z.infer<typeof EvFogRevealed>
export type EvSpawnNpc          = z.infer<typeof EvSpawnNpc>
export type EvNpcSpawned        = z.infer<typeof EvNpcSpawned>
export type EvDespawnNpc        = z.infer<typeof EvDespawnNpc>
export type EvNpcDespawned      = z.infer<typeof EvNpcDespawned>
export type DiceFace            = z.infer<typeof DiceFace>
export type ChatChannel         = z.infer<typeof ChatChannel>
