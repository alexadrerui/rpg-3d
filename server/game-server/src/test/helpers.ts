import { createServer }     from "http"
import express              from "express"
import { Server }           from "socket.io"
import { io as ioCli }      from "socket.io-client"
import type { Socket }      from "socket.io-client"
import jwt                  from "jsonwebtoken"
import { SessionManager }   from "../session-manager.js"
import { authMiddleware }   from "../auth.js"
import { registerHandlers } from "../handlers.js"

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production"

// ── JWT factory ───────────────────────────────────────────────────────────────

export function makeToken(payload: {
  sub:          string
  name:         string
  email?:       string
  isMaster?:    boolean
  campaignId?:  string
  characterId?: string
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" }) as string
}

// ── Test server ───────────────────────────────────────────────────────────────

export type TestServer = {
  port:     number
  sessions: SessionManager
  close():  Promise<void>
}

export async function createTestServer(): Promise<TestServer> {
  const app     = express()
  const http    = createServer(app)
  const sessions = new SessionManager(null)   // no Redis

  const io = new Server(http, {
    cors:         { origin: "*" },
    pingTimeout:  5_000,
    pingInterval: 2_000,
  })

  io.use(authMiddleware)
  io.on("connection", socket => registerHandlers(io, socket, sessions))

  await new Promise<void>(resolve => http.listen(0, resolve))
  const { port } = http.address() as { port: number }

  return {
    port,
    sessions,
    close: () => new Promise<void>(resolve => io.close(() => resolve())),
  }
}

// ── Client helpers ─────────────────────────────────────────────────────────

export type TestSocket = Socket

export function connectClient(port: number, token: string): TestSocket {
  return ioCli(`http://localhost:${port}`, {
    auth:        { token },
    autoConnect:  false,
    transports:  ["websocket"],
  })
}

export function waitConnect(socket: TestSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.once("connect", resolve)
    socket.once("connect_error", reject)
    socket.connect()
  })
}

export function waitEvent<T>(socket: TestSocket, event: string): Promise<T> {
  return new Promise(resolve => socket.once(event, resolve as () => void))
}

// Generic ack wrapper — emit event, wait for server acknowledgement
export function ack<T = { ok: boolean; error?: string }>(
  socket: TestSocket,
  event:  string,
  data?:  unknown,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`ack timeout for "${event}"`)),
      5_000,
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(socket as any).emit(event, data ?? {}, (result: T) => {
      clearTimeout(timer)
      resolve(result)
    })
  })
}
