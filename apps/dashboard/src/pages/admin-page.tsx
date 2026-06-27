import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { gameSystems as api, type ApiGameSystem } from "../lib/api-client"
import { clsx } from "clsx"

type AdminTab = "pending" | "active" | "rejected"

export function AdminPage() {
  const navigate = useNavigate()
  const [secret,   setSecret]   = useState(() => sessionStorage.getItem("rpg3d-admin-secret") ?? "")
  const [authed,   setAuthed]   = useState(false)
  const [tab,      setTab]      = useState<AdminTab>("pending")
  const [systems,  setSystems]  = useState<ApiGameSystem[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const load = useCallback(async (s: string, t: AdminTab) => {
    setLoading(true); setError(null)
    try {
      const statusMap: Record<AdminTab, "PENDING" | "ACTIVE" | "REJECTED"> = {
        pending:  "PENDING",
        active:   "ACTIVE",
        rejected: "REJECTED",
      }
      const data = await api.adminList(s, statusMap[t])
      setSystems(data)
      setAuthed(true)
    } catch (err: unknown) {
      const e = err as { status?: number }
      if (e.status === 403) setError("Segredo de admin incorreto.")
      else setError("Erro ao carregar sistemas.")
      setAuthed(false)
    } finally { setLoading(false) }
  }, [])

  const handleLogin = () => {
    sessionStorage.setItem("rpg3d-admin-secret", secret)
    load(secret, tab)
  }

  useEffect(() => {
    if (authed) load(secret, tab)
  }, [tab, authed, load, secret])

  const handleApprove = async (s: ApiGameSystem) => {
    try {
      const updated = await api.adminApprove(secret, s.id)
      setSystems(prev => prev.filter(x => x.id !== updated.id))
    } catch { setError("Erro ao aprovar.") }
  }

  const handleReject = async (s: ApiGameSystem, reason: string) => {
    try {
      const updated = await api.adminReject(secret, s.id, reason || undefined)
      setSystems(prev => prev.filter(x => x.id !== updated.id))
    } catch { setError("Erro ao rejeitar.") }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-sm font-medium text-neutral-200 text-center">Painel Admin</h1>
          <div className="space-y-2">
            <label className="text-[10px] text-neutral-500 uppercase tracking-wide block">Segredo admin</label>
            <input
              type="password"
              className="w-full bg-neutral-800 border border-neutral-700/50 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-600/60"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="PLATFORM_ADMIN_SECRET"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
          <button
            type="button"
            onClick={handleLogin}
            className="w-full bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            ← Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
            ← Dashboard
          </button>
          <span className="text-neutral-700">/</span>
          <h1 className="text-sm font-medium text-neutral-300">Admin — Sistemas de Jogo</h1>
        </div>
        <button
          type="button"
          onClick={() => { sessionStorage.removeItem("rpg3d-admin-secret"); setAuthed(false) }}
          className="text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors"
        >
          Sair
        </button>
      </header>

      {/* Tabs */}
      <div className="border-b border-neutral-800 px-6 flex gap-0">
        {([
          { id: "pending",  label: "Aguardando revisão" },
          { id: "active",   label: "Publicados" },
          { id: "rejected", label: "Rejeitados" },
        ] as { id: AdminTab; label: string }[]).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={clsx(
              "px-4 py-3 text-xs font-medium border-b-2 transition-colors",
              tab === t.id
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-neutral-500 hover:text-neutral-300",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <main className="container mx-auto max-w-3xl p-6 space-y-4">
        {error && (
          <div className="bg-red-950/40 border border-red-700/40 text-red-400 text-xs rounded-lg px-4 py-3">{error}</div>
        )}

        {loading ? (
          <p className="text-neutral-600 text-sm text-center py-12">Carregando...</p>
        ) : systems.length === 0 ? (
          <p className="text-neutral-600 text-sm text-center py-12">Nenhum sistema neste estado.</p>
        ) : (
          <div className="grid gap-4">
            {systems.map(s => (
              <AdminSystemCard
                key={s.id}
                system={s}
                showActions={tab === "pending"}
                onApprove={() => handleApprove(s)}
                onReject={(reason) => handleReject(s, reason)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// ── Card de sistema no painel admin ──────────────────────────────────────────

function AdminSystemCard({ system: s, showActions, onApprove, onReject }: {
  system:      ApiGameSystem
  showActions: boolean
  onApprove:   () => void
  onReject:    (reason: string) => void
}) {
  const [rejecting, setRejecting] = useState(false)
  const [reason,    setReason]    = useState("")

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-neutral-200 text-sm">{s.name}</h3>
            <span className="text-[10px] text-neutral-600 font-mono border border-neutral-800 px-1.5 py-0.5 rounded">#{s.id}</span>
            <span className="text-[10px] text-neutral-600 border border-neutral-800 px-1.5 py-0.5 rounded-full">v{s.version}</span>
          </div>
          {s.authorName && (
            <p className="text-[10px] text-neutral-500">por {s.authorName}</p>
          )}
          <p className="text-xs text-neutral-400 leading-relaxed">{s.description}</p>
          {s.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {s.tags.map(tag => (
                <span key={tag} className="text-[10px] bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          )}
          {s.repositoryUrl && (
            <a href={s.repositoryUrl} target="_blank" rel="noreferrer" className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors block">
              Repositório →
            </a>
          )}
          {s.rejectionReason && (
            <p className="text-[10px] text-red-400/70 italic">Motivo anterior: {s.rejectionReason}</p>
          )}
        </div>

        <div className="shrink-0 text-right space-y-1">
          <p className="text-xs text-neutral-500">
            {s.price === 0 ? "Gratuito" : `${s.price.toLocaleString()} créditos`}
          </p>
          <p className="text-[10px] text-neutral-600">
            {new Date(s.createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      {s.manifest && (
        <details className="group">
          <summary className="text-[10px] text-neutral-600 hover:text-neutral-400 cursor-pointer select-none transition-colors">
            {s.manifest.fields.length} campo{s.manifest.fields.length !== 1 ? "s" : ""} na ficha ▾
          </summary>
          <div className="mt-2 flex gap-1.5 flex-wrap">
            {s.manifest.fields.map(f => (
              <span key={f.id} className="text-[10px] bg-neutral-800/60 text-neutral-500 px-2 py-0.5 rounded font-mono">
                {f.id} <span className="text-neutral-700">({f.type})</span>
              </span>
            ))}
          </div>
        </details>
      )}

      {showActions && (
        <div className="flex items-center gap-2 pt-1 border-t border-neutral-800">
          {!rejecting ? (
            <>
              <button
                type="button"
                onClick={onApprove}
                className="bg-green-800/60 hover:bg-green-700/70 text-green-300 text-xs font-medium px-4 py-1.5 rounded-lg transition-colors border border-green-700/40"
              >
                Aprovar
              </button>
              <button
                type="button"
                onClick={() => setRejecting(true)}
                className="bg-red-900/40 hover:bg-red-800/50 text-red-400 text-xs font-medium px-4 py-1.5 rounded-lg transition-colors border border-red-800/40"
              >
                Rejeitar
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <input
                className="flex-1 bg-neutral-800 border border-neutral-700/50 rounded px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-red-700/50 placeholder-neutral-600"
                placeholder="Motivo da rejeição (opcional)"
                value={reason}
                onChange={e => setReason(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (onReject(reason), setRejecting(false), setReason(""))}
                autoFocus
              />
              <button
                type="button"
                onClick={() => { onReject(reason); setRejecting(false); setReason("") }}
                className="bg-red-900/60 hover:bg-red-800/70 text-red-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border border-red-800/40 whitespace-nowrap"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => { setRejecting(false); setReason("") }}
                className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
