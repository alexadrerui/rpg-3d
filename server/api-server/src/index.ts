import express        from "express"
import cors           from "cors"
import { authRouter }                    from "./routes/auth.js"
import { campaignRouter }                from "./routes/campaigns.js"
import { sceneRouter }                   from "./routes/scenes.js"
import { characterRouter, inviteRouter } from "./routes/characters.js"
import { assetRouter }                   from "./routes/assets.js"
import { systemsRouter, seedSystems }    from "./routes/systems.js"

const app  = express()
const PORT = Number(process.env.API_SERVER_PORT ?? 4000)

const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? "http://localhost:3001,http://localhost:3002,http://localhost:3003").split(",")

app.set("trust proxy", 1)  // necessário para req.ip correto atrás de nginx/load balancer
app.use(cors({ origin: CORS_ORIGINS, credentials: true }))
app.use(express.json({ limit: "10mb" }))

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/auth",       authRouter)
app.use("/campaigns",  campaignRouter)
app.use("/scenes",     sceneRouter)
app.use("/characters", characterRouter)
app.use("/invites",    inviteRouter)
app.use("/assets",     assetRouter)
app.use("/systems",    systemsRouter)

app.get("/health", (_req, res) => res.json({ status: "ok", service: "api-server" }))

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[api-server] unhandled error:", err)
  res.status(500).json({ error: "INTERNAL_ERROR" })
})

app.listen(PORT, async () => {
  console.log(`[api-server] running on port ${PORT}`)
  await seedSystems().catch(e => console.error("[api-server] seed error:", e))
})
