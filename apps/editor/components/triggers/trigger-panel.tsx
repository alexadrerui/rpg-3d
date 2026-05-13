"use client"
import { clsx }             from "clsx"
import { useTriggerStore }  from "../../store/trigger-store"
import type { AnyTriggerNode, NoteNode, TrapNode, SpawnNode } from "@rpg3d/schema"

export function TriggerPanel() {
  const { triggers, selectedId, setSelectedId, updateTrigger, removeTrigger } = useTriggerStore()
  const trigger = triggers.find(t => t.id === selectedId)

  if (!trigger) return <TriggerList />

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700/50 shrink-0">
        <button onClick={() => setSelectedId(null)} className="text-neutral-500 hover:text-neutral-300 text-xs">← Voltar</button>
        <button onClick={() => { removeTrigger(trigger.id); setSelectedId(null) }}
          className="text-red-500 hover:text-red-400 text-xs">🗑 Remover</button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <BaseFields trigger={trigger} onUpdate={(p) => updateTrigger(trigger.id, p)} />
        {trigger.type === "trigger_note"  && <NoteFields  trigger={trigger as NoteNode}  onUpdate={(p) => updateTrigger(trigger.id, p as Partial<AnyTriggerNode>)} />}
        {trigger.type === "trigger_trap"  && <TrapFields  trigger={trigger as TrapNode}  onUpdate={(p) => updateTrigger(trigger.id, p as Partial<AnyTriggerNode>)} />}
        {trigger.type === "trigger_spawn" && <SpawnFields trigger={trigger as SpawnNode} onUpdate={(p) => updateTrigger(trigger.id, p as Partial<AnyTriggerNode>)} />}
      </div>
    </div>
  )
}

