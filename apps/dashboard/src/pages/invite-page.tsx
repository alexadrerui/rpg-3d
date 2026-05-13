import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { invites, setApiToken, auth as authApi, type ApiCampaign, type ApiCharacter } from "../lib/api-client"
import { useAuthStore } from "../store/auth-store"
import { clsx } from "clsx"

export function InvitePage() {
  const { token }    = useParams<{ token: string }>()
  const { token: authToken, setAuth, clear } = useAuthStore()
  const navigate     = useNavigate()
  const [authed, setAuthed]     = useState(!!authToken)
  const [accepting, setAccepting] = useState(false)
  const [result, setResult]     = useState<{ campaign: ApiCampaign; character: ApiCharacter; alreadyJoined: boolean } | null>(null)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => { if (authToken) setApiToken(authToken) }, [])

  const handleAccept = async () => {
    if (!token) return
    setAccepting(true); setError(null)
    try {
      const data = await invites.accept(token)
      setResult(data)
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } }
      setError(e.data?.error === "INVITE_EXPIRED" ? "Este convite expirou"
        : e.data?.error === "INVITE_USED" ? "Este convite já foi usado"
        : "Convite inválido")
    } finally { setAccepting(false) }
  }

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <p className="text-neutral-300 text-sm">Faça login para aceitar o convite</p>
        <QuickLogin onSuccess={(t, u) => {
          setAuth({ token: t, userId: u.id, name: u.name, email: u.email })
          setAuthed(true)
        }} />
      </div>
    </div>
  )

  if (result) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="text-4xl">🎲</div>
        <h2 className="text-xl font-semibold text-neutral-100">
          {result.alreadyJoined ? "Você já está nesta campanha!" : "Bem-vindo(a)!"}
        </h2>
        <p className="text-neutral-400 text-sm">
          Campanha: <strong className="text-neutral-200">{result.campaign.name}</strong>
        </p>
        <p className="text-neutral-400 text-sm">
          Personagem: <strong className="text-neutral-200">{result.character.name}</strong>
        </p>
        <div className="flex gap-3 pt-2">
          <button onClick={() => navigate(`/campaign/${result.campaign.id}/character`)}
            className="flex-1 bg-purple-700 hover:bg-purple-600 text-white text-sm py-2.5 rounded-lg transition-colors">
            Preencher ficha
          </button>
          <button onClick={() => navigate("/")}
            className="flex-1 border border-neutral-700 text-neutral-300 hover:text-white text-sm py-2.5 rounded-lg transition-colors">
            Ir para dashboard
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="text-4xl">📜</div>
        <div>
          <h2 className="text-xl font-semibold text-neutral-100">Convite de campanha</h2>
          <p className="text-neutral-400 text-sm mt-2">Você foi convidado para participar de uma campanha de RPG</p>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button onClick={handleAccept} disabled={accepting}
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

function QuickLogin({ onSuccess }: { onSuccess: (token: string, user: { id: string; name: string; email: string }) => void }) {
  const [email, setEmail]   = useState("")
  const [password, setPass] = useState("")
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const { token, user } = await authApi.login(email, password)
      setApiToken(token); onSuccess(token, user)
    } catch { setError("Credenciais inválidas") }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={handle} className="space-y-3 text-left">
      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder="E-mail" required
        className="w-full bg-neutral-900 text-neutral-200 text-sm rounded-lg px-3 py-2 border border-neutral-700/50 outline-none focus:border-neutral-500 placeholder-neutral-700"
      />
      <input type="password" value={password} onChange={e => setPass(e.target.value)}
        placeholder="Senha" required
        className="w-full bg-neutral-900 text-neutral-200 text-sm rounded-lg px-3 py-2 border border-neutral-700/50 outline-none focus:border-neutral-500 placeholder-neutral-700"
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full bg-purple-700 hover:bg-purple-600 text-white text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50">
        {loading ? "..." : "Entrar"}
      </button>
    </form>
  )
}
