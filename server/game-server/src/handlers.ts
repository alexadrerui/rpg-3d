import { randomUUID } from "crypto"
import type { Server, Socket } from "socket.io"
import type { ServerToClientMap, ClientToServerMap } from "@rpg3d/schema"
import {
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
  type AnyTriggerNode,
} from "@rpg3d/schema"
import { rollDice }         from "@rpg3d/dice-engine"
import { SessionManager }   from "./session-manager.js"
import { logQueue }         from "./log-queue.js"
import {
  isInsideTrigger,
  computeRevealedCells,
  computeRaycastCells,
  computeRoomCells,
  extractWallSegments,
  type WallSegment,
} from "./collision.js"
import type { JwtPayload }  from "./auth.js"

// ─────────────────────────────────────────────────────────────────────────────
// Config de ambiente
// ─────────────────────────────────────────────────────────────────────────────

const API_URL       = process.env.API_URL       ?? "http://localhost:4000"
const SERVER_SECRET = process.env.SERVER_SECRET ?? "dev-server-secret"
const STORAGE_URL   = process.env.STORAGE_PUBLIC_URL ?? `${API_URL}/scenes`

async function fetchSceneUrl(sceneId: string): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/scenes/${sceneId}/url`, {
      headers: { "x-server-secret": SERVER_SECRET },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { url: string }
    return data.url
  } catch {
    return `${STORAGE_URL}/${sceneId}.rpgscene`
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache de cenas carregadas (sceneId → triggers + walls + fog config)
// ─────────────────────────────────────────────────────────────────────────────

type SceneData = {
  triggers:     AnyTriggerNode[]
  walls:        WallSegment[]
  fogMode:      "circle" | "raycast" | "room"
  revealRadius: number
}

type CacheEntry = { data: SceneData; loadedAt: number }

const SCENE_CACHE_TTL  = 1000 * 60 * 60       // 1h sem uso → expira
const COOLDOWN_MAX_AGE = 1000 * 60 * 5        // 5 min → cooldown obsoleto

const sceneDataCache   = new Map<string, CacheEntry>()
const triggerCooldowns = new Map<string, number>()  // triggerId → timestamp

setInterval(() => {
  const now = Date.now()
  for (const [id, entry] of sceneDataCache) {
    if (now - entry.loadedAt > SCENE_CACHE_TTL) sceneDataCache.delete(id)
  }
  for (const [id, ts] of triggerCooldowns) {
    if (now - ts > COOLDOWN_MAX_AGE) triggerCooldowns.delete(id)
  }
}, 1000 * 60 * 15)  // roda a cada 15 min

async function fetchSceneData(sceneUrl: string, sceneId: string): Promise<SceneData> {
  const cached = sceneDataCache.get(sceneId)
  if (cached) return cached.data
  try {
    const res = await fetch(sceneUrl)
    const raw = await res.json() as {
      triggers?:    AnyTriggerNode[]
      scene?:       { nodes?: Record<string, unknown> }
      environment?: { fogOfWar?: { revealMode?: string; revealRadius?: number } }
    }
    const triggers    = raw.triggers ?? []
    const walls       = extractWallSegments(raw.scene?.nodes ?? {})
    const fogCfg      = raw.environment?.fogOfWar
    const fogMode     = (fogCfg?.revealMode ?? "circle") as SceneData["fogMode"]
    const revealRadius = fogCfg?.revealRadius ?? 5

    const data: SceneData = { triggers, walls, fogMode, revealRadius }
    sceneDataCache.set(sceneId, { data, loadedAt: Date.now() })
    if (walls.length > 0) console.log(`[scene] ${sceneId}: ${walls.length} wall segments extracted`)
    return data
  } catch {
    console.error(`[handlers] failed to fetch scene ${sceneId}`)
    return { triggers: [], walls: [], fogMode: "circle", revealRadius: 5 }
  }
}

function isTriggerOnCooldown(triggerId: string, cooldownMs: number): boolean {
  const last = triggerCooldowns.get(triggerId)
  if (!last || cooldownMs === 0) return false
  return Date.now() - last < cooldownMs
}

// ─────────────────────────────────────────────────────────────────────────────
// Registro de handlers no socket
// ─────────────────────────────────────────────────────────────────────────────

export function registerHandlers(
  io: Server<ClientToServerMap, ServerToClientMap>,
  socket: Socket<ClientToServerMap, ServerToClientMap>,
  sessions: SessionManager,
): void {

  const user = socket.data.user as JwtPayload
  let currentSessionId: string | null = null

  // ── room:join ─────────────────────────────────────────────────────────────

  socket.on("room:join", async (raw, cb) => {
    const parsed = EvJoinRoom.safeParse(raw)
    if (!parsed.success) return cb({ ok: false, error: "INVALID_PAYLOAD" })

    const { sessionId, campaignId, characterId, avatarType, avatarUrl } = parsed.data
    const isMaster = user.isMaster ?? !characterId

    const room = await sessions.getOrCreate(sessionId, campaignId, user.sub)

    sessions.join(room, {
      userId:      user.sub,
      name:        user.name,
      socketId:    socket.id,
      characterId,
      isMaster,
      isOnline:    true,
      avatarType,
      avatarUrl,
    })

    currentSessionId = sessionId
    await socket.join(sessionId)

    // Notifica todos na sala que alguém entrou
    socket.to(sessionId).emit("room:participant", {
      userId:      user.sub,
      characterId,
      isMaster,
      isOnline:    true,
      name:        user.name,
      avatarType,
      avatarUrl,
    })

    cb({ ok: true, data: undefined })

    logQueue.push({
      sessionId:  sessionId,
      campaignId: campaignId,
      type:       "JOIN",
      actorName:  user.name,
      data:       { isMaster },
    })

    // Se já tem cena ativa, manda o URL para o novo participante
    if (room.activeSceneUrl) {
      socket.emit("scene:loaded", {
        sceneId:      room.activeSceneId!,
        sceneUrl:     room.activeSceneUrl,
        transitionFx: "none",
      })
    }

    // Restaura NPC tokens existentes na room
    for (const npc of sessions.getNpcTokens(room)) {
      socket.emit("npc:spawned", npc)
    }

    console.log(`[room:join] ${user.name} → session ${sessionId} (master: ${isMaster})`)
  })

  // ── scene:load ────────────────────────────────────────────────────────────

  socket.on("scene:load", async (raw, cb) => {
    const parsed = EvLoadScene.safeParse(raw)
    if (!parsed.success) return cb({ ok: false, error: "INVALID_PAYLOAD" })

    const room = currentSessionId ? sessions.get(currentSessionId) : null
    if (!room) return cb({ ok: false, error: "NOT_IN_ROOM" })
    if (!sessions.isMaster(room, user.sub)) return cb({ ok: false, error: "FORBIDDEN" })

    const { sceneId, transitionFx } = parsed.data

    const sceneUrl = await fetchSceneUrl(sceneId)

    sessions.setActiveScene(room, sceneId, sceneUrl)

    // Pré-carrega dados da cena em cache (triggers + walls + fog config)
    fetchSceneData(sceneUrl, sceneId).catch(console.error)

    // Broadcast para TODOS na sala (incluindo remetente)
    io.to(currentSessionId!).emit("scene:loaded", { sceneId, sceneUrl, transitionFx })

    logQueue.push({
      sessionId:  currentSessionId!,
      campaignId: room.campaignId,
      type:       "SCENE_LOAD",
      actorName:  user.name,
      data:       { sceneId },
    })

    cb({ ok: true, data: undefined })
    console.log(`[scene:load] ${sceneId} → session ${currentSessionId}`)
  })

  // ── token:move ────────────────────────────────────────────────────────────

  socket.on("token:move", async (raw) => { try {
    const parsed = EvMoveToken.safeParse(raw)
    if (!parsed.success) return

    const room = currentSessionId ? sessions.get(currentSessionId) : null
    if (!room) return

    const isNpc = sessions.isNpcToken(room, parsed.data.characterId)

    // Apenas o mestre pode mover tokens NPC/enemy
    if (isNpc && !sessions.isMaster(room, user.sub)) return

    const tokenData = { ...parsed.data, userId: user.sub }

    if (isNpc) {
      sessions.moveNpcToken(room, parsed.data.characterId, parsed.data.position, parsed.data.rotation)
    } else {
      sessions.updateToken(room, tokenData)
    }

    // Broadcast posição (excluindo remetente para evitar eco)
    socket.to(currentSessionId!).emit("token:moved", tokenData)

    // ── Verificar triggers + fog (só para tokens de jogador) ───────────────
    if (!isNpc && room.activeSceneId && room.activeSceneUrl) {
      const { triggers, walls, fogMode, revealRadius } =
        await fetchSceneData(room.activeSceneUrl, room.activeSceneId)

      for (const trigger of triggers) {
        // Pula armadilhas desarmadas e notas já reveladas
        if (trigger.type === "trigger_trap" && (trigger.isDisarmed || room.disarmedTraps.has(trigger.id))) continue
        if (trigger.type === "trigger_note" && room.revealedNotes.has(trigger.id)) continue

        // Verifica oneShot
        if (trigger.oneShot && (room.disarmedTraps.has(trigger.id) || room.revealedNotes.has(trigger.id))) continue

        // Verifica cooldown
        if (isTriggerOnCooldown(trigger.id, trigger.cooldownMs)) continue

        if (isInsideTrigger(trigger, parsed.data.position)) {
          triggerCooldowns.set(trigger.id, Date.now())

          // Notas com revealOn = "enter_zone" são reveladas automaticamente
          if (trigger.type === "trigger_note" && trigger.revealOn === "enter_zone") {
            sessions.revealNote(room, trigger.id)
          }

          // Emite para a sala inteira
          io.to(currentSessionId!).emit("trigger:activated", {
            trigger,
            activatedBy: parsed.data.characterId,
            position:    parsed.data.position,
          })

          // Transição de cena automática
          if (trigger.type === "trigger_transition" && trigger.targetSceneId) {
            const targetUrl = await fetchSceneUrl(trigger.targetSceneId)
            sessions.setActiveScene(room, trigger.targetSceneId, targetUrl)
            io.to(currentSessionId!).emit("scene:loaded", {
              sceneId:      trigger.targetSceneId,
              sceneUrl:     targetUrl,
              transitionFx: trigger.transitionFx ?? "fade",
            })
          }
        }
      }

      // ── Fog of war ───────────────────────────────────────────────────────
      let fogCells: { x: number; z: number }[]
      switch (fogMode) {
        case "raycast":
          fogCells = computeRaycastCells(parsed.data.position, revealRadius, walls)
          break
        case "room":
          // maxDistance = revealRadius × 3 para revelar salas generosas
          fogCells = computeRoomCells(parsed.data.position, revealRadius * 3, walls)
          break
        default:
          fogCells = computeRevealedCells(parsed.data.position, revealRadius)
      }
      const newKeys = sessions.revealFogCells(room, fogCells)

      if (newKeys.length > 0) {
        const newCells = newKeys.map(k => {
          const [x, z] = k.split(":").map(Number)
          return { x, z }
        })
        io.to(currentSessionId!).emit("fog:revealed", { cells: newCells })
      }
    }
  } catch (err) { console.error("[token:move] unhandled error:", err) } })

  // ── chat:send ─────────────────────────────────────────────────────────────

  socket.on("chat:send", (raw, cb) => {
    const parsed = EvSendMessage.safeParse(raw)
    if (!parsed.success) return cb({ ok: false, error: "INVALID_PAYLOAD" })

    const room = currentSessionId ? sessions.get(currentSessionId) : null
    if (!room) return cb({ ok: false, error: "NOT_IN_ROOM" })

    const { channel, content, toUserId, speakAs } = parsed.data
    const participant = room.participants.get(user.sub)

    const message = {
      id:         randomUUID(),
      channel,
      content,
      toUserId,
      speakAs,
      fromUserId: user.sub,
      fromName:   participant?.name ?? user.name,
      timestamp:  new Date().toISOString(),
    }

    if (channel === "whisper" && toUserId) {
      // Mensagem privada: só remetente e destinatário
      const target = Array.from(room.participants.values()).find(p => p.userId === toUserId)
      socket.emit("chat:message", message)
      if (target?.socketId) io.to(target.socketId).emit("chat:message", message)

    } else if (channel === "master") {
      // Só o mestre e o remetente veem
      if (!sessions.isMaster(room, user.sub)) {
        return cb({ ok: false, error: "FORBIDDEN" })
      }
      io.to(currentSessionId!).emit("chat:message", message)

    } else {
      // general / game_log: todos na sala
      io.to(currentSessionId!).emit("chat:message", message)
      if (channel === "general") {
        logQueue.push({
          sessionId:  currentSessionId!,
          campaignId: room.campaignId,
          type:       "CHAT",
          actorName:  message.fromName,
          data:       { content: content.slice(0, 200) },
        })
      }
    }

    cb({ ok: true, data: undefined })
  })

  // ── dice:roll ─────────────────────────────────────────────────────────────

  socket.on("dice:roll", (raw, cb) => {
    const parsed = EvRollDice.safeParse(raw)
    if (!parsed.success) return cb({ ok: false, error: "INVALID_PAYLOAD" })

    const room = currentSessionId ? sessions.get(currentSessionId) : null
    if (!room) return cb({ ok: false, error: "NOT_IN_ROOM" })

    const { diceCount, diceFaces, modifier, label, isSecret, characterId } = parsed.data
    const participant = room.participants.get(user.sub)

    const { rolls, total } = rollDice(diceCount, diceFaces, modifier)

    const result = {
      id:          randomUUID(),
      diceCount,
      diceFaces,
      modifier,
      label,
      isSecret,
      characterId,
      fromUserId:  user.sub,
      fromName:    participant?.name ?? user.name,
      rolls,
      total,
      timestamp:   new Date().toISOString(),
    }

    if (isSecret) {
      // Rolagem secreta: só remetente e mestre
      socket.emit("dice:result", result)
      const master = Array.from(room.participants.values()).find(p => p.isMaster)
      if (master?.socketId && master.userId !== user.sub) {
        io.to(master.socketId).emit("dice:result", result)
      }
    } else {
      // Broadcast para toda sala
      io.to(currentSessionId!).emit("dice:result", result)
    }

    if (!isSecret) {
      logQueue.push({
        sessionId:  currentSessionId!,
        campaignId: room.campaignId,
        type:       "DICE",
        actorName:  participant?.name ?? user.name,
        data:       { diceCount, diceFaces, modifier, rolls, total, label },
      })
    }

    // Log no chat automaticamente
    const logMsg = {
      id:         randomUUID(),
      channel:    "game_log" as const,
      content:    isSecret
        ? `🎲 ${participant?.name ?? user.name} rolou ${diceCount}d${diceFaces} em segredo`
        : `🎲 ${participant?.name ?? user.name} rolou ${diceCount}d${diceFaces}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ""}: [${rolls.join(", ")}] = **${total}**${label ? ` (${label})` : ""}`,
      speakAs:    "player" as const,
      fromUserId: user.sub,
      fromName:   participant?.name ?? user.name,
      timestamp:  new Date().toISOString(),
    }
    if (!isSecret) io.to(currentSessionId!).emit("chat:message", logMsg)

    cb({ ok: true, data: undefined })
  })

  // ── note:reveal ───────────────────────────────────────────────────────────

  socket.on("note:reveal", (raw, cb) => {
    const parsed = EvRevealNote.safeParse(raw)
    if (!parsed.success) return cb({ ok: false, error: "INVALID_PAYLOAD" })

    const room = currentSessionId ? sessions.get(currentSessionId) : null
    if (!room) return cb({ ok: false, error: "NOT_IN_ROOM" })
    if (!sessions.isMaster(room, user.sub)) return cb({ ok: false, error: "FORBIDDEN" })

    const triggers = room.activeSceneId ? (sceneDataCache.get(room.activeSceneId)?.data.triggers ?? []) : []
    const trigger  = triggers.find(t => t.id === parsed.data.triggerId)
    if (!trigger) return cb({ ok: false, error: "TRIGGER_NOT_FOUND" })

    sessions.revealNote(room, parsed.data.triggerId)
    io.to(currentSessionId!).emit("trigger:activated", {
      trigger,
      activatedBy: user.sub,
      position:    trigger.position,
    })

    logQueue.push({
      sessionId:  currentSessionId!,
      campaignId: room.campaignId,
      type:       "NOTE_REVEAL",
      actorName:  user.name,
      data:       { triggerId: parsed.data.triggerId },
    })

    cb({ ok: true, data: undefined })
    console.log(`[note:reveal] ${parsed.data.triggerId} by master`)
  })

  // ── trap:disarm ───────────────────────────────────────────────────────────

  socket.on("trap:disarm", (raw, cb) => {
    const parsed = EvDisarmTrap.safeParse(raw)
    if (!parsed.success) return cb({ ok: false, error: "INVALID_PAYLOAD" })

    const room = currentSessionId ? sessions.get(currentSessionId) : null
    if (!room) return cb({ ok: false, error: "NOT_IN_ROOM" })
    if (!sessions.isMaster(room, user.sub)) return cb({ ok: false, error: "FORBIDDEN" })

    sessions.disarmTrap(room, parsed.data.triggerId)

    // Atualiza o trigger no cache com isDisarmed = true
    const triggers = room.activeSceneId ? sceneDataCache.get(room.activeSceneId)?.data.triggers : undefined
    if (triggers) {
      const t = triggers.find(t => t.id === parsed.data.triggerId)
      if (t && t.type === "trigger_trap") (t as { isDisarmed: boolean }).isDisarmed = true
    }

    logQueue.push({
      sessionId:  currentSessionId!,
      campaignId: room.campaignId,
      type:       "TRAP_DISARM",
      actorName:  user.name,
      data:       { triggerId: parsed.data.triggerId },
    })

    cb({ ok: true, data: undefined })
    console.log(`[trap:disarm] ${parsed.data.triggerId} by master`)
  })

  // ── fog:clear ─────────────────────────────────────────────────────────────

  socket.on("fog:clear", (raw, cb) => {
    const parsed = EvClearFog.safeParse(raw)
    if (!parsed.success) return cb({ ok: false, error: "INVALID_PAYLOAD" })

    const room = currentSessionId ? sessions.get(currentSessionId) : null
    if (!room) return cb({ ok: false, error: "NOT_IN_ROOM" })
    if (!sessions.isMaster(room, user.sub)) return cb({ ok: false, error: "FORBIDDEN" })

    sessions.clearFog(room)
    io.to(currentSessionId!).emit("fog:revealed", { cells: [] })

    logQueue.push({
      sessionId:  currentSessionId!,
      campaignId: room.campaignId,
      type:       "FOG_CLEAR",
      actorName:  user.name,
    })

    cb({ ok: true, data: undefined })
    console.log(`[fog:clear] session ${currentSessionId}`)
  })

  // ── npc:spawn ─────────────────────────────────────────────────────────────

  socket.on("npc:spawn", (raw, cb) => {
    const parsed = EvSpawnNpc.safeParse(raw)
    if (!parsed.success) return cb({ ok: false, error: "INVALID_PAYLOAD" })

    const room = currentSessionId ? sessions.get(currentSessionId) : null
    if (!room) return cb({ ok: false, error: "NOT_IN_ROOM" })
    if (!sessions.isMaster(room, user.sub)) return cb({ ok: false, error: "FORBIDDEN" })

    const tokenId = randomUUID()
    const npc = { tokenId, ...parsed.data }

    sessions.spawnNpcToken(room, npc)
    io.to(currentSessionId!).emit("npc:spawned", npc)

    logQueue.push({
      sessionId:  currentSessionId!,
      campaignId: room.campaignId,
      type:       "NPC_SPAWN",
      actorName:  user.name,
      data:       { role: npc.role, name: npc.name, tokenId },
    })

    cb({ ok: true, data: { tokenId } })
    console.log(`[npc:spawn] ${npc.role} "${npc.name}" (${tokenId}) na session ${currentSessionId}`)
  })

  // ── npc:despawn ───────────────────────────────────────────────────────────

  socket.on("npc:despawn", (raw, cb) => {
    const parsed = EvDespawnNpc.safeParse(raw)
    if (!parsed.success) return cb({ ok: false, error: "INVALID_PAYLOAD" })

    const room = currentSessionId ? sessions.get(currentSessionId) : null
    if (!room) return cb({ ok: false, error: "NOT_IN_ROOM" })
    if (!sessions.isMaster(room, user.sub)) return cb({ ok: false, error: "FORBIDDEN" })

    const existed = sessions.despawnNpcToken(room, parsed.data.tokenId)
    if (!existed) return cb({ ok: false, error: "TOKEN_NOT_FOUND" })

    io.to(currentSessionId!).emit("npc:despawned", { tokenId: parsed.data.tokenId })

    logQueue.push({
      sessionId:  currentSessionId!,
      campaignId: room.campaignId,
      type:       "NPC_DESPAWN",
      actorName:  user.name,
      data:       { tokenId: parsed.data.tokenId },
    })

    cb({ ok: true, data: undefined })
    console.log(`[npc:despawn] ${parsed.data.tokenId} da session ${currentSessionId}`)
  })

  // ── disconnect ────────────────────────────────────────────────────────────

  socket.on("disconnect", () => {
    if (!currentSessionId) return
    const room = sessions.get(currentSessionId)
    if (!room) return

    const isMasterLeaving = sessions.isMaster(room, user.sub)
    sessions.leave(room, user.sub)

    const leaving = room.participants.get(user.sub)
    socket.to(currentSessionId).emit("room:participant", {
      userId:      user.sub,
      characterId: leaving?.characterId,
      isMaster:    isMasterLeaving,
      isOnline:    false,
      name:        user.name,
      avatarType:  leaving?.avatarType,
      avatarUrl:   leaving?.avatarUrl,
    })

    logQueue.push({
      sessionId:  currentSessionId,
      campaignId: room.campaignId,
      type:       "LEAVE",
      actorName:  user.name,
      data:       { isMaster: isMasterLeaving },
    })

    if (isMasterLeaving) {
      logQueue.endSession(currentSessionId).catch(console.error)
    }

    console.log(`[disconnect] ${user.name} saiu da session ${currentSessionId}`)
  })
}
