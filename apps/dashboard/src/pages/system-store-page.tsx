import { useState, useEffect } from "react"
import { useNavigate }          from "react-router-dom"
import { gameSystems as api, setApiToken, type ApiGameSystem } from "../lib/api-client"
import { useAuthStore }         from "../store/auth-store"
import { clsx }                 from "clsx"

// ─────────────────────────────────────────────────────────────────────────────
// SystemStorePage — loja de sistemas de jogo
// ─────────────────────────────────────────────────────────────────────────────

export function SystemStorePage() {
  const { token } = useAuthStore()
  const navigate  = useNavigate()
  const [systems,  setSystems]  = useState<ApiGameSystem[]>([])
  const [credits,  setCredits]  = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [buying,   setBuying]   = useState<string | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    if (!token) { navigate("/"); return }
    setApiToken(token)
  }, [token, navigate])

  useEffect(() => {
    if (!token) return
    api.list()
      .then(({ systems: s, credits: c }) => { setSystems(s); setCredits(c) })
      .finally(() => setLoading(false))
  }, [])

  const handlePurchase = async (system: ApiGameSystem) => {
    setBuying(system.id); setError(null)
    try {
      const { credits: newCredits } = await api.purchase(system.id)
      setCredits(newCredits)
      setSystems(prev => prev.map(s => s.id === system.id ? { ...s, isPurchased: true } : s))
    } catch (err: unknown) {
      const e = err as { data?: { error?: string; needed?: number } }
      if (e.data?.error === "INSUFFICIENT_CREDITS") {
        setError(`Créditos insuficientes. Você tem ${credits} créditos, mas precisa de ${e.data.needed ?? system.price}.`)
      } else if (e.data?.error === "ALREADY_OWNED") {
        setSystems(prev => prev.map(s => s.id === system.id ? { ...s, isPurchased: true } : s))
      } else {
        setError("Erro ao adquirir o sistema. Tente novamente.")
      }
    } finally { setBuying(null) }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
            ← Dashboard
          </button>
          <span className="text-neutral-700">/</span>
          <h1 className="text-sm font-medium text-neutral-300">Loja de Sistemas</h1>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-500">Saldo:</span>
          <span className="text-amber-400 font-medium tabular-nums">{credits.toLocaleString()} créditos</span>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-medium text-neutral-200">Sistemas de jogo</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Cada sistema define as regras, mecânicas e ficha de personagem da sua campanha.
          </p>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-700/40 text-red-400 text-xs rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-neutral-600 text-sm text-center py-12">Carregando...</p>
        ) : (
          <div className="grid gap-4">
            {systems.map(s => (
              <SystemCard key={s.id} system={s}
                buying={buying === s.id}
                onPurchase={() => handlePurchase(s)} />
            ))}
          </div>
        )}

        {/* Aviso sobre créditos */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-xs text-neutral-500 space-y-1">
          <p className="font-medium text-neutral-400">Sobre os créditos</p>
          <p>Novos usuários recebem 1.000 créditos gratuitos ao criar sua conta.</p>
          <p>Sistemas gratuitos podem ser adquiridos sem custo.</p>
        </div>
      </main>
    </div>
  )
}

// ── Card de sistema ────────────────────────────────────────────────────────────

function SystemCard({ system: s, buying, onPurchase }: {
  system: ApiGameSystem
  buying: boolean
  onPurchase: () => void
}) {
  return (
    <div className={clsx(
      "bg-neutral-900 border rounded-xl p-5 transition-colors",
      s.isPurchased ? "border-neutral-700/50" : "border-neutral-800 hover:border-neutral-700/80",
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          {/* Nome + badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-neutral-200">{s.name}</h3>
            {s.price === 0 && (
              <span className="text-[10px] bg-green-950/60 text-green-400 border border-green-700/40 px-1.5 py-0.5 rounded-full">
                Gratuito
              </span>
            )}
            <span className="text-[10px] text-neutral-600 border border-neutral-800 px-1.5 py-0.5 rounded-full">
              v{s.version}
            </span>
          </div>

          {/* Descrição */}
          <p className="text-xs text-neutral-400 leading-relaxed">{s.description}</p>

          {/* Tags */}
          {s.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {s.tags.map(tag => (
                <span key={tag}
                  className="text-[10px] bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Ação */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          {s.isPurchased ? (
            <span className="flex items-center gap-1.5 text-xs text-green-400 border border-green-700/40 bg-green-950/40 px-3 py-1.5 rounded-lg">
              ✓ Adquirido
            </span>
          ) : (
            <button onClick={onPurchase} disabled={buying}
              className="bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors whitespace-nowrap">
              {buying ? "Aguarde..." : s.price === 0 ? "Adquirir grátis" : `Comprar · ${s.price.toLocaleString()} créditos`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
