import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  gameSystems as api,
  setApiToken,
  type ApiGameSystem,
  type ManifestField,
  type SystemManifest,
  type SubmitSystemData,
} from "../lib/api-client"
import { useAuthStore } from "../store/auth-store"
import { clsx } from "clsx"

// ─────────────────────────────────────────────────────────────────────────────
// SystemStorePage
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "store" | "mine" | "submit"

export function SystemStorePage() {
  const { token } = useAuthStore()
  const navigate  = useNavigate()
  const [tab, setTab]         = useState<Tab>("store")
  const [systems, setSystems] = useState<ApiGameSystem[]>([])
  const [mine,    setMine]    = useState<ApiGameSystem[]>([])
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(true)
  const [buying,  setBuying]  = useState<string | null>(null)
  const [error,   setError]   = useState<string | null>(null)
  const [tag,     setTag]     = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!token) { navigate("/"); return }
    setApiToken(token)
  }, [token, navigate])

  useEffect(() => {
    if (!token) return
    setLoading(true)
    Promise.all([
      api.list(tag),
      api.mine(),
    ]).then(([storeRes, mineRes]) => {
      setSystems(storeRes.systems)
      setCredits(storeRes.credits)
      setMine(mineRes)
    }).finally(() => setLoading(false))
  }, [tag, token])

  const allTags = [...new Set(systems.flatMap(s => s.tags))].sort()

  const handlePurchase = async (system: ApiGameSystem) => {
    setBuying(system.id); setError(null)
    try {
      const { credits: newCredits } = await api.purchase(system.id)
      setCredits(newCredits)
      setSystems(prev => prev.map(s => s.id === system.id ? { ...s, isPurchased: true } : s))
    } catch (err: unknown) {
      const e = err as { data?: { error?: string; needed?: number } }
      if (e.data?.error === "INSUFFICIENT_CREDITS") {
        setError(`Créditos insuficientes. Você tem ${credits}, precisa de ${e.data.needed ?? system.price}.`)
      } else if (e.data?.error === "ALREADY_OWNED") {
        setSystems(prev => prev.map(s => s.id === system.id ? { ...s, isPurchased: true } : s))
      } else {
        setError("Erro ao adquirir o sistema. Tente novamente.")
      }
    } finally { setBuying(null) }
  }

  const handleSubmitted = (system: ApiGameSystem) => {
    setMine(prev => [system, ...prev.filter(s => s.id !== system.id)])
    setTab("mine")
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
          <h1 className="text-sm font-medium text-neutral-300">Sistemas de Jogo</h1>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-500">Saldo:</span>
          <span className="text-amber-400 font-medium tabular-nums">{credits.toLocaleString()} créditos</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-neutral-800 px-6 flex gap-0">
        {([
          { id: "store",  label: "Loja" },
          { id: "mine",   label: `Meus sistemas${mine.length > 0 ? ` (${mine.length})` : ""}` },
          { id: "submit", label: "Publicar sistema" },
        ] as { id: Tab; label: string }[]).map(t => (
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

      <main className="container mx-auto max-w-3xl p-6 space-y-6">
        {error && (
          <div className="bg-red-950/40 border border-red-700/40 text-red-400 text-xs rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* ── Aba: Loja ── */}
        {tab === "store" && (
          <>
            {/* Filtro por tag */}
            {allTags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setTag(undefined)}
                  className={clsx(
                    "text-[10px] px-2.5 py-1 rounded-full border transition-colors",
                    !tag ? "bg-purple-800/60 border-purple-600/50 text-purple-200" : "border-neutral-700 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300",
                  )}
                >
                  Todos
                </button>
                {allTags.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t === tag ? undefined : t)}
                    className={clsx(
                      "text-[10px] px-2.5 py-1 rounded-full border transition-colors",
                      tag === t ? "bg-purple-800/60 border-purple-600/50 text-purple-200" : "border-neutral-700 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <p className="text-neutral-600 text-sm text-center py-12">Carregando...</p>
            ) : systems.length === 0 ? (
              <p className="text-neutral-600 text-sm text-center py-12">Nenhum sistema encontrado.</p>
            ) : (
              <div className="grid gap-4">
                {systems.map(s => (
                  <SystemCard key={s.id} system={s} buying={buying === s.id} onPurchase={() => handlePurchase(s)} />
                ))}
              </div>
            )}

            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-xs text-neutral-500 space-y-1">
              <p className="font-medium text-neutral-400">Sobre os créditos</p>
              <p>Novos usuários recebem 1.000 créditos gratuitos. Sistemas gratuitos não têm custo.</p>
            </div>
          </>
        )}

        {/* ── Aba: Meus sistemas ── */}
        {tab === "mine" && (
          <>
            <div>
              <h2 className="text-sm font-medium text-neutral-200">Sistemas publicados por você</h2>
              <p className="text-xs text-neutral-500 mt-1">Sistemas enviados para revisão. Ficam pendentes até aprovação da plataforma.</p>
            </div>
            {mine.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <p className="text-neutral-600 text-sm">Você ainda não publicou nenhum sistema.</p>
                <button
                  type="button"
                  onClick={() => setTab("submit")}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Publicar meu primeiro sistema →
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {mine.map(s => (
                  <MySystemCard key={s.id} system={s} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Aba: Publicar sistema ── */}
        {tab === "submit" && (
          <SubmitSystemForm onSubmitted={handleSubmitted} />
        )}
      </main>
    </div>
  )
}

// ── Card da loja ──────────────────────────────────────────────────────────────

function SystemCard({ system: s, buying, onPurchase }: {
  system: ApiGameSystem; buying: boolean; onPurchase: () => void
}) {
  return (
    <div className={clsx(
      "bg-neutral-900 border rounded-xl p-5 transition-colors",
      s.isPurchased ? "border-neutral-700/50" : "border-neutral-800 hover:border-neutral-700/80",
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-neutral-200">{s.name}</h3>
            {s.price === 0 && (
              <span className="text-[10px] bg-green-950/60 text-green-400 border border-green-700/40 px-1.5 py-0.5 rounded-full">Gratuito</span>
            )}
            <span className="text-[10px] text-neutral-600 border border-neutral-800 px-1.5 py-0.5 rounded-full">v{s.version}</span>
            {s.authorName && (
              <span className="text-[10px] text-neutral-500">por {s.authorName}</span>
            )}
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">{s.description}</p>
          {s.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {s.tags.map(tag => (
                <span key={tag} className="text-[10px] bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </div>
        <div className="shrink-0">
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

// ── Card dos meus sistemas ────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  PENDING:  { label: "Em revisão",  class: "text-amber-400 border-amber-700/40 bg-amber-950/40" },
  ACTIVE:   { label: "Publicado",   class: "text-green-400 border-green-700/40 bg-green-950/40" },
  REJECTED: { label: "Rejeitado",   class: "text-red-400 border-red-700/40 bg-red-950/40" },
}

function MySystemCard({ system: s }: { system: ApiGameSystem }) {
  const badge = STATUS_LABELS[s.status] ?? STATUS_LABELS.PENDING
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-medium text-neutral-200 text-sm">{s.name}</h3>
          <span className="text-[10px] text-neutral-600 font-mono border border-neutral-800 px-1.5 py-0.5 rounded">#{s.id}</span>
        </div>
        <span className={clsx("text-[10px] border px-2 py-0.5 rounded-full shrink-0", badge.class)}>
          {badge.label}
        </span>
      </div>
      <p className="text-xs text-neutral-500 leading-relaxed">{s.description}</p>
      {s.status === "REJECTED" && (
        <p className="text-xs text-red-400/80 bg-red-950/20 border border-red-900/30 rounded px-3 py-2">
          Seu sistema foi rejeitado. Revise o manifest e reenvie pela aba "Publicar sistema".
        </p>
      )}
      {s.repositoryUrl && (
        <a href={s.repositoryUrl} target="_blank" rel="noreferrer" className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors">
          Repositório →
        </a>
      )}
    </div>
  )
}

// ── Formulário de publicação ──────────────────────────────────────────────────

function SubmitSystemForm({ onSubmitted }: { onSubmitted: (s: ApiGameSystem) => void }) {
  const [form, setForm] = useState({
    id: "", name: "", description: "", price: 0, version: "1.0.0",
    tags: "", thumbnail: "", repositoryUrl: "",
  })
  const [fields,  setFields]  = useState<ManifestField[]>([defaultField()])
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const set = (k: keyof typeof form, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const addField    = () => setFields(f => [...f, defaultField()])
  const removeField = (i: number) => setFields(f => f.filter((_, j) => j !== i))
  const updateField = (i: number, patch: Partial<ManifestField>) =>
    setFields(f => f.map((field, j) => j === i ? { ...field, ...patch } : field))

  const handleSubmit = async () => {
    setError(null); setSaving(true)
    try {
      const manifest: SystemManifest = {
        fields: fields.filter(f => f.id && f.label),
      }
      const data: SubmitSystemData = {
        id:            form.id,
        name:          form.name,
        description:   form.description,
        price:         Number(form.price),
        version:       form.version,
        tags:          form.tags.split(",").map(t => t.trim()).filter(Boolean),
        thumbnail:     form.thumbnail || undefined,
        repositoryUrl: form.repositoryUrl || undefined,
        manifest,
      }
      const result = await api.submit(data)
      setSuccess(true)
      onSubmitted(result)
    } catch (err: unknown) {
      const e = err as { data?: { error?: string; issues?: { message: string }[] } }
      if (e.data?.error === "ID_TAKEN") setError("Esse ID já está em uso. Escolha outro.")
      else if (e.data?.issues) setError(e.data.issues.map(i => i.message).join(", "))
      else setError("Erro ao publicar. Verifique os dados e tente novamente.")
    } finally { setSaving(false) }
  }

  if (success) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-green-400 font-medium">Sistema enviado para revisão!</p>
        <p className="text-xs text-neutral-500">Em breve você verá o status na aba "Meus sistemas".</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-medium text-neutral-200">Publicar sistema de jogo</h2>
        <p className="text-xs text-neutral-500 mt-1">
          Defina os metadados e os campos da ficha de personagem. Após envio, a equipe revisará antes de publicar.
        </p>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-700/40 text-red-400 text-xs rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Metadados */}
      <section className="space-y-3">
        <p className="text-[10px] text-neutral-500 uppercase tracking-wide font-medium">Informações</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ID único (slug)" hint="ex: meu-sistema-rpg">
            <input className={input} value={form.id} onChange={e => set("id", e.target.value)} placeholder="meu-sistema" />
          </Field>
          <Field label="Versão">
            <input className={input} value={form.version} onChange={e => set("version", e.target.value)} placeholder="1.0.0" />
          </Field>
        </div>
        <Field label="Nome do sistema">
          <input className={input} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Meu RPG System" />
        </Field>
        <Field label="Descrição" hint="10–500 caracteres">
          <textarea className={`${input} min-h-[72px] resize-y`} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Descreva o sistema e seu estilo de jogo..." />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Preço (créditos)" hint="0 = gratuito">
            <input className={input} type="number" min={0} value={form.price} onChange={e => set("price", e.target.value)} />
          </Field>
          <Field label="Tags" hint="separadas por vírgula">
            <input className={input} value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="fantasia, homebrew" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="URL da thumbnail" hint="opcional">
            <input className={input} value={form.thumbnail} onChange={e => set("thumbnail", e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="URL do repositório" hint="opcional">
            <input className={input} value={form.repositoryUrl} onChange={e => set("repositoryUrl", e.target.value)} placeholder="https://github.com/..." />
          </Field>
        </div>
      </section>

      {/* Campos da ficha */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-neutral-500 uppercase tracking-wide font-medium">Campos da ficha de personagem</p>
          <button type="button" onClick={addField} className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors">
            + Adicionar campo
          </button>
        </div>
        <p className="text-[10px] text-neutral-600">
          Defina os campos que aparecerão na ficha do personagem. Use "Grupo" para organizar em abas.
        </p>

        <div className="space-y-2">
          {fields.map((f, i) => (
            <FieldRow key={i} field={f} onChange={p => updateField(i, p)} onRemove={() => removeField(i)} canRemove={fields.length > 1} />
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
      >
        {saving ? "Enviando..." : "Enviar para revisão"}
      </button>
    </div>
  )
}

// ── Campo de formulário de publicação ─────────────────────────────────────────

function FieldRow({ field, onChange, onRemove, canRemove }: {
  field:    ManifestField
  onChange: (p: Partial<ManifestField>) => void
  onRemove: () => void
  canRemove: boolean
}) {
  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3 space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <Field label="ID do campo">
          <input className={inputSm} value={field.id} onChange={e => onChange({ id: e.target.value })} placeholder="hp" />
        </Field>
        <Field label="Label">
          <input className={inputSm} value={field.label} onChange={e => onChange({ label: e.target.value })} placeholder="Pontos de Vida" />
        </Field>
        <Field label="Tipo">
          <select className={inputSm} value={field.type} onChange={e => onChange({ type: e.target.value as ManifestField["type"] })}>
            <option value="text">Texto</option>
            <option value="number">Número</option>
            <option value="textarea">Texto longo</option>
            <option value="select">Seleção</option>
            <option value="boolean">Sim/Não</option>
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Grupo (aba)">
          <input className={inputSm} value={field.group ?? ""} onChange={e => onChange({ group: e.target.value || undefined })} placeholder="Combate" />
        </Field>
        {field.type === "number" && (
          <>
            <Field label="Mín">
              <input className={inputSm} type="number" value={field.min ?? ""} onChange={e => onChange({ min: e.target.value ? Number(e.target.value) : undefined })} />
            </Field>
            <Field label="Máx">
              <input className={inputSm} type="number" value={field.max ?? ""} onChange={e => onChange({ max: e.target.value ? Number(e.target.value) : undefined })} />
            </Field>
          </>
        )}
        {field.type === "select" && (
          <div className="col-span-2">
            <Field label="Opções (vírgula)">
              <input className={inputSm} value={field.options?.join(", ") ?? ""} onChange={e => onChange({ options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="Guerreiro, Mago, Ladino" />
            </Field>
          </div>
        )}
      </div>
      {canRemove && (
        <button type="button" onClick={onRemove} className="text-[10px] text-red-500/60 hover:text-red-400 transition-colors">
          Remover campo
        </button>
      )}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-neutral-500">
        {label}{hint && <span className="text-neutral-700 ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  )
}

const input   = "w-full bg-neutral-800 border border-neutral-700/50 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-600/60"
const inputSm = "w-full bg-neutral-800/80 border border-neutral-700/40 rounded px-2 py-1.5 text-[10px] text-neutral-200 focus:outline-none focus:border-purple-600/60"

function defaultField(): ManifestField {
  return { id: "", label: "", type: "text" }
}
