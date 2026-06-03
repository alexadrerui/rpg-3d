import type { Redis } from "ioredis"
import type { EvRoomJoined, EvTokenMoved, CombatantEntry, EvCombatState, VideoMode, VideoTransitionEffect, OverlayBlend } from "@rpg3d/schema"

// ─────────────────────────────────────────────────────────────────────────────
// Tipos internos do estado de uma room
// ─────────────────────────────────────────────────────────────────────────────

export type Participant = {
  userId:      string
  name:        string
  socketId:    string
  characterId: string | undefined
  isMaster:    boolean
  isOnline:    boolean
  avatarType:  "none" | "image" | "model" | undefined
  avatarUrl:   string | undefined
}

export type TokenState = {
  characterId: string
  userId:      string
  position:    { x: number; y: number; z: number }
  rotation:    number
}

export type NpcTokenState = {
  tokenId:     string
  role:        "npc" | "enemy"
  name:        string
  position:    { x: number; y: number; z: number }
  rotation:    number
  avatarType?: "none" | "image" | "model"
  avatarUrl?:  string
}

export type { CombatantEntry }

export type CombatState = {
  active:     boolean
  round:      number
  turnIndex:  number
  combatants: CombatantEntry[]
}

export type MediaState = {
  playing:    boolean
  trackIndex: number
  trackUrl:   string | null
  trackName:  string | null
}

export type VideoState = {
  playing:            boolean
  url:                string | null
  name:               string | null
  mode:               VideoMode | null
  transitionIn:       VideoTransitionEffect | null
  transitionOut:      VideoTransitionEffect | null
  transitionDuration: number | null
  overlayOpacity:     number | null
  overlayBlend:       OverlayBlend | null
}

export type RoomState = {
  sessionId:      string
  campaignId:     string
  masterId:       string
  activeSceneId:  string | null
  activeSceneUrl: string | null
  participants:   Map<string, Participant>                    // userId → Participant
  tokens:         Map<string, TokenState>                    // characterId → TokenState
  npcTokens:      Map<string, NpcTokenState>                 // tokenId → NpcTokenState
  sheetStates:    Map<string, Record<string, unknown>>       // characterId → last sheet patch (ephemeral, not persisted)
  combat:         CombatState
  disarmedTraps:  Set<string>
  revealedNotes:  Set<string>
  fogCells:       Set<string>                                // "x:z" serializado
  media:          MediaState
  video:          VideoState
  lastActivity:   number
}

// ─────────────────────────────────────────────────────────────────────────────
// SessionManager — mantém rooms em memória + persiste no Redis
// ─────────────────────────────────────────────────────────────────────────────

const ROOM_TTL_SECONDS = 60 * 60 * 8   // 8h sem atividade → expira no Redis

export class SessionManager {
  private rooms = new Map<string, RoomState>()   // sessionId → RoomState
  private redis: Redis | null

  constructor(redis: Redis | null) {
    this.redis = redis
  }

  // ── Criação / recuperação de room ─────────────────────────────────────────

  async getOrCreate(sessionId: string, campaignId: string, masterId: string): Promise<RoomState> {
    if (this.rooms.has(sessionId)) return this.rooms.get(sessionId)!

    // Tenta restaurar do Redis (servidor reiniciado)
    const persisted = await this.loadFromRedis(sessionId)
    if (persisted) {
      this.rooms.set(sessionId, persisted)
      return persisted
    }

    const room: RoomState = {
      sessionId,
      campaignId,
      masterId,
      activeSceneId:  null,
      activeSceneUrl: null,
      participants:   new Map(),
      tokens:         new Map(),
      npcTokens:      new Map(),
      sheetStates:    new Map(),
      combat:         { active: false, round: 1, turnIndex: 0, combatants: [] },
      disarmedTraps:  new Set(),
      revealedNotes:  new Set(),
      fogCells:       new Set(),
      media:  { playing: false, trackIndex: 0, trackUrl: null, trackName: null },
      video:  { playing: false, url: null, name: null, mode: null, transitionIn: null, transitionOut: null, transitionDuration: null, overlayOpacity: null, overlayBlend: null },
      lastActivity:   Date.now(),
    }
    this.rooms.set(sessionId, room)
    return room
  }

  get(sessionId: string): RoomState | undefined {
    return this.rooms.get(sessionId)
  }

  // ── Participantes ─────────────────────────────────────────────────────────

  join(room: RoomState, participant: Participant): void {
    room.participants.set(participant.userId, { ...participant, isOnline: true })
    this.touch(room)
  }

  leave(room: RoomState, userId: string): void {
    const p = room.participants.get(userId)
    if (p) {
      p.isOnline = false
      p.socketId = ""
    }
    this.touch(room)
  }

