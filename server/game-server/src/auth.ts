import jwt from "jsonwebtoken"
import type { Socket } from "socket.io"

export type JwtPayload = {
  sub:         string    // userId
  name:        string
  campaignId?: string
  isMaster?:   boolean
}

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production"

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Socket.io middleware — valida JWT no handshake
// ─────────────────────────────────────────────────────────────────────────────

export function authMiddleware(
  socket: Socket,
  next: (err?: Error) => void
): void {
  const token =
    (socket.handshake.auth as Record<string, string>).token ??
    socket.handshake.headers["authorization"]?.replace("Bearer ", "")

  if (!token) {
    // Permite conexão sem token em dev; em produção bloquear aqui
    if (process.env.NODE_ENV === "production") {
      return next(new Error("AUTH_REQUIRED"))
    }
    // Dev: injeta payload fake
    socket.data.user = {
      sub:      `dev-user-${socket.id.slice(0, 6)}`,
      name:     "Dev Player",
      isMaster: false,
    } satisfies JwtPayload
    return next()
  }

  const payload = verifyToken(token)
  if (!payload) return next(new Error("AUTH_INVALID"))

  socket.data.user = payload
  next()
}
