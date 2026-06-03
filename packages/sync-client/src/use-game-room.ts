import { useEffect, useRef, useCallback } from "react"
import { create }    from "zustand"
import { getSocket } from "./socket.js"
import type {
  EvRoomJoined, EvSceneLoaded, EvTokenMoved,
  EvNpcSpawned,
  EvMessageReceived, EvDiceResult, EvTriggerActivated,
  EvJoinRoom, EvLoadScene, EvSpawnNpc, EvDespawnNpc,
  EvMediaState, EvVideoState, EvVideoPlay,
  EvCombatState, CombatantEntry, EvCombatAbilityResult,
} from "@rpg3d/schema"

export type { CombatantEntry, EvCombatAbilityResult }
export type CombatState = EvCombatState
export type CombatAbilityResult = EvCombatAbilityResult

// ── Estado Zustand ────────────────────────────────────────────────────────────
export type GameRoomStatus = "disconnected" | "connecting" | "connected" | "error"
export type Participant    = { userId: string; characterId?: string; isMaster: boolean; isOnline: boolean; name: string; avatarType?: "none" | "image" | "model"; avatarUrl?: string }
export type TokenPosition  = { characterId: string; userId: string; position: { x: number; y: number; z: number }; rotation: number }
export type ActiveScene    = { sceneId: string; sceneUrl: string; transitionFx: "fade" | "dissolve" | "none" }
export type FogCell        = { x: number; z: number }
export type NpcToken       = EvNpcSpawned

export type SheetStates = Record<string, Record<string, unknown>>

export type MediaState = { playing: boolean; trackIndex: number; trackUrl: string | null; trackName: string | null }
export type VideoState = {
  playing:            boolean
  url:                string | null
  name:               string | null
  mode:               string | null
  transitionIn:       string | null
  transitionOut:      string | null
  transitionDuration: number | null
  overlayOpacity:     number | null
  overlayBlend:       string | null
}

type RoomStore = {
  status: GameRoomStatus; sessionId: string | null
  participants: Participant[]
  tokens:    Record<string, TokenPosition>
  npcTokens: Record<string, NpcToken>
  activeScene: ActiveScene | null; fogCells: FogCell[]; lastError: string | null
  mediaState:  MediaState | null
  videoState:  VideoState | null
  sheetStates:  SheetStates
  combatState:  CombatState | null
  _setStatus:       (s: GameRoomStatus) => void
  _setSession:      (d: EvRoomJoined) => void
  _setParticipant:  (p: Participant) => void
  _setScene:        (s: ActiveScene) => void
  _updateToken:     (t: EvTokenMoved) => void
  _spawnNpc:        (n: NpcToken) => void
  _moveNpc:         (tokenId: string, pos: NpcToken["position"], rotation: number) => void
  _despawnNpc:      (tokenId: string) => void
  _revealFog:       (c: FogCell[]) => void
  _clearFog:        () => void
  _setError:        (e: string | null) => void
  _setMediaState:   (m: EvMediaState) => void
  _setVideoState:   (v: EvVideoState) => void
  _setSheetState:   (characterId: string, data: Record<string, unknown>) => void
  _setCombatState:  (c: EvCombatState) => void
}

