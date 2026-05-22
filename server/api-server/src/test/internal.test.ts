import { describe, it, expect } from "vitest"
import request from "supertest"
import { createApp } from "../app.js"
import { prisma }    from "../lib/prisma.js"
import { createUser, bearerHeader, createCampaign, createSession } from "./helpers.js"

const app           = createApp()
const SERVER_SECRET = "test-server-secret"
const secretHeader  = { "x-server-secret": SERVER_SECRET }

// ── POST /internal/session-log ────────────────────────────────────────────────

describe("POST /internal/session-log", () => {
  it("insere batch de entradas de log", async () => {
    const master   = await createUser()
    const campaign = await createCampaign(master.id)
    const session  = await createSession(campaign.id)

    const entries = [
      { sessionId: session.id, campaignId: campaign.id, type: "JOIN",  actorName: "Alice" },
      { sessionId: session.id, campaignId: campaign.id, type: "CHAT",  actorName: "Alice", data: { content: "olá" } },
      { sessionId: session.id, campaignId: campaign.id, type: "DICE",  actorName: "Bob",   data: { total: 15 } },
    ]

    const res = await request(app)
      .post("/internal/session-log")
      .set(secretHeader)
      .send({ entries })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.count).toBe(3)

    const logs = await prisma.sessionLog.findMany({ where: { sessionId: session.id } })
    expect(logs).toHaveLength(3)
  })

  it("retorna 200 para batch vazio sem inserir nada", async () => {
    const res = await request(app)
      .post("/internal/session-log")
      .set(secretHeader)
      .send({ entries: [] })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it("retorna 401 sem o server secret", async () => {
    const res = await request(app)
      .post("/internal/session-log")
      .send({ entries: [] })

    expect(res.status).toBe(401)
  })

  it("retorna 400 para payload inválido", async () => {
    const res = await request(app)
      .post("/internal/session-log")
      .set(secretHeader)
      .send({ entries: [{ type: "INVALIDO" }] })

    expect(res.status).toBe(400)
  })
})

// ── POST /internal/session-end ────────────────────────────────────────────────

describe("POST /internal/session-end", () => {
  it("marca a sessão como encerrada", async () => {
    const master   = await createUser()
    const campaign = await createCampaign(master.id)
    const session  = await createSession(campaign.id)

    expect(session.endedAt).toBeNull()

    const res = await request(app)
      .post("/internal/session-end")
      .set(secretHeader)
      .send({ sessionId: session.id })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    const updated = await prisma.session.findUnique({ where: { id: session.id } })
    expect(updated?.endedAt).not.toBeNull()
  })

  it("retorna 401 sem o server secret", async () => {
    const res = await request(app)
      .post("/internal/session-end")
      .send({ sessionId: "any" })

    expect(res.status).toBe(401)
  })
})

// ── GET /sessions/:id/log ─────────────────────────────────────────────────────

describe("GET /sessions/:id/log", () => {
  it("mestre pode ver o log completo", async () => {
    const master   = await createUser()
    const campaign = await createCampaign(master.id)
    const session  = await createSession(campaign.id)

    await prisma.sessionLog.create({
      data: { sessionId: session.id, campaignId: campaign.id, type: "JOIN", actorName: "Alice" },
    })

    const res = await request(app)
      .get(`/sessions/${session.id}/log`)
      .set(bearerHeader(master))

    expect(res.status).toBe(200)
    expect(res.body.session.id).toBe(session.id)
    expect(res.body.logs).toHaveLength(1)
    expect(res.body.logs[0].type).toBe("JOIN")
  })

  it("jogador com personagem na campanha pode ver o log", async () => {
    const master  = await createUser()
    const player  = await createUser()
    const campaign = await createCampaign(master.id)
    const session  = await createSession(campaign.id)

    await prisma.character.create({
      data: { userId: player.id, campaignId: campaign.id, name: "Aragorn", sheetData: {} },
    })

    const res = await request(app)
      .get(`/sessions/${session.id}/log`)
      .set(bearerHeader(player))

    expect(res.status).toBe(200)
  })

  it("usuário sem personagem na campanha recebe 403", async () => {
    const master     = await createUser()
    const outsider   = await createUser()
    const campaign   = await createCampaign(master.id)
    const session    = await createSession(campaign.id)

    const res = await request(app)
      .get(`/sessions/${session.id}/log`)
      .set(bearerHeader(outsider))

    expect(res.status).toBe(403)
  })

  it("retorna 404 para sessão inexistente", async () => {
    const user = await createUser()
    const res  = await request(app)
      .get("/sessions/nao-existe/log")
      .set(bearerHeader(user))

    expect(res.status).toBe(404)
  })

  it("retorna 401 sem autenticação", async () => {
    const res = await request(app).get("/sessions/qualquer/log")
    expect(res.status).toBe(401)
  })
})
