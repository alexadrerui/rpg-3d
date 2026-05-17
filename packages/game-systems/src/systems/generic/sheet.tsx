import { useState } from "react"
import { clsx } from "clsx"
import type { CharacterSheetProps } from "../../types.js"

const inputCls = "w-full bg-neutral-900 text-neutral-200 text-sm rounded-lg px-3 py-2 border border-neutral-700/50 outline-none focus:border-neutral-500 placeholder-neutral-700"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><label className="text-xs text-neutral-500">{label}</label>{children}</div>
}

export function GenericCharacterSheet({ data, onSave, saving, readOnly }: CharacterSheetProps) {
  const [name,     setName]     = useState(String(data.characterName ?? ""))
  const [notes,    setNotes]    = useState(String(data.notes         ?? ""))
  const [avatarUrl, setAvatar]  = useState(String((data.avatar as { url?: string } | undefined)?.url ?? ""))
  const [saved, setSaved]       = useState(false)

  const handleSave = async () => {
    await onSave({ characterName: name, notes, avatar: avatarUrl ? { type: "image", url: avatarUrl } : { type: "none" } })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

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
          className={clsx(inputCls, "resize-none h-40")} disabled={readOnly} />
      </Field>

      <Field label="URL do avatar (imagem ou .glb — opcional)">
        <input value={avatarUrl} onChange={e => setAvatar(e.target.value)}
          placeholder="https://exemplo.com/avatar.png"
          className={inputCls} disabled={readOnly} />
      </Field>

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
