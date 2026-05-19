import { useState } from "react"
import { clsx } from "clsx"
import type { CharacterSheetProps, CombatAbility } from "../../types.js"

// ─────────────────────────────────────────────────────────────────────────────
// D&D 5e — wizard de ficha em 6 etapas
// ─────────────────────────────────────────────────────────────────────────────

type Step = "basics" | "attributes" | "background" | "appearance" | "avatar" | "abilities"

const STEPS: { key: Step; label: string; icon: string }[] = [
  { key: "basics",     label: "Raça e classe", icon: "⚔️" },
  { key: "attributes", label: "Atributos",      icon: "🎲" },
  { key: "background", label: "História",       icon: "📖" },
  { key: "appearance", label: "Aparência",      icon: "🎭" },
  { key: "avatar",     label: "Avatar 3D",      icon: "🧙" },
  { key: "abilities",  label: "Habilidades",    icon: "✦" },
]

export function Dnd5eCharacterSheet({ data, onSave, saving, readOnly }: CharacterSheetProps) {
  const [step, setStep] = useState<Step>("basics")
  const currentIdx = STEPS.findIndex(s => s.key === step)

  return (
    <div className="space-y-0">
      {/* Step tabs */}
      <div className="border-b border-neutral-800 -mx-6 px-6">
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <button key={s.key} onClick={() => setStep(s.key)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-2 text-xs rounded-t-lg border-b-2 transition-colors",
                step === s.key
                  ? "border-purple-500 text-purple-300 bg-purple-950/30"
                  : i < currentIdx
                  ? "border-green-700/50 text-green-500"
                  : "border-transparent text-neutral-500 hover:text-neutral-300",
              )}>
              <span>{s.icon}</span>
              <span className="hidden sm:block">{s.label}</span>
              {i < currentIdx && <span className="text-green-500 text-[10px]">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="pt-6">
        {step === "basics"     && <BasicsStep     sheet={data} onSave={onSave} saving={saving} readOnly={readOnly} onNext={() => setStep("attributes")} />}
        {step === "attributes" && <AttributesStep sheet={data} onSave={onSave} saving={saving} readOnly={readOnly} onNext={() => setStep("background")} onBack={() => setStep("basics")} />}
        {step === "background" && <BackgroundStep sheet={data} onSave={onSave} saving={saving} readOnly={readOnly} onNext={() => setStep("appearance")} onBack={() => setStep("attributes")} />}
        {step === "appearance" && <AppearanceStep sheet={data} onSave={onSave} saving={saving} readOnly={readOnly} onNext={() => setStep("avatar")} onBack={() => setStep("background")} />}
        {step === "avatar"     && <AvatarStep     sheet={data} onSave={onSave} saving={saving} readOnly={readOnly} onNext={() => setStep("abilities")} onBack={() => setStep("appearance")} />}
        {step === "abilities"  && <AbilitiesStep  sheet={data} onSave={onSave} saving={saving} readOnly={readOnly} onBack={() => setStep("avatar")} />}
      </div>
    </div>
  )
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

const inputCls = "w-full bg-neutral-900 text-neutral-200 text-sm rounded-lg px-3 py-2 border border-neutral-700/50 outline-none focus:border-neutral-500 placeholder-neutral-700"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><label className="text-xs text-neutral-500">{label}</label>{children}</div>
}

function SheetInput({ value, onChange, placeholder, disabled }: { value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean }) {
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className={inputCls} />
}

