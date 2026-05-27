import { useState, useCallback, createElement } from "react"
import type { CharacterSheetProps, ManifestField, SystemManifest, GameSystem, GameSystemMeta } from "./types.js"

// ─────────────────────────────────────────────────────────────────────────────
// ManifestCharacterSheet — renderiza ficha dinamicamente a partir de um manifest
// JSON. Usado por sistemas externos registrados no marketplace.
// ─────────────────────────────────────────────────────────────────────────────

interface ManifestSheetProps extends CharacterSheetProps {
  manifest: SystemManifest
}

export function ManifestCharacterSheet({ manifest, data, onSave, saving, readOnly }: ManifestSheetProps) {
  const [draft, setDraft]       = useState<Record<string, unknown>>(data)
  const [activeGroup, setGroup] = useState<string>("")

  // Agrupa campos por group (string vazia = sem grupo)
  const groups = groupFields(manifest.fields)
  const groupNames = Object.keys(groups)

  const currentGroup = activeGroup || groupNames[0] || ""
  const fields = groups[currentGroup] ?? []

  const set = useCallback((id: string, value: unknown) => {
    setDraft(prev => ({ ...prev, [id]: value }))
  }, [])

  const handleSave = async () => {
    await onSave(draft)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs de grupos */}
      {groupNames.length > 1 && (
        <div className="flex gap-1 flex-wrap border-b border-neutral-800 pb-2">
          {groupNames.map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setGroup(g)}
              className={`text-xs px-3 py-1.5 rounded-t transition-colors ${
                currentGroup === g
                  ? "bg-purple-800/60 text-purple-200 border border-purple-700/50"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {g || "Geral"}
            </button>
          ))}
        </div>
      )}

      {/* Campos do grupo ativo */}
      <div className="grid grid-cols-1 gap-3">
        {fields.map(field => (
          <FieldInput
            key={field.id}
            field={field}
            value={draft[field.id] ?? field.defaultValue ?? ""}
            onChange={v => set(field.id, v)}
            readOnly={readOnly}
          />
        ))}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="self-end mt-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
        >
          {saving ? "Salvando..." : "Salvar ficha"}
        </button>
      )}
    </div>
  )
}

// ── Componente de campo individual ────────────────────────────────────────────

function FieldInput({ field, value, onChange, readOnly }: {
  field:    ManifestField
  value:    unknown
  onChange: (v: unknown) => void
  readOnly?: boolean
}) {
  const base = "w-full bg-neutral-800 border border-neutral-700/50 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-purple-600/60 disabled:opacity-60"

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-neutral-400">
        {field.label}
        {field.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>

      {field.type === "textarea" && (
        <textarea
          className={`${base} min-h-[80px] resize-y`}
          value={String(value ?? "")}
          onChange={e => onChange(e.target.value)}
          disabled={readOnly}
        />
      )}

      {field.type === "text" && (
        <input
          type="text"
          className={base}
          value={String(value ?? "")}
          onChange={e => onChange(e.target.value)}
          disabled={readOnly}
        />
      )}

      {field.type === "number" && (
        <input
          type="number"
          className={base}
          value={Number(value ?? 0)}
          min={field.min}
          max={field.max}
          onChange={e => onChange(Number(e.target.value))}
          disabled={readOnly}
        />
      )}

      {field.type === "select" && (
        <select
          className={base}
          value={String(value ?? "")}
          onChange={e => onChange(e.target.value)}
          disabled={readOnly}
        >
          <option value="">Selecione...</option>
          {field.options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {field.type === "boolean" && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={e => onChange(e.target.checked)}
            disabled={readOnly}
            className="w-4 h-4 accent-purple-500"
          />
          <span className="text-xs text-neutral-400">Ativo</span>
        </label>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupFields(fields: ManifestField[]): Record<string, ManifestField[]> {
  const result: Record<string, ManifestField[]> = {}
  for (const f of fields) {
    const g = f.group ?? ""
    if (!result[g]) result[g] = []
    result[g].push(f)
  }
  return result
}

// ── Factory — cria um GameSystem a partir de metadados + manifest ──────────────

export function createManifestSystem(
  meta:     GameSystemMeta,
  manifest: SystemManifest,
): GameSystem {
  return {
    ...meta,
    defaultData: () =>
      Object.fromEntries(
        manifest.fields.map(f => [f.id, f.defaultValue ?? (f.type === "number" ? 0 : f.type === "boolean" ? false : "")])
      ),
    CharacterSheet: (props) =>
      createElement(ManifestCharacterSheet, { ...props, manifest }),
  }
}