  reconnect(room: RoomState, userId: string, socketId: string): void {
    const p = room.participants.get(userId)
    if (p) {
      p.isOnline  = true
      p.socketId  = socketId
    }
    this.touch(room)
  }

  getParticipantsList(room: RoomState): EvRoomJoined["participants"] {
    return Array.from(room.participants.values()).map(p => ({
      userId:      p.userId,
      characterId: p.characterId,
      isMaster:    p.isMaster,
      isOnline:    p.isOnline,
      name:        p.name,
      avatarType:  p.avatarType,
      avatarUrl:   p.avatarUrl,
    }))
  }

  isMaster(room: RoomState, userId: string): boolean {
    return room.masterId === userId
  }

  // ── Cena ─────────────────────────────────────────────────────────────────

  setActiveScene(room: RoomState, sceneId: string, sceneUrl: string): void {
    room.activeSceneId  = sceneId
    room.activeSceneUrl = sceneUrl
    this.touch(room)
    this.persist(room)
  }

  // ── Tokens ───────────────────────────────────────────────────────────────

  updateToken(room: RoomState, token: EvTokenMoved): void {
    room.tokens.set(token.characterId, {
      characterId: token.characterId,
      userId:      token.userId,
      position:    token.position,
      rotation:    token.rotation,
    })
    // tokens são high-frequency: não persiste no Redis a cada move
  }

  // ── Triggers ─────────────────────────────────────────────────────────────

  disarmTrap(room: RoomState, triggerId: string): void {
    room.disarmedTraps.add(triggerId)
    this.touch(room)
    this.persist(room)
  }

  revealNote(room: RoomState, triggerId: string): void {
    room.revealedNotes.add(triggerId)
    this.touch(room)
    this.persist(room)
  }

  // ── NPC tokens ───────────────────────────────────────────────────────────

  spawnNpcToken(room: RoomState, npc: NpcTokenState): void {
    room.npcTokens.set(npc.tokenId, npc)
    this.touch(room)
    this.persist(room)
  }

  moveNpcToken(room: RoomState, tokenId: string, position: { x: number; y: number; z: number }, rotation: number): void {
    const npc = room.npcTokens.get(tokenId)
    if (!npc) return
    npc.position = position
    npc.rotation = rotation
    // Não persiste no Redis a cada move (high-frequency), consistente com player tokens
    this.touch(room)
  }

  despawnNpcToken(room: RoomState, tokenId: string): boolean {
    const existed = room.npcTokens.delete(tokenId)
    if (existed) { this.touch(room); this.persist(room) }
    return existed
  }

  isNpcToken(room: RoomState, tokenId: string): boolean {
    return room.npcTokens.has(tokenId)
  }

  getNpcTokens(room: RoomState): NpcTokenState[] {
    return Array.from(room.npcTokens.values())
  }

  // ── Sheet states (ephemeral, not persisted to Redis) ─────────────────────

  updateSheetState(room: RoomState, characterId: string, data: Record<string, unknown>): void {
    room.sheetStates.set(characterId, data)
    this.touch(room)
  }

  getSheetStates(room: RoomState): Array<{ characterId: string; data: Record<string, unknown> }> {
    return Array.from(room.sheetStates.entries()).map(([characterId, data]) => ({ characterId, data }))
  }

  // ── Combate por turno ────────────────────────────────────────────────────

  startCombat(room: RoomState, combatants: CombatantEntry[]): void {
    room.combat = { active: true, round: 1, turnIndex: 0, combatants }
    this.touch(room)
    this.persist(room)
  }

  nextTurn(room: RoomState): void {
    const c = room.combat
    if (!c.active || c.combatants.length === 0) return
    const total = c.combatants.length
    let next = c.turnIndex
    let safetyBreak = 0
    do {
      next++
      if (next >= total) { next = 0; c.round++ }
      safetyBreak++
    } while (c.combatants[next]?.isDefeated && safetyBreak <= total)

    c.turnIndex = next
    const actor = c.combatants[next]
    if (actor && !actor.isDefeated) {
      actor.hasAction = true
      actor.hasBonusAction = true
      actor.hasMovement = true
    }
    this.touch(room)
    this.persist(room)
  }

  endCombat(room: RoomState): void {
    room.combat = { active: false, round: 1, turnIndex: 0, combatants: [] }
    this.touch(room)
    this.persist(room)
  }

  setCombatantHp(room: RoomState, id: string, hp: number): void {
    const combatant = room.combat.combatants.find(c => c.id === id)
    if (!combatant) return
    combatant.hp = Math.max(0, hp)
    combatant.isDefeated = combatant.hp <= 0
    this.touch(room)
    this.persist(room)
  }

