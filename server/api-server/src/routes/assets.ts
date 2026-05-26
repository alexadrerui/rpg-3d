import { Router }        from "express"
import { z }             from "zod"
import { prisma }        from "../lib/prisma.js"
import { requireAuth }   from "../middleware/auth.js"
import { presignPut, assetPublicUrl } from "../lib/storage.js"

export const assetRouter: ReturnType<typeof Router> = Router()
assetRouter.use(requireAuth)

// ── POST /assets/presign ──────────────────────────────────────────────────────
// Gera uma URL pré-assinada para upload direto ao object storage.
// Cria o registro Asset (confirmed=false) antes do upload acontecer.

const ALLOWED_MIME_PREFIXES = ["model/", "image/", "audio/", "video/", "application/json"]

const PresignSchema = z.object({
  campaignId: z.string(),
  fileName:   z.string().min(1).max(255),
  mimeType:   z.string().min(1).refine(
    m => ALLOWED_MIME_PREFIXES.some(p => m.startsWith(p)),
    "Tipo de arquivo não permitido",
  ),
  sizeBytes:  z.number().int().positive().optional(),
})

assetRouter.post("/presign", async (req, res) => {
  const parsed = PresignSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const campaign = await prisma.campaign.findUnique({ where: { id: parsed.data.campaignId } })
  if (!campaign) { res.status(404).json({ error: "NOT_FOUND" }); return }
  if (campaign.masterId !== req.user!.sub) { res.status(403).json({ error: "FORBIDDEN" }); return }

  const assetId = crypto.randomUUID()
  const rawExt  = parsed.data.fileName.includes(".") ? parsed.data.fileName.split(".").pop()! : "bin"
  const ext     = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "")
  const key     = `campaigns/${parsed.data.campaignId}/assets/${assetId}.${ext}`

  const asset = await prisma.asset.create({
    data: {
      campaignId: parsed.data.campaignId,
      uploadedBy: req.user!.sub,
      fileName:   parsed.data.fileName,
      mimeType:   parsed.data.mimeType,
      sizeBytes:  parsed.data.sizeBytes,
      publicUrl:  assetPublicUrl(key),
      storageKey: key,
      confirmed:  false,
    },
  })

  const uploadUrl = await presignPut(key, parsed.data.mimeType)
  res.json({ assetId: asset.id, uploadUrl, publicUrl: asset.publicUrl })
})

// ── POST /assets/confirm ──────────────────────────────────────────────────────
// Marca o asset como confirmado após upload bem-sucedido.

assetRouter.post("/confirm", async (req, res) => {
  const body = z.object({ assetId: z.string() }).safeParse(req.body)
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return }

  const asset = await prisma.asset.findUnique({ where: { id: body.data.assetId } })
  if (!asset) { res.status(404).json({ error: "NOT_FOUND" }); return }
  if (asset.uploadedBy !== req.user!.sub) { res.status(403).json({ error: "FORBIDDEN" }); return }

  const updated = await prisma.asset.update({
    where: { id: body.data.assetId },
    data:  { confirmed: true },
  })
  res.json(updated)
})

// ── GET /assets?campaignId=:id ────────────────────────────────────────────────
// Lista assets confirmados de uma campanha.

assetRouter.get("/", async (req, res) => {
  const { campaignId } = req.query
  if (!campaignId || typeof campaignId !== "string") {
    res.status(400).json({ error: "CAMPAIGN_ID_REQUIRED" }); return
  }

  const campaign = await prisma.campaign.findUnique({
    where:   { id: campaignId },
    include: { characters: { where: { userId: req.user!.sub } } },
  })
  if (!campaign) { res.status(404).json({ error: "NOT_FOUND" }); return }

  const isMaster      = campaign.masterId === req.user!.sub
  const isParticipant = isMaster || campaign.characters.length > 0
  if (!isParticipant) { res.status(403).json({ error: "FORBIDDEN" }); return }

  const assets = await prisma.asset.findMany({
    where:   { campaignId, confirmed: true },
    orderBy: { createdAt: "desc" },
    select:  { id: true, fileName: true, mimeType: true, sizeBytes: true, publicUrl: true, createdAt: true },
  })
  res.json(assets)
})
