import { describe, it, expect, beforeEach } from "vitest"
import request from "supertest"
import { createApp } from "../app.js"
import { prisma }    from "../lib/prisma.js"
import { createUser, bearerHeader, seedSystems } from "./helpers.js"

const app = createApp()

beforeEach(async () => {
  await seedSystems()
})

// ── GET /systems ──────────────────────────────────────────────────────────────

describe("GET /systems", () => {
  it("lista sistemas com créditos e isPurchased", async () => {
    const user = await createUser({ credits: 800 })
    const res  = await request(app).get("/systems").set(bearerHeader(user))

    expect(res.status).toBe(200)
    expect(res.body.credits).toBe(800)
    expect(Array.isArray(res.body.systems)).toBe(true)

    const generic = res.body.systems.find((s: { id: string }) => s.id === "generic")
    expect(generic).toBeDefined()
    expect(generic.isPurchased).toBe(true) // gratuito = sempre comprado

    const dnd = res.body.systems.find((s: { id: string }) => s.id === "dnd5e")
    expect(dnd).toBeDefined()
    expect(dnd.isPurchased).toBe(false)
  })

  it("retorna 401 sem token", async () => {
    const res = await request(app).get("/systems")
    expect(res.status).toBe(401)
  })
})

// ── POST /systems/:id/purchase ────────────────────────────────────────────────

describe("POST /systems/:id/purchase", () => {
  it("adquire sistema gratuito sem deduzir créditos", async () => {
    const user = await createUser({ credits: 500 })
    const res  = await request(app)
      .post("/systems/generic/purchase")
      .set(bearerHeader(user))

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.credits).toBe(500) // não mudou

    const purchase = await prisma.userSystemPurchase.findUnique({
      where: { userId_systemId: { userId: user.id, systemId: "generic" } },
    })
    expect(purchase).not.toBeNull()
  })

  it("adquire sistema pago e deduz créditos via transação", async () => {
    const user = await createUser({ credits: 1000 })
    const res  = await request(app)
      .post("/systems/dnd5e/purchase")
      .set(bearerHeader(user))

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.credits).toBe(500) // 1000 - 500

    const updated = await prisma.user.findUnique({ where: { id: user.id } })
    expect(updated?.credits).toBe(500)
  })

  it("retorna 402 com créditos insuficientes", async () => {
    const user = await createUser({ credits: 100 })
    const res  = await request(app)
      .post("/systems/dnd5e/purchase")
      .set(bearerHeader(user))

    expect(res.status).toBe(402)
    expect(res.body.error).toBe("INSUFFICIENT_CREDITS")
    expect(res.body.credits).toBe(100)
    expect(res.body.needed).toBe(500)
  })

  it("retorna 400 para sistema já possuído", async () => {
    const user = await createUser({ credits: 2000 })
    await request(app).post("/systems/dnd5e/purchase").set(bearerHeader(user))

    const res = await request(app)
      .post("/systems/dnd5e/purchase")
      .set(bearerHeader(user))

    expect(res.status).toBe(400)
    expect(res.body.error).toBe("ALREADY_OWNED")
  })

  it("retorna 404 para sistema inexistente", async () => {
    const user = await createUser()
    const res  = await request(app)
      .post("/systems/nao-existe/purchase")
      .set(bearerHeader(user))

    expect(res.status).toBe(404)
    expect(res.body.error).toBe("SYSTEM_NOT_FOUND")
  })

  it("retorna 401 sem autenticação", async () => {
    const res = await request(app).post("/systems/generic/purchase")
    expect(res.status).toBe(401)
  })
})
