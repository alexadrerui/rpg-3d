import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { auth as authApi, campaigns as campaignsApi, characters as charsApi, setApiToken, type ApiCampaign } from "../lib/api-client"
import { useAuthStore } from "../store/auth-store"
import { clsx } from "clsx"

// ─────────────────────────────────────────────────────────────────────────────
// LobbyPage — login + seleção de campanha antes de entrar na sessão
// ─────────────────────────────────────────────────────────────────────────────

export function LobbyPage() {
  const { setAuth, token } = useAuthStore()
  const navigate = useNavigate()
  const [step, setStep] = useState<"login" | "campaigns">(token ? "campaigns" : "login")

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-neutral-100 tracking-tight">RPG 3D</h1>
          <p className="text-neutral-500 text-sm mt-1">Mesa de RPG em tempo real</p>
        </div>

        {step === "login" ? (
          <LoginForm
            onSuccess={(token, user) => {
              setApiToken(token)
              setAuth({ token, userId: user.id, name: user.name, campaignId: "" })
              setStep("campaigns")
            }}
          />
        ) : (
          <CampaignSelector
            onEnter={(campaignId, sessionId, sessionToken, isMaster, characterId, avatarType, avatarUrl) => {
              setAuth({
                token:       sessionToken,
                userId:      useAuthStore.getState().userId,
                name:        useAuthStore.getState().name,
                campaignId,
                characterId,
                isMaster,
                avatarType,
                avatarUrl,
              })
              navigate(`/session/${sessionId}`, { state: { campaignId } })
            }}
            onLogout={() => {
              setApiToken(null)
              setStep("login")
            }}
          />
        )}
      </div>
    </div>
  )
}

// ── Login form ────────────────────────────────────────────────────────────────

function LoginForm({ onSuccess }: { onSuccess: (token: string, user: { id: string; name: string; email: string }) => void }) {
  const [mode, setMode]     = useState<"login" | "register">("login")
  const [email, setEmail]   = useState("")
  const [name, setName]     = useState("")
  const [password, setPass] = useState("")
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const { token, user } = mode === "login"
        ? await authApi.login(email, password)
        : await authApi.register(email, name, password)
      onSuccess(token, user)
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } }
      setError(e.data?.error === "INVALID_CREDENTIALS" ? "E-mail ou senha inválidos"
        : e.data?.error === "EMAIL_TAKEN" ? "Este e-mail já está em uso"
        : "Erro ao conectar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex rounded-lg border border-neutral-700/50 overflow-hidden mb-6">
        {(["login", "register"] as const).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={clsx("flex-1 py-2 text-sm transition-colors",
              mode === m ? "bg-neutral-800 text-neutral-100" : "text-neutral-500 hover:text-neutral-300")}>
            {m === "login" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>

      {mode === "register" && (
        <Field label="Nome">
          <Input value={name} onChange={setName} placeholder="Seu nome" required />
        </Field>
      )}
      <Field label="E-mail">
        <Input type="email" value={email} onChange={setEmail} placeholder="voce@email.com" required />
      </Field>
      <Field label="Senha">
        <Input type="password" value={password} onChange={setPass} placeholder="••••••••" required />
      </Field>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
        {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
      </button>
    </form>
  )
}

// ── Campaign selector ──────────────────────────────────────────────────────────

function CampaignSelector({ onEnter, onLogout }: {
  onEnter:  (campaignId: string, sessionId: string, sessionToken: string, isMaster: boolean, characterId?: string, avatarType?: "none" | "image" | "model", avatarUrl?: string) => void
  onLogout: () => void
}) {
  const [campaigns, setCampaigns] = useState<ApiCampaign[]>([])
  const [loading, setLoading]     = useState(true)
  const [joining, setJoining]     = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const { name } = useAuthStore()

  useState(() => {
    campaignsApi.list()
      .then(setCampaigns)
      .catch(() => setError("Não foi possível carregar as campanhas"))
      .finally(() => setLoading(false))
  })

  const handleEnter = async (campaignId: string) => {
    setJoining(campaignId); setError(null)
    try {
      const { sessionToken, sessionId, isMaster, characterId } =
        await campaignsApi.getSessionToken(campaignId)

      // Fetch avatar from character sheet
      let avatarType: "none" | "image" | "model" | undefined
      let avatarUrl: string | undefined
      if (characterId) {
        try {
          const chars = await charsApi.list(campaignId)
          const char  = chars.find(c => c.id === characterId)
          const sheet = char?.sheetData as Record<string, unknown> | undefined
          const av    = sheet?.avatar as { type?: string; url?: string } | undefined
          if (av?.type === "image" || av?.type === "model") {
            avatarType = av.type
            avatarUrl  = av.url
          } else {
            avatarType = "none"
          }
        } catch { /* silently skip — avatar optional */ }
      }

      onEnter(campaignId, sessionId, sessionToken, isMaster, characterId, avatarType, avatarUrl)
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } }
      setError(e.data?.error === "CHARACTER_NOT_APPROVED"
        ? "Seu personagem ainda não foi aprovado pelo mestre"
        : "Erro ao entrar na campanha")
    } finally {
      setJoining(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-neutral-400 text-sm">Olá, <span className="text-neutral-200">{name}</span></p>
        <button onClick={onLogout} className="text-xs text-neutral-600 hover:text-neutral-400">Sair</button>
      </div>

      <p className="text-neutral-500 text-xs">Escolha uma campanha para entrar:</p>

      {loading && <p className="text-neutral-600 text-sm text-center py-4">Carregando...</p>}
      {error   && <p className="text-red-400 text-xs">{error}</p>}

      {!loading && campaigns.length === 0 && (
        <div className="text-center py-8">
          <p className="text-neutral-600 text-sm">Nenhuma campanha disponível</p>
          <p className="text-neutral-700 text-xs mt-1">Use o link de convite para entrar em uma campanha</p>
        </div>
      )}

      <div className="space-y-2">
        {campaigns.map(c => (
          <button key={c.id} onClick={() => handleEnter(c.id)}
            disabled={!!joining}
            className="w-full text-left bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/50 hover:border-neutral-600/50 rounded-xl p-4 transition-all disabled:opacity-50">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-200 truncate">{c.name}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {c.isMaster ? "Mestre" : `Jogador · ${c.myCharacter?.name ?? "sem personagem"}`}
                  {" · "}{c._count.characters} jogadores
                </p>
              </div>
              <span className={clsx("shrink-0 text-xs px-2 py-0.5 rounded-full",
                c.isMaster
                  ? "bg-purple-950/60 text-purple-400"
                  : c.myCharacter?.approved
                  ? "bg-green-950/60 text-green-400"
                  : "bg-amber-950/60 text-amber-400")}>
                {c.isMaster ? "Mestre" : c.myCharacter?.approved ? "Aprovado" : "Pendente"}
              </span>
            </div>
            {joining === c.id && (
              <p className="text-xs text-neutral-500 mt-2">Entrando...</p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Helpers de formulário ─────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-neutral-500">{label}</label>
      {children}
    </div>
  )
}
function Input({ type = "text", value, onChange, placeholder, required }: {
  type?: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} required={required}
      className="w-full bg-neutral-900 text-neutral-200 text-sm rounded-lg px-3 py-2 border border-neutral-700/50 outline-none focus:border-neutral-500 placeholder-neutral-700"
    />
  )
}
