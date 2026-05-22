import bcrypt from "bcryptjs"
import { prisma } from "../lib/prisma.js"
import { signToken } from "../lib/jwt.js"
import { seedSystems } from "../routes/systems.js"

export { seedSystems }

export async function createUser(opts: {
  email?:   string
  name?:    string
  password?: string
  credits?: number
} = {}) {
  const plainPassword = opts.password ?? "password123"
  return prisma.user.create({
    data: {
      email:    opts.email ?? `u${Date.now()}${Math.random().toString(36).slice(2)}@test.com`,
      name:     opts.name  ?? "Test User",
      password: await bcrypt.hash(plainPassword, 4), // custo baixo para agilizar testes
      credits:  opts.credits ?? 1000,
    },
  })
}

export function bearerHeader(user: { id: string; name: string; email: string }) {
  return { Authorization: `Bearer ${signToken({ sub: user.id, name: user.name, email: user.email })}` }
}

export async function createCampaign(masterId: string, opts: { name?: string; systemId?: string } = {}) {
  return prisma.campaign.create({
    data: {
      name:     opts.name     ?? "Test Campaign",
      masterId,
      systemId: opts.systemId ?? "generic",
    },
  })
}

export async function createSession(campaignId: string) {
  return prisma.session.create({ data: { campaignId } })
}
