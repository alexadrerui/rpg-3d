import { Router }    from "express"
import bcrypt        from "bcryptjs"
import { z }         from "zod"
import { prisma }    from "../lib/prisma.js"
import { signToken, signRefreshToken, verifyRefreshToken, refreshExpiresAt } from "../lib/jwt.js"
import { requireAuth } from "../middleware/auth.js"
import { extractIp, hashIp } from "../lib/ip-hash.js"

export const authRouter: ReturnType<typeof Router> = Router()

// ── POST /auth/register ───────────────────────────────────────────────────────
const RegisterSchema = z.object({
  email:    z.string().email(),
  name:     z.string().min(2).max(60),
  password: z.string().min(8),
})

authRouter.post("/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const { email, name, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) { res.status(409).json({ error: "EMAIL_TAKEN" }); return }

  const hash             = await bcrypt.hash(password, 12)
  const rawIp            = extractIp(req)
  const registrationIpHash = rawIp ? hashIp(rawIp) : null
  const user = await prisma.user.create({
    data: { email, name, password: hash, registrationIpHash },
  })

  const token        = signToken({ sub: user.id, name: user.name, email: user.email })
  const refreshToken = signRefreshToken(user.id)
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt: refreshExpiresAt() } })
  res.status(201).json({ token, refreshToken, user: { id: user.id, name: user.name, email: user.email } })
})

// ── POST /auth/login ──────────────────────────────────────────────────────────
const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string(),
})

authRouter.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) { res.status(401).json({ error: "INVALID_CREDENTIALS" }); return }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) { res.status(401).json({ error: "INVALID_CREDENTIALS" }); return }

  const token        = signToken({ sub: user.id, name: user.name, email: user.email })
  const refreshToken = signRefreshToken(user.id)
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt: refreshExpiresAt() } })
  res.json({ token, refreshToken, user: { id: user.id, name: user.name, email: user.email } })
})

// ── GET /auth/me ──────────────────────────────────────────────────────────────
authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.user!.sub },
    select: { id: true, name: true, email: true, createdAt: true },
  })
  if (!user) { res.status(404).json({ error: "NOT_FOUND" }); return }
  res.json(user)
})

// ── POST /auth/refresh ────────────────────────────────────────────────────────
const RefreshSchema = z.object({ refreshToken: z.string() })

authRouter.post("/refresh", async (req, res) => {
  const parsed = RefreshSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const payload = verifyRefreshToken(parsed.data.refreshToken)
  if (!payload) { res.status(401).json({ error: "INVALID_TOKEN" }); return }

  const record = await prisma.refreshToken.findUnique({
    where:   { token: parsed.data.refreshToken },
    include: { user: true },
  })
  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    res.status(401).json({ error: "TOKEN_EXPIRED_OR_REVOKED" }); return
  }

  const newRefreshToken = signRefreshToken(record.userId)
  await prisma.$transaction([
    prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } }),
    prisma.refreshToken.create({ data: { token: newRefreshToken, userId: record.userId, expiresAt: refreshExpiresAt() } }),
  ])

  const token = signToken({ sub: record.user.id, name: record.user.name, email: record.user.email })
  res.json({ token, refreshToken: newRefreshToken })
})

// ── POST /auth/logout ─────────────────────────────────────────────────────────
authRouter.post("/logout", async (req, res) => {
  const parsed = RefreshSchema.safeParse(req.body)
  if (!parsed.success) { res.status(204).end(); return }

  await prisma.refreshToken.updateMany({
    where: { token: parsed.data.refreshToken, revokedAt: null },
    data:  { revokedAt: new Date() },
  })
  res.status(204).end()
})
