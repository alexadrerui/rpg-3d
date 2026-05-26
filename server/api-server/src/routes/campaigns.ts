import { Router }        from "express"
import { z }             from "zod"
import { prisma }        from "../lib/prisma.js"
import { signToken }     from "../lib/jwt.js"
import { requireAuth }   from "../middleware/auth.js"
import { sendInviteEmail } from "../lib/mailer.js"

export const campaignRouter: ReturnType<typeof Router> = Router()
campaignRouter.use(requireAuth)

const CreateCampaignSchema = z.object({
  name:        z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  systemId:    z.string().default("dnd5e"),
})

// ── GET /campaigns ────────────────────────────────────────────────────────────
campaignRouter.get("/", async (req, res) => {
  const userId = req.user!.sub

  // Campanhas onde é mestre OU tem personagem
  const campaigns = await prisma.campaign.findMany({
    where: {
      OR: [
        { masterId: userId },
        { characters: { some: { userId } } },
      ],
    },
    include: {
      master:     { select: { id: true, name: true } },
      characters: { where: { userId }, select: { id: true, name: true, approved: true } },
      scenes:     { select: { id: true, name: true }, orderBy: { updatedAt: "desc" }, take: 1 },
      _count:     { select: { characters: true, scenes: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  res.json(campaigns.map(c => ({
    ...c,
    isMaster:   c.masterId === userId,
    myCharacter: c.characters[0] ?? null,
  })))
})

// ── POST /campaigns ───────────────────────────────────────────────────────────
campaignRouter.post("/", async (req, res) => {
  const parsed = CreateCampaignSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const campaign = await prisma.campaign.create({
    data: { ...parsed.data, masterId: req.user!.sub },
  })
  res.status(201).json(campaign)
})

// ── GET /campaigns/:id ────────────────────────────────────────────────────────
campaignRouter.get("/:id", async (req, res) => {
  const userId   = req.user!.sub
  const campaign = await prisma.campaign.findUnique({
    where:   { id: req.params.id },
    include: {
      master:     { select: { id: true, name: true } },
      characters: { include: { user: { select: { id: true, name: true } } } },
      scenes:     { select: { id: true, name: true, version: true, updatedAt: true }, orderBy: { updatedAt: "desc" } },
    },
  })

  if (!campaign) { res.status(404).json({ error: "NOT_FOUND" }); return }

  // Só mestre ou participantes podem ver
  const isParticipant = campaign.masterId === userId ||
    campaign.characters.some(c => c.userId === userId)
  if (!isParticipant) { res.status(403).json({ error: "FORBIDDEN" }); return }

  res.json({ ...campaign, isMaster: campaign.masterId === userId })
})

const InviteSchema = z.object({
  email:         z.string().email().optional(),
  recipientName: z.string().max(80).optional(),
})

// ── POST /campaigns/:id/invite ────────────────────────────────────────────────
campaignRouter.post("/:id/invite", async (req, res) => {
  const campaign = await prisma.campaign.findUnique({
    where:   { id: req.params.id },
    include: { master: { select: { name: true } } },
  })
  if (!campaign) { res.status(404).json({ error: "NOT_FOUND" }); return }
  if (campaign.masterId !== req.user!.sub) { res.status(403).json({ error: "FORBIDDEN" }); return }

  const body = InviteSchema.safeParse(req.body)
  const email         = body.success ? body.data.email : undefined
  const recipientName = body.success ? (body.data.recipientName ?? "") : ""

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 dias
  const invite    = await prisma.campaignInvite.create({
    data: { campaignId: campaign.id, expiresAt },
  })

  const baseUrl    = process.env.DASHBOARD_URL ?? "http://localhost:3003"
  const inviteUrl  = `${baseUrl}/invite/${invite.token}`

  if (email) {
    sendInviteEmail({
      toEmail:       email,
      recipientName,
      campaignName:  campaign.name,
      masterName:    campaign.master.name ?? "Mestre",
      inviteUrl,
    }).catch(err => console.error("[invite] email error:", err))
  }

  res.status(201).json({
    token:     invite.token,
    expiresAt: invite.expiresAt,
    url:       inviteUrl,
    emailSent: !!email,
  })
})

// ── GET /campaigns/:id/sessions ──────────────────────────────────────────────
campaignRouter.get("/:id/sessions", async (req, res) => {
  const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } })
  if (!campaign) { res.status(404).json({ error: "NOT_FOUND" }); return }

  const userId = req.user!.sub
  const isMaster = campaign.masterId === userId
  const isParticipant = isMaster ||
    !!(await prisma.character.findFirst({ where: { campaignId: campaign.id, userId } }))
  if (!isParticipant) { res.status(403).json({ error: "FORBIDDEN" }); return }

  const sessions = await prisma.session.findMany({
    where:   { campaignId: req.params.id },
    orderBy: { startedAt: "desc" },
    take:    30,
    include: { _count: { select: { logs: true } } },
  })

  res.json(sessions)
})

// ── POST /campaigns/:id/session ───────────────────────────────────────────────
// Gera um JWT de sessão de jogo com isMaster = true para o mestre
campaignRouter.post("/:id/session", async (req, res) => {
  const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } })
  if (!campaign) { res.status(404).json({ error: "NOT_FOUND" }); return }

  const userId   = req.user!.sub
  const isMaster = campaign.masterId === userId

  // Jogador precisa ter personagem aprovado
  if (!isMaster) {
    const character = await prisma.character.findFirst({
      where: { campaignId: campaign.id, userId, approved: true },
    })
    if (!character) { res.status(403).json({ error: "CHARACTER_NOT_APPROVED" }); return }

    const sessionToken = signToken({
      sub:         userId,
      name:        req.user!.name,
      email:       req.user!.email,
      isMaster:    false,
      campaignId:  campaign.id,
      characterId: character.id,
    })

    // Cria/atualiza a session
    const session = await prisma.session.create({ data: { campaignId: campaign.id } })
    res.json({ sessionToken, sessionId: session.id, isMaster: false, characterId: character.id })
    return
  }

  const sessionToken = signToken({
    sub:        userId,
    name:       req.user!.name,
    email:      req.user!.email,
    isMaster:   true,
    campaignId: campaign.id,
  })

  const session = await prisma.session.create({ data: { campaignId: campaign.id } })
  res.json({ sessionToken, sessionId: session.id, isMaster: true })
})
