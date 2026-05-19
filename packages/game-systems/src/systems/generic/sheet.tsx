import { useState } from "react"
import { clsx } from "clsx"
import type { CharacterSheetProps, CombatAbility } from "../../types.js"

const inputCls = "w-full bg-neutral-900 text-neutral-200 text-sm rounded-lg px-3 py-2 border border-neutral-700/50 outline-none focus:border-neutral-500 placeholder-neutral-700"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><label className="text-xs text-neutral-500">{label}</label>{children}</div>
}

const RESOURCES = ["PD", "PM", "PA", "PE", "Ação", "Bônus", "Gratuito"]

export function GenericCharacterSheet({ data, onSave, saving, readOnly }: CharacterSheetProps) {
  const [name,      setName]     = useState(String(data.characterName ?? ""))
  const [notes,     setNotes]    = useState(String(data.notes         ?? ""))
  const [avatarUrl, setAvatar]   = useState(String((data.avatar as { url?: string } | undefined)?.url ?? ""))
  const [abilities, setAbilities] = useState<CombatAbility[]>(
    () => (data.combatAbilities as CombatAbility[] | undefined) ?? []
  )
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    await onSave({
      characterName: name,
      notes,
      avatar: avatarUrl ? { type: "image", url: avatarUrl } : { type: "none" },
      combatAbilities: abilities,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addAbility = () => setAbilities(prev => [...prev, {
    id: crypto.randomUUID(), name: "", description: "", cost: 1, resource: "PD",
  }])
  const updAbility = (id: string, patch: Partial<CombatAbility>) =>
    setAbilities(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a))
  const delAbility = (id: string) =>
    setAbilities(prev => prev.filter(a => a.id !== id))

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-neutral-200">Ficha de personagem</h2>

      <Field label="Nome do personagem">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome..."
          className={inputCls} disabled={readOnly} />
      </Field>

      <Field label="Notas e descrição">
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Descrição, traços, habilidades especiais, itens... Formato livre."
          className={clsx(inputCls, "resize-none h-32")} disabled={readOnly} />
      </Field>

      <Field label="URL do avatar (imagem ou .glb — opcional)">
        <input value={avatarUrl} onChange={e => setAvatar(e.target.value)}
          placeholder="https://exemplo.com/avatar.png"
          className={inputCls} disabled={readOnly} />
      </Field>

      {/* ── Habilidades de combate ──────────────────────────────────────────── */}
      <div className="pt-2 border-t border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-neutral-300">Habilidades de combate</p>
            <p className="text-xs text-neutral-600 mt-0.5">Aparecem no painel de visão de combate.</p>
          </div>
          {!readOnly && (
            <button onClick={addAbility}
              className="text-xs bg-purple-900/60 hover:bg-purple-800/60 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-700/40 transition-colors">
              + Adicionar
            </button>
          )}
        </div>

        {abilities.length === 0 && (
          <p className="text-neutral-700 text-xs text-center py-4">
            {readOnly ? "Nenhuma habilidade cadastrada." : "Nenhuma habilidade ainda."}
          </p>
        )}

        <div className="space-y-3">
          {abilities.map(ab => (
            <div key={ab.id} className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-3 space-y-3">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Field label="Nome">
                    <input value={ab.name} onChange={e => updAbility(ab.id, { name: e.target.value })}
                      placeholder="Golpe Brutal" className={inputCls} disabled={readOnly} />
                  </Field>
                </div>
                <div style={{ width: 68 }}>
                  <Field label="Custo">
                    <input type="number" min={0} max={99} value={ab.cost}
                      onChange={e => updAbility(ab.id, { cost: Number(e.target.value) })}
                      disabled={readOnly} className={`${inputCls} text-center`} />
                  </Field>
                </div>
                <div style={{ width: 100 }}>
                  <Field label="Recurso">
                    <select value={ab.resource} onChange={e => updAbility(ab.id, { resource: e.target.value })}
                      disabled={readOnly} className={inputCls}>
                      {RESOURCES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </Field>
                </div>
                {!readOnly && (
                  <button onClick={() => delAbility(ab.id)}
                    className="mb-1 text-neutral-600 hover:text-red-400 transition-colors text-sm px-1">
                    ✕
                  </button>
                )}
              </div>
              <Field label="Descrição">
                <textarea value={ab.description}
                  onChange={e => updAbility(ab.id, { description: e.target.value })}
                  disabled={readOnly} className={`${inputCls} resize-none`} rows={2}
                  placeholder="Efeito, condição, dano..." />
              </Field>
            </div>
          ))}
        </div>
      </div>

      {!readOnly && (
        <div className="flex items-center gap-3 pt-2">
          <button onClick={handleSave} disabled={saving}
            className="bg-purple-700 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar ficha"}
          </button>
          {saved && <span className="text-xs text-green-400">✓ Salvo</span>}
        </div>
      )}
    </div>
  )
}
