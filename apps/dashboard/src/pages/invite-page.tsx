import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { invites, setApiToken, setRefreshToken, auth as authApi, type ApiCampaign, type ApiCharacter } from "../lib/api-client"
import { useAuthStore } from "../store/auth-store"
import { clsx } from "clsx"

type User = { id: string; name: string; email: string }
type AcceptResult = { campaign: ApiCampaign; character: ApiCharacter; alreadyJoined: boolean }

export function InvitePage() {
  const { token }    = useParams<{ token: string }>()
  const { token: authToken, setAuth } = useAuthStore()
  const navigate     = useNavigate()
  const [authed, setAuthed]       = useState(!!authToken)
  const [accepting, setAccepting] = useState(false)
  const [result, setResult]       = useState<AcceptResult | null>(null)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => { if (authToken) setApiToken(authToken) }, [])

  const doAccept = async () => {
    if (!token) return
    setAccepting(true); setError(null)
    try {
      const data = await invites.accept(token)
      setResult(data)
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } }
      setError(
        e.data?.error === "INVITE_EXPIRED" ? "Este convite expirou" :
        e.data?.error === "INVITE_USED"    ? "Este convite já foi usado" :
        "Convite inválido"
      )
    } finally {
      setAccepting(false)
    }
  }

  // After auth (login or register): auto-accept immediately
  const handleAuthSuccess = async (t: string, u: User) => {
    setAuth({ token: t, userId: u.id, name: u.name, email: u.email })
    setAccepting(true); setError(null)
    try {
      const data = await invites.accept(token!)
      setResult(data)
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } }
      setError(
        e.data?.error === "INVITE_EXPIRED" ? "Este convite expirou" :
        e.data?.error === "INVITE_USED"    ? "Este convite já foi usado" :
        "Convite inválido"
      )
      setAuthed(true) // fallback: show manual accept button with error
    } finally {
      setAccepting(false)
    }
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (result) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="text-4xl">🎲</div>
        <h2 className="text-xl font-semibold text-neutral-100">
          {result.alreadyJoined ? "Você já está nesta campanha!" : "Bem-vindo(a)!"}
        </h2>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="t-label">Campanha</span>
            <span className="text-sm text-neutral-200">{result.campaign.name}</span>
          </div>
          <div className="h-px bg-neutral-800" />
          <div className="flex items-center justify-between">
            <span className="t-label">Personagem</span>
            <span className="text-sm text-neutral-200">{result.character.name}</span>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={() => navigate(`/campaign/${result.campaign.id}/character`)}
            className="flex-1 bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            Preencher ficha
          </button>
          <button onClick={() => navigate("/")}
            className="flex-1 border border-neutral-700/50 text-neutral-300 hover:text-white hover:border-neutral-500 text-sm py-2.5 rounded-lg transition-colors">
            Dashboard
          </button>
        </div>
      </div>
    </div>
  )

  // ── Não autenticado: auth form + auto-accept ─────────────────────────────────
  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-3xl mb-3">📜</div>
          <h1 className="text-3xl font-semibold text-neutral-100 tracking-tight">
            RPG <span className="text-purple-300">3D</span>
          </h1>
          <p className="text-neutral-500 text-sm mt-1">Você recebeu um convite de campanha</p>
        </div>

        {accepting ? (
          <div className="text-center py-6">
            <p className="text-neutral-400 text-sm">Aceitando convite...</p>
          </div>
        ) : (
          <QuickAuth onSuccess={handleAuthSuccess} />
        )}

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
      </div>
    </div>
  )

  // ── Autenticado mas ainda não aceitou ────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="text-4xl">📜</div>
        <div>
          <h2 className="text-xl font-semibold text-neutral-100">Convite de campanha</h2>
          <p className="text-neutral-500 text-sm mt-2">Você foi convidado para participar de uma campanha de RPG</p>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button onClick={doAccept} disabled={accepting}
          className="w-full bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium py-3 rounded-xl transition-colors disabled:opacity-50">
          {accepting ? "Aceitando..." : "Aceitar convite"}
        </button>
        <button onClick={() => navigate("/")} className="text-xs text-neutral-600 hover:text-neutral-400">
          Ir para o dashboard
        </button>
      </div>
    </div>
  )
}

// ── QuickAuth: Entrar / Criar conta ───────────────────────────────────────────
function QuickAuth({ onSuccess }: { onSuccess: (token: string, user: User) => void }) {
  const [mode, setMode]     = useState<"login" | "register">("login")
  const [email, setEmail]   = useState("")
  const [name, setName]     = useState("")
  const [password, setPass] = useState("")
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const { token, refreshToken, user } = mode === "login"
        ? await authApi.login(email, password)
        : await authApi.register(email, name, password, "player")
      setApiToken(token)
      setRefreshToken(refreshToken)
      onSuccess(token, user)
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } }
      setError(
        e.data?.error === "INVALID_CREDENTIALS" ? "E-mail ou senha inválidos" :
        e.data?.error === "EMAIL_TAKEN"          ? "Este e-mail já está em uso" :
        "Erro ao conectar com o servidor"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex rounded-lg border border-neutral-700/50 overflow-hidden">
        {(["login", "register"] as const).map(m => (
          <button key={m} type="button" onClick={() => { setMode(m); setError(null) }}
            className={clsx("flex-1 py-2 text-sm transition-colors",
              mode === m ? "bg-neutral-800 text-neutral-100" : "text-neutral-500 hover:text-neutral-300")}>
            {m === "login" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>

      {mode === "register" && (
        <div className="space-y-1">
          <label className="t-label block">Nome</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Seu nome" required
            className="w-full bg-neutral-800 text-neutral-200 text-xs rounded-md px-2.5 py-1.5 border border-neutral-700/50 outline-none focus:border-neutral-500 placeholder-neutral-600"
          />
        </div>
      )}

      <div className="space-y-1">
        <label className="t-label block">E-mail</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="voce@email.com" required
          className="w-full bg-neutral-800 text-neutral-200 text-xs rounded-md px-2.5 py-1.5 border border-neutral-700/50 outline-none focus:border-neutral-500 placeholder-neutral-600"
        />
      </div>

      <div className="space-y-1">
        <label className="t-label block">Senha</label>
        <input type="password" value={password} onChange={e => setPass(e.target.value)}
          placeholder="••••••••" required
          className="w-full bg-neutral-800 text-neutral-200 text-xs rounded-md px-2.5 py-1.5 border border-neutral-700/50 outline-none focus:border-neutral-500 placeholder-neutral-600"
        />
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
        {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
      </button>
    </form>
  )
}