export const useRoomStore = create<RoomStore>((set) => ({
  status: "disconnected", sessionId: null,
  participants: [], tokens: {}, npcTokens: {}, activeScene: null, fogCells: [], lastError: null,
  mediaState: null, videoState: null, sheetStates: {}, combatState: null,

  _setStatus:      (status)    => set({ status }),
  _setError:       (lastError) => set({ lastError }),
  _setSession:     ({ sessionId, participants }) =>
    set({ sessionId, status: "connected", participants: participants.map(p => ({ ...p, name: p.name ?? p.userId })) }),
  _setParticipant: (p) =>
    set(s => {
      const next = [...s.participants]; const i = next.findIndex(x => x.userId === p.userId)
      if (i >= 0) next[i] = p; else next.push(p)
      return { participants: next }
    }),
  _setScene:    (activeScene) => set({ activeScene }),
  _updateToken: (t) => set(s => ({ tokens: { ...s.tokens, [t.characterId]: { characterId: t.characterId, userId: t.userId, position: t.position, rotation: t.rotation } } })),
  _spawnNpc:    (n) => set(s => ({ npcTokens: { ...s.npcTokens, [n.tokenId]: n } })),
  _moveNpc:     (tokenId, pos, rotation) => set(s => {
    const npc = s.npcTokens[tokenId]
    if (!npc) return {}
    return { npcTokens: { ...s.npcTokens, [tokenId]: { ...npc, position: pos, rotation } } }
  }),
  _despawnNpc:  (tokenId) => set(s => {
    const { [tokenId]: _, ...rest } = s.npcTokens
    return { npcTokens: rest }
  }),
  _revealFog:   (cells) => set(s => {
    if (!cells.length) return {}
    const existing = new Set(s.fogCells.map(c => `${c.x}:${c.z}`))
    const incoming  = cells.filter(c => !existing.has(`${c.x}:${c.z}`))
    return incoming.length ? { fogCells: [...s.fogCells, ...incoming] } : {}
  }),
  _clearFog: () => set({ fogCells: [] }),
  _setMediaState:  (m) => set({ mediaState: m }),
  _setVideoState:  (v) => set({ videoState: v }),
  _setSheetState:  (characterId, data) =>
    set(s => ({ sheetStates: { ...s.sheetStates, [characterId]: data } })),
  _setCombatState: (c) => set({ combatState: c }),
}))

// ── useGameRoom ───────────────────────────────────────────────────────────────
export type UseGameRoomOptions = {
  sessionId: string; campaignId: string; characterId?: string
  token: string; serverUrl?: string
  avatarType?: "none" | "image" | "model"
  avatarUrl?: string
  onSceneLoaded?:      (d: EvSceneLoaded) => void
  onTriggerActivated?: (d: EvTriggerActivated) => void
  onMessage?:          (d: EvMessageReceived) => void
  onDiceResult?:       (d: EvDiceResult) => void
  onFogRevealed?:      (c: FogCell[]) => void
  onAbilityResult?:    (d: EvCombatAbilityResult) => void
}

