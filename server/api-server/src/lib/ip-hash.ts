import { createHmac } from "crypto"
import type { Request } from "express"

// ─────────────────────────────────────────────────────────────────────────────
// LGPD art. 12 — dado anonimizado não é dado pessoal.
// O IP nunca é armazenado em texto claro; apenas o HMAC-SHA256 com salt
// de servidor é persistido. Irreversível sem o salt.
// ─────────────────────────────────────────────────────────────────────────────

const SALT = process.env.IP_HASH_SALT
if (!SALT) {
  console.warn("[ip-hash] IP_HASH_SALT não definido — use uma string aleatória longa em produção")
}
const EFFECTIVE_SALT = SALT ?? "rpg3d-dev-salt-change-in-production"

// Remove mapeamento IPv6→IPv4 (::ffff:1.2.3.4 → 1.2.3.4) e porta eventual
function normalizeIp(raw: string): string {
  const mapped = raw.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (mapped) return mapped[1]!
  // Remove porta apenas em IPv4 com porta (ex: "1.2.3.4:8080")
  // IPv6 não tem porta sem colchetes, então não aplicamos replace em IPs com múltiplos ":"
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(raw)) return raw.replace(/:\d+$/, "")
  return raw
}

// Extrai o IP real do request respeitando proxies reversos
export function extractIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"]
  if (forwarded) {
    // X-Forwarded-For pode ser "client, proxy1, proxy2" — pega o primeiro
    const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(",")[0]?.trim()
    if (first) return normalizeIp(first)
  }
  const addr = req.ip ?? req.socket.remoteAddress
  return addr ? normalizeIp(addr) : null
}

// Retorna HMAC-SHA256 hex do IP normalizado
export function hashIp(ip: string): string {
  return createHmac("sha256", EFFECTIVE_SALT).update(ip).digest("hex")
}
