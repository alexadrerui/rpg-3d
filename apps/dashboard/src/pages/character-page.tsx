import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { characters as charsApi, setApiToken, type ApiCharacter } from "../lib/api-client"
import { useAuthStore } from "../store/auth-store"
import { clsx } from "clsx"

// ─────────────────────────────────────────────────────────────────────────────
// CharacterPage — ficha de personagem por etapas (wizard de 4 passos)
// ─────────────────────────────────────────────────────────────────────────────

type Step = "basics" | "attributes" | "background" | "appearance"

const STEPS: { key: Step; label: string; icon: string }[] = [
  { key: "basics",     label: "Raça e classe",      icon: "⚔️" },
  { key: "attributes", label: "Atributos",           icon: "🎲" },
  { key: "background", label: "História",            icon: "📖" },
  { key: "appearance", label: "Aparência",           icon: "🎭" },
]

export function CharacterPage() {
  const { id: campaignId }     = useParams<{ id: string }>()
  const { token, setAuth }     = useAuthStore()
  const navigate               = useNavigate()
  const [character, setCharacter] = useState<ApiCharacter | null>(null)
  const [loading, setLoading]  = useState(true)
  const [step, setStep]        = useState<Step>("basics")
  const [saving, setSaving]    = useState(false)
  const [saved, setSaved]      = useState(false)

  useEffect(() => { if (token) setApiToken(token) }, [])

  useEffect(() => {
    if (!campaignId) return
    charsApi.list(campaignId)
      .then(list => {
        if (list.length > 0) setCharacter(list[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [campaignId])

  const handleSaveStep = async (data: Record<string, unknown>) => {
    if (!character) return
    setSaving(true); setSaved(false)
    try {
      const updated = await charsApi.updateSheet(character.id, data, data.name as string | undefined)
      setCharacter(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-neutral-500">Carregando...</p></div>

  if (!character) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-neutral-400">Nenhum personagem encontrado</p>
        <button onClick={() => navigate("/")} className="text-xs text-neutral-600 hover:text-neutral-400">← Dashboard</button>
      </div>
    </div>
  )

  const currentIdx = STEPS.findIndex(s => s.key === step)
  const sheet      = character.sheetData as Record<string, unknown>

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="text-xs text-neutral-500 hover:text-neutral-300">← Dashboard</button>
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-medium text-neutral-300">{character.name}</h1>
          {character.approved
            ? <span className="text-xs bg-green-950/60 text-green-400 border border-green-700/40 px-2 py-0.5 rounded-full">Aprovado</span>
            : <span className="text-xs bg-amber-950/60 text-amber-400 border border-amber-700/40 px-2 py-0.5 rounded-full">Aguardando aprovação</span>}
        </div>
        {saved && <span className="text-xs text-green-400">✓ Salvo</span>}
      </header>

      {/* Step tabs */}
      <div className="border-b border-neutral-800">
        <div className="container mx-auto max-w-2xl px-6 flex gap-1 pt-3">
          {STEPS.map((s, i) => (
            <button key={s.key} onClick={() => setStep(s.key)}
              className={clsx("flex items-center gap-1.5 px-3 py-2 text-xs rounded-t-lg border-b-2 transition-colors",
                step === s.key
                  ? "border-purple-500 text-purple-300 bg-purple-950/30"
                  : i < currentIdx
                  ? "border-green-700/50 text-green-500"
                  : "border-transparent text-neutral-500 hover:text-neutral-300")}>
              <span>{s.icon}</span>
              <span className="hidden sm:block">{s.label}</span>
              {i < currentIdx && <span className="text-green-500">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <main className="container mx-auto max-w-2xl px-6 py-8">
        {step === "basics"     && <BasicsStep     sheet={sheet} onSave={handleSaveStep} saving={saving} onNext={() => setStep("attributes")} />}
        {step === "attributes" && <AttributesStep sheet={sheet} onSave={handleSaveStep} saving={saving} onNext={() => setStep("background")} onBack={() => setStep("basics")} />}
        {step === "background" && <BackgroundStep sheet={sheet} onSave={handleSaveStep} saving={saving} onNext={() => setStep("appearance")} onBack={() => setStep("attributes")} />}
        {step === "appearance" && <AppearanceStep sheet={sheet} onSave={handleSaveStep} saving={saving} onBack={() => setStep("background")} />}
      </main>
    </div>
  )
}

// ── Etapa 1: Raça e classe ─────────────────────────────────────────────────────
function BasicsStep({ sheet, onSave, saving, onNext }: StepProps) {
  const [race,  setRace]  = useState(String(sheet.race  ?? ""))
  const [klass, setKlass] = useState(String(sheet.class ?? ""))
  const [name,  setName]  = useState(String(sheet.characterName ?? ""))
  const [level, setLevel] = useState(Number(sheet.level ?? 1))

  const RACES   = ["Humano","Elfo","Anão","Halfling","Draconato","Gnomo","Meio-Elfo","Meio-Orc","Tiefling"]
  const CLASSES = ["Bárbaro","Bardo","Clérigo","Druida","Guerreiro","Monge","Paladino","Patrulheiro","Ladino","Feiticeiro","Bruxo","Mago"]

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-neutral-200">Raça e classe</h2>
      <Field label="Nome do personagem">
        <Input value={name} onChange={setName} placeholder="Aragorn, Hermione..." />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Raça">
          <Select value={race} onChange={setRace} options={RACES} placeholder="Escolher..." />
        </Field>
        <Field label="Classe">
          <Select value={klass} onChange={setKlass} options={CLASSES} placeholder="Escolher..." />
        </Field>
      </div>
      <Field label="Nível">
        <input type="number" min={1} max={20} value={level} onChange={e => setLevel(Number(e.target.value))}
          className={inputCls} />
      </Field>
      <StepFooter saving={saving} onNext={() => onSave({ race, class: klass, characterName: name, level, name })} nextLabel="Salvar e continuar" showNext onNext2={onNext} />
    </div>
  )
}

// ── Etapa 2: Atributos ────────────────────────────────────────────────────────
function AttributesStep({ sheet, onSave, saving, onNext, onBack }: StepProps & { onBack: () => void }) {
  const ATTRS = ["strength","dexterity","constitution","intelligence","wisdom","charisma"] as const
  const LABELS: Record<string, string> = { strength:"Força", dexterity:"Destreza", constitution:"Constituição", intelligence:"Inteligência", wisdom:"Sabedoria", charisma:"Carisma" }
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(ATTRS.map(a => [a, Number(sheet[a] ?? 10)]))
  )

  const set = (attr: string, v: number) => setValues(prev => ({ ...prev, [attr]: v }))
  const modifier = (v: number) => Math.floor((v - 10) / 2)
  const fmt = (m: number) => m >= 0 ? `+${m}` : String(m)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-neutral-200">Atributos</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {ATTRS.map(attr => (
          <div key={attr} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
            <p className="text-xs text-neutral-500 mb-2">{LABELS[attr]}</p>
            <input type="number" min={1} max={20} value={values[attr]}
              onChange={e => set(attr, Number(e.target.value))}
              className="w-16 text-center text-2xl font-bold text-neutral-100 bg-transparent outline-none border-b border-neutral-700 focus:border-purple-500"
            />
            <p className="text-sm text-purple-400 mt-1">{fmt(modifier(values[attr]!))}</p>
          </div>
        ))}
      </div>
      <StepFooter saving={saving} onSave={() => onSave(values)} onNext={onNext} onBack={onBack} showNext showBack />
    </div>
  )
}

// ── Etapa 3: História ─────────────────────────────────────────────────────────
function BackgroundStep({ sheet, onSave, saving, onNext, onBack }: StepProps & { onBack: () => void }) {
  const [background, setBackground] = useState(String(sheet.background ?? ""))
  const [personality, setPersonality] = useState(String(sheet.personality ?? ""))
  const [bonds, setBonds]   = useState(String(sheet.bonds ?? ""))
  const [flaws, setFlaws]   = useState(String(sheet.flaws ?? ""))

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-neutral-200">História e background</h2>
      <Field label="Background">
        <Select value={background} onChange={setBackground}
          options={["Acólito","Criminoso","Herói do Povo","Nobre","Sábio","Soldado","Marinheiro","Forasteiro","Herói de Guilda","Ermitão"]}
          placeholder="Escolher..." />
      </Field>
      <Field label="Traços de personalidade">
        <textarea value={personality} onChange={e => setPersonality(e.target.value)}
          className={clsx(inputCls, "resize-none h-20")} placeholder="Como você age e se comporta..." />
      </Field>
      <Field label="Vínculos">
        <textarea value={bonds} onChange={e => setBonds(e.target.value)}
          className={clsx(inputCls, "resize-none h-16")} placeholder="O que é mais importante para você..." />
      </Field>
      <Field label="Defeitos">
        <textarea value={flaws} onChange={e => setFlaws(e.target.value)}
          className={clsx(inputCls, "resize-none h-16")} placeholder="Sua fraqueza ou vício..." />
      </Field>
      <StepFooter saving={saving} onSave={() => onSave({ background, personality, bonds, flaws })} onNext={onNext} onBack={onBack} showNext showBack />
    </div>
  )
}

// ── Etapa 4: Aparência ────────────────────────────────────────────────────────
function AppearanceStep({ sheet, onSave, saving, onBack }: StepProps & { onBack: () => void }) {
  const [age,    setAge]    = useState(String(sheet.age    ?? ""))
  const [height, setHeight] = useState(String(sheet.height ?? ""))
  const [weight, setWeight] = useState(String(sheet.weight ?? ""))
  const [eyes,   setEyes]   = useState(String(sheet.eyes   ?? ""))
  const [hair,   setHair]   = useState(String(sheet.hair   ?? ""))
  const [skin,   setSkin]   = useState(String(sheet.skin   ?? ""))
  const [notes,  setNotes]  = useState(String(sheet.appearanceNotes ?? ""))

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-neutral-200">Aparência</h2>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Idade"><Input value={age}    onChange={setAge}    placeholder="30 anos" /></Field>
        <Field label="Altura"><Input value={height} onChange={setHeight} placeholder="1,80m" /></Field>
        <Field label="Peso"><Input value={weight} onChange={setWeight} placeholder="80kg" /></Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Olhos"><Input value={eyes} onChange={setEyes} placeholder="Azuis" /></Field>
        <Field label="Cabelo"><Input value={hair} onChange={setHair} placeholder="Preto" /></Field>
        <Field label="Pele"><Input value={skin}  onChange={setSkin}  placeholder="Clara" /></Field>
      </div>
      <Field label="Notas adicionais">
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          className={clsx(inputCls, "resize-none h-20")} placeholder="Cicatrizes, marcas, tatuagens..." />
      </Field>
      <StepFooter saving={saving} onSave={() => onSave({ age, height, weight, eyes, hair, skin, appearanceNotes: notes })} onBack={onBack} showBack finalStep />
    </div>
  )
}

// ── Shared types and helpers ───────────────────────────────────────────────────
type StepProps = {
  sheet:   Record<string, unknown>
  onSave:  (data: Record<string, unknown>) => Promise<void>
  onNext?: () => void
  saving:  boolean
}

function StepFooter({ saving, onSave, onNext, onBack, showNext, showBack, finalStep, nextLabel, onNext2 }: {
  saving: boolean; onSave?: () => void; onNext?: () => void; onBack?: () => void
  showNext?: boolean; showBack?: boolean; finalStep?: boolean; nextLabel?: string; onNext2?: () => void
}) {
  const handleNext = async () => {
    if (onSave) await onSave()
    if (onNext) onNext()
    if (onNext2) onNext2()
  }

  return (
    <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
      {showBack ? (
        <button onClick={onBack} className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">← Voltar</button>
      ) : <div />}
      <div className="flex gap-3">
        {onSave && !showNext && (
          <button onClick={onSave} disabled={saving}
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
            {saving ? "Salvando..." : finalStep ? "✓ Finalizar ficha" : "Salvar"}
          </button>
        )}
        {showNext && (
          <button onClick={handleNext} disabled={saving}
            className="bg-purple-700 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
            {saving ? "Salvando..." : nextLabel ?? "Próximo →"}
          </button>
        )}
      </div>
    </div>
  )
}

const inputCls = "w-full bg-neutral-900 text-neutral-200 text-sm rounded-lg px-3 py-2 border border-neutral-700/50 outline-none focus:border-neutral-500 placeholder-neutral-700"
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><label className="text-xs text-neutral-500">{label}</label>{children}</div>
}
function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
}
function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}
function clsx(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
