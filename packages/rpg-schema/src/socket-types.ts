import type {
  EvRoomJoined,
  EvSceneLoaded,
  EvTokenMoved,
  EvNpcSpawned,
  EvNpcDespawned,
  EvMessageReceived,
  EvDiceResult,
  EvTriggerActivated,
  EvFogRevealed,
  EvJoinRoom,
  EvLoadScene,
  EvMoveToken,
  EvSpawnNpc,
  EvDespawnNpc,
  EvSendMessage,
  EvRollDice,
  EvRevealNote,
  EvDisarmTrap,
  EvClearFog,
  EvParticipant,
  EvMediaPlay,
  EvMediaPause,
  EvMediaNext,
  EvMediaPrev,
  EvMediaStop,
  EvMediaState,
  EvVideoPlay,
  EvVideoPause,
  EvVideoStop,
  EvVideoState,
  EvSheetUpdate,
  EvSheetState,
  EvCombatState,
  EvCombatStart,
  EvCombatNextTurn,
  EvCombatEnd,
  EvCombatSetHp,
} from "./events.js"

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces tipadas para Socket.io — importadas por server e client
// ─────────────────────────────────────────────────────────────────────────────

export interface ServerToClientMap {
  "room:joined":       (data: EvRoomJoined)       => void
  "room:participant":  (data: EvParticipant)       => void
  "scene:loaded":      (data: EvSceneLoaded)       => void
  "token:moved":       (data: EvTokenMoved)        => void
  "npc:spawned":       (data: EvNpcSpawned)        => void
  "npc:despawned":     (data: EvNpcDespawned)      => void
  "chat:message":      (data: EvMessageReceived)   => void
  "dice:result":       (data: EvDiceResult)        => void
  "trigger:activated": (data: EvTriggerActivated)  => void
  "fog:revealed":      (data: EvFogRevealed)       => void
  "media:state":       (data: EvMediaState)        => void
  "video:state":       (data: EvVideoState)        => void
  "sheet:state":       (data: EvSheetState)        => void
  "combat:state":      (data: EvCombatState)       => void
  "error":             (data: { code: string; message: string }) => void
  "ping":              () => void
}

export interface ClientToServerMap {
  "room:join":    (data: EvJoinRoom,    cb: AckFn) => void
  "scene:load":   (data: EvLoadScene,   cb: AckFn) => void
  "token:move":   (data: EvMoveToken)              => void
  "npc:spawn":    (data: EvSpawnNpc,   cb: AckFn<{ tokenId: string }>) => void
  "npc:despawn":  (data: EvDespawnNpc, cb: AckFn) => void
  "chat:send":    (data: EvSendMessage, cb: AckFn) => void
  "dice:roll":    (data: EvRollDice,   cb: AckFn) => void
  "note:reveal":  (data: EvRevealNote, cb: AckFn) => void
  "trap:disarm":  (data: EvDisarmTrap, cb: AckFn) => void
  "fog:clear":    (data: EvClearFog,   cb: AckFn) => void
  "media:play":   (data: EvMediaPlay,  cb: AckFn) => void
  "media:pause":  (data: EvMediaPause, cb: AckFn) => void
  "media:next":   (data: EvMediaNext,  cb: AckFn) => void
  "media:prev":   (data: EvMediaPrev,  cb: AckFn) => void
  "media:stop":   (data: EvMediaStop,  cb: AckFn) => void
  "video:play":   (data: EvVideoPlay,   cb: AckFn) => void
  "video:pause":  (data: EvVideoPause,  cb: AckFn) => void
  "video:stop":   (data: EvVideoStop,   cb: AckFn) => void
  "sheet:update":     (data: EvSheetUpdate,     cb: AckFn) => void
  "combat:start":     (data: EvCombatStart,     cb: AckFn) => void
  "combat:next_turn": (data: EvCombatNextTurn,  cb: AckFn) => void
  "combat:end":       (data: EvCombatEnd,       cb: AckFn) => void
  "combat:set_hp":    (data: EvCombatSetHp,     cb: AckFn) => void
  "pong":             () => void
}

export type AckFn<T = void> = (res: AckResponse<T>) => void

export type AckResponse<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string }
