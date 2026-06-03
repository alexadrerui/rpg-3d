import { Router } from "express"
import { z }      from "zod"
import { prisma } from "../lib/prisma.js"
import { requireAuth } from "../middleware/auth.js"

export const systemsRouter: ReturnType<typeof Router> = Router()

const ADMIN_SECRET = process.env.PLATFORM_ADMIN_SECRET ?? "dev-admin-secret"

// ── Schemas de validação ───────────────────────────────────────────────────────

const ManifestFieldSchema = z.object({
  id:           z.string().min(1).max(64),
  label:        z.string().min(1).max(120),
  type:         z.enum(["text", "number", "textarea", "select", "boolean"]),
  options:      z.array(z.string()).optional(),
  min:          z.number().optional(),
  max:          z.number().optional(),
  group:        z.string().optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  required:     z.boolean().optional(),
})

const SystemManifestSchema = z.object({
  fields:          z.array(ManifestFieldSchema).min(1).max(100),
  combatAbilities: z.boolean().optional(),
})

const SubmitSystemSchema = z.object({
  id:            z.string().regex(/^[a-z0-9_-]{2,64}$/, "ID deve ser slug (ex: meu-sistema)"),
  name:          z.string().min(2).max(80),
  description:   z.string().min(10).max(500),
  price:         z.number().int().min(0).max(100_000).default(0),
  version:       z.string().regex(/^\d+\.\d+\.\d+$/).default("1.0.0"),
  tags:          z.array(z.string().max(32)).max(10).default([]),
  thumbnail:     z.string().url().optional(),
  repositoryUrl: z.string().url().optional(),
  manifest:      SystemManifestSchema,
})

const UpdateSystemSchema = SubmitSystemSchema.partial().omit({ id: true })

// GET /systems — lista sistemas ativos com isPurchased e saldo
systemsRouter.get("/", requireAuth, async (req, res) => {
  const userId = req.user!.sub
  const tag    = req.query.tag as string | undefined

  const [systems, purchases, user] = await Promise.all([
    prisma.gameSystemCatalog.findMany({
      where: {
        isActive: true,
        status:   "ACTIVE",
        ...(tag ? { tags: { has: tag } } : {}),
      },
      orderBy: { price: "asc" },
    }),
    prisma.userSystemPurchase.findMany({
      where:  { userId },
      select: { systemId: true },
    }),
    prisma.user.findUnique({
      where:  { id: userId },
      select: { credits: true },
    }),
  ])

  const purchasedIds = new Set(purchases.map(p => p.systemId))

  return res.json({
    credits: user?.credits ?? 0,
    systems: systems.map(s => ({
      ...s,
      isPurchased: s.price === 0 || purchasedIds.has(s.id),
    })),
  })
})

// GET /systems/mine — sistemas submetidos pelo usuário autenticado
// DEVE ficar antes de /:id para evitar conflito de rota
systemsRouter.get("/mine", requireAuth, async (req, res) => {
  const authorId = req.user!.sub
  const systems  = await prisma.gameSystemCatalog.findMany({
    where:   { authorId },
    orderBy: { createdAt: "desc" },
  })
  return res.json(systems)
})

// GET /systems/:id — detalhes de um sistema (requer auth para calcular isPurchased)
systemsRouter.get("/:id", requireAuth, async (req, res) => {
  const userId   = req.user!.sub
  const systemId = String(req.params.id)

  const [system, purchase] = await Promise.all([
    prisma.gameSystemCatalog.findUnique({ where: { id: systemId } }),
    prisma.userSystemPurchase.findUnique({
      where:  { userId_systemId: { userId, systemId } },
      select: { systemId: true },
    }),
  ])

  if (!system) return res.status(404).json({ error: "SYSTEM_NOT_FOUND" })

  return res.json({
    ...system,
    isPurchased: system.price === 0 || !!purchase,
  })
})

// POST /systems — submeter novo sistema externo
systemsRouter.post("/", requireAuth, async (req, res) => {
  const parse = SubmitSystemSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: "INVALID_DATA", issues: parse.error.issues })

  const { id, name, description, price, version, tags, thumbnail, repositoryUrl, manifest } = parse.data
  const userId = req.user!.sub
  const user   = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })

  const existing = await prisma.gameSystemCatalog.findUnique({ where: { id } })
  if (existing) return res.status(409).json({ error: "ID_TAKEN" })

  const system = await prisma.gameSystemCatalog.create({
    data: {
      id, name, description, price, version, tags,
      thumbnail:     thumbnail ?? null,
      repositoryUrl: repositoryUrl ?? null,
      manifest:      manifest as object,
      authorId:      userId,
      authorName:    user?.name ?? null,
      status:        "PENDING",
      isActive:      false,
    },
  })

  return res.status(201).json(system)
})

