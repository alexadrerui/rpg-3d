import type {
  EvRoomJoined,
  EvSceneLoaded,
  EvTokenMoved,
  EvMessageReceived,
  EvDiceResult,
  EvTriggerActivated,
  EvFogRevealed,
  EvJoinRoom,
  EvLoadScene,
  EvMoveToken,
  EvSendMessage,
  EvRollDice,
  EvRevealNote,
  EvDisarmTrap,
  EvClearFog,
  EvParticipant,
} from "./events"

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces tipadas para Socket.io — importadas por server e client
// ─────────────────────────────────────────────────────────────────────────────

export interface ServerToClientMap {
  "room:joined":       (data: EvRoomJoined)       => void
  "room:participant":  (data: EvParticipant) => void
  "scene:loaded":      (data: EvSceneLoaded)       => void
  "token:moved":       (data: EvTokenMoved)        => void
  "chat:message":      (data: EvMessageReceived)   => void
  "dice:result":       (data: EvDiceResult)        => void
  "trigger:activated": (data: EvTriggerActivated)  => void
  "fog:revealed":      (data: EvFogRevealed)       => void
  "error":             (data: { code: string; message: string }) => void
  "ping":              () => void
}

export interface ClientToServerMap {
  "room:join":    (data: EvJoinRoom,    cb: AckFn) => void
  "scene:load":   (data: EvLoadScene,   cb: AckFn) => void
  "token:move":   (data: EvMoveToken)              => void
  "chat:send":    (data: EvSendMessage, cb: AckFn) => void
  "dice:roll":    (data: EvRollDice,   cb: AckFn) => void
  "note:reveal":  (data: EvRevealNote, cb: AckFn) => void
  "trap:disarm":  (data: EvDisarmTrap, cb: AckFn) => void
  "fog:clear":    (data: EvClearFog,   cb: AckFn) => void
  "pong":         () => void
}

export type AckFn<T = void> = (res: AckResponse<T>) => void

export type AckResponse<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string }
