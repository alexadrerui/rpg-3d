import { useState, useCallback } from "react"
import { systemRegistry } from "@rpg3d/game-systems"

interface CharacterSheetPanelProps {
  systemId:    string
  sheetData:   Record<string, unknown>
  onSave:      (patch: Record<string, unknown>) => Promise<void>
  open:        boolean
  onClose:     () => void
}

export function CharacterSheetPanel({
  systemId,
  sheetData,
  onSave,
  open,
  onClose,
}: CharacterSheetPanelProps) {
  const [saving, setSaving] = useState(false)

  const system = systemRegistry.get(systemId)

  const handleSave = useCallback(async (patch: Record<string, unknown>) => {
    setSaving(true)
    try {
      await onSave(patch)
    } finally {
      setSaving(false)
    }
  }, [onSave])

  return (
    <>
      {open && (
        <div
          className="absolute inset-0 bg-black/40 pointer-events-auto"
          style={{ zIndex: 40 }}
          onClick={onClose}
        />
      )}

      <div
        className="absolute top-0 left-0 h-full flex flex-col pointer-events-auto bg-neutral-950 border-r border-neutral-800/80 transition-transform duration-300 ease-out"
        style={{
          zIndex:    41,
          width:     "min(440px, 92vw)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          boxShadow: open ? "6px 0 32px rgba(0,0,0,0.7)" : "none",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800 shrink-0">
          <div>
            <p className="text-sm font-semibold text-neutral-200">Ficha do Personagem</p>
            {system && (
              <p className="text-[11px] text-neutral-500 mt-0.5">{system.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Sheet content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
          {system ? (
            <system.CharacterSheet
              data={sheetData}
              onSave={handleSave}
              saving={saving}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <p className="text-neutral-400 text-sm">Sistema não encontrado</p>
              <p className="text-neutral-600 text-xs font-mono">{systemId}</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
