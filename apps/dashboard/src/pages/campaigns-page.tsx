import { useState, useEffect } from "react"
import { useNavigate }         from "react-router-dom"
import { campaigns as campaignsApi, gameSystems as systemsApi, setApiToken, auth as authApi, type ApiCampaign, type ApiGameSystem } from "../lib/api-client"
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
  const [mode, setMode]     = useState<"login" | "register">("login")
  const [email, setEmail]   = useState("")
  const [name, setName]     = useState("")
  const [password, setPass] = useState("")
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const { token, user } = mode === "login"
        ? await authApi.login(email, password)
        : await authApi.register(email, name, password)
      setApiToken(token)
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
        <h1 className="text-2xl font-semibold text-neutral-100 text-center">Dashboard RPG 3D</h1>
        <div className="flex rounded-lg border border-neutral-700/50 overflow-hidden">
          {(["login", "register"] as const).map(m => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={clsx("flex-1 py-2 text-sm transition-colors",
                mode === m ? "bg-neutral-800 text-neutral-100" : "text-neutral-500 hover:text-neutral-300")}>
              {m === "login" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && <Input label="Nome" value={name} onChange={setName} required />}
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
  const [campaigns, setCampaigns] = useState<ApiCampaign[]>([])
  const [loading, setLoading]     = useState(true)
  const [creating, setCreating]   = useState(false)
  const [newName, setNewName]     = useState("")
  const [showForm, setShowForm]   = useState(false)
  const [systems, setSystems]     = useState<ApiGameSystem[]>([])
  const [systemId, setSystemId]   = useState("generic")

  useEffect(() => {
    campaignsApi.list().then(setCampaigns).finally(() => setLoading(false))
    systemsApi.list().then(({ systems: s }) => {
      setSystems(s.filter(x => x.isPurchased))
    }).catch(() => {})
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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-sm font-medium text-neutral-300">RPG 3D — Dashboard</h1>
        <div className="flex items-center gap-4 text-xs text-neutral-500">
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
          <form onSubmit={handleCreate} className="space-y-3">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Nome da campanha..." required
              className="w-full bg-neutral-900 text-neutral-200 text-sm rounded-lg px-3 py-2 border border-neutral-700/50 outline-none focus:border-neutral-500 placeholder-neutral-700"
            />
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-neutral-500">Sistema de jogo</label>
                <select value={systemId} onChange={e => setSystemId(e.target.value)}
                  className="w-full bg-neutral-900 text-neutral-200 text-sm rounded-lg px-3 py-2 border border-neutral-700/50 outline-none focus:border-neutral-500">
                  {systems.length === 0
                    ? <option value="generic">Sistema Genérico (gratuito)</option>
                    : systems.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}{s.price === 0 ? " · Gratuito" : ""}
                      </option>
                    ))}
                </select>
              </div>
              <button type="submit" disabled={creating}
                className="bg-purple-700 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50 shrink-0">
                {creating ? "..." : "Criar"}
              </button>
            </div>
            <p className="text-xs text-neutral-600">
              Quer usar outro sistema?{" "}
              <button type="button" onClick={() => navigate("/systems")}
                className="text-purple-400 hover:text-purple-300 underline">
                Ver loja de sistemas
              </button>
            </p>
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
              Nenhuma campanha. Crie uma ou aceite um convite.
            </p>
          )}
        </div>
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
          <p className="text-xs text-neutral-500 mt-1">
            {c.isMaster ? "Mestre" : `Jogador · ${c.myCharacter?.name ?? "sem personagem"}`}
            {" · "}{c._count.characters} jogadores
            {" · "}{c._count.scenes} cenários
          </p>
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
      <label className="text-xs text-neutral-500">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full bg-neutral-900 text-neutral-200 text-sm rounded-lg px-3 py-2 border border-neutral-700/50 outline-none focus:border-neutral-500 placeholder-neutral-700"
      />
    </div>
  )
}
