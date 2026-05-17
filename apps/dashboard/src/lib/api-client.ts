// ─────────────────────────────────────────────────────────────────────────────
// API client — wrapper tipado sobre fetch
// Usado por apps/game e apps/dashboard
// ─────────────────────────────────────────────────────────────────────────────

const API_URL =
  typeof import.meta !== "undefined" && (import.meta as unknown as Record<string, Record<string, string>>).env?.VITE_API_URL
    ? (import.meta as unknown as Record<string, Record<string, string>>).env.VITE_API_URL
    : "http://localhost:4000"

// ── Token store simples (em memória + localStorage) ───────────────────────────
let _token: string | null = null

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

export type ApiUser = { id: string; name: string; email: string }
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
  register: (email: string, name: string, password: string) =>
    apiFetch<{ token: string; user: ApiUser }>("/auth/register", {
      method: "POST", body: JSON.stringify({ email, name, password }),
    }),

  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: ApiUser }>("/auth/login", {
      method: "POST", body: JSON.stringify({ email, password }),
    }),

  me: () => apiFetch<ApiUser>("/auth/me"),
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

  createInvite: (campaignId: string) =>
    apiFetch<ApiInvite>(`/campaigns/${campaignId}/invite`, { method: "POST" }),

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

export type ApiGameSystem = {
  id: string; name: string; description: string
  price: number; version: string; tags: string[]
  thumbnail?: string; isActive: boolean
  isPurchased: boolean
}

export const gameSystems = {
  list: () =>
    apiFetch<{ credits: number; systems: ApiGameSystem[] }>("/systems"),

  purchase: (systemId: string) =>
    apiFetch<{ ok: boolean; credits: number }>(`/systems/${systemId}/purchase`, { method: "POST" }),
}
