// ─────────────────────────────────────────────────────────────────────────────
// API client — wrapper tipado sobre fetch
// Usado por apps/game e apps/dashboard
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000"

// ── Token store simples (em memória + localStorage) ───────────────────────────
let _token: string | null = null
let _refreshToken: string | null = null
let _refreshing = false

export function setApiToken(token: string | null): void {
  _token = token
  if (token) localStorage.setItem("rpg3d-api-token", token)
  else        localStorage.removeItem("rpg3d-api-token")
}

export function getApiToken(): string | null {
  if (_token) return _token
  _token = localStorage.getItem("rpg3d-api-token")
  return _token
}

export function setRefreshToken(token: string | null): void {
  _refreshToken = token
  if (token) localStorage.setItem("rpg3d-refresh-token", token)
  else        localStorage.removeItem("rpg3d-refresh-token")
}

export function getRefreshToken(): string | null {
  if (_refreshToken) return _refreshToken
  _refreshToken = localStorage.getItem("rpg3d-refresh-token")
  return _refreshToken
}

// ── Fetch base ────────────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getApiToken()
  const res   = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  })

  if (
    res.status === 401 &&
    !_refreshing &&
    path !== "/auth/refresh" &&
    path !== "/auth/login" &&
    path !== "/auth/register"
  ) {
    const rt = getRefreshToken()
    if (rt) {
      _refreshing = true
      try {
        const refreshed = await apiFetch<{ token: string; refreshToken: string }>("/auth/refresh", {
          method: "POST", body: JSON.stringify({ refreshToken: rt }),
        })
        setApiToken(refreshed.token)
        setRefreshToken(refreshed.refreshToken)
        _refreshing = false
        return apiFetch<T>(path, init)
      } catch {
        _refreshing = false
        setApiToken(null)
        setRefreshToken(null)
        throw Object.assign(new Error("SESSION_EXPIRED"), { status: 401 })
      }
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw Object.assign(new Error(err.error ?? "API_ERROR"), { status: res.status, data: err })
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export type ApiUser = { id: string; name: string; email: string; masterCode?: string; defaultRole?: string }

export type ApiMasterProfile = {
  id: string; name: string; masterCode: string
  ownedCampaigns: { id: string; name: string; systemId: string; _count: { characters: number } }[]
}

export type ApiJoinRequest = {
  id: string; campaignId: string; playerId: string; status: string; createdAt: string
  player:   { id: string; name: string; email: string }
  campaign: { id: string; name: string }
}
export type ApiCampaign = {
  id: string; name: string; description?: string
  systemId: string; masterId: string; isMaster: boolean
  master: { id: string; name: string }
  myCharacter: ApiCharacter | null
  _count: { characters: number; scenes: number }
  createdAt: string; updatedAt: string
}
export type ApiScene = {
  id: string; name: string; description?: string
  fileUrl: string; version: number; updatedAt: string
}
export type ApiCharacter = {
  id: string; name: string; campaignId: string; userId: string
  sheetData: Record<string, unknown>; approved: boolean
  createdAt: string; updatedAt: string
}
export type ApiInvite = { token: string; expiresAt: string; url: string }
export type ApiSessionData = {
  sessionToken: string; sessionId: string
  isMaster: boolean; characterId?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

export const auth = {
  register: (email: string, name: string, password: string, defaultRole: "master" | "player" = "player") =>
    apiFetch<{ token: string; refreshToken: string; user: ApiUser }>("/auth/register", {
      method: "POST", body: JSON.stringify({ email, name, password, defaultRole }),
    }),

  login: (email: string, password: string) =>
    apiFetch<{ token: string; refreshToken: string; user: ApiUser }>("/auth/login", {
      method: "POST", body: JSON.stringify({ email, password }),
    }),

  me: () => apiFetch<ApiUser>("/auth/me"),

  refresh: (refreshToken: string) =>
    apiFetch<{ token: string; refreshToken: string }>("/auth/refresh", {
      method: "POST", body: JSON.stringify({ refreshToken }),
    }),

  logout: (refreshToken: string) =>
    apiFetch<void>("/auth/logout", {
      method: "POST", body: JSON.stringify({ refreshToken }),
    }),
}

// ─────────────────────────────────────────────────────────────────────────────
// Campaigns
// ─────────────────────────────────────────────────────────────────────────────

export const campaigns = {
  list: () =>
    apiFetch<ApiCampaign[]>("/campaigns"),

  get: (id: string) =>
    apiFetch<ApiCampaign & { scenes: ApiScene[]; characters: (ApiCharacter & { user: ApiUser })[] }>(`/campaigns/${id}`),

  create: (data: { name: string; description?: string; systemId?: string }) =>
    apiFetch<ApiCampaign>("/campaigns", { method: "POST", body: JSON.stringify(data) }),

  createInvite: (campaignId: string, opts?: { email?: string; recipientName?: string }) =>
    apiFetch<ApiInvite & { emailSent?: boolean }>(`/campaigns/${campaignId}/invite`, {
      method: "POST",
      body:   JSON.stringify(opts ?? {}),
    }),

  getSessionToken: (campaignId: string) =>
    apiFetch<ApiSessionData>(`/campaigns/${campaignId}/session`, { method: "POST" }),
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenes
// ─────────────────────────────────────────────────────────────────────────────

export const scenes = {
  list: (campaignId: string) =>
    apiFetch<ApiScene[]>(`/scenes?campaignId=${campaignId}`),

  create: (data: { campaignId: string; name: string; fileUrl: string; description?: string }) =>
    apiFetch<ApiScene>("/scenes", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: { name?: string; fileUrl?: string; description?: string }) =>
    apiFetch<ApiScene>(`/scenes/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<void>(`/scenes/${id}`, { method: "DELETE" }),
}

// ─────────────────────────────────────────────────────────────────────────────
// Characters
// ─────────────────────────────────────────────────────────────────────────────

export const characters = {
  list: (campaignId: string) =>
    apiFetch<(ApiCharacter & { user: ApiUser })[]>(`/characters?campaignId=${campaignId}`),

  get: (id: string) =>
    apiFetch<ApiCharacter & { user: ApiUser }>(`/characters/${id}`),

  create: (campaignId: string, name: string) =>
    apiFetch<ApiCharacter>("/characters", {
      method: "POST", body: JSON.stringify({ campaignId, name }),
    }),

  updateSheet: (id: string, sheetData: Record<string, unknown>, name?: string) =>
    apiFetch<ApiCharacter>(`/characters/${id}/sheet`, {
      method: "PATCH", body: JSON.stringify({ sheetData, name }),
    }),

  approve: (id: string) =>
    apiFetch<ApiCharacter>(`/characters/${id}/approve`, { method: "POST" }),

  reject: (id: string) =>
    apiFetch<void>(`/characters/${id}/reject`, { method: "POST" }),
}

// ─────────────────────────────────────────────────────────────────────────────
// Invites
// ─────────────────────────────────────────────────────────────────────────────

export const invites = {
  accept: (token: string) =>
    apiFetch<{ campaign: ApiCampaign; character: ApiCharacter; alreadyJoined: boolean }>(
      `/invites/${token}/accept`, { method: "POST" }
    ),
}

// ─────────────────────────────────────────────────────────────────────────────
// Game Systems
// ─────────────────────────────────────────────────────────────────────────────

export type ApiSession = {
  id: string; campaignId: string; sceneId?: string
  startedAt: string; endedAt?: string
  _count?: { logs: number }
}
export type ApiSessionLog = {
  id: string; sessionId: string; campaignId: string
  type: string; actorName?: string
  data?: Record<string, unknown>
  timestamp: string
}

export const sessions = {
  list: (campaignId: string) =>
    apiFetch<ApiSession[]>(`/campaigns/${campaignId}/sessions`),

  getLog: (sessionId: string) =>
    apiFetch<{ session: ApiSession; logs: ApiSessionLog[] }>(`/sessions/${sessionId}/log`),
}

export type { ManifestField, SystemManifest } from "@rpg3d/game-systems"
import type { ManifestField, SystemManifest } from "@rpg3d/game-systems"

export type ApiGameSystem = {
  id: string; name: string; description: string
  price: number; version: string; tags: string[]
  thumbnail?: string | null; isActive: boolean
  isPurchased?: boolean  // ausente em GET /systems/:id público
  status: "PENDING" | "ACTIVE" | "REJECTED"
  authorId?: string | null; authorName?: string | null
  repositoryUrl?: string | null; manifest?: SystemManifest | null
  createdAt: string
}

export type SubmitSystemData = {
  id: string; name: string; description: string; manifest: SystemManifest
  price?: number; version?: string; tags?: string[]
  thumbnail?: string; repositoryUrl?: string
}

export const gameSystems = {
  list: (tag?: string) =>
    apiFetch<{ credits: number; systems: ApiGameSystem[] }>(`/systems${tag ? `?tag=${encodeURIComponent(tag)}` : ""}`),

  mine: () =>
    apiFetch<ApiGameSystem[]>("/systems/mine"),

  getDetail: (id: string) =>
    apiFetch<ApiGameSystem>(`/systems/${id}`),

  submit: (data: SubmitSystemData) =>
    apiFetch<ApiGameSystem>("/systems", { method: "POST", body: JSON.stringify(data) }),

  updateOwn: (id: string, data: Partial<Omit<SubmitSystemData, "id">>) =>
    apiFetch<ApiGameSystem>(`/systems/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  purchase: (systemId: string) =>
    apiFetch<{ ok: boolean; credits: number }>(`/systems/${systemId}/purchase`, { method: "POST" }),
}

// ─────────────────────────────────────────────────────────────────────────────
// Masters — encontrar mestre por código + solicitações de entrada
// ─────────────────────────────────────────────────────────────────────────────

export const masters = {
  findByCode: (code: string) =>
    apiFetch<ApiMasterProfile>(`/masters/${code.toUpperCase()}`),

  requestJoin: (code: string, campaignId: string) =>
    apiFetch<ApiJoinRequest>(
      `/masters/${code.toUpperCase()}/campaigns/${campaignId}/request`,
      { method: "POST" }
    ),

  listRequests: () =>
    apiFetch<ApiJoinRequest[]>("/masters/me/requests"),

  reviewRequest: (requestId: string, action: "approve" | "reject") =>
    apiFetch<{ ok: boolean; action: string }>(`/masters/requests/${requestId}`, {
      method: "PATCH", body: JSON.stringify({ action }),
    }),
}
