import { Router }        from "express"
import { z }             from "zod"
import { prisma }        from "../lib/prisma.js"
import { requireAuth }   from "../middleware/auth.js"

export const sceneRouter = Router()

// ── GET /scenes/:id/url ───────────────────────────────────────────────────────
// Endpoint interno chamado pelo game-server para obter a URL do .rpgscene
// Não requer auth — chamado server-to-server com secret header
sceneRouter.get("/:id/url", async (req, res) => {
  const serverSecret = req.headers["x-server-secret"]
  const expectedSecret = process.env.SERVER_SECRET ?? "dev-server-secret"

  // Em produção: validar o secret. Em dev: aceitar sem secret.
  if (process.env.NODE_ENV === "production" && serverSecret !== expectedSecret) {
    res.status(401).json({ error: "FORBIDDEN" }); return
  }

  const scene = await prisma.scene.findUnique({ where: { id: req.params.id } })
  if (!scene) { res.status(404).json({ error: "NOT_FOUND" }); return }
  res.json({ url: scene.fileUrl, name: scene.name, version: scene.version })
})

// Rotas abaixo requerem auth
sceneRouter.use(requireAuth)

// ── GET /scenes?campaignId=:id ────────────────────────────────────────────────
sceneRouter.get("/", async (req, res) => {
  const { campaignId } = req.query
  if (!campaignId || typeof campaignId !== "string") {
    res.status(400).json({ error: "CAMPAIGN_ID_REQUIRED" }); return
  }

  // Validar que o user é participante
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { characters: { where: { userId: req.user!.sub } } },
  })
  if (!campaign) { res.status(404).json({ error: "NOT_FOUND" }); return }

  const isMaster      = campaign.masterId === req.user!.sub
  const isParticipant = isMaster || campaign.characters.length > 0
  if (!isParticipant) { res.status(403).json({ error: "FORBIDDEN" }); return }

  const scenes = await prisma.scene.findMany({
    where:   { campaignId },
    select:  { id: true, name: true, description: true, version: true, fileUrl: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  })
  res.json(scenes)
})

// ── POST /scenes ──────────────────────────────────────────────────────────────
const CreateSceneSchema = z.object({
  campaignId:  z.string(),
  name:        z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  fileUrl:     z.string().url(),
})

sceneRouter.post("/", async (req, res) => {
  const parsed = CreateSceneSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const campaign = await prisma.campaign.findUnique({ where: { id: parsed.data.campaignId } })
  if (!campaign) { res.status(404).json({ error: "NOT_FOUND" }); return }
  if (campaign.masterId !== req.user!.sub) { res.status(403).json({ error: "FORBIDDEN" }); return }

  const scene = await prisma.scene.create({ data: parsed.data })
  res.status(201).json(scene)
})

// ── PUT /scenes/:id ───────────────────────────────────────────────────────────
const UpdateSceneSchema = z.object({
  name:        z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  fileUrl:     z.string().url().optional(),
})

sceneRouter.put("/:id", async (req, res) => {
  const scene = await prisma.scene.findUnique({ where: { id: req.params.id }, include: { campaign: true } })
  if (!scene) { res.status(404).json({ error: "NOT_FOUND" }); return }
  if (scene.campaign.masterId !== req.user!.sub) { res.status(403).json({ error: "FORBIDDEN" }); return }

  const parsed = UpdateSceneSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const updated = await prisma.scene.update({
    where: { id: req.params.id },
    data:  { ...parsed.data, version: { increment: 1 } },
  })
  res.json(updated)
})

// ── DELETE /scenes/:id ────────────────────────────────────────────────────────
sceneRouter.delete("/:id", async (req, res) => {
  const scene = await prisma.scene.findUnique({ where: { id: req.params.id }, include: { campaign: true } })
  if (!scene) { res.status(404).json({ error: "NOT_FOUND" }); return }
  if (scene.campaign.masterId !== req.user!.sub) { res.status(403).json({ error: "FORBIDDEN" }); return }
  await prisma.scene.delete({ where: { id: req.params.id } })
  res.status(204).send()
})
