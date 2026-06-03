import { Router }    from "express"
import bcrypt        from "bcryptjs"
import { z }         from "zod"
import { prisma }    from "../lib/prisma.js"
import { signToken, signRefreshToken, verifyRefreshToken, refreshExpiresAt } from "../lib/jwt.js"
import { requireAuth } from "../middleware/auth.js"
import { extractIp, hashIp } from "../lib/ip-hash.js"

export const authRouter: ReturnType<typeof Router> = Router()

// Gera código de mestre curto e legível (sem caracteres ambíguos: 0/O, 1/I/L)
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
function makeMasterCode(): string {
  return Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("")
}
async function uniqueMasterCode(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = makeMasterCode()
    const exists = await prisma.user.findUnique({ where: { masterCode: code }, select: { id: true } })
    if (!exists) return code
  }
  throw new Error("masterCode collision exhausted")
}

// ── POST /auth/register ───────────────────────────────────────────────────────
const RegisterSchema = z.object({
  email:       z.string().email(),
  name:        z.string().min(2).max(60),
  password:    z.string().min(8),
  defaultRole: z.enum(["master", "player"]).default("player"),
})

authRouter.post("/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const { email, name, password, defaultRole } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) { res.status(409).json({ error: "EMAIL_TAKEN" }); return }

  const hash             = await bcrypt.hash(password, 12)
  const rawIp            = extractIp(req)
  const registrationIpHash = rawIp ? hashIp(rawIp) : null
  const masterCode       = await uniqueMasterCode()
  const user = await prisma.user.create({
    data: { email, name, password: hash, defaultRole, masterCode, registrationIpHash },
  })

  const token        = signToken({ sub: user.id, name: user.name, email: user.email })
  const refreshToken = signRefreshToken(user.id)
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt: refreshExpiresAt() } })
  res.status(201).json({ token, refreshToken, user: { id: user.id, name: user.name, email: user.email, defaultRole: user.defaultRole, masterCode: user.masterCode } })
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
  let user = await prisma.user.findUnique({
    where:  { id: req.user!.sub },
    select: { id: true, name: true, email: true, createdAt: true, defaultRole: true, masterCode: true },
  })
  if (!user) { res.status(404).json({ error: "NOT_FOUND" }); return }

  // Gera masterCode para usuários cadastrados antes da feature
  if (!user.masterCode) {
    const code = await uniqueMasterCode()
    user = await prisma.user.update({
      where:  { id: user.id },
      data:   { masterCode: code },
      select: { id: true, name: true, email: true, createdAt: true, defaultRole: true, masterCode: true },
    })
  }

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
