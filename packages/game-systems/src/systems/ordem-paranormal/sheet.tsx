import { useState } from "react"
import { clsx } from "clsx"
import type { CharacterSheetProps, CombatAbility } from "../../types.js"
import {
  ATRIBUTOS, PERICIAS, TREINO, CLASSE_LIST, ORIGEM_LIST, ORIGENS, CLASSES,
  pvMax, peMax, sanMax, dtPadrao, periciasConcedidas, type AttrKey,
} from "./data.js"

// ─────────────────────────────────────────────────────────────────────────────
// Ordem Paranormal — ficha de agente em abas
// ─────────────────────────────────────────────────────────────────────────────

type Step = "basico" | "atributos" | "pericias" | "habilidades"

const STEPS: { key: Step; label: string; icon: string }[] = [
  { key: "basico",      label: "Agente",      icon: "🕵️" },
  { key: "atributos",   label: "Atributos",   icon: "🎲" },
  { key: "pericias",    label: "Perícias",    icon: "📋" },
  { key: "habilidades", label: "Habilidades", icon: "✦" },
]

export function OrdemParanormalCharacterSheet({ data, onSave, saving, readOnly }: CharacterSheetProps) {
  const [step, setStep] = useState<Step>("basico")
  const currentIdx = STEPS.findIndex(s => s.key === step)

  return (
    <div className="space-y-0">
      <div className="border-b border-neutral-800 -mx-6 px-6">
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <button key={s.key} onClick={() => setStep(s.key)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-2 text-xs rounded-t-lg border-b-2 transition-colors",
                step === s.key
                  ? "border-red-500 text-red-300 bg-red-950/30"
                  : i < currentIdx
                  ? "border-green-700/50 text-green-500"
                  : "border-transparent text-neutral-500 hover:text-neutral-300",
              )}>
              <span>{s.icon}</span>
              <span className="hidden sm:block">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-6">
        {step === "basico"      && <BasicoStep      sheet={data} onSave={onSave} saving={saving} readOnly={readOnly} onNext={() => setStep("atributos")} />}
        {step === "atributos"   && <AtributosStep   sheet={data} onSave={onSave} saving={saving} readOnly={readOnly} onNext={() => setStep("pericias")} onBack={() => setStep("basico")} />}
        {step === "pericias"    && <PericiasStep    sheet={data} onSave={onSave} saving={saving} readOnly={readOnly} onNext={() => setStep("habilidades")} onBack={() => setStep("atributos")} />}
        {step === "habilidades" && <HabilidadesStep sheet={data} onSave={onSave} saving={saving} readOnly={readOnly} onBack={() => setStep("pericias")} />}
      </div>
    </div>
  )
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

const inputCls = "w-full bg-neutral-900 text-neutral-200 text-sm rounded-lg px-3 py-2 border border-neutral-700/50 outline-none focus:border-neutral-500 placeholder-neutral-700"

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-neutral-500">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-neutral-600">{hint}</p>}
    </div>
  )
}

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && !Number.isNaN(v) ? v : fallback
}
function str(v: unknown): string {
  return typeof v === "string" ? v : ""
}