export function useGameRoom(opts: UseGameRoomOptions) {
  const { sessionId, campaignId, characterId, token, serverUrl, avatarType, avatarUrl } = opts
  const store  = useRoomStore()
  const cbRef  = useRef(opts); cbRef.current = opts

  useEffect(() => {
    const socket = getSocket(serverUrl)
    socket.auth  = { token }
    store._setStatus("connecting")

    socket.on("room:joined",     (d) => store._setSession(d))
    socket.on("room:participant",(d) => store._setParticipant({ ...d, name: d.name ?? d.userId }))
    socket.on("scene:loaded",    (d) => { store._setScene(d); cbRef.current.onSceneLoaded?.(d) })
    socket.on("token:moved",     (d) => {
      if (useRoomStore.getState().npcTokens[d.characterId]) store._moveNpc(d.characterId, d.position, d.rotation)
      else store._updateToken(d)
    })
    socket.on("npc:spawned",   (d) => store._spawnNpc(d))
    socket.on("npc:despawned", ({ tokenId }) => store._despawnNpc(tokenId))
    socket.on("chat:message",    (d) => cbRef.current.onMessage?.(d))
    socket.on("dice:result",     (d) => cbRef.current.onDiceResult?.(d))
    socket.on("trigger:activated",(d) => cbRef.current.onTriggerActivated?.(d))
    socket.on("fog:revealed",    ({ cells }) => {
      if (!cells.length) store._clearFog(); else store._revealFog(cells)
      cbRef.current.onFogRevealed?.(cells)
    })
    socket.on("media:state",   (d) => store._setMediaState(d))
    socket.on("video:state",   (d) => store._setVideoState(d))
    socket.on("sheet:state",   ({ characterId, data }) => store._setSheetState(characterId, data))
    socket.on("combat:state",  (d) => store._setCombatState(d))
    socket.on("combat:ability_result", (d) => cbRef.current.onAbilityResult?.(d))
    socket.on("error",         ({ message }) => { store._setError(message); store._setStatus("error") })
    socket.on("connect_error", (err)         => { store._setError(err.message); store._setStatus("error") })
    socket.on("ping", () => socket.emit("pong"))

    socket.connect()
    socket.once("connect", () => {
      const payload: EvJoinRoom = { sessionId, campaignId, characterId, token, avatarType, avatarUrl }
      socket.emit("room:join", payload, (res) => {
        if (!res.ok) { store._setError(res.error); store._setStatus("error") }
      })
    })

    return () => {
      socket.off("room:joined").off("room:participant").off("scene:loaded")
        .off("token:moved").off("npc:spawned").off("npc:despawned")
        .off("chat:message").off("dice:result")
        .off("trigger:activated").off("fog:revealed")
        .off("media:state").off("video:state").off("sheet:state").off("combat:state")
        .off("combat:ability_result")
        .off("error").off("connect_error").off("ping")
    }
  }, [sessionId, campaignId, characterId, token, serverUrl, avatarType, avatarUrl])

  const loadScene  = useCallback((data: EvLoadScene) =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("scene:load", data, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const moveToken  = useCallback((characterId: string, position: { x: number; y: number; z: number }, rotation: number) => {
    getSocket(serverUrl).emit("token:move", { characterId, position, rotation })
    // Optimistic local update — server uses socket.to() which excludes sender
    const state = useRoomStore.getState()
    if (state.npcTokens[characterId]) {
      state._moveNpc(characterId, position, rotation)
    } else {
      const participant = state.participants.find(p => p.characterId === characterId)
      state._updateToken({ characterId, userId: participant?.userId ?? characterId, position, rotation })
    }
  }, [serverUrl])

  const revealNote = useCallback((triggerId: string, toAll = true) =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("note:reveal", { triggerId, toAll }, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const disarmTrap = useCallback((triggerId: string) =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("trap:disarm", { triggerId }, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const clearFog   = useCallback(() =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("fog:clear", { confirm: true }, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const spawnNpc   = useCallback((data: EvSpawnNpc) =>
    new Promise<string>((res, rej) => getSocket(serverUrl).emit("npc:spawn", data, r => r.ok ? res(r.data.tokenId) : rej(new Error(r.error)))), [serverUrl])

  const despawnNpc = useCallback((tokenId: string) =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("npc:despawn", { tokenId }, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const playMedia  = useCallback((trackIndex?: number) =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("media:play", { trackIndex }, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const pauseMedia = useCallback(() =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("media:pause", {}, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const nextTrack  = useCallback(() =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("media:next", {}, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const prevTrack  = useCallback(() =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("media:prev", {}, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const stopMedia  = useCallback(() =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("media:stop", {}, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const playVideo  = useCallback((data: EvVideoPlay) =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("video:play", data, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const pauseVideo = useCallback(() =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("video:pause", {}, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const stopVideo  = useCallback(() =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("video:stop", {}, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const startCombat   = useCallback(() =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("combat:start", {}, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const nextCombatTurn = useCallback(() =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("combat:next_turn", {}, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const endCombat     = useCallback(() =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("combat:end", {}, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const setCombatantHp = useCallback((combatantId: string, hp: number) =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("combat:set_hp", { combatantId, hp }, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const useAbility = useCallback((abilityId: string, targetId: string) =>
    new Promise<void>((res, rej) => getSocket(serverUrl).emit("combat:use_ability", { abilityId, targetId }, r => r.ok ? res() : rej(new Error(r.error)))), [serverUrl])

  const updateSheet = useCallback((characterId: string, patch: Record<string, unknown>) =>
    new Promise<void>((res, rej) => {
      useRoomStore.getState()._setSheetState(characterId, patch)
      getSocket(serverUrl).emit("sheet:update", { characterId, patch }, r =>
        r.ok ? res() : rej(new Error(r.error))
      )
    }), [serverUrl])

  return {
    status: store.status, sessionId: store.sessionId,
    participants: store.participants, tokens: store.tokens, npcTokens: store.npcTokens,
    activeScene: store.activeScene, fogCells: store.fogCells, lastError: store.lastError,
    mediaState: store.mediaState, videoState: store.videoState,
    sheetStates: store.sheetStates, combatState: store.combatState,
    loadScene, moveToken, revealNote, disarmTrap, clearFog, spawnNpc, despawnNpc,
    playMedia, pauseMedia, nextTrack, prevTrack, stopMedia,
    playVideo, pauseVideo, stopVideo,
    updateSheet, startCombat, nextCombatTurn, endCombat, setCombatantHp, useAbility,
  }
}
