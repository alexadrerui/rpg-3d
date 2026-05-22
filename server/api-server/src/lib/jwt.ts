import jwt from "jsonwebtoken"
import { randomUUID } from "crypto"

const SECRET     = process.env.JWT_SECRET    ?? "dev-secret-change-in-production"
const EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d"

const REFRESH_SECRET     = process.env.JWT_REFRESH_SECRET     ?? "dev-refresh-secret-change-in-production"
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? "30d"

export type TokenPayload = {
  sub:         string   // userId
  name:        string
  email:       string
  isMaster?:   boolean
  campaignId?: string
  characterId?: string
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN } as jwt.SignOptions)
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as TokenPayload
  } catch {
    return null
  }
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, jti: randomUUID() }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN } as jwt.SignOptions)
}

export function verifyRefreshToken(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as { sub: string }
  } catch {
    return null
  }
}

export function refreshExpiresAt(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d
}
