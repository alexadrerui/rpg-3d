import { Router } from "express"
import { prisma }  from "../lib/prisma.js"
import { requireAuth } from "../middleware/auth.js"

export const systemsRouter = Router()

// GET /systems — lista sistemas com isPurchased e saldo de créditos
systemsRouter.get("/", requireAuth, async (req, res) => {
  const userId = req.user!.sub

  const [systems, purchases, user] = await Promise.all([
    prisma.gameSystemCatalog.findMany({
      where:   { isActive: true },
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

// POST /systems/:id/purchase — adquirir sistema (deduz créditos se pago)
systemsRouter.post("/:id/purchase", requireAuth, async (req, res) => {
  const userId   = req.user!.sub
  const systemId = String(req.params.id)

  const system = await prisma.gameSystemCatalog.findUnique({ where: { id: systemId } })
  if (!system)          return res.status(404).json({ error: "SYSTEM_NOT_FOUND" })
  if (!system.isActive) return res.status(400).json({ error: "SYSTEM_UNAVAILABLE" })

  const existing = await prisma.userSystemPurchase.findUnique({
    where: { userId_systemId: { userId, systemId } },
  })
  if (existing) return res.status(400).json({ error: "ALREADY_OWNED" })

  if (system.price === 0) {
    try {
      await prisma.userSystemPurchase.create({ data: { userId, systemId } })
    } catch (e: unknown) {
      if ((e as { code?: string }).code === "P2002") {
        return res.status(400).json({ error: "ALREADY_OWNED" })
      }
      throw e
    }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } })
    return res.json({ ok: true, credits: user?.credits ?? 0 })
  }

  // Verifica créditos
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } })
  if (!user || user.credits < system.price) {
    return res.status(402).json({
      error:   "INSUFFICIENT_CREDITS",
      credits: user?.credits ?? 0,
      needed:  system.price,
    })
  }

  // Transação: cria compra + deduz créditos
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

// ── Seed dos sistemas built-in (chamado no startup) ───────────────────────────

const BUILT_IN_SYSTEMS = [
  {
    id:          "generic",
    name:        "Sistema Genérico",
    description: "Um sistema simples sem regras específicas. Ideal para campanhas narrativas e homebrew.",
    price:       0,
    tags:        ["gratuito", "narrativo", "homebrew"],
  },
  {
    id:          "dnd5e",
    name:        "D&D 5ª Edição",
    description: "Dungeons & Dragons 5ª Edição — o sistema de RPG de fantasia mais popular do mundo.",
    price:       500,
    tags:        ["fantasia", "d20", "high-fantasy"],
  },
]

export async function seedSystems(): Promise<void> {
  for (const s of BUILT_IN_SYSTEMS) {
    await prisma.gameSystemCatalog.upsert({
      where:  { id: s.id },
      update: { name: s.name, description: s.description, price: s.price, tags: s.tags },
      create: s,
    })
  }
}
