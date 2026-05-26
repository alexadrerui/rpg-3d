import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest"
import { randomUUID } from "crypto"
import {
  createTestServer, makeToken, connectClient,
  waitConnect, waitEvent, ack,
  type TestServer, type TestSocket,
} from "./helpers.js"

// ─────────────────────────────────────────────────────────────────────────────
// Shared server — one instance for the entire suite (sequential tests)
// ─────────────────────────────────────────────────────────────────────────────

let srv: TestServer
const openSockets: TestSocket[] = []

function trackedClient(port: number, token: string): TestSocket {
  const s = connectClient(port, token)
  openSockets.push(s)
  return s
}

beforeAll(async () => { srv = await createTestServer() })
afterAll(async ()  => { await srv.close() })
afterEach(() => {
  // Disconnect & drain tracked sockets after each test
  for (const s of openSockets.splice(0)) s.disconnect()
})

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function joinRoom(
  socket:     TestSocket,
  sessionId:  string,
  campaignId: string,
  token:      string,
  characterId?: string,
) {
  await waitConnect(socket)
  return ack<{ ok: boolean; error?: string }>(socket, "room:join", {
    sessionId,
    campaignId,
    token,
    ...(characterId ? { characterId } : {}),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// room:join
// ─────────────────────────────────────────────────────────────────────────────

describe("room:join", () => {
  it("master joins room successfully", async () => {
    const sessId  = randomUUID()
    const campId  = randomUUID()
    const masterT = makeToken({ sub: randomUUID(), name: "DM", isMaster: true })
    const socket  = trackedClient(srv.port, masterT)

    const result = await joinRoom(socket, sessId, campId, masterT)
    expect(result).toMatchObject({ ok: true })
  })

  it("player joins room successfully with characterId", async () => {
    const sessId  = randomUUID()
    const campId  = randomUUID()
    const masterT = makeToken({ sub: randomUUID(), name: "DM", isMaster: true })
    const playerT = makeToken({ sub: randomUUID(), name: "Player" })

    // Master must join first to create the room
    const master = trackedClient(srv.port, masterT)
    await joinRoom(master, sessId, campId, masterT)

    const player = trackedClient(srv.port, playerT)
    const result = await joinRoom(player, sessId, campId, playerT, "char-abc")
    expect(result).toMatchObject({ ok: true })
  })

  it("rejects malformed payload", async () => {
    const masterT = makeToken({ sub: randomUUID(), name: "DM" })
    const socket  = trackedClient(srv.port, masterT)
    await waitConnect(socket)

    // Missing required sessionId / campaignId (not UUIDs)
    const result = await ack<{ ok: boolean; error?: string }>(socket, "room:join", {
      sessionId: "not-a-uuid", campaignId: "also-bad", token: masterT,
    })
    expect(result).toMatchObject({ ok: false, error: "INVALID_PAYLOAD" })
  })

  it("broadcasts room:participant to existing members when new player joins", async () => {
    const sessId  = randomUUID()
    const campId  = randomUUID()
    const masterT = makeToken({ sub: randomUUID(), name: "DM", isMaster: true })
    const playerT = makeToken({ sub: randomUUID(), name: "Warrior" })

    const master = trackedClient(srv.port, masterT)
    await joinRoom(master, sessId, campId, masterT)

    const participantEvt = waitEvent<{ name?: string; isOnline: boolean }>(master, "room:participant")

    const player = trackedClient(srv.port, playerT)
    await joinRoom(player, sessId, campId, playerT, randomUUID())

    const evt = await participantEvt
    expect(evt).toMatchObject({ isOnline: true, name: "Warrior" })
  })

  it("restores video state for late-joining socket", async () => {
    const sessId  = randomUUID()
    const campId  = randomUUID()
    const masterT = makeToken({ sub: randomUUID(), name: "DM", isMaster: true })
    const playerT = makeToken({ sub: randomUUID(), name: "Rogue" })

    // Master joins and plays a video
    const master = trackedClient(srv.port, masterT)
    await joinRoom(master, sessId, campId, masterT)
    await ack(master, "video:play", {
      url:  "https://example.com/cinematic.mp4",
      mode: "cinematic",
    })

    // Player joins after video is already active — should receive video:state
    const player = trackedClient(srv.port, playerT)
    const videoStateEvt = waitEvent<{ url: string; playing: boolean }>(player, "video:state")
    await joinRoom(player, sessId, campId, playerT, randomUUID())

    const state = await videoStateEvt
    expect(state).toMatchObject({ url: "https://example.com/cinematic.mp4", playing: true })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// video:play / video:stop
// ─────────────────────────────────────────────────────────────────────────────

describe("video:play / video:stop", () => {
  it("master plays cinematic video — ack ok + server state reflects all fields", async () => {
    const sessId  = randomUUID()
    const campId  = randomUUID()
    const masterT = makeToken({ sub: randomUUID(), name: "DM", isMaster: true })
    const master  = trackedClient(srv.port, masterT)
    await joinRoom(master, sessId, campId, masterT)

    const result = await ack<{ ok: boolean }>(master, "video:play", {
      url:                "https://example.com/video.mp4",
      name:               "Intro cutscene",
      mode:               "cinematic",
      transitionIn:       "dream",
      transitionOut:      "fade",
      transitionDuration: 2000,
      overlayOpacity:     1.0,
      overlayBlend:       "normal",
    })

    expect(result).toMatchObject({ ok: true })

    // Verify all 9 fields were correctly persisted in the room state
    const room = srv.sessions.get(sessId)!
    expect(room.video).toMatchObject({
      playing:            true,
      url:                "https://example.com/video.mp4",
      name:               "Intro cutscene",
      mode:               "cinematic",
      transitionIn:       "dream",
      transitionOut:      "fade",
      transitionDuration: 2000,
      overlayOpacity:     1.0,
      overlayBlend:       "normal",
    })
  })

  it("video:state is broadcast to all room members on video:play", async () => {
    const sessId  = randomUUID()
    const campId  = randomUUID()
    const masterT = makeToken({ sub: randomUUID(), name: "DM",       isMaster: true })
    const observT = makeToken({ sub: randomUUID(), name: "Observer", isMaster: false })

    const master   = trackedClient(srv.port, masterT)
    const observer = trackedClient(srv.port, observT)

    await joinRoom(master,   sessId, campId, masterT)
    await joinRoom(observer, sessId, campId, observT, randomUUID())

    // Observer waits for video:state broadcast from master's video:play
    const stateEvt = waitEvent<Record<string, unknown>>(observer, "video:state")

    await ack(master, "video:play", {
      url:  "https://example.com/cutscene.mp4",
      mode: "cinematic",
    })

    const state = await stateEvt
    expect(state).toMatchObject({ playing: true, url: "https://example.com/cutscene.mp4", mode: "cinematic" })
  })

  it("non-master cannot play video — FORBIDDEN", async () => {
    const sessId  = randomUUID()
    const campId  = randomUUID()
    const masterT = makeToken({ sub: randomUUID(), name: "DM",     isMaster: true })
    const playerT = makeToken({ sub: randomUUID(), name: "Player", isMaster: false })

    const master = trackedClient(srv.port, masterT)
    await joinRoom(master, sessId, campId, masterT)

    const player = trackedClient(srv.port, playerT)
    await joinRoom(player, sessId, campId, playerT, randomUUID())

    const result = await ack<{ ok: boolean; error?: string }>(player, "video:play", {
      url:  "https://example.com/hack.mp4",
      mode: "cinematic",
    })
    expect(result).toMatchObject({ ok: false, error: "FORBIDDEN" })
  })

  it("master stops video — state resets to null fields", async () => {
    const sessId  = randomUUID()
    const campId  = randomUUID()
    const masterT = makeToken({ sub: randomUUID(), name: "DM", isMaster: true })
    const master  = trackedClient(srv.port, masterT)
    await joinRoom(master, sessId, campId, masterT)

    // Play first
    await ack(master, "video:play", {
      url:  "https://example.com/scene.mp4",
      mode: "overlay",
    })

    // Then stop — capture the video:state event emitted by the server
    const stateEvt = waitEvent<Record<string, unknown>>(master, "video:state")
    const result   = await ack<{ ok: boolean }>(master, "video:stop", {})

    expect(result).toMatchObject({ ok: true })
    const state = await stateEvt
    expect(state).toMatchObject({ playing: false, url: null, mode: null })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// media:play / media:stop
// ─────────────────────────────────────────────────────────────────────────────

describe("media:play / media:stop", () => {
  it("master plays media — playing:true in media:state", async () => {
    const sessId  = randomUUID()
    const campId  = randomUUID()
    const masterT = makeToken({ sub: randomUUID(), name: "DM", isMaster: true })
    const master  = trackedClient(srv.port, masterT)
    await joinRoom(master, sessId, campId, masterT)

    const stateEvt = waitEvent<{ playing: boolean; trackIndex: number }>(master, "media:state")
    const result   = await ack<{ ok: boolean }>(master, "media:play", { trackIndex: 2 })

    expect(result).toMatchObject({ ok: true })
    const state = await stateEvt
    expect(state).toMatchObject({ playing: true, trackIndex: 2 })
  })

  it("master stops media — playing:false, trackIndex resets", async () => {
    const sessId  = randomUUID()
    const campId  = randomUUID()
    const masterT = makeToken({ sub: randomUUID(), name: "DM", isMaster: true })
    const master  = trackedClient(srv.port, masterT)
    await joinRoom(master, sessId, campId, masterT)

    await ack(master, "media:play", { trackIndex: 3 })

    const stateEvt = waitEvent<{ playing: boolean; trackIndex: number }>(master, "media:state")
    const result   = await ack<{ ok: boolean }>(master, "media:stop", {})

    expect(result).toMatchObject({ ok: true })
    const state = await stateEvt
    expect(state).toMatchObject({ playing: false, trackIndex: 0 })
  })

  it("non-master cannot control media — FORBIDDEN", async () => {
    const sessId  = randomUUID()
    const campId  = randomUUID()
    const masterT = makeToken({ sub: randomUUID(), name: "DM",     isMaster: true })
    const playerT = makeToken({ sub: randomUUID(), name: "Player", isMaster: false })

    const master = trackedClient(srv.port, masterT)
    await joinRoom(master, sessId, campId, masterT)

    const player = trackedClient(srv.port, playerT)
    await joinRoom(player, sessId, campId, playerT, randomUUID())

    const result = await ack<{ ok: boolean; error?: string }>(player, "media:play", {})
    expect(result).toMatchObject({ ok: false, error: "FORBIDDEN" })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// dice:roll
// ─────────────────────────────────────────────────────────────────────────────

describe("dice:roll", () => {
  it("produces a valid result broadcast", async () => {
    const sessId  = randomUUID()
    const campId  = randomUUID()
    const masterT = makeToken({ sub: randomUUID(), name: "DM", isMaster: true })
    const master  = trackedClient(srv.port, masterT)
    await joinRoom(master, sessId, campId, masterT)

    const resultEvt = waitEvent<{
      diceCount: number; diceFaces: number; rolls: number[]; total: number
    }>(master, "dice:result")

    const ackResult = await ack<{ ok: boolean }>(master, "dice:roll", {
      diceCount: 2, diceFaces: 6, modifier: 3, label: "Dano",
    })
    expect(ackResult).toMatchObject({ ok: true })

    const diceResult = await resultEvt
    expect(diceResult.diceCount).toBe(2)
    expect(diceResult.diceFaces).toBe(6)
    expect(diceResult.rolls).toHaveLength(2)
    expect(diceResult.rolls.every(r => r >= 1 && r <= 6)).toBe(true)
    expect(diceResult.total).toBe(diceResult.rolls.reduce((a, b) => a + b, 0) + 3)
  })

  it("rejects invalid dice faces", async () => {
    const sessId  = randomUUID()
    const campId  = randomUUID()
    const masterT = makeToken({ sub: randomUUID(), name: "DM", isMaster: true })
    const master  = trackedClient(srv.port, masterT)
    await joinRoom(master, sessId, campId, masterT)

    const result = await ack<{ ok: boolean; error?: string }>(master, "dice:roll", {
      diceCount: 1, diceFaces: 7,   // 7 is not a valid face (only 4,6,8,10,12,20,100)
    })
    expect(result).toMatchObject({ ok: false, error: "INVALID_PAYLOAD" })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// chat:send
// ─────────────────────────────────────────────────────────────────────────────

describe("chat:send", () => {
  it("general message is broadcast back to the sender", async () => {
    const sessId  = randomUUID()
    const campId  = randomUUID()
    const masterT = makeToken({ sub: randomUUID(), name: "DM", isMaster: true })
    const master  = trackedClient(srv.port, masterT)
    await joinRoom(master, sessId, campId, masterT)

    const msgEvt = waitEvent<{ channel: string; content: string; fromName: string }>(
      master, "chat:message",
    )
    const result = await ack<{ ok: boolean }>(master, "chat:send", {
      channel: "general", content: "Hello, world!", speakAs: "player",
    })
    expect(result).toMatchObject({ ok: true })

    const msg = await msgEvt
    expect(msg).toMatchObject({ channel: "general", content: "Hello, world!", fromName: "DM" })
  })

  it("non-master cannot send on master channel — FORBIDDEN", async () => {
    const sessId  = randomUUID()
    const campId  = randomUUID()
    const masterT = makeToken({ sub: randomUUID(), name: "DM",     isMaster: true })
    const playerT = makeToken({ sub: randomUUID(), name: "Player", isMaster: false })

    const master = trackedClient(srv.port, masterT)
    await joinRoom(master, sessId, campId, masterT)

    const player = trackedClient(srv.port, playerT)
    await joinRoom(player, sessId, campId, playerT, randomUUID())

    const result = await ack<{ ok: boolean; error?: string }>(player, "chat:send", {
      channel: "master", content: "I should not see this", speakAs: "player",
    })
    expect(result).toMatchObject({ ok: false, error: "FORBIDDEN" })
  })
})
