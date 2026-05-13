"use client"
import { useEffect, useRef, useCallback } from "react"
import { create }    from "zustand"
import { getSocket } from "./socket.js"
import type {
  EvRoomJoined, EvSceneLoaded, EvTokenMoved,
  EvMessageReceived, EvDiceResult, EvTriggerActivated,
  EvJoinRoom, EvLoadScene,
} from "@rpg3d/schema"

// ── Estado Zustand ────────────────────────────────────────────────────────────
export type GameRoomStatus = "disconnected" | "connecting" | "connected" | "error"
export type Participant    = { userId: string; characterId?: string; isMaster: boolean; isOnline: boolean; name: string }
export type TokenPosition  = { characterId: string; userId: string; position: { x: number; y: number; z: number }; rotation: number }
export type ActiveScene    = { sceneId: string; sceneUrl: string; transitionFx: "fade" | "dissolve" | "none" }
export type FogCell        = { x: number; z: number }

type RoomStore = {
  status: GameRoomStatus; sessionId: string | null
  participants: Participant[]; tokens: Record<string, TokenPosition>
  activeScene: ActiveScene | null; fogCells: FogCell[]; lastError: string | null
  _setStatus:      (s: GameRoomStatus) => void
  _setSession:     (d: EvRoomJoined) => void
  _setParticipant: (p: Participant) => void
  _setScene:       (s: ActiveScene) => void
  _updateToken:    (t: EvTokenMoved) => void
  _revealFog:      (c: FogCell[]) => void
  _clearFog:       () => void
  _setError:       (e: string | null) => void
}

export const useRoomStore = create<RoomStore>((set) => ({
  status: "disconnected", sessionId: null,
  participants: [], tokens: {}, activeScene: null, fogCells: [], lastError: null,

  _setStatus:      (status)    => set({ status }),
  _setError:       (lastError) => set({ lastError }),
  _setSession:     ({ sessionId, participants }) =>
    set({ sessionId, status: "connected", participants: participants.map(p => ({ ...p, name: p.userId })) }),
  _setParticipant: (p) =>
    set(s => {
      const next = [...s.participants]; const i = next.findIndex(x => x.userId === p.userId)
      if (i >= 0) next[i] = p; else next.push(p)
      return { participants: next }
    }),
  _setScene:    (activeScene) => set({ activeScene }),
  _updateToken: (t) => set(s => ({ tokens: { ...s.tokens, [t.characterId]: { characterId: t.characterId, userId: t.userId, position: t.position, rotation: t.rotation } } })),
  _revealFog:   (cells) => set(s => {
    if (!cells.length) return {}
    const existing = new Set(s.fogCells.map(c => `${c.x}:${c.z}`))
    const incoming  = cells.filter(c => !existing.has(`${c.x}:${c.z}`))
    return incoming.length ? { fogCells: [...s.fogCells, ...incoming] } : {}
  }),
  _clearFog: () => set({ fogCells: [] }),
}))

// ── useGameRoom ───────────────────────────────────────────────────────────────
export type UseGameRoomOptions = {
  sessionId: string; campaignId: string; characterId?: string
  token: string; serverUrl?: string
  onSceneLoaded?:      (d: EvSceneLoaded) => void
  onTriggerActivated?: (d: EvTriggerActivated) => void
  onMessage?:          (d: EvMessageReceived) => void
  onDiceResult?:       (d: EvDiceResult) => void
  onFogRevealed?:      (c: FogCell[]) => void
}

export function useGameRoom(opts: UseGameRoomOptions) {
  const { sessionId, campaignId, characterId, token, serverUrl } = opts
  const store  = useRoomStore()
  const cbRef  = useRef(opts); cbRef.current = opts

  useEffect(() => {
    const socket = getSocket(serverUrl)
    socket.auth  = { token }
    store._setStatus("connecting")

    socket.on("room:joined",     (d) => store._setSession(d))
    socket.on("room:participant",(d) => store._setParticipant(d))
    socket.on("scene:loaded",    (d) => { store._setScene(d); cbRef.current.onSceneLoaded?.(d) })
    socket.on("token:moved",     (d) => store._updateToken(d))
    socket.on("chat:message",    (d) => cbRef.current.onMessage?.(d))
    socket.on("dice:result",     (d) => cbRef.current.onDiceResult?.(d))
    socket.on("trigger:activated",(d) => cbRef.current.onTriggerActivated?.(d))
    socket.on("fog:revealed",    ({ cells }) => {
      if (!cells.length) store._clearFog(); else store._revealFog(cells)
      cbRef.current.onFogRevealed?.(cells)
    })
    socket.on("error",         ({ message }) => { store._setError(message); store._setStatus("error") })
    socket.on("connect_error", (err)         => { store._setError(err.message); store._setStatus("error") })
    socket.on("ping", () => socket.emit("pong"))

    socket.connect()
    socket.once("connect", () => {
      const payload: EvJoinRoom = { sessionId, campaignId, characterId, token }
      socket.emit("room:join", payload, (res) => {
        if (!res.ok) { store._setError(res.error); store._setStatus("error") }
      })
    })

    return () => {
      socket.off("room:joined").off("room:participant").off("scene:loaded")
        .off("token:moved").off("chat:message").off("dice:result")
        .off("trigger:activated").off("fog:revealed").off("error")
        .off("connect_error").off("ping")
    }
  }, [sessionId, campaignId, characterId, token, serverUrl])

  const loadScene  = useCallback((data: EvLoadScene) =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("scene:load", data, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const moveToken  = useCallback((characterId: string, position: { x: number; y: number; z: number }, rotation: number) =>
    getSocket(serverUrl).emit("token:move", { characterId, position, rotation }), [serverUrl])

  const revealNote = useCallback((triggerId: string, toAll = true) =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("note:reveal", { triggerId, toAll }, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const disarmTrap = useCallback((triggerId: string) =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("trap:disarm", { triggerId }, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const clearFog   = useCallback(() =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("fog:clear", { confirm: true }, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  return {
    status: store.status, sessionId: store.sessionId,
    participants: store.participants, tokens: store.tokens,
    activeScene: store.activeScene, fogCells: store.fogCells, lastError: store.lastError,
    loadScene, moveToken, revealNote, disarmTrap, clearFog,
  }
}
