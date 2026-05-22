import { beforeEach, afterAll } from "vitest"
import { prisma } from "../lib/prisma.js"

beforeEach(async () => {
  // Limpa tabelas em ordem de dependência (FK constraints)
  await prisma.refreshToken.deleteMany()
  await prisma.sessionLog.deleteMany()
  await prisma.session.deleteMany()
  await prisma.userSystemPurchase.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.campaignInvite.deleteMany()
  await prisma.character.deleteMany()
  await prisma.scene.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.user.deleteMany()
  await prisma.gameSystemCatalog.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})