// PATCH /systems/:id — atualizar sistema próprio (só se PENDING ou REJECTED)
systemsRouter.patch("/:id", requireAuth, async (req, res) => {
  const userId   = req.user!.sub
  const systemId = String(req.params.id)

  const system = await prisma.gameSystemCatalog.findUnique({ where: { id: systemId } })
  if (!system)                  return res.status(404).json({ error: "SYSTEM_NOT_FOUND" })
  if (system.authorId !== userId) return res.status(403).json({ error: "NOT_OWNER" })
  if (system.status === "ACTIVE") return res.status(400).json({ error: "CANNOT_EDIT_ACTIVE" })

  const parse = UpdateSystemSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: "INVALID_DATA", issues: parse.error.issues })

  const updated = await prisma.gameSystemCatalog.update({
    where: { id: systemId },
    data: {
      ...parse.data,
      manifest: parse.data.manifest ? (parse.data.manifest as object) : undefined,
      status:   "PENDING",  // volta para revisão a cada edição
    },
  })

  return res.json(updated)
})

// POST /systems/:id/purchase — adquirir sistema
systemsRouter.post("/:id/purchase", requireAuth, async (req, res) => {
  const userId   = req.user!.sub
  const systemId = String(req.params.id)

  const system = await prisma.gameSystemCatalog.findUnique({ where: { id: systemId } })
  if (!system)                return res.status(404).json({ error: "SYSTEM_NOT_FOUND" })
  if (!system.isActive)       return res.status(400).json({ error: "SYSTEM_UNAVAILABLE" })
  if (system.status !== "ACTIVE") return res.status(400).json({ error: "SYSTEM_UNAVAILABLE" })

  const existing = await prisma.userSystemPurchase.findUnique({
    where: { userId_systemId: { userId, systemId } },
  })
  if (existing) return res.status(400).json({ error: "ALREADY_OWNED" })

  if (system.price === 0) {
    try {
      await prisma.userSystemPurchase.create({ data: { userId, systemId } })
    } catch (e: unknown) {
      if ((e as { code?: string }).code === "P2002") return res.status(400).json({ error: "ALREADY_OWNED" })
      throw e
    }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } })
    return res.json({ ok: true, credits: user?.credits ?? 0 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } })
  if (!user || user.credits < system.price) {
    return res.status(402).json({ error: "INSUFFICIENT_CREDITS", credits: user?.credits ?? 0, needed: system.price })
  }

  const updatedUser = await prisma.$transaction(async tx => {
    await tx.userSystemPurchase.create({ data: { userId, systemId } })
    return tx.user.update({
      where:  { id: userId },
      data:   { credits: { decrement: system.price } },
      select: { credits: true },
    })
  })

  return res.json({ ok: true, credits: updatedUser.credits })
})

// POST /systems/:id/approve — aprovar sistema (requer x-admin-secret)
systemsRouter.post("/:id/approve", async (req, res) => {
  if (req.headers["x-admin-secret"] !== ADMIN_SECRET) {
    return res.status(403).json({ error: "FORBIDDEN" })
  }
  const systemId = String(req.params.id)
  const system = await prisma.gameSystemCatalog.findUnique({ where: { id: systemId } })
  if (!system) return res.status(404).json({ error: "SYSTEM_NOT_FOUND" })

  const updated = await prisma.gameSystemCatalog.update({
    where: { id: systemId },
    data:  { status: "ACTIVE", isActive: true },
  })
  return res.json(updated)
})

// POST /systems/:id/reject — rejeitar sistema com motivo (requer x-admin-secret)
systemsRouter.post("/:id/reject", async (req, res) => {
  if (req.headers["x-admin-secret"] !== ADMIN_SECRET) {
    return res.status(403).json({ error: "FORBIDDEN" })
  }
  const systemId = String(req.params.id)
  const system = await prisma.gameSystemCatalog.findUnique({ where: { id: systemId } })
  if (!system) return res.status(404).json({ error: "SYSTEM_NOT_FOUND" })

  const updated = await prisma.gameSystemCatalog.update({
    where: { id: systemId },
    data:  { status: "REJECTED", isActive: false },
  })
  return res.json(updated)
})

// ── Seed dos sistemas built-in (chamado no startup) ───────────────────────────

const BUILT_IN_SYSTEMS = [
  {
    id:          "generic",
    name:        "Sistema Genérico",
    description: "Um sistema simples sem regras específicas. Ideal para campanhas narrativas e homebrew.",
    price:       0,
    tags:        ["gratuito", "narrativo", "homebrew"],
    status:      "ACTIVE" as const,
    isActive:    true,
  },
  {
    id:          "dnd5e",
    name:        "D&D 5ª Edição",
    description: "Dungeons & Dragons 5ª Edição — o sistema de RPG de fantasia mais popular do mundo.",
    price:       500,
    tags:        ["fantasia", "d20", "high-fantasy"],
    status:      "ACTIVE" as const,
    isActive:    true,
  },
  {
    id:          "ordem-paranormal",
    name:        "Ordem Paranormal",
    description: "Sistema de horror e investigação da Jambô Editora. Agentes da Ordem enfrentam o Outro Lado com NEX, atributos, perícias, classes e rituais. Fan content não-oficial.",
    price:       500,
    tags:        ["horror", "investigação", "moderno", "ordem-paranormal"],
    status:      "ACTIVE" as const,
    isActive:    true,
  },
]

export async function seedSystems(): Promise<void> {
  for (const s of BUILT_IN_SYSTEMS) {
    await prisma.gameSystemCatalog.upsert({
      where:  { id: s.id },
      update: { name: s.name, description: s.description, price: s.price, tags: s.tags, status: s.status, isActive: s.isActive },
      create: s,
    })
  }
}
