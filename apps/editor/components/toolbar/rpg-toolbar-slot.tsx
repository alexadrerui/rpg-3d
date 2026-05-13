"use client"
import { clsx }             from "clsx"
import { useTriggerStore }  from "../../store/trigger-store"

// ─────────────────────────────────────────────────────────────────────────────
// RpgToolbarSlot — botões RPG injetados no slot viewerToolbarRight do Pascal Editor
// Fica na barra de ferramentas do viewer, ao lado dos controles de câmera
// ─────────────────────────────────────────────────────────────────────────────

const TOOLS = [
  { key: "note"          as const, icon: "📜", label: "Adicionar nota",          shortcut: "N" },
  { key: "trap"          as const, icon: "⚠️", label: "Adicionar armadilha",     shortcut: "T" },
  { key: "spawn"         as const, icon: "🎯", label: "Adicionar spawn point",   shortcut: "S" },
  { key: "transition"    as const, icon: "🚪", label: "Adicionar transição",     shortcut: "D" },
  { key: "ambient_audio" as const, icon: "🔊", label: "Adicionar áudio ambiente",shortcut: "A" },
]

type Props = {
  onPublish: () => void
}

export function RpgToolbarSlot({ onPublish }: Props) {
  const { activeTool, setActiveTool } = useTriggerStore()

  return (
    <div className="flex items-center gap-0.5 border-l border-neutral-700/50 pl-2 ml-1">

      {/* Separator label */}
      <span className="text-[9px] text-neutral-600 uppercase tracking-widest mr-1.5 hidden lg:block">RPG</span>

      {/* Tool buttons */}
      {TOOLS.map(tool => (
        <button
          key={tool.key}
          title={`${tool.label} (${tool.shortcut})`}
          onClick={() => setActiveTool(activeTool === tool.key ? "select" : tool.key)}
          className={clsx(
            "w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all",
            "hover:bg-neutral-700/60",
            activeTool === tool.key
              ? "bg-neutral-700 ring-1 ring-neutral-400/50 scale-105"
              : "opacity-70 hover:opacity-100"
          )}
        >
          {tool.icon}
        </button>
      ))}

      {/* Divider */}
      <div className="w-px h-5 bg-neutral-700/50 mx-1" />

      {/* Publish button */}
      <button
        title="Exportar .rpgscene"
        onClick={onPublish}
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium text-green-400 hover:bg-green-950/50 hover:text-green-300 transition-all border border-green-900/40 hover:border-green-700/50"
      >
        <span>↑</span>
        <span className="hidden lg:block">Publicar</span>
      </button>
    </div>
  )
}
