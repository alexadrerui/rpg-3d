import { Router }        from "express"
import { z }             from "zod"
import { prisma }        from "../lib/prisma.js"
import { signToken }     from "../lib/jwt.js"
import { requireAuth }   from "../middleware/auth.js"

export const characterRouter = Router()
characterRouter.use(requireAuth)

// ── GET /characters?campaignId=:id ────────────────────────────────────────────
characterRouter.get("/", async (req, res) => {
  const { campaignId } = req.query
  if (!campaignId || typeof campaignId !== "string") {
    res.status(400).json({ error: "CAMPAIGN_ID_REQUIRED" }); return
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
  if (!campaign) { res.status(404).json({ error: "NOT_FOUND" }); return }

  const isMaster = campaign.masterId === req.user!.sub

  const characters = await prisma.character.findMany({
    where:   isMaster ? { campaignId } : { campaignId, userId: req.user!.sub },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  })
  res.json(characters)
})

// ── POST /characters ──────────────────────────────────────────────────────────
const CreateCharacterSchema = z.object({
  campaignId: z.string(),
  name:       z.string().min(1).max(80),
  sheetData:  z.record(z.string(), z.unknown()).default({}),
})

characterRouter.post("/", async (req, res) => {
  const parsed = CreateCharacterSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  // Não pode ter dois personagens na mesma campanha
  const existing = await prisma.character.findFirst({
    where: { campaignId: parsed.data.campaignId, userId: req.user!.sub },
  })
  if (existing) { res.status(409).json({ error: "ALREADY_HAS_CHARACTER", character: existing }); return }

  const character = await prisma.character.create({
    data: { ...parsed.data, userId: req.user!.sub },
  })
  res.status(201).json(character)
})

// ── GET /characters/:id ───────────────────────────────────────────────────────
characterRouter.get("/:id", async (req, res) => {
  const character = await prisma.character.findUnique({
    where:   { id: req.params.id },
    include: { user: { select: { id: true, name: true } }, campaign: true },
  })
  if (!character) { res.status(404).json({ error: "NOT_FOUND" }); return }

  const isMaster = character.campaign.masterId === req.user!.sub
  const isOwner  = character.userId === req.user!.sub
  if (!isMaster && !isOwner) { res.status(403).json({ error: "FORBIDDEN" }); return }

  res.json(character)
})

// ── PATCH /characters/:id/sheet ───────────────────────────────────────────────
// Atualiza a ficha por etapas — pode ser chamado múltiplas vezes
const SheetUpdateSchema = z.object({
  sheetData: z.record(z.string(), z.unknown()),
  name:      z.string().min(1).max(80).optional(),
})

characterRouter.patch("/:id/sheet", async (req, res) => {
  const character = await prisma.character.findUnique({
    where: { id: req.params.id }, include: { campaign: true },
  })
  if (!character) { res.status(404).json({ error: "NOT_FOUND" }); return }
  if (character.userId !== req.user!.sub) { res.status(403).json({ error: "FORBIDDEN" }); return }
  if (character.approved) { res.status(409).json({ error: "ALREADY_APPROVED" }); return }

  const parsed = SheetUpdateSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  // Merge da ficha (não substitui — mescla os campos)
  const currentSheet = character.sheetData as Record<string, unknown>
  const mergedSheet  = { ...currentSheet, ...parsed.data.sheetData }

  const updated = await prisma.character.update({
    where: { id: req.params.id },
    data:  { sheetData: mergedSheet, name: parsed.data.name ?? character.name },
  })
  res.json(updated)
})

// ── POST /characters/:id/approve ──────────────────────────────────────────────
// Só o mestre aprova
characterRouter.post("/:id/approve", async (req, res) => {
  const character = await prisma.character.findUnique({
    where: { id: req.params.id }, include: { campaign: true },
  })
  if (!character) { res.status(404).json({ error: "NOT_FOUND" }); return }
  if (character.campaign.masterId !== req.user!.sub) { res.status(403).json({ error: "FORBIDDEN" }); return }

  const updated = await prisma.character.update({
    where: { id: req.params.id },
    data:  { approved: true },
  })
  res.json(updated)
})

// ── POST /characters/:id/reject ───────────────────────────────────────────────
characterRouter.post("/:id/reject", async (req, res) => {
  const character = await prisma.character.findUnique({
    where: { id: req.params.id }, include: { campaign: true },
  })
  if (!character) { res.status(404).json({ error: "NOT_FOUND" }); return }
  if (character.campaign.masterId !== req.user!.sub) { res.status(403).json({ error: "FORBIDDEN" }); return }

  await prisma.character.update({
    where: { id: req.params.id },
    data:  { approved: false },
  })
  res.status(204).send()
})

// ── POST /invites/:token/accept ───────────────────────────────────────────────
// Aceitar convite — cria a primeira ficha em branco
export const inviteRouter = Router()
inviteRouter.use(requireAuth)

inviteRouter.post("/:token/accept", async (req, res) => {
  const invite = await prisma.campaignInvite.findUnique({
    where:   { token: req.params.token },
    include: { campaign: true },
  })
  if (!invite) { res.status(404).json({ error: "INVITE_NOT_FOUND" }); return }
  if (invite.expiresAt < new Date()) { res.status(410).json({ error: "INVITE_EXPIRED" }); return }
  if (invite.usedBy)  { res.status(409).json({ error: "INVITE_USED" }); return }

  const userId = req.user!.sub

  // Verificar se já é participante
  const existingChar = await prisma.character.findFirst({
    where: { campaignId: invite.campaignId, userId },
  })

  if (existingChar) {
    // Já é participante — retorna os dados para redirecionar
    res.json({
      campaign:   invite.campaign,
      character:  existingChar,
      alreadyJoined: true,
    })
    return
  }

  // Marcar convite como usado e criar ficha vazia
  const [, character] = await prisma.$transaction([
    prisma.campaignInvite.update({ where: { id: invite.id }, data: { usedBy: userId } }),
    prisma.character.create({
      data: {
        campaignId: invite.campaignId,
        userId,
        name:      req.user!.name,
        sheetData: {},
      },
    }),
  ])

  res.status(201).json({
    campaign:  invite.campaign,
    character,
    alreadyJoined: false,
  })
})
