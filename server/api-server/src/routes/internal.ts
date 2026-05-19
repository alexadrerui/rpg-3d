import { Router }         from "express"
import { z }             from "zod"
import { Prisma }        from "@prisma/client"
import { prisma }        from "../lib/prisma.js"

export const internalRouter = Router()

const SERVER_SECRET = process.env.SERVER_SECRET ?? "dev-server-secret"

function checkSecret(req: { headers: Record<string, string | string[] | undefined> }, res: { status: (n: number) => { json: (v: unknown) => void } }): boolean {
  if (req.headers["x-server-secret"] !== SERVER_SECRET) {
    res.status(401).json({ error: "UNAUTHORIZED" })
    return false
  }
  return true
}

const LogEntrySchema = z.object({
  sessionId:  z.string(),
  campaignId: z.string(),
  type:       z.enum(["JOIN","LEAVE","CHAT","DICE","SCENE_LOAD","NPC_SPAWN","NPC_DESPAWN","NOTE_REVEAL","TRAP_DISARM","FOG_CLEAR"]),
  actorName:  z.string().optional(),
  data:       z.record(z.string(), z.unknown()).optional(),
})

// POST /internal/session-log — batch insert log entries from game-server
internalRouter.post("/session-log", async (req, res) => {
  if (!checkSecret(req as never, res as never)) return

  const parsed = z.object({ entries: z.array(LogEntrySchema) }).safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  if (parsed.data.entries.length === 0) { res.json({ ok: true }); return }

  await prisma.sessionLog.createMany({
    data: parsed.data.entries.map(e => ({
      ...e,
      data: e.data as Prisma.InputJsonValue | undefined,
    })),
  })
  res.json({ ok: true, count: parsed.data.entries.length })
})

// POST /internal/session-end — mark session as ended
internalRouter.post("/session-end", async (req, res) => {
  if (!checkSecret(req as never, res as never)) return

  const parsed = z.object({ sessionId: z.string() }).safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: "INVALID_PAYLOAD" }); return }

  await prisma.session.updateMany({
    where: { id: parsed.data.sessionId, endedAt: null },
    data:  { endedAt: new Date() },
  })
  res.json({ ok: true })
})
