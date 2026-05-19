import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  campaigns as campaignsApi,
  characters as charsApi,
  scenes as scenesApi,
  sessions as sessionsApi,
  setApiToken,
  type ApiCampaign, type ApiScene, type ApiCharacter, type ApiUser,
  type ApiSession, type ApiSessionLog,
} from "../lib/api-client"
import { useAuthStore } from "../store/auth-store"
import { clsx } from "clsx"

const GAME_URL   = import.meta.env.VITE_GAME_URL   ?? "http://localhost:3002"
const EDITOR_URL = import.meta.env.VITE_EDITOR_URL ?? "http://localhost:3001"

type CampaignDetail = ApiCampaign & {
  scenes: ApiScene[]
  characters: (ApiCharacter & { user: ApiUser })[]
}

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { token, userId } = useAuthStore()
  const navigate = useNavigate()

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copying, setCopying]   = useState(false)
  const [starting, setStarting] = useState(false)
  const [pastSessions, setPastSessions]   = useState<ApiSession[]>([])
  const [expandedSession, setExpanded]    = useState<string | null>(null)
  const [sessionLogs, setSessionLogs]     = useState<Record<string, ApiSessionLog[]>>({})
  const [loadingLog, setLoadingLog]       = useState<string | null>(null)

  useEffect(() => { if (token) setApiToken(token) }, [token])

  useEffect(() => {
    if (!id) return
    campaignsApi.get(id)
      .then(data => setCampaign(data as CampaignDetail))
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id || !token) return
    sessionsApi.list(id).then(setPastSessions).catch(() => {})
  }, [id, token])

  const handleApprove = async (charId: string) => {
    await charsApi.approve(charId)
    setCampaign(prev => prev ? {
      ...prev,
      characters: prev.characters.map(c => c.id === charId ? { ...c, approved: true } : c),
    } : null)
  }

  const handleReject = async (charId: string) => {
    if (!confirm("Rejeitar e remover este personagem da campanha?")) return
    await charsApi.reject(charId)
    setCampaign(prev => prev ? {
      ...prev,
      characters: prev.characters.filter(c => c.id !== charId),
    } : null)
  }

  const handleDeleteScene = async (sceneId: string) => {
    if (!confirm("Deletar este cenário permanentemente?")) return
    await scenesApi.delete(sceneId)
    setCampaign(prev => prev ? {
      ...prev,
      scenes: prev.scenes.filter(s => s.id !== sceneId),
    } : null)
  }

  const handleCopyInvite = async () => {
    if (!id) return
    setCopying(true)
    try {
      const { url } = await campaignsApi.createInvite(id)
      await navigator.clipboard.writeText(url)
      setInviteUrl(url)
    } finally { setCopying(false) }
  }

  const handleExpandSession = async (sessionId: string) => {
    if (expandedSession === sessionId) { setExpanded(null); return }
    setExpanded(sessionId)
    if (!sessionLogs[sessionId]) {
      setLoadingLog(sessionId)
      try {
        const { logs } = await sessionsApi.getLog(sessionId)
        setSessionLogs(prev => ({ ...prev, [sessionId]: logs }))
      } catch { /* silently fail */ }
      finally { setLoadingLog(null) }
    }
  }

  const handleStartSession = async () => {
    if (!id) return
    setStarting(true)
    try {
      const { sessionToken, sessionId } = await campaignsApi.getSessionToken(id)
      localStorage.setItem("rpg3d-session-token", sessionToken)
      window.open(`${GAME_URL}/session/${sessionId}`, "_blank")
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } }
      alert(
        e.data?.error === "CHARACTER_NOT_APPROVED"
          ? "Seu personagem ainda não foi aprovado pelo mestre."
          : "Erro ao iniciar sessão. Tente novamente."
      )
    } finally { setStarting(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Carregando...</p>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-400 text-sm">{error ?? "Campanha não encontrada"}</p>
          <button onClick={() => navigate("/")}
            className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors">
            ← Voltar para campanhas
          </button>
        </div>
      </div>
    )
  }

  const isMaster = campaign.isMaster

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")}
            className="text-neutral-500 hover:text-neutral-300 text-xs transition-colors">
            ← Campanhas
          </button>
          <span className="text-neutral-700">/</span>
          <h1 className="text-sm font-medium text-neutral-200">{campaign.name}</h1>
          <span className={clsx(
            "text-xs px-2 py-0.5 rounded border",
            isMaster
              ? "bg-purple-900/40 text-purple-400 border-purple-700/30"
              : "bg-neutral-800 text-neutral-500 border-neutral-700/30"
          )}>
            {isMaster ? "Mestre" : "Jogador"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isMaster && (
            <button onClick={handleCopyInvite} disabled={copying}
              className="text-xs text-neutral-400 hover:text-neutral-200 border border-neutral-700/50 hover:border-neutral-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
              {copying ? "..." : "Convidar jogador"}
            </button>
          )}
          <button onClick={handleStartSession} disabled={starting}
            className="text-xs bg-purple-700 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium">
            {starting ? "Iniciando..." : "Jogar ↗"}
          </button>
        </div>
      </header>

      {inviteUrl && (
        <div className="bg-green-950/30 border-b border-green-800/20 px-6 py-2 flex items-center gap-2">
          <span className="text-xs text-green-500">Link copiado:</span>
          <span className="text-xs text-green-400 font-mono truncate max-w-sm">{inviteUrl}</span>
        </div>
      )}

      <main className="container mx-auto max-w-4xl p-6 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Mestre"      value={campaign.master.name} />
          <StatCard label="Cenários"    value={String(campaign.scenes.length)} />
          <StatCard label="Personagens" value={String(campaign.characters.length)} />
        </div>

        {/* Scenes */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Cenários</h2>
            {isMaster && (
              <a href={EDITOR_URL} target="_blank" rel="noreferrer"
                className="text-xs text-neutral-400 hover:text-neutral-200 border border-neutral-700/50 px-3 py-1.5 rounded-lg transition-colors">
                Abrir editor ↗
              </a>
            )}
          </div>

          {campaign.scenes.length === 0 ? (
            <EmptyState text={
              isMaster
                ? "Nenhum cenário publicado. Abra o editor para criar e publicar um."
                : "Nenhum cenário disponível ainda."
            } />
          ) : (
            <div className="space-y-2">
              {campaign.scenes.map(scene => (
                <SceneRow
                  key={scene.id}
                  scene={scene}
                  isMaster={isMaster}
                  onDelete={() => handleDeleteScene(scene.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Characters */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Personagens</h2>

          {campaign.characters.length === 0 ? (
            <EmptyState text="Nenhum personagem na campanha ainda." />
          ) : (
            <div className="space-y-2">
              {campaign.characters.map(char => (
                <CharacterRow
                  key={char.id}
                  character={char}
                  isMaster={isMaster}
                  isOwn={char.userId === userId}
                  campaignId={campaign.id}
                  onApprove={() => handleApprove(char.id)}
                  onReject={() => handleReject(char.id)}
                />
              ))}
            </div>
          )}
        </section>
        {/* Sessions */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Sessões anteriores</h2>

          {pastSessions.length === 0 ? (
            <EmptyState text="Nenhuma sessão registrada ainda." />
          ) : (
            <div className="space-y-2">
              {pastSessions.map(s => (
                <SessionRow
                  key={s.id}
                  session={s}
                  expanded={expandedSession === s.id}
                  logs={sessionLogs[s.id] ?? null}
                  loadingLog={loadingLog === s.id}
                  onToggle={() => handleExpandSession(s.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-neutral-200">{value}</p>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-10 bg-neutral-900/40 rounded-xl border border-dashed border-neutral-800">
      <p className="text-neutral-600 text-sm">{text}</p>
    </div>
  )
}

function SceneRow({ scene, isMaster, onDelete }: {
  scene: ApiScene; isMaster: boolean; onDelete: () => void
}) {
  return (
    <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 hover:border-neutral-700/60 transition-colors">
      <div>
        <p className="text-sm font-medium text-neutral-200">{scene.name}</p>
        <p className="text-xs text-neutral-500 mt-0.5">
          versão {scene.version} · {new Date(scene.updatedAt).toLocaleDateString("pt-BR")}
        </p>
      </div>
      {isMaster && (
        <button onClick={onDelete}
          className="text-xs text-red-500 hover:text-red-400 border border-red-900/30 hover:border-red-700/50 px-2.5 py-1 rounded-lg transition-colors">
          Deletar
        </button>
      )}
    </div>
  )
}

function formatDuration(startedAt: string, endedAt?: string): string {
  if (!endedAt) return "—"
  const mins = Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000)
  if (mins < 1) return "< 1min"
  const h = Math.floor(mins / 60), m = mins % 60
  return h > 0 ? `${h}h ${m}min` : `${mins}min`
}

const LOG_TYPE_META: Record<string, { label: string; cls: string }> = {
  JOIN:        { label: "entrada",    cls: "bg-neutral-800 text-neutral-400" },
  LEAVE:       { label: "saída",      cls: "bg-neutral-800 text-neutral-400" },
  CHAT:        { label: "chat",       cls: "bg-blue-950 text-blue-400" },
  DICE:        { label: "dado",       cls: "bg-yellow-950 text-yellow-400" },
  SCENE_LOAD:  { label: "cena",       cls: "bg-purple-950 text-purple-400" },
  NPC_SPAWN:   { label: "npc+",       cls: "bg-orange-950 text-orange-400" },
  NPC_DESPAWN: { label: "npc-",       cls: "bg-orange-950/60 text-orange-500" },
  NOTE_REVEAL: { label: "nota",       cls: "bg-green-950 text-green-400" },
  TRAP_DISARM: { label: "armadilha",  cls: "bg-red-950 text-red-400" },
  FOG_CLEAR:   { label: "névoa",      cls: "bg-sky-950 text-sky-400" },
}

function formatLogDesc(log: ApiSessionLog): string {
  const d = (log.data ?? {}) as Record<string, unknown>
  switch (log.type) {
    case "JOIN":        return `entrou na sessão${d.isMaster ? " como mestre" : ""}`
    case "LEAVE":       return `saiu da sessão`
    case "CHAT":        return `"${String(d.content ?? "").slice(0, 80)}"`
    case "DICE": {
      const rolls = Array.isArray(d.rolls) ? (d.rolls as number[]).join(", ") : ""
      const mod   = typeof d.modifier === "number" && d.modifier !== 0
        ? (d.modifier > 0 ? `+${d.modifier}` : `${d.modifier}`) : ""
      return `rolou ${d.diceCount}d${d.diceFaces}${mod}: [${rolls}] = ${d.total}${d.label ? ` (${d.label})` : ""}`
    }
    case "SCENE_LOAD":  return `carregou cena`
    case "NPC_SPAWN":   return `invocou ${d.role ?? "NPC"} "${d.name ?? ""}"`
    case "NPC_DESPAWN": return `removeu NPC`
    case "NOTE_REVEAL": return `revelou uma nota`
    case "TRAP_DISARM": return `desarmou uma armadilha`
    case "FOG_CLEAR":   return `limpou a névoa de guerra`
    default:            return log.type
  }
}

function SessionRow({ session: s, expanded, logs, loadingLog, onToggle }: {
  session: ApiSession; expanded: boolean
  logs: ApiSessionLog[] | null; loadingLog: boolean
  onToggle: () => void
}) {
  const logCount = s._count?.logs ?? (logs?.length ?? 0)
  const date = new Date(s.startedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
  const time = new Date(s.startedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-800/40 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium text-neutral-200">{date} às {time}</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {formatDuration(s.startedAt, s.endedAt)} · {logCount} eventos
            </p>
          </div>
          {!s.endedAt && (
            <span className="text-xs px-2 py-0.5 bg-green-950 text-green-400 rounded border border-green-800/30">
              ao vivo
            </span>
          )}
        </div>
        <span className="text-neutral-600 text-xs">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t border-neutral-800 px-4 py-3 max-h-80 overflow-y-auto">
          {loadingLog ? (
            <p className="text-xs text-neutral-600 py-2">Carregando log...</p>
          ) : !logs || logs.length === 0 ? (
            <p className="text-xs text-neutral-600 py-2">Nenhum evento registrado.</p>
          ) : (
            <div className="space-y-1">
              {logs.map(log => {
                const meta = LOG_TYPE_META[log.type] ?? { label: log.type, cls: "bg-neutral-800 text-neutral-500" }
                const t = new Date(log.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                return (
                  <div key={log.id} className="flex items-start gap-2 text-xs">
                    <span className="text-neutral-600 shrink-0 w-10">{t}</span>
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${meta.cls}`}>
                      {meta.label}
                    </span>
                    {log.actorName && (
                      <span className="text-neutral-400 shrink-0 font-medium">{log.actorName}</span>
                    )}
                    <span className="text-neutral-500 truncate">{formatLogDesc(log)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CharacterRow({ character: c, isMaster, isOwn, campaignId, onApprove, onReject }: {
  character: ApiCharacter & { user: ApiUser }
  isMaster:  boolean
  isOwn:     boolean
  campaignId: string
  onApprove: () => void
  onReject:  () => void
}) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 hover:border-neutral-700/60 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className={clsx(
          "w-2 h-2 rounded-full shrink-0",
          c.approved ? "bg-green-500" : "bg-yellow-500 animate-pulse"
        )} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-200 truncate">
            {c.name}
            {isOwn && <span className="ml-2 text-xs text-neutral-600">(você)</span>}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {c.user.name} · {c.approved ? "aprovado" : "aguardando aprovação"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isOwn && (
          <button onClick={() => navigate(`/campaign/${campaignId}/character`)}
            className="text-xs text-neutral-400 hover:text-neutral-200 border border-neutral-700/50 px-2.5 py-1 rounded-lg transition-colors">
            Editar ficha
          </button>
        )}
        {isMaster && !c.approved && (
          <>
            <button onClick={onApprove}
              className="text-xs text-green-400 hover:text-green-300 border border-green-900/40 hover:border-green-700/60 px-2.5 py-1 rounded-lg transition-colors">
              Aprovar
            </button>
            <button onClick={onReject}
              className="text-xs text-red-500 hover:text-red-400 border border-red-900/30 hover:border-red-700/50 px-2.5 py-1 rounded-lg transition-colors">
              Rejeitar
            </button>
          </>
        )}
      </div>
    </div>
  )
}
