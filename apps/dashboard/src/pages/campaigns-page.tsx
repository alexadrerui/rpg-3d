import { useState, useEffect } from "react"
import { useNavigate }         from "react-router-dom"
import { campaigns as campaignsApi, gameSystems as systemsApi, masters as mastersApi, setApiToken, setRefreshToken, auth as authApi, type ApiCampaign, type ApiGameSystem, type ApiMasterProfile, type ApiJoinRequest } from "../lib/api-client"
import { useAuthStore }        from "../store/auth-store"
import { clsx }                from "clsx"

const EDITOR_URL    = import.meta.env.VITE_EDITOR_URL    ?? "http://localhost:3001"
const GAME_URL      = import.meta.env.VITE_GAME_URL      ?? "http://localhost:3002"

export function CampaignsPage() {
  const { token, name, setAuth, clear } = useAuthStore()
  const navigate = useNavigate()
  const [authed, setAuthed]             = useState(!!token)

  // Restaura token no api-client ao montar
  useEffect(() => { if (token) setApiToken(token) }, [])

  if (!authed) return (
    <LoginPage onSuccess={(t, u) => {
      setAuth({ token: t, userId: u.id, name: u.name, email: u.email })
      setAuthed(true)
    }} />
  )

  return <CampaignList name={name} onLogout={() => { clear(); setAuthed(false) }} />
}

