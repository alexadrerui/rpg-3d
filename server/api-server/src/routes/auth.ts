import { Router }    from "express"
import bcrypt        from "bcryptjs"
import { z }         from "zod"
import { prisma }    from "../lib/prisma.js"
import { signToken } from "../lib/jwt.js"
import { requireAuth } from "../middleware/auth.js"

export const authRouter = Router()

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

  const hash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({ data: { email, name, password: hash } })

  const token = signToken({ sub: user.id, name: user.name, email: user.email })
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } })
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

  const token = signToken({ sub: user.id, name: user.name, email: user.email })
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } })
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
