import { Router }      from "express"
import { z }           from "zod"
import { prisma }      from "../lib/prisma.js"
import { requireAuth } from "../middleware/auth.js"

export const mastersRouter: ReturnType<typeof Router> = Router()

type JoinReqFull = {
  id:        string
  campaignId:string
  playerId:  string
  status:    string
  createdAt: Date
  updatedAt: Date
  player:    { id: string; name: string; email: string }
  campaign:  { id: string; masterId: string; systemId: string; name: string }
}

// ── GET /masters/me/requests — mestre vê solicitações pendentes ───────────────
// IMPORTANTE: deve vir ANTES de /:code para não ser capturado pelo param
mastersRouter.get("/me/requests", requireAuth, async (req, res) => {
  const userId = req.user!.sub
  const requests = await prisma.joinRequest.findMany({
    where:   { campaign: { masterId: userId }, status: "pending" },
    include: {
      player:   { select: { id: true, name: true, email: true } },
      campaign: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  }) as unknown as (JoinReqFull & { campaign: { id: string; name: string } })[]
  res.json(requests)
})

// ── GET /masters/:code — público ──────────────────────────────────────────────
mastersRouter.get("/:code", async (req, res) => {
  const masterCode = String(req.params.code).toUpperCase().trim()
  const master = await prisma.user.findUnique({
    where:  { masterCode },
    select: {
      id: true, name: true, masterCode: true,
      ownedCampaigns: {
        select: {
          id: true, name: true, systemId: true,
          _count: { select: { characters: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  })
  if (!master) { res.status(404).json({ error: "MASTER_NOT_FOUND" }); return }
  res.json(master)
})

// ── POST /masters/:code/campaigns/:campaignId/request ─────────────────────────
mastersRouter.post("/:code/campaigns/:campaignId/request", requireAuth, async (req, res) => {
  const userId     = req.user!.sub
  const masterCode = String(req.params.code).toUpperCase().trim()
  const campaignId = String(req.params.campaignId)

  const campaign = await prisma.campaign.findUnique({
    where:   { id: campaignId },
    include: { master: { select: { masterCode: true } } },
  })
  if (!campaign) { res.status(404).json({ error: "NOT_FOUND" }); return }
  if (campaign.master.masterCode !== masterCode) {
    res.status(403).json({ error: "FORBIDDEN" }); return
  }
  if (campaign.masterId === userId) {
    res.status(400).json({ error: "MASTER_CANNOT_JOIN" }); return
  }

  const alreadyMember = await prisma.character.findFirst({ where: { campaignId, userId } })
  if (alreadyMember) { res.status(409).json({ error: "ALREADY_MEMBER" }); return }

  const existing = await prisma.joinRequest.findUnique({
    where: { campaignId_playerId: { campaignId, playerId: userId } },
  })
  if (existing) {
    res.status(409).json({ error: "REQUEST_EXISTS", status: existing.status }); return
  }

  const request = await prisma.joinRequest.create({
    data:    { campaignId, playerId: userId },
    include: { player: { select: { id: true, name: true, email: true } } },
  })
  res.status(201).json(request)
})

// ── PATCH /masters/requests/:id — aprovar ou rejeitar ─────────────────────────
const ReviewSchema = z.object({ action: z.enum(["approve", "reject"]) })

mastersRouter.patch("/requests/:id", requireAuth, async (req, res) => {
  const userId = req.user!.sub
  const parsed = ReviewSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const raw = await prisma.joinRequest.findUnique({
    where:   { id: String(req.params.id) },
    include: {
      campaign: { select: { id: true, masterId: true, systemId: true, name: true } },
      player:   { select: { id: true, name: true, email: true } },
    },
  }) as JoinReqFull | null

  if (!raw) { res.status(404).json({ error: "NOT_FOUND" }); return }
  if (raw.campaign.masterId !== userId) { res.status(403).json({ error: "FORBIDDEN" }); return }
  if (raw.status !== "pending") { res.status(409).json({ error: "ALREADY_REVIEWED" }); return }

  const { action } = parsed.data

  if (action === "approve") {
    await prisma.$transaction([
      prisma.joinRequest.update({ where: { id: raw.id }, data: { status: "approved" } }),
      prisma.character.create({
        data: {
          campaignId: raw.campaignId,
          userId:     raw.playerId,
          name:       raw.player.name,
          sheetData:  {},
          approved:   true,
        },
      }),
    ])
  } else {
    await prisma.joinRequest.update({ where: { id: raw.id }, data: { status: "rejected" } })
  }

  res.json({
    ok: true, action,
    player:   { id: raw.player.id,   name: raw.player.name,   email: raw.player.email },
    campaign: { id: raw.campaign.id, name: raw.campaign.name },
  })
})