// ── Login ─────────────────────────────────────────────────────────────────────
function LoginPage({ onSuccess }: { onSuccess: (token: string, user: { id: string; name: string; email: string }) => void }) {
  const [mode, setMode]       = useState<"login" | "register">("login")
  const [email, setEmail]     = useState("")
  const [name, setName]       = useState("")
  const [password, setPass]   = useState("")
  const [role, setRole]       = useState<"player" | "master">("player")
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const { token, refreshToken, user } = mode === "login"
        ? await authApi.login(email, password)
        : await authApi.register(email, name, password, role)
      setApiToken(token)
      setRefreshToken(refreshToken)
      onSuccess(token, user)
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } }
      setError(e.data?.error === "INVALID_CREDENTIALS" ? "E-mail ou senha inválidos"
        : e.data?.error === "EMAIL_TAKEN" ? "E-mail já em uso"
        : "Erro ao conectar com o servidor")
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-neutral-100 tracking-tight">
            RPG <span className="text-purple-300">3D</span>
          </h1>
          <p className="text-neutral-500 text-sm mt-1">Dashboard</p>
        </div>
        <div className="flex rounded-lg border border-neutral-700/50 overflow-hidden">
          {(["login", "register"] as const).map(m => (
            <button key={m} type="button" onClick={() => { setMode(m); setError(null) }}
              className={clsx("flex-1 py-2 text-sm transition-colors",
                mode === m ? "bg-neutral-800 text-neutral-100" : "text-neutral-500 hover:text-neutral-300")}>
              {m === "login" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <Input label="Nome" value={name} onChange={setName} required />

              <div className="space-y-1">
                <label className="t-label block">Você é</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["player", "master"] as const).map(r => (
                    <button
                      key={r} type="button"
                      onClick={() => setRole(r)}
                      className={clsx(
                        "flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border text-xs font-medium transition-all",
                        role === r
                          ? r === "master"
                            ? "bg-[rgb(88_28_135/0.5)] text-purple-300 border-[rgb(126_34_206/0.5)]"
                            : "bg-green-950/40 text-green-400 border-green-700/40"
                          : "bg-neutral-800/60 text-neutral-500 border-neutral-700/50 hover:border-neutral-600 hover:text-neutral-300"
                      )}
                    >
                      <span className="text-lg leading-none">{r === "master" ? "👑" : "🎲"}</span>
                      <span>{r === "master" ? "Mestre" : "Jogador"}</span>
                      <span className={clsx("text-[10px] font-normal", role === r ? "opacity-80" : "text-neutral-600")}>
                        {r === "master" ? "Cria campanhas" : "Participa de campanhas"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <Input label="E-mail" type="email" value={email} onChange={setEmail} required />
          <Input label="Senha"  type="password" value={password} onChange={setPass} required />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Campaign list ─────────────────────────────────────────────────────────────
function CampaignList({ name, onLogout }: { name: string; onLogout: () => void }) {
  const navigate = useNavigate()
  const [campaigns, setCampaigns]   = useState<ApiCampaign[]>([])
  const [loading, setLoading]       = useState(true)
  const [creating, setCreating]     = useState(false)
  const [newName, setNewName]       = useState("")
  const [showForm, setShowForm]     = useState(false)
  const [systems, setSystems]       = useState<ApiGameSystem[]>([])
  const [systemId, setSystemId]     = useState("generic")
  const [masterCode, setMasterCode] = useState<string | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)

  // Busca por código de mestre
  const [codeInput, setCodeInput]       = useState("")
  const [masterResult, setMasterResult] = useState<ApiMasterProfile | null>(null)
  const [codeError, setCodeError]       = useState<string | null>(null)
  const [searching, setSearching]       = useState(false)
  const [joinSent, setJoinSent]         = useState<Record<string, string>>({}) // campaignId → status

  // Solicitações pendentes (só para mestres)
  const [pendingRequests, setPendingRequests] = useState<ApiJoinRequest[]>([])
  const [reviewing, setReviewing]             = useState<string | null>(null)

  useEffect(() => {
    campaignsApi.list().then(setCampaigns).finally(() => setLoading(false))
    systemsApi.list().then(({ systems: s }) => setSystems(s.filter(x => x.isPurchased))).catch(() => {})
    authApi.me().then(u => {
      if (u.masterCode) setMasterCode(u.masterCode)
    }).catch(() => {})
    mastersApi.listRequests().then(setPendingRequests).catch(() => {})
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const c = await campaignsApi.create({ name: newName.trim(), systemId })
      setCampaigns(prev => [c, ...prev])
      setNewName(""); setShowForm(false)
    } finally { setCreating(false) }
  }

  const handleCopyCode = async () => {
    if (!masterCode) return
    await navigator.clipboard.writeText(masterCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = codeInput.trim().toUpperCase()
    if (!code) return
    setSearching(true); setCodeError(null); setMasterResult(null)
    try {
      const result = await mastersApi.findByCode(code)
      setMasterResult(result)
    } catch {
      setCodeError("Código não encontrado. Verifique e tente novamente.")
    } finally { setSearching(false) }
  }

  const handleRequestJoin = async (campaignId: string) => {
    if (!masterResult) return
    setJoinSent(prev => ({ ...prev, [campaignId]: "sending" }))
    try {
      await mastersApi.requestJoin(masterResult.masterCode, campaignId)
      setJoinSent(prev => ({ ...prev, [campaignId]: "sent" }))
    } catch (err: unknown) {
      const e = err as { data?: { error?: string; status?: string } }
      const status = e.data?.error === "ALREADY_MEMBER" ? "member"
        : e.data?.error === "REQUEST_EXISTS" ? (e.data.status ?? "sent")
        : "error"
      setJoinSent(prev => ({ ...prev, [campaignId]: status }))
    }
  }

  const handleReview = async (reqId: string, action: "approve" | "reject") => {
    setReviewing(reqId)
    try {
      await mastersApi.reviewRequest(reqId, action)
      setPendingRequests(prev => prev.filter(r => r.id !== reqId))
      if (action === "approve") {
        setCampaigns(prev => prev.map(c =>
          c.id === pendingRequests.find(r => r.id === reqId)?.campaignId
            ? { ...c, _count: { ...c._count, characters: c._count.characters + 1 } }
            : c
        ))
      }
    } finally { setReviewing(null) }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-100 tracking-tight">RPG 3D</span>
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          {/* Código do mestre */}
          {masterCode && (
            <button onClick={handleCopyCode}
              className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-200 transition-colors"
              title="Copiar seu código de mestre">
              <span className="font-mono text-[11px] tracking-widest text-neutral-300">{masterCode}</span>
              <span className="text-neutral-600">{codeCopied ? "✓" : "⧉"}</span>
            </button>
          )}
          <span>{name}</span>
          <button onClick={() => navigate("/systems")} className="hover:text-neutral-300 transition-colors">
            Loja de sistemas
          </button>
          <a href={EDITOR_URL} target="_blank" rel="noreferrer"
            className="hover:text-neutral-300 transition-colors">Editor →</a>
          <button onClick={onLogout} className="hover:text-neutral-300">Sair</button>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl p-6 space-y-6">
        {/* Create campaign */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-neutral-200">Minhas campanhas</h2>
          <button onClick={() => setShowForm(s => !s)}
            className="text-xs bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 border border-purple-700/50 px-3 py-1.5 rounded-lg transition-colors">
            + Nova campanha
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-neutral-200">Nova campanha</h3>
              <button type="button" onClick={() => { setShowForm(false); setNewName("") }}
                className="text-neutral-600 hover:text-neutral-400 text-xs transition-colors">✕</button>
            </div>

            <div className="space-y-1">
              <label className="t-label block">Nome</label>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Nome da campanha..." required autoFocus
                className="w-full bg-neutral-800 text-neutral-200 text-xs rounded-md px-2.5 py-1.5 border border-neutral-700/50 outline-none focus:border-neutral-500 placeholder-neutral-600"
              />
            </div>

            <div className="space-y-1">
              <label className="t-label block">Sistema de jogo</label>
              <select value={systemId} onChange={e => setSystemId(e.target.value)}
                className="w-full bg-neutral-800 text-neutral-200 text-xs rounded-md px-2.5 py-1.5 border border-neutral-700/50 outline-none focus:border-neutral-500">
                {systems.length === 0
                  ? <option value="generic">Sistema Genérico · Gratuito</option>
                  : systems.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.price === 0 ? " · Gratuito" : ""}
                    </option>
                  ))}
              </select>
              <p className="text-[10px] text-neutral-600 mt-1">
                Quer outro sistema?{" "}
                <button type="button" onClick={() => navigate("/systems")}
                  className="text-purple-400 hover:text-purple-300 transition-colors">
                  Ver loja →
                </button>
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={creating}
                className="bg-purple-700 hover:bg-purple-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                {creating ? "Criando..." : "Criar campanha"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setNewName("") }}
                className="text-neutral-500 hover:text-neutral-300 text-xs px-3 py-2 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {loading && <p className="text-neutral-600 text-sm text-center py-8">Carregando...</p>}

        <div className="space-y-3">
          {campaigns.map(c => (
            <CampaignCard key={c.id} campaign={c}
              onOpen={() => navigate(`/campaign/${c.id}`)}
              onEnterGame={() => window.open(`${GAME_URL}`, "_blank")}
            />
          ))}
          {!loading && campaigns.length === 0 && (
            <p className="text-neutral-600 text-sm text-center py-12">
              Nenhuma campanha. Crie uma ou use o código de um mestre para solicitar entrada.
            </p>
          )}
        </div>

        {/* Solicitações pendentes — visível para mestres */}
        {pendingRequests.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                Solicitações de entrada
              </h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-700/40 font-medium">
                {pendingRequests.length}
              </span>
            </div>
            <div className="space-y-2">
              {pendingRequests.map(req => (
                <div key={req.id}
                  className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 hover:border-neutral-700/60 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-200 truncate">{req.player.name}</p>
                    <p className="t-meta mt-0.5">{req.campaign.name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={reviewing === req.id}
                      onClick={() => handleReview(req.id, "approve")}
                      className="text-xs text-green-400 hover:text-green-300 border border-green-900/40 hover:border-green-700/60 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50">
                      Aprovar
                    </button>
                    <button
                      disabled={reviewing === req.id}
                      onClick={() => handleReview(req.id, "reject")}
                      className="text-xs text-red-500 hover:text-red-400 border border-red-900/30 hover:border-red-700/50 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50">
                      Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Encontrar mestre por código */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
            Entrar em campanha
          </h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={codeInput}
              onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeError(null); setMasterResult(null) }}
              placeholder="Código do mestre (ex: XK7M2P)"
              maxLength={6}
              className="flex-1 bg-neutral-800 text-neutral-200 text-xs rounded-md px-2.5 py-1.5 border border-neutral-700/50 outline-none focus:border-neutral-500 placeholder-neutral-600 font-mono tracking-widest uppercase"
            />
            <button type="submit" disabled={searching || codeInput.length < 6}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium px-4 py-1.5 rounded-md border border-neutral-700/50 transition-colors disabled:opacity-50 shrink-0">
              {searching ? "..." : "Buscar"}
            </button>
          </form>
          {codeError && <p className="text-red-400 text-xs">{codeError}</p>}

          {masterResult && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                <span className="text-sm font-medium text-purple-300">{masterResult.name}</span>
                <span className="t-meta ml-auto font-mono">{masterResult.masterCode}</span>
              </div>
              {masterResult.ownedCampaigns.length === 0 ? (
                <p className="text-neutral-600 text-xs px-4 py-3">Nenhuma campanha disponível.</p>
              ) : (
                <div className="divide-y divide-neutral-800">
                  {masterResult.ownedCampaigns.map(camp => {
                    const status = joinSent[camp.id]
                    return (
                      <div key={camp.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-neutral-200">{camp.name}</p>
                          <p className="t-meta mt-0.5">{camp._count.characters} jogadores · {camp.systemId}</p>
                        </div>
                        {status === "sent" || status === "pending" ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium bg-amber-950/60 text-amber-400 border-amber-700/40">
                            Aguardando aprovação
                          </span>
                        ) : status === "approved" || status === "member" ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium bg-green-950/60 text-green-400 border-green-700/40">
                            Já participante
                          </span>
                        ) : status === "error" ? (
                          <span className="text-[10px] text-red-400">Erro</span>
                        ) : (
                          <button
                            onClick={() => handleRequestJoin(camp.id)}
                            className="text-xs bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 border border-purple-700/50 px-3 py-1 rounded-lg transition-colors">
                            Solicitar entrada
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function CampaignCard({ campaign: c, onOpen, onEnterGame }: {
  campaign: ApiCampaign; onOpen: () => void; onEnterGame: () => void
}) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copying, setCopying]     = useState(false)

  const handleCopyInvite = async () => {
    setCopying(true)
    try {
      const { url } = await campaignsApi.createInvite(c.id)
      await navigator.clipboard.writeText(url)
      setInviteUrl(url)
    } finally { setCopying(false) }
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700/80 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-medium text-neutral-200 truncate">{c.name}</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={clsx(
              "text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0",
              c.isMaster
                ? "bg-[rgb(88_28_135/0.6)] text-purple-300 border-[rgb(126_34_206/0.4)]"
                : "bg-neutral-800 text-neutral-500 border-neutral-700/50"
            )}>
              {c.isMaster ? "Mestre" : "Jogador"}
            </span>
            {!c.isMaster && c.myCharacter?.name && (
              <span className="t-meta truncate">{c.myCharacter.name}</span>
            )}
            <span className="t-meta">{c._count.characters} jogadores · {c._count.scenes} cenários</span>
          </div>
          {inviteUrl && (
            <p className="text-xs text-green-400 mt-1 truncate">Link copiado: {inviteUrl}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {c.isMaster && (
            <button onClick={handleCopyInvite} disabled={copying}
              className="text-xs text-neutral-400 hover:text-neutral-200 border border-neutral-700/50 hover:border-neutral-600 px-2.5 py-1 rounded-lg transition-colors">
              {copying ? "..." : "Convidar"}
            </button>
          )}
          <button onClick={onOpen}
            className="text-xs text-neutral-300 hover:text-white border border-neutral-700/50 hover:border-neutral-500 px-2.5 py-1 rounded-lg transition-colors">
            Gerenciar
          </button>
          <button onClick={onEnterGame}
            className="text-xs bg-purple-900/60 hover:bg-purple-800/60 text-purple-300 border border-purple-700/40 px-2.5 py-1 rounded-lg transition-colors">
            Jogar ↗
          </button>
        </div>
      </div>
    </div>
  )
}

function Input({ label, type = "text", value, onChange, required }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; required?: boolean
}) {
  return (
    <div className="space-y-1">
      <label className="t-label block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full bg-neutral-800 text-neutral-200 text-xs rounded-md px-2.5 py-1.5 border border-neutral-700/50 outline-none focus:border-neutral-500 placeholder-neutral-600"
      />
    </div>
  )
}
