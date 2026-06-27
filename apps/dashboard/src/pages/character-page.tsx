import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { characters as charsApi, campaigns as campaignsApi, gameSystems as systemsApi, setApiToken, type ApiCharacter } from "../lib/api-client"
import { useAuthStore } from "../store/auth-store"
import { systemRegistry, createManifestSystem } from "@rpg3d/game-systems"

// ─────────────────────────────────────────────────────────────────────────────
// CharacterPage — renderiza a ficha do sistema da campanha via registry
// ─────────────────────────────────────────────────────────────────────────────

export function CharacterPage() {
  const { id: campaignId }   = useParams<{ id: string }>()
  const { token }            = useAuthStore()
  const navigate             = useNavigate()
  const [character, setCharacter] = useState<ApiCharacter | null>(null)
  const [systemId,  setSystemId]  = useState("generic")
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)

  useEffect(() => { if (token) setApiToken(token) }, [token])

  useEffect(() => {
    if (!campaignId) return
    Promise.all([
      charsApi.list(campaignId),
      campaignsApi.get(campaignId),
    ]).then(async ([chars, campaign]) => {
      setCharacter(chars[0] ?? null)
      const sysId = campaign.systemId ?? "generic"
      setSystemId(sysId)
      if (!systemRegistry.get(sysId)) {
        try {
          const sys = await systemsApi.getDetail(sysId)
          if (sys.manifest) {
            systemRegistry.register(createManifestSystem(
              { id: sys.id, name: sys.name, description: sys.description, version: sys.version, price: sys.price, tags: sys.tags, thumbnail: sys.thumbnail ?? undefined },
              sys.manifest,
            ))
          }
        } catch {}
      }
    }).finally(() => setLoading(false))
  }, [campaignId])

  const handleSave = async (patch: Record<string, unknown>) => {
    if (!character) return
    setSaving(true); setSaved(false)
    try {
      const updated = await charsApi.updateSheet(character.id, patch, patch.name as string | undefined)
      setCharacter(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-neutral-500">Carregando...</p>
    </div>
  )

  if (!character) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-neutral-400">Nenhum personagem encontrado</p>
        <button onClick={() => navigate("/")} className="text-xs text-neutral-600 hover:text-neutral-400">← Dashboard</button>
      </div>
    </div>
  )

  const system = systemRegistry.get(systemId) ?? systemRegistry.get("generic")!
  const { CharacterSheet } = system

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/campaign/${campaignId}`)}
            className="text-neutral-500 hover:text-neutral-300 text-xs transition-colors">
            ← Campanha
          </button>
          <span className="text-neutral-700">/</span>
          <h1 className="text-sm font-medium text-neutral-200">{character.name}</h1>
          <span className="text-xs text-neutral-600 border border-neutral-800 px-1.5 py-0.5 rounded-full">
            {system.name}
          </span>
          {character.approved
            ? <span className="text-xs bg-green-950/60 text-green-400 border border-green-700/40 px-2 py-0.5 rounded-full">Aprovado</span>
            : <span className="text-xs bg-amber-950/60 text-amber-400 border border-amber-700/40 px-2 py-0.5 rounded-full">Aguardando aprovação</span>}
        </div>
        {saved
          ? <span className="text-xs text-green-400">✓ Salvo</span>
          : <div />}
      </header>

      {/* Sheet */}
      <main className="container mx-auto max-w-2xl px-6 py-8">
        <CharacterSheet
          data={character.sheetData as Record<string, unknown>}
          onSave={handleSave}
          saving={saving}
        />
      </main>
    </div>
  )
}
