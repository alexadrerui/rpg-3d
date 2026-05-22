import { describe, it, expect } from "vitest"
import request from "supertest"
import { createApp } from "../app.js"
import { prisma }    from "../lib/prisma.js"
import { createUser, bearerHeader } from "./helpers.js"

const app = createApp()

// ── POST /auth/register ───────────────────────────────────────────────────────

describe("POST /auth/register", () => {
  it("cria usuário e retorna token + refreshToken", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "alice@example.com", name: "Alice", password: "password123",
    })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.refreshToken).toBeDefined()
    expect(res.body.user.email).toBe("alice@example.com")
    expect(res.body.user.password).toBeUndefined()
  })

  it("retorna 409 para e-mail duplicado", async () => {
    await createUser({ email: "dup@example.com" })
    const res = await request(app).post("/auth/register").send({
      email: "dup@example.com", name: "Bob", password: "password123",
    })
    expect(res.status).toBe(409)
    expect(res.body.error).toBe("EMAIL_TAKEN")
  })

  it("retorna 400 para payload inválido", async () => {
    const res = await request(app).post("/auth/register").send({ email: "not-an-email" })
    expect(res.status).toBe(400)
  })

  it("cria RefreshToken no banco após registro", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "tracked@example.com", name: "Tracked", password: "password123",
    })
    const record = await prisma.refreshToken.findUnique({ where: { token: res.body.refreshToken } })
    expect(record).not.toBeNull()
    expect(record?.revokedAt).toBeNull()
  })
})

// ── POST /auth/login ──────────────────────────────────────────────────────────

describe("POST /auth/login", () => {
  it("retorna token + refreshToken com credenciais válidas", async () => {
    await createUser({ email: "login@example.com", password: "secret123" })
    const res = await request(app).post("/auth/login").send({
      email: "login@example.com", password: "secret123",
    })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.refreshToken).toBeDefined()
  })

  it("retorna 401 para senha errada", async () => {
    await createUser({ email: "user@example.com", password: "correct" })
    const res = await request(app).post("/auth/login").send({
      email: "user@example.com", password: "wrong",
    })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe("INVALID_CREDENTIALS")
  })

  it("retorna 401 para e-mail desconhecido", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "nobody@example.com", password: "any",
    })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe("INVALID_CREDENTIALS")
  })
})

// ── GET /auth/me ──────────────────────────────────────────────────────────────

describe("GET /auth/me", () => {
  it("retorna dados do usuário autenticado", async () => {
    const user = await createUser({ email: "me@example.com", name: "Me" })
    const res  = await request(app).get("/auth/me").set(bearerHeader(user))
    expect(res.status).toBe(200)
    expect(res.body.email).toBe("me@example.com")
    expect(res.body.name).toBe("Me")
    expect(res.body.password).toBeUndefined()
  })

  it("retorna 401 sem token", async () => {
    const res = await request(app).get("/auth/me")
    expect(res.status).toBe(401)
  })

  it("retorna 401 com token inválido", async () => {
    const res = await request(app).get("/auth/me").set({ Authorization: "Bearer garbage" })
    expect(res.status).toBe(401)
  })
})

// ── POST /auth/refresh ────────────────────────────────────────────────────────

describe("POST /auth/refresh", () => {
  it("emite novo token e rotaciona o refreshToken", async () => {
    const loginRes = await request(app).post("/auth/register").send({
      email: "refresh@example.com", name: "Refresh", password: "password123",
    })
    const oldRefresh = loginRes.body.refreshToken as string

    const res = await request(app).post("/auth/refresh").send({ refreshToken: oldRefresh })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.refreshToken).toBeDefined()
    expect(res.body.refreshToken).not.toBe(oldRefresh)

    // Token antigo deve estar revogado
    const old = await prisma.refreshToken.findUnique({ where: { token: oldRefresh } })
    expect(old?.revokedAt).not.toBeNull()
  })

  it("retorna 401 para token inválido", async () => {
    const res = await request(app).post("/auth/refresh").send({ refreshToken: "garbage" })
    expect(res.status).toBe(401)
  })

  it("retorna 401 para token já revogado", async () => {
    const loginRes = await request(app).post("/auth/register").send({
      email: "revoked@example.com", name: "Revoked", password: "password123",
    })
    const rt = loginRes.body.refreshToken as string

    // Usa o token uma vez (rotaciona)
    await request(app).post("/auth/refresh").send({ refreshToken: rt })

    // Tenta usar o token antigo novamente
    const res = await request(app).post("/auth/refresh").send({ refreshToken: rt })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe("TOKEN_EXPIRED_OR_REVOKED")
  })
})

// ── POST /auth/logout ─────────────────────────────────────────────────────────

describe("POST /auth/logout", () => {
  it("revoga o refreshToken e retorna 204", async () => {
    const loginRes = await request(app).post("/auth/register").send({
      email: "logout@example.com", name: "Logout", password: "password123",
    })
    const rt = loginRes.body.refreshToken as string

    const res = await request(app).post("/auth/logout").send({ refreshToken: rt })
    expect(res.status).toBe(204)

    // Token deve estar revogado
    const record = await prisma.refreshToken.findUnique({ where: { token: rt } })
    expect(record?.revokedAt).not.toBeNull()
  })

  it("retorna 204 mesmo com payload inválido (operação idempotente)", async () => {
    const res = await request(app).post("/auth/logout").send({})
    expect(res.status).toBe(204)
  })
})