function SheetSelect({ value, onChange, options, placeholder, disabled }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; disabled?: boolean }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} className={inputCls}>
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function StepFooter({
  saving, onSave, onNext, onBack, showNext, showBack, finalStep, nextLabel,
}: {
  saving: boolean; onSave?: () => void; onNext?: () => void; onBack?: () => void
  showNext?: boolean; showBack?: boolean; finalStep?: boolean; nextLabel?: string
}) {
  const handleNext = async () => {
    if (onSave) await onSave()
    if (onNext) onNext()
  }

  return (
    <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
      {showBack
        ? <button onClick={onBack} className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">← Voltar</button>
        : <div />}
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

// ── Etapa 1: Raça e classe ─────────────────────────────────────────────────────

function BasicsStep({ sheet, onSave, saving, readOnly, onNext }: {
  sheet: Record<string, unknown>; onSave: (p: Record<string, unknown>) => Promise<void>
  saving: boolean; readOnly?: boolean; onNext: () => void
}) {
  const [race,  setRace]  = useState(String(sheet.race             ?? ""))
  const [klass, setKlass] = useState(String(sheet.class            ?? ""))
  const [name,  setName]  = useState(String(sheet.characterName    ?? ""))
  const [level, setLevel] = useState(Number(sheet.level            ?? 1))

  const RACES   = ["Humano","Elfo","Anão","Halfling","Draconato","Gnomo","Meio-Elfo","Meio-Orc","Tiefling"]
  const CLASSES = ["Bárbaro","Bardo","Clérigo","Druida","Guerreiro","Monge","Paladino","Patrulheiro","Ladino","Feiticeiro","Bruxo","Mago"]

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-neutral-200">Raça e classe</h2>
      <Field label="Nome do personagem">
        <SheetInput value={name} onChange={setName} placeholder="Aragorn, Hermione..." disabled={readOnly} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Raça">
          <SheetSelect value={race} onChange={setRace} options={RACES} placeholder="Escolher..." disabled={readOnly} />
        </Field>
        <Field label="Classe">
          <SheetSelect value={klass} onChange={setKlass} options={CLASSES} placeholder="Escolher..." disabled={readOnly} />
        </Field>
      </div>
      <Field label="Nível">
        <input type="number" min={1} max={20} value={level} onChange={e => setLevel(Number(e.target.value))}
          disabled={readOnly} className={inputCls} />
      </Field>
      {!readOnly && (
        <StepFooter saving={saving}
          onSave={() => onSave({ race, class: klass, characterName: name, level, name })}
          onNext={onNext} showNext nextLabel="Salvar e continuar" />
      )}
    </div>
  )
}

// ── Etapa 2: Atributos ─────────────────────────────────────────────────────────

function AttributesStep({ sheet, onSave, saving, readOnly, onNext, onBack }: {
  sheet: Record<string, unknown>; onSave: (p: Record<string, unknown>) => Promise<void>
  saving: boolean; readOnly?: boolean; onNext: () => void; onBack: () => void
}) {
  const ATTRS = ["strength","dexterity","constitution","intelligence","wisdom","charisma"] as const
  const LABELS: Record<string, string> = {
    strength: "Força", dexterity: "Destreza", constitution: "Constituição",
    intelligence: "Inteligência", wisdom: "Sabedoria", charisma: "Carisma",
  }
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
            <input type="number" min={1} max={20} value={values[attr]} disabled={readOnly}
              onChange={e => set(attr, Number(e.target.value))}
              className="w-16 text-center text-2xl font-bold text-neutral-100 bg-transparent outline-none border-b border-neutral-700 focus:border-purple-500 disabled:opacity-60"
            />
            <p className="text-sm text-purple-400 mt-1">{fmt(modifier(values[attr] ?? 10))}</p>
          </div>
        ))}
      </div>
      {!readOnly && (
        <StepFooter saving={saving} onSave={() => onSave(values)} onNext={onNext} onBack={onBack} showNext showBack />
      )}
    </div>
  )
}

// ── Etapa 3: História ──────────────────────────────────────────────────────────

function BackgroundStep({ sheet, onSave, saving, readOnly, onNext, onBack }: {
  sheet: Record<string, unknown>; onSave: (p: Record<string, unknown>) => Promise<void>
  saving: boolean; readOnly?: boolean; onNext: () => void; onBack: () => void
}) {
  const [background,   setBackground]   = useState(String(sheet.background   ?? ""))
  const [personality,  setPersonality]  = useState(String(sheet.personality  ?? ""))
  const [bonds,        setBonds]        = useState(String(sheet.bonds        ?? ""))
  const [flaws,        setFlaws]        = useState(String(sheet.flaws        ?? ""))

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-neutral-200">História e background</h2>
      <Field label="Background">
        <SheetSelect value={background} onChange={setBackground} disabled={readOnly}
          options={["Acólito","Criminoso","Herói do Povo","Nobre","Sábio","Soldado","Marinheiro","Forasteiro","Herói de Guilda","Ermitão"]}
          placeholder="Escolher..." />
      </Field>
      <Field label="Traços de personalidade">
        <textarea value={personality} onChange={e => setPersonality(e.target.value)} disabled={readOnly}
          className={clsx(inputCls, "resize-none h-20")} placeholder="Como você age e se comporta..." />
      </Field>
      <Field label="Vínculos">
        <textarea value={bonds} onChange={e => setBonds(e.target.value)} disabled={readOnly}
          className={clsx(inputCls, "resize-none h-16")} placeholder="O que é mais importante para você..." />
      </Field>
      <Field label="Defeitos">
        <textarea value={flaws} onChange={e => setFlaws(e.target.value)} disabled={readOnly}
          className={clsx(inputCls, "resize-none h-16")} placeholder="Sua fraqueza ou vício..." />
      </Field>
      {!readOnly && (
        <StepFooter saving={saving} onSave={() => onSave({ background, personality, bonds, flaws })} onNext={onNext} onBack={onBack} showNext showBack />
      )}
    </div>
  )
}

