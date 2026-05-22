import express, { type Request, type Response, type NextFunction } from "express"
import cors from "cors"
import { authRouter }                    from "./routes/auth.js"
import { campaignRouter }                from "./routes/campaigns.js"
import { sceneRouter }                   from "./routes/scenes.js"
import { characterRouter, inviteRouter } from "./routes/characters.js"
import { assetRouter }                   from "./routes/assets.js"
import { systemsRouter }                 from "./routes/systems.js"
import { sessionLogRouter }              from "./routes/session-log.js"
import { internalRouter }                from "./routes/internal.js"

export function createApp(): express.Express {
  const app = express()

  const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? "http://localhost:3001,http://localhost:3002,http://localhost:3003").split(",")
  app.set("trust proxy", 1)
  app.use(cors({ origin: CORS_ORIGINS, credentials: true }))
  app.use(express.json({ limit: "10mb" }))

  app.use("/auth",       authRouter)
  app.use("/campaigns",  campaignRouter)
  app.use("/scenes",     sceneRouter)
  app.use("/characters", characterRouter)
  app.use("/invites",    inviteRouter)
  app.use("/assets",     assetRouter)
  app.use("/systems",    systemsRouter)
  app.use("/sessions",   sessionLogRouter)
  app.use("/internal",   internalRouter)

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "api-server" }))

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[api-server] unhandled error:", err)
    res.status(500).json({ error: "INTERNAL_ERROR" })
  })

  return app
}
