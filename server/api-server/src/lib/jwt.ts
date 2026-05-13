import jwt from "jsonwebtoken"

const SECRET     = process.env.JWT_SECRET    ?? "dev-secret-change-in-production"
const EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d"

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