// ── Etapa 4: Aparência ─────────────────────────────────────────────────────────

function AppearanceStep({ sheet, onSave, saving, readOnly, onBack, onNext }: {
  sheet: Record<string, unknown>; onSave: (p: Record<string, unknown>) => Promise<void>
  saving: boolean; readOnly?: boolean; onBack: () => void; onNext?: () => void
}) {
  const [age,    setAge]    = useState(String(sheet.age            ?? ""))
  const [height, setHeight] = useState(String(sheet.height         ?? ""))
  const [weight, setWeight] = useState(String(sheet.weight         ?? ""))
  const [eyes,   setEyes]   = useState(String(sheet.eyes           ?? ""))
  const [hair,   setHair]   = useState(String(sheet.hair           ?? ""))
  const [skin,   setSkin]   = useState(String(sheet.skin           ?? ""))
  const [notes,  setNotes]  = useState(String(sheet.appearanceNotes ?? ""))

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-neutral-200">Aparência</h2>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Idade"><SheetInput value={age}    onChange={setAge}    placeholder="30 anos" disabled={readOnly} /></Field>
        <Field label="Altura"><SheetInput value={height} onChange={setHeight} placeholder="1,80m"  disabled={readOnly} /></Field>
        <Field label="Peso"><SheetInput value={weight} onChange={setWeight} placeholder="80kg"    disabled={readOnly} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Olhos"><SheetInput value={eyes} onChange={setEyes} placeholder="Azuis"  disabled={readOnly} /></Field>
        <Field label="Cabelo"><SheetInput value={hair} onChange={setHair} placeholder="Preto" disabled={readOnly} /></Field>
        <Field label="Pele"><SheetInput value={skin}  onChange={setSkin}  placeholder="Clara" disabled={readOnly} /></Field>
      </div>
      <Field label="Notas adicionais">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} disabled={readOnly}
          className={clsx(inputCls, "resize-none h-20")} placeholder="Cicatrizes, marcas, tatuagens..." />
      </Field>
      {!readOnly && (
        <StepFooter saving={saving}
          onSave={() => onSave({ age, height, weight, eyes, hair, skin, appearanceNotes: notes })}
          onNext={onNext} onBack={onBack} showNext showBack nextLabel="Próximo →" />
      )}
    </div>
  )
}

// ── Etapa 5: Avatar 3D ─────────────────────────────────────────────────────────

function AvatarStep({ sheet, onSave, saving, readOnly, onBack, onNext }: {
  sheet: Record<string, unknown>; onSave: (p: Record<string, unknown>) => Promise<void>
  saving: boolean; readOnly?: boolean; onBack: () => void; onNext?: () => void
}) {
  const saved = sheet.avatar as { type?: string; url?: string } | undefined
  const [type, setType] = useState<"none" | "image" | "model">(
    saved?.type === "image" || saved?.type === "model" ? saved.type : "none"
  )
  const [url, setUrl] = useState(saved?.url ?? "")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-neutral-200">Avatar 3D</h2>
        <p className="text-xs text-neutral-500 mt-1">Como seu personagem aparece no mapa.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {([
          { key: "none",  label: "Disco padrão", desc: "Disco colorido com inicial" },
          { key: "image", label: "Imagem",        desc: "PNG transparente como sprite" },
          { key: "model", label: "Modelo 3D",     desc: "Arquivo .glb animado" },
        ] as const).map(opt => (
          <button key={opt.key} onClick={() => !readOnly && setType(opt.key)}
            className={clsx(
              "text-left p-3 rounded-xl border transition-colors",
              type === opt.key
                ? "border-purple-500 bg-purple-950/30 text-purple-300"
                : "border-neutral-700/50 bg-neutral-900 text-neutral-400 hover:border-neutral-600",
              readOnly && "cursor-default",
            )}>
            <p className="text-sm font-medium">{opt.label}</p>
            <p className="text-xs opacity-60 mt-0.5">{opt.desc}</p>
          </button>
        ))}
      </div>
      {type !== "none" && (
        <Field label={type === "image" ? "URL da imagem (PNG com transparência)" : "URL do modelo (.glb)"}>
          <SheetInput value={url} onChange={setUrl}
            placeholder={type === "image" ? "https://exemplo.com/avatar.png" : "https://exemplo.com/avatar.glb"}
            disabled={readOnly} />
        </Field>
      )}
      {type === "image" && url && (
        <div className="flex items-center gap-4 p-4 bg-neutral-900 rounded-xl border border-neutral-800">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-neutral-800 flex items-center justify-center shrink-0"
            style={{ background: "repeating-conic-gradient(#2a2a2a 0% 25%, #1a1a1a 0% 50%) 0 0 / 16px 16px" }}>
            <img src={url} alt="preview" className="max-h-full max-w-full object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
          </div>
          <div>
            <p className="text-xs text-neutral-400">Pré-visualização</p>
            <p className="text-xs text-neutral-600 mt-1">O fundo xadrez indica transparência</p>
          </div>
        </div>
      )}
      {!readOnly && (
        <StepFooter saving={saving}
          onSave={() => onSave({ avatar: type === "none" ? { type: "none" } : { type, url } })}
          onNext={onNext} onBack={onBack} showNext={!!onNext} showBack
          nextLabel="Próximo →" />
      )}
    </div>
  )
}

