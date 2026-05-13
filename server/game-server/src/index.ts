import express       from "express"
import cors          from "cors"
import { createServer } from "http"
import { Server }    from "socket.io"
import Redis         from "ioredis"
import type { ServerToClientMap, ClientToServerMap } from "@rpg3d/schema"
import { SessionManager }  from "./session-manager.js"
import { authMiddleware }  from "./auth.js"
import { registerHandlers } from "./handlers.js"

const PORT        = Number(process.env.GAME_SERVER_PORT ?? 4001)
const REDIS_URL   = process.env.REDIS_URL
const CORS_ORIGIN = (process.env.CORS_ORIGIN ?? "http://localhost:3002,http://localhost:3003").split(",")

// ── Redis (graceful degradation) ─────────────────────────────────────────────
let redis: Redis | null = null

if (REDIS_URL) {
  redis = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 2 })
  redis.on("connect", () => console.log("[redis] connected"))
  redis.on("error",   (e) => console.warn("[redis] error:", e.message))
  redis.connect().catch(() => { redis = null })
} else {
  console.log("[redis] REDIS_URL not set — running without persistence")
}

// ── Express ───────────────────────────────────────────────────────────────────
const app  = express()
const http = createServer(app)

app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json())

app.get("/health", (_req, res) => {
  res.json({
    status:    "ok",
    service:   "game-server",
    timestamp: new Date().toISOString(),
    redis:     redis?.status ?? "disabled",
  })
})

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server<ClientToServerMap, ServerToClientMap>(http, {
  cors:         { origin: CORS_ORIGIN, methods: ["GET", "POST"] },
  pingTimeout:  30_000,
  pingInterval: 10_000,
})

const sessions = new SessionManager(redis)
setInterval(() => sessions.pruneStale(), 1000 * 60 * 60)

io.use(authMiddleware)

io.on("connection", (socket) => {
  const user = socket.data.user as { sub: string; name: string }
  console.log(`[io] connected: ${user.name} (${socket.id})`)

  const pingInterval = setInterval(() => socket.emit("ping"), 25_000)
  socket.on("pong", () => {})

  registerHandlers(io, socket, sessions)

  socket.on("disconnect", () => {
    clearInterval(pingInterval)
    console.log(`[io] disconnected: ${user.name} (${socket.id})`)
  })
})

// ── Start ─────────────────────────────────────────────────────────────────────
http.listen(PORT, () => {
  console.log(`[game-server] running on port ${PORT} | redis: ${REDIS_URL ? "enabled" : "disabled"}`)
})

process.on("SIGTERM", () => {
  http.close(() => { redis?.disconnect(); process.exit(0) })
})
