import type { Request, Response, NextFunction } from "express"
import { verifyToken, type TokenPayload } from "../lib/jwt.js"

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "AUTH_REQUIRED" })
    return
  }
  const token   = header.slice(7)
  const payload = verifyToken(token)
  if (!payload) {
    res.status(401).json({ error: "AUTH_INVALID" })
    return
  }
  req.user = payload
  next()
}

export function requireMaster(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.isMaster) {
    res.status(403).json({ error: "FORBIDDEN" })
    return
  }
  next()
}