// ── Etapa 6: Habilidades de combate ────────────────────────────────────────────

const RESOURCES = ["PD", "PM", "PA", "PE", "Ação", "Bônus", "Gratuito"]

function AbilitiesStep({ sheet, onSave, saving, readOnly, onBack }: {
  sheet: Record<string, unknown>; onSave: (p: Record<string, unknown>) => Promise<void>
  saving: boolean; readOnly?: boolean; onBack: () => void
}) {
  const [abilities, setAbilities] = useState<CombatAbility[]>(
    () => (sheet.combatAbilities as CombatAbility[] | undefined) ?? []
  )

  const add = () => setAbilities(prev => [...prev, {
    id: crypto.randomUUID(), name: "", description: "", cost: 1, resource: "PD",
  }])

  const upd = (id: string, patch: Partial<CombatAbility>) =>
    setAbilities(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a))

  const del = (id: string) =>
    setAbilities(prev => prev.filter(a => a.id !== id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-neutral-200">Habilidades de combate</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Aparecem no painel de visão de combate.</p>
        </div>
        {!readOnly && (
          <button onClick={add}
            className="text-xs bg-purple-900/60 hover:bg-purple-800/60 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-700/40 transition-colors">
            + Adicionar
          </button>
        )}
      </div>

      {abilities.length === 0 && (
        <div className="py-10 text-center text-neutral-600 text-sm">
          {readOnly ? "Nenhuma habilidade cadastrada." : "Clique em '+ Adicionar' para criar habilidades de combate."}
        </div>
      )}

      <div className="space-y-3">
        {abilities.map(ab => (
          <div key={ab.id} className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Field label="Nome">
                  <SheetInput value={ab.name} onChange={v => upd(ab.id, { name: v })}
                    placeholder="Assassinato Furtivo" disabled={readOnly} />
                </Field>
              </div>
              <div style={{ width: 72 }}>
                <Field label="Custo">
                  <input type="number" min={0} max={99} value={ab.cost}
                    onChange={e => upd(ab.id, { cost: Number(e.target.value) })}
                    disabled={readOnly}
                    className={`${inputCls} text-center`} />
                </Field>
              </div>
              <div style={{ width: 100 }}>
                <Field label="Recurso">
                  <SheetSelect value={ab.resource} onChange={v => upd(ab.id, { resource: v })}
                    options={RESOURCES} disabled={readOnly} />
                </Field>
              </div>
              {!readOnly && (
                <button onClick={() => del(ab.id)}
                  className="mb-1 text-neutral-600 hover:text-red-400 transition-colors text-sm px-1 shrink-0">
                  ✕
                </button>
              )}
            </div>
            <Field label="Descrição">
              <textarea value={ab.description}
                onChange={e => upd(ab.id, { description: e.target.value })}
                disabled={readOnly}
                className={`${inputCls} resize-none`}
                rows={2}
                placeholder="+3d8 de dano em um alvo desprevenido ou flanqueado." />
            </Field>
          </div>
        ))}
      </div>

      {!readOnly && (
        <StepFooter saving={saving}
          onSave={() => onSave({ combatAbilities: abilities })}
          onBack={onBack} showBack finalStep />
      )}
    </div>
  )
}