function StepFooter({
  saving, onSave, onNext, onBack, finalStep,
}: {
  saving: boolean; onSave?: () => void; onNext?: () => void; onBack?: () => void; finalStep?: boolean
}) {
  const handleNext = async () => { if (onSave) await onSave(); if (onNext) onNext() }
  return (
    <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
      {onBack
        ? <button onClick={onBack} className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">← Voltar</button>
        : <span />}
      <div className="flex items-center gap-3">
        {onSave && (
          <button onClick={onSave} disabled={saving}
            className="text-sm text-neutral-400 hover:text-white border border-neutral-700/50 hover:border-neutral-500 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        )}
        {onNext && (
          <button onClick={handleNext} disabled={saving}
            className="bg-red-800 hover:bg-red-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50">
            {finalStep ? "Concluir" : "Continuar →"}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Etapa 1: Agente (classe, origem, NEX) ──────────────────────────────────────

function BasicoStep({ sheet, onSave, saving, readOnly, onNext }: StepProps & { onNext: () => void }) {
  const [name,    setName]    = useState(str(sheet.characterName))
  const [classe,  setClasse]  = useState(str(sheet.classe))
  const [origem,  setOrigem]  = useState(str(sheet.origem))
  const [nex,     setNex]     = useState(num(sheet.nex, 5))
  const [patente, setPatente] = useState(str(sheet.patente) || "Recruta")

  const origemInfo = ORIGENS[origem]

  const save = () => onSave({ characterName: name, classe, origem, nex, patente })

  return (
    <div className="space-y-5">
      <Field label="Nome do agente">
        <input value={name} onChange={e => setName(e.target.value)} disabled={readOnly}
          placeholder="Codinome ou nome real" className={inputCls} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Classe">
          <select value={classe} onChange={e => setClasse(e.target.value)} disabled={readOnly} className={inputCls}>
            <option value="">Escolher...</option>
            {CLASSE_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Patente">
          <select value={patente} onChange={e => setPatente(e.target.value)} disabled={readOnly} className={inputCls}>
            {["Recruta", "Operador", "Agente Especial", "Oficial de Operações", "Agente de Elite"].map(p =>
              <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Origem">
        <select value={origem} onChange={e => setOrigem(e.target.value)} disabled={readOnly} className={inputCls}>
          <option value="">Escolher...</option>
          {ORIGEM_LIST.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </Field>

      {origemInfo && (
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-red-400/80 font-bold">Poder de origem</span>
            <span className="text-sm font-medium text-neutral-200">{origemInfo.poder.titulo}</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">{origemInfo.poder.desc}</p>
          {origemInfo.pericias.length > 0 && (
            <p className="text-[11px] text-neutral-500">
              Perícias treinadas: <span className="text-neutral-300">{origemInfo.pericias.join(", ")}</span>
            </p>
          )}
        </div>
      )}

      <Field label={`NEX — ${nex}%`} hint="Nível de Exposição (0–99%). Define progressão, PV/PE e Sanidade.">
        <input type="range" min={0} max={99} step={1} value={nex} disabled={readOnly}
          onChange={e => setNex(Number(e.target.value))} className="w-full accent-red-600" />
      </Field>

      {classe && (
        <p className="text-[11px] text-neutral-600">
          Proficiências da classe: {CLASSES[classe]?.prof}
        </p>
      )}

      {!readOnly && <StepFooter saving={saving} onSave={save} onNext={onNext} />}
    </div>
  )
}

// ── Etapa 2: Atributos e vitais ────────────────────────────────────────────────

function AtributosStep({ sheet, onSave, saving, readOnly, onNext, onBack }: StepProps & { onNext: () => void; onBack: () => void }) {
  const classe = str(sheet.classe)
  const [attrs, setAttrs] = useState<Record<AttrKey, number>>(() => ({
    FOR: num(sheet.FOR, 1), AGI: num(sheet.AGI, 1), INT: num(sheet.INT, 1),
    PRE: num(sheet.PRE, 1), VIG: num(sheet.VIG, 1),
  }))
  const [pv,  setPv]  = useState(num(sheet.pv,  pvMax(classe, num(sheet.VIG, 1))))
  const [pe,  setPe]  = useState(num(sheet.pe,  peMax(classe, num(sheet.PRE, 1))))
  const [san, setSan] = useState(num(sheet.san, sanMax(classe)))
  const [defesa, setDefesa] = useState(num(sheet.defesa, 10 + num(sheet.AGI, 1)))
  const [desloc, setDesloc] = useState(num(sheet.deslocamento, 9))

  const setAttr = (k: AttrKey, v: number) =>
    setAttrs(prev => ({ ...prev, [k]: Math.max(0, Math.min(99, v)) }))

  const calcPv  = pvMax(classe, attrs.VIG)
  const calcPe  = peMax(classe, attrs.PRE)
  const calcSan = sanMax(classe)
  const calcDef = 10 + attrs.AGI

  // hp/maxHp espelham PV para o tracker de combate compartilhado
  const save = () => onSave({
    ...attrs, pv, pe, san, defesa, deslocamento: desloc,
    hp: pv, maxHp: calcPv,
    pvMax: calcPv, peMax: calcPe, sanMax: calcSan,
    dt: dtPadrao(attrs.PRE),
  })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Atributos</h3>
        <div className="grid grid-cols-5 gap-2">
          {ATRIBUTOS.map(a => (
            <div key={a.key} className="flex flex-col items-center bg-neutral-900/70 border border-neutral-800 rounded-xl py-3">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500">{a.key}</span>
              <input type="number" min={0} max={99} value={attrs[a.key]} disabled={readOnly}
                onChange={e => setAttr(a.key, Number(e.target.value))}
                className="w-12 text-center bg-transparent text-2xl font-black text-neutral-100 outline-none" />
              <span className="text-[9px] text-neutral-600">{a.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Vitalidade</h3>
        <div className="grid grid-cols-3 gap-3">
          <VitalBox label="PV" color="green"  cur={pv}  onCur={setPv}  max={calcPv}  readOnly={readOnly} />
          <VitalBox label="PE" color="blue"   cur={pe}  onCur={setPe}  max={calcPe}  readOnly={readOnly} />
          <VitalBox label="Sanidade" color="purple" cur={san} onCur={setSan} max={calcSan} readOnly={readOnly} />
        </div>
        {!classe && <p className="text-[10px] text-amber-500/80 mt-2">Escolha uma classe na aba Agente para calcular os máximos.</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Defesa" hint={`Sugerido: ${calcDef}`}>
          <input type="number" value={defesa} disabled={readOnly}
            onChange={e => setDefesa(Number(e.target.value))} className={`${inputCls} text-center`} />
        </Field>
        <Field label="Deslocamento (m)">
          <input type="number" value={desloc} disabled={readOnly}
            onChange={e => setDesloc(Number(e.target.value))} className={`${inputCls} text-center`} />
        </Field>
        <Field label="DT de habilidades" hint="10 + Presença">
          <input type="number" value={dtPadrao(attrs.PRE)} disabled className={`${inputCls} text-center opacity-70`} />
        </Field>
      </div>

      {!readOnly && <StepFooter saving={saving} onSave={save} onNext={onNext} onBack={onBack} />}
    </div>
  )
}

function VitalBox({ label, color, cur, onCur, max, readOnly }: {
  label: string; color: "green" | "blue" | "purple"; cur: number; onCur: (v: number) => void; max: number; readOnly?: boolean
}) {
  const ring = {
    green:  "border-green-800/50",
    blue:   "border-blue-800/50",
    purple: "border-purple-800/50",
  }[color]
  return (
    <div className={clsx("bg-neutral-900/70 border rounded-xl p-3 flex flex-col items-center", ring)}>
      <span className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</span>
      <div className="flex items-baseline gap-1 mt-1">
        <input type="number" value={cur} disabled={readOnly}
          onChange={e => onCur(Number(e.target.value))}
          className="w-12 text-center bg-transparent text-xl font-black text-neutral-100 outline-none" />
        <span className="text-sm text-neutral-600">/ {max}</span>
      </div>
    </div>
  )
}

// ── Etapa 3: Perícias ──────────────────────────────────────────────────────────

function PericiasStep({ sheet, onSave, saving, readOnly, onNext, onBack }: StepProps & { onNext: () => void; onBack: () => void }) {
  const classe = str(sheet.classe)
  const origem = str(sheet.origem)
  const concedidas = periciasConcedidas(classe, origem)
  const [pericias, setPericias] = useState<Record<string, number>>(
    () => (sheet.pericias as Record<string, number> | undefined) ?? {},
  )

  const setTreino = (nome: string, v: number) =>
    setPericias(prev => ({ ...prev, [nome]: v }))

  const save = () => onSave({ pericias })

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-neutral-500">
        ● = concedida automaticamente por classe/origem. Treino: 5 treinado · 10 veterano · 15 expert.
        <span className="text-neutral-600"> Flags: * só treinado · + penalidade de carga.</span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
        {PERICIAS.map(p => {
          const granted = concedidas.has(p.nome)
          const treino  = pericias[p.nome] ?? (granted ? 5 : 0)
          return (
            <div key={p.nome} className="flex items-center gap-2 py-1 border-b border-neutral-900">
              <span className={clsx("w-1.5 text-xs", granted ? "text-red-400" : "text-transparent")}>●</span>
              <span className="flex-1 text-sm text-neutral-300">
                {p.nome}
                <span className="text-[10px] text-neutral-600 ml-1">({p.dado}{p.flag})</span>
              </span>
              <select value={treino} disabled={readOnly}
                onChange={e => setTreino(p.nome, Number(e.target.value))}
                className="bg-neutral-900 text-neutral-300 text-xs rounded-md px-2 py-1 border border-neutral-700/50 outline-none focus:border-neutral-500">
                {TREINO.map(t => <option key={t.v} value={t.v}>{t.v === 0 ? "—" : `+${t.v} ${t.label}`}</option>)}
              </select>
            </div>
          )
        })}
      </div>

      {!readOnly && <StepFooter saving={saving} onSave={save} onNext={onNext} onBack={onBack} />}
    </div>
  )
}

// ── Etapa 4: Habilidades e rituais (combate) ───────────────────────────────────

const ORDEM_RESOURCES = ["PE", "Ação", "Bônus", "Reação", "Gratuito"]

function HabilidadesStep({ sheet, onSave, saving, readOnly, onBack }: StepProps & { onBack: () => void }) {
  const [abilities, setAbilities] = useState<CombatAbility[]>(
    () => (sheet.combatAbilities as CombatAbility[] | undefined) ?? [],
  )

  const add = () => setAbilities(prev => [...prev, {
    id: crypto.randomUUID(), name: "", description: "", cost: 1, resource: "PE",
    effect: "none", targeting: "enemy",
  }])
  const upd = (id: string, patch: Partial<CombatAbility>) =>
    setAbilities(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a))
  const del = (id: string) =>
    setAbilities(prev => prev.filter(a => a.id !== id))

  const save = () => onSave({ combatAbilities: abilities })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-neutral-200">Habilidades e rituais</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Aparecem no painel de visão de combate. O servidor resolve dano/cura.</p>
        </div>
        {!readOnly && (
          <button onClick={add}
            className="text-xs bg-red-900/60 hover:bg-red-800/60 text-red-300 px-3 py-1.5 rounded-lg border border-red-700/40 transition-colors">
            + Adicionar
          </button>
        )}
      </div>

      {abilities.length === 0 && (
        <div className="py-10 text-center text-neutral-600 text-sm">
          {readOnly ? "Nenhuma habilidade cadastrada." : "Clique em '+ Adicionar' para criar habilidades ou rituais."}
        </div>
      )}

      <div className="space-y-3">
        {abilities.map(ab => (
          <div key={ab.id} className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Field label="Nome">
                  <input value={ab.name} onChange={e => upd(ab.id, { name: e.target.value })}
                    placeholder="Lâmina Sanguinária / Eco de Sangue" className={inputCls} disabled={readOnly} />
                </Field>
              </div>
              <div style={{ width: 72 }}>
                <Field label="Custo">
                  <input type="number" min={0} max={99} value={ab.cost}
                    onChange={e => upd(ab.id, { cost: Number(e.target.value) })}
                    disabled={readOnly} className={`${inputCls} text-center`} />
                </Field>
              </div>
              <div style={{ width: 100 }}>
                <Field label="Recurso">
                  <select value={ab.resource} onChange={e => upd(ab.id, { resource: e.target.value })}
                    disabled={readOnly} className={inputCls}>
                    {ORDEM_RESOURCES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
              </div>
              {!readOnly && (
                <button onClick={() => del(ab.id)}
                  className="mb-1 text-neutral-600 hover:text-red-400 transition-colors text-sm px-1 shrink-0">✕</button>
              )}
            </div>

            <Field label="Descrição">
              <textarea value={ab.description}
                onChange={e => upd(ab.id, { description: e.target.value })}
                disabled={readOnly} className={`${inputCls} resize-none`} rows={2}
                placeholder="Efeito do ritual ou ataque especial..." />
            </Field>

            {/* Resolução em combate */}
            <div className="border-t border-neutral-800/70 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Field label="Efeito">
                <select value={ab.effect ?? "none"} disabled={readOnly}
                  onChange={e => upd(ab.id, { effect: e.target.value as CombatAbility["effect"] })}
                  className={inputCls}>
                  <option value="none">— Nenhum</option>
                  <option value="damage">Dano</option>
                  <option value="heal">Cura</option>
                </select>
              </Field>
              <Field label="Dado">
                <input value={ab.dice ?? ""} disabled={readOnly}
                  onChange={e => upd(ab.id, { dice: e.target.value })}
                  placeholder="2d6" className={`${inputCls} font-mono`} />
              </Field>
              <Field label="Bônus">
                <input type="number" value={ab.bonus ?? 0} disabled={readOnly}
                  onChange={e => upd(ab.id, { bonus: Number(e.target.value) || undefined })}
                  className={`${inputCls} text-center`} />
              </Field>
              <Field label="Alvo">
                <select value={ab.targeting ?? (ab.effect === "heal" ? "ally" : "enemy")} disabled={readOnly}
                  onChange={e => upd(ab.id, { targeting: e.target.value as CombatAbility["targeting"] })}
                  className={inputCls}>
                  <option value="enemy">Inimigo</option>
                  <option value="ally">Aliado</option>
                  <option value="self">Próprio</option>
                  <option value="any">Qualquer</option>
                </select>
              </Field>
            </div>
          </div>
        ))}
      </div>

      {!readOnly && <StepFooter saving={saving} onSave={save} onBack={onBack} finalStep />}
    </div>
  )
}

// ── Tipos ───────────────────────────────────────────────────────────────────────

type StepProps = {
  sheet:    Record<string, unknown>
  onSave:   (patch: Record<string, unknown>) => Promise<void>
  saving:   boolean
  readOnly?: boolean
}
