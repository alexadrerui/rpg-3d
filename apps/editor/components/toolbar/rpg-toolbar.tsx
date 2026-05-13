"use client"
import { clsx } from "clsx"
import { useTriggerStore } from "../../store/trigger-store"

const TOOLS = [
  { key: "select"        as const, icon: "↖",  label: "Selecionar",    color: "text-neutral-300" },
  { key: "note"          as const, icon: "📜", label: "Nota",          color: "text-amber-400"   },
  { key: "trap"          as const, icon: "⚠️", label: "Armadilha",     color: "text-red-400"     },
  { key: "spawn"         as const, icon: "🎯", label: "Spawn",         color: "text-green-400"   },
  { key: "transition"    as const, icon: "🚪", label: "Transição",     color: "text-blue-400"    },
  { key: "ambient_audio" as const, icon: "🔊", label: "Áudio ambiente",color: "text-purple-400"  },
]

type Props = { onPublish?: () => void }

export function RpgToolbar({ onPublish }: Props) {
  const { activeTool, setActiveTool } = useTriggerStore()

  return (
    <div className="flex flex-col gap-1 p-1.5 bg-neutral-900/95 backdrop-blur-sm border border-neutral-700/50 rounded-xl shadow-xl">
      <span className="text-[9px] text-neutral-600 uppercase tracking-widest px-2 pt-1">RPG</span>

      {TOOLS.map(tool => (
        <button key={tool.key} title={tool.label}
          onClick={() => setActiveTool(activeTool === tool.key ? null : tool.key)}
          className={clsx(
            "w-9 h-9 flex items-center justify-center rounded-lg text-base transition-all",
            activeTool === tool.key ? "bg-neutral-700 ring-1 ring-neutral-500 scale-105" : "hover:bg-neutral-800",
            tool.color
          )}
        >{tool.icon}</button>
      ))}

      <div className="h-px bg-neutral-700/50 mx-2 my-0.5" />

      <button title="Publicar .rpgscene" onClick={onPublish}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-sm text-green-400 hover:bg-green-950/50 hover:text-green-300 transition-all">
        ↑
      </button>
    </div>
  )
}