function TriggerList() {
  const { triggers, selectedId, setSelectedId } = useTriggerStore()
  const ICONS: Record<string, string> = {
    trigger_note: "📜", trigger_trap: "⚠️", trigger_spawn: "🎯",
    trigger_transition: "🚪", trigger_ambient_audio: "🔊",
  }
  if (!triggers.length) return (
    <div className="px-4 py-6 text-center text-xs text-neutral-600">
      Nenhum trigger ainda.<br />Use a toolbar RPG para adicionar.
    </div>
  )
  return (
    <div className="flex flex-col gap-1 p-2">
      {triggers.map(t => (
        <button key={t.id} onClick={() => setSelectedId(t.id)}
          className={clsx("flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors",
            selectedId === t.id ? "bg-neutral-700 text-neutral-100" : "hover:bg-neutral-800 text-neutral-300")}>
          <span className="text-base">{ICONS[t.type] ?? "⚡"}</span>
          <div className="min-w-0">
            <p className="font-medium truncate">
              {t.type === "trigger_note"  ? (t as NoteNode).title :
               t.type === "trigger_trap"  ? ((t as TrapNode).label ?? "Armadilha") :
               t.type === "trigger_spawn" ? ((t as SpawnNode).label ?? "Spawn") : t.id.slice(0,16)}
            </p>
            <p className="text-neutral-500 text-[10px]">{t.type.replace("trigger_","")}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

function BaseFields({ trigger, onUpdate }: { trigger: AnyTriggerNode; onUpdate: (p: Partial<AnyTriggerNode>) => void }) {
  return (
    <section className="space-y-3">
      <Select label="Visibilidade" value={trigger.visibility}
        onChange={v => onUpdate({ visibility: v as AnyTriggerNode["visibility"] })}
        options={[{ value:"master_only",label:"Só mestre" },{ value:"always",label:"Sempre visível" },{ value:"on_trigger",label:"Ao ativar" }]} />
      <div className="flex gap-4 items-center">
        <Checkbox label="Uma vez" checked={trigger.oneShot} onChange={v => onUpdate({ oneShot: v })} />
        <Field label="Cooldown (ms)">
          <input type="number" min={0} step={500} value={trigger.cooldownMs}
            onChange={e => onUpdate({ cooldownMs: Number(e.target.value) })} className={inputCls} />
        </Field>
      </div>
      <Select label="Forma" value={trigger.shape.kind}
        onChange={v => onUpdate({ shape: v === "box" ? { kind:"box",width:1,depth:1,height:2 } : v === "sphere" ? { kind:"sphere",radius:1.5 } : { kind:"cylinder",radius:1,height:2 } })}
        options={[{ value:"sphere",label:"Esfera" },{ value:"box",label:"Caixa" },{ value:"cylinder",label:"Cilindro" }]} />
      {trigger.shape.kind === "sphere" && (
        <Field label="Raio">
          <input type="number" min={0.1} step={0.5} value={trigger.shape.radius}
            onChange={e => onUpdate({ shape: { ...trigger.shape, radius: Number(e.target.value) } as typeof trigger.shape })} className={inputCls} />
        </Field>
      )}
    </section>
  )
}

function NoteFields({ trigger, onUpdate }: { trigger: NoteNode; onUpdate: (p: Partial<NoteNode>) => void }) {
  return (
    <section className="space-y-3 border-t border-neutral-700/50 pt-3">
      <p className="text-xs font-medium text-amber-400">📜 Nota</p>
      <Field label="Título"><input value={trigger.title} onChange={e => onUpdate({ title: e.target.value })} className={inputCls} maxLength={120} /></Field>
      <Field label="Conteúdo (markdown)"><textarea value={trigger.content} onChange={e => onUpdate({ content: e.target.value })} className={clsx(inputCls,"resize-none h-24")} maxLength={4000} /></Field>
      <Select label="Revelar para jogadores" value={trigger.revealOn}
        onChange={v => onUpdate({ revealOn: v as NoteNode["revealOn"] })}
        options={[{ value:"never",label:"Nunca (só mestre)" },{ value:"enter_zone",label:"Ao entrar na zona" },{ value:"master_reveal",label:"Mestre revela" }]} />
      <Field label="Cor do ícone">
        <input type="color" value={trigger.iconColor} onChange={e => onUpdate({ iconColor: e.target.value as `#${string}` })}
          className="h-8 w-16 rounded cursor-pointer bg-transparent" />
      </Field>
    </section>
  )
}

function TrapFields({ trigger, onUpdate }: { trigger: TrapNode; onUpdate: (p: Partial<TrapNode>) => void }) {
  const eff = trigger.effects[0]
  return (
    <section className="space-y-3 border-t border-neutral-700/50 pt-3">
      <p className="text-xs font-medium text-red-400">⚠️ Armadilha</p>
      <Field label="Rótulo (interno)"><input value={trigger.label ?? ""} onChange={e => onUpdate({ label: e.target.value })} className={inputCls} maxLength={80} /></Field>
      <div className="flex gap-4">
        <Checkbox label="Oculta"    checked={trigger.isHidden}  onChange={v => onUpdate({ isHidden: v })} />
        <Checkbox label="Desarmada" checked={trigger.isDisarmed} onChange={v => onUpdate({ isDisarmed: v })} />
      </div>
      {trigger.isHidden && (
        <div className="flex gap-2">
          <Field label="DC Detectar"><input type="number" min={1} max={30} value={trigger.detectDc ?? 14} onChange={e => onUpdate({ detectDc: Number(e.target.value) })} className={inputCls} /></Field>
          <Field label="DC Desarmar"><input type="number" min={1} max={30} value={trigger.disarmDc ?? 12} onChange={e => onUpdate({ disarmDc: Number(e.target.value) })} className={inputCls} /></Field>
        </div>
      )}
      {eff && eff.kind === "damage" && (
        <div className="space-y-2 bg-neutral-800/50 rounded-lg p-3">
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Dano principal</p>
          <div className="flex gap-2">
            <Field label="Qtd"><input type="number" min={1} max={20} value={eff.diceCount} onChange={e => onUpdate({ effects:[{...eff,diceCount:Number(e.target.value)},...trigger.effects.slice(1)] })} className={inputCls} /></Field>
            <Field label="Dado">
              <Select value={String(eff.diceFaces)} onChange={v => onUpdate({ effects:[{...eff,diceFaces:Number(v) as typeof eff.diceFaces},...trigger.effects.slice(1)] })}
                options={[4,6,8,10,12,20].map(f => ({ value:String(f),label:`d${f}` }))} />
            </Field>
            <Field label="Bônus"><input type="number" value={eff.modifier} onChange={e => onUpdate({ effects:[{...eff,modifier:Number(e.target.value)},...trigger.effects.slice(1)] })} className={inputCls} /></Field>
          </div>
          <Select label="Tipo" value={eff.damageType} onChange={v => onUpdate({ effects:[{...eff,damageType:v as typeof eff.damageType},...trigger.effects.slice(1)] })}
            options={["piercing","slashing","bludgeoning","fire","cold","lightning","acid","poison","psychic","necrotic","radiant","force","thunder"].map(d=>({ value:d,label:d }))} />
        </div>
      )}
    </section>
  )
}

function SpawnFields({ trigger, onUpdate }: { trigger: SpawnNode; onUpdate: (p: Partial<SpawnNode>) => void }) {
  return (
    <section className="space-y-3 border-t border-neutral-700/50 pt-3">
      <p className="text-xs font-medium text-green-400">🎯 Spawn Point</p>
      <Field label="Rótulo"><input value={trigger.label ?? ""} onChange={e => onUpdate({ label: e.target.value })} className={inputCls} maxLength={80} /></Field>
      <Select label="Para" value={trigger.forRole} onChange={v => onUpdate({ forRole: v as SpawnNode["forRole"] })}
        options={[{ value:"any",label:"Qualquer" },{ value:"player",label:"Jogador" },{ value:"npc",label:"NPC" },{ value:"enemy",label:"Inimigo" }]} />
      <Field label="Direção (°)"><input type="number" min={0} max={360} value={trigger.facing} onChange={e => onUpdate({ facing: Number(e.target.value) })} className={inputCls} /></Field>
    </section>
  )
}

const inputCls = "w-full bg-neutral-800 text-neutral-200 text-xs rounded px-2 py-1.5 border border-neutral-700/50 outline-none focus:border-neutral-500"
function Label({ children }: { children: React.ReactNode }) { return <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium">{children}</p> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1"><Label>{label}</Label>{children}</div> }
function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center gap-1.5 cursor-pointer text-xs text-neutral-400"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded border-neutral-600 bg-neutral-800 accent-blue-500" />{label}</label>
}
function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label?: string }) {
  return <div className="space-y-1">{label && <Label>{label}</Label>}<select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
}
