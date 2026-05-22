import { Router }      from "express"
import { prisma }      from "../lib/prisma.js"
import { requireAuth } from "../middleware/auth.js"

export const sessionLogRouter: ReturnType<typeof Router> = Router()
sessionLogRouter.use(requireAuth)

// GET /sessions/:id/log — retorna sessão + entradas de log (para o dashboard)
sessionLogRouter.get("/:id/log", async (req, res) => {
  const session = await prisma.session.findUnique({
    where: { id: req.params.id },
    include: { campaign: { select: { masterId: true } } },
  })
  if (!session) { res.status(404).json({ error: "NOT_FOUND" }); return }

  const userId = req.user!.sub
  const isMaster = session.campaign.masterId === userId
  const hasCharacter = isMaster
    ? true
    : !!(await prisma.character.findFirst({ where: { campaignId: session.campaignId, userId } }))

  if (!hasCharacter) { res.status(403).json({ error: "FORBIDDEN" }); return }

  const logs = await prisma.sessionLog.findMany({
    where:   { sessionId: req.params.id },
    orderBy: { timestamp: "asc" },
    take:    500,
  })

  res.json({ session, logs })
})