  getCombatState(room: RoomState): EvCombatState {
    return {
      active:     room.combat.active,
      round:      room.combat.round,
      turnIndex:  room.combat.turnIndex,
      combatants: room.combat.combatants,
    }
  }

  // ── Mídia ─────────────────────────────────────────────────────────────────

  setMedia(room: RoomState, state: Partial<MediaState>): void {
    Object.assign(room.media, state)
    this.touch(room)
  }

  setVideo(room: RoomState, state: Partial<VideoState>): void {
    Object.assign(room.video, state)
    this.touch(room)
  }

  // ── Fog of war ───────────────────────────────────────────────────────────

  revealFogCells(room: RoomState, cells: { x: number; z: number }[]): string[] {
    const newKeys: string[] = []
    for (const c of cells) {
      const key = `${Math.round(c.x)}:${Math.round(c.z)}`
      if (!room.fogCells.has(key)) {
        room.fogCells.add(key)
        newKeys.push(key)
      }
    }
    if (newKeys.length > 0) this.persist(room)
    return newKeys
  }

  clearFog(room: RoomState): void {
    room.fogCells.clear()
    this.touch(room)
    this.persist(room)
  }

  getFogCells(room: RoomState): { x: number; z: number }[] {
    const result: { x: number; z: number }[] = []
    for (const key of room.fogCells) {
      const [rawX, rawZ] = key.split(":")
      const x = Number(rawX), z = Number(rawZ)
      if (!isNaN(x) && !isNaN(z)) result.push({ x, z })
    }
    return result
  }

  // ── Persistência Redis ───────────────────────────────────────────────────

  private touch(room: RoomState): void {
    room.lastActivity = Date.now()
  }

  private async persist(room: RoomState): Promise<void> {
    if (!this.redis) return
    try {
      const payload = {
        sessionId:      room.sessionId,
        campaignId:     room.campaignId,
        masterId:       room.masterId,
        activeSceneId:  room.activeSceneId,
        activeSceneUrl: room.activeSceneUrl,
        disarmedTraps:  Array.from(room.disarmedTraps),
        revealedNotes:  Array.from(room.revealedNotes),
        fogCells:       Array.from(room.fogCells),
        npcTokens:      Array.from(room.npcTokens.values()),
        participants:   Array.from(room.participants.entries()).map(([, p]) => p),
        media:          room.media,
        video:          room.video,
        combat:         room.combat,
        lastActivity:   room.lastActivity,
      }
      await this.redis.setex(
        `session:${room.sessionId}`,
        ROOM_TTL_SECONDS,
        JSON.stringify(payload)
      )
    } catch (err) {
      console.error("[session-manager] redis persist error:", err)
    }
  }

  private async loadFromRedis(sessionId: string): Promise<RoomState | null> {
    if (!this.redis) return null
    try {
      const raw = await this.redis.get(`session:${sessionId}`)
      if (!raw) return null

      const d = JSON.parse(raw)
      const room: RoomState = {
        sessionId:      d.sessionId,
        campaignId:     d.campaignId,
        masterId:       d.masterId,
        activeSceneId:  d.activeSceneId,
        activeSceneUrl: d.activeSceneUrl,
        participants:   new Map((d.participants as Participant[]).map(p => [p.userId, p])),
        tokens:         new Map(),
        npcTokens:      new Map((d.npcTokens as NpcTokenState[] ?? []).map(n => [n.tokenId, n])),
        sheetStates:    new Map(),
        combat:         d.combat ?? { active: false, round: 1, turnIndex: 0, combatants: [] },
        disarmedTraps:  new Set(d.disarmedTraps),
        revealedNotes:  new Set(d.revealedNotes),
        fogCells:       new Set(d.fogCells),
        media:  d.media  ?? { playing: false, trackIndex: 0, trackUrl: null, trackName: null },
        video:  d.video  ?? { playing: false, url: null, name: null, mode: null, transitionIn: null, transitionOut: null, transitionDuration: null, overlayOpacity: null, overlayBlend: null },
        lastActivity:   d.lastActivity,
      }
      console.log(`[session-manager] restored session ${sessionId} from Redis`)
      return room
    } catch (err) {
      console.error("[session-manager] redis load error:", err)
      return null
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  /** Remove rooms sem atividade há mais de X ms */
  pruneStale(maxAgeMs = 1000 * 60 * 60 * 12): void {
    const cutoff = Date.now() - maxAgeMs
    for (const [id, room] of this.rooms) {
      if (room.lastActivity < cutoff) {
        this.rooms.delete(id)
        console.log(`[session-manager] pruned stale room: ${id}`)
      }
    }
  }
}
