import { useRef, useState } from "react"
import { useDice }   from "@rpg3d/sync-client"
import type { DiceFace } from "@rpg3d/schema"
import { clsx } from "clsx"
import { DiceSettingsModal } from "./dice-settings-modal"

type Props = {
  serverUrl?:    string
  characterId?:  string
  dice3d:        boolean
  onToggleDice3d: () => void
}

const DICE_FACES: DiceFace[] = [4, 6, 8, 10, 12, 20, 100]

const DICE_COLORS: Record<number, string> = {
  4:   "from-red-700    to-red-900",
  6:   "from-blue-700   to-blue-900",
  8:   "from-green-700  to-green-900",
  10:  "from-yellow-600 to-yellow-800",
  12:  "from-purple-700 to-purple-900",
  20:  "from-pink-600   to-pink-900",
  100: "from-neutral-600 to-neutral-800",
}

const DICE_LABELS: Record<number, string> = {
  4: "d4", 6: "d6", 8: "d8", 10: "d10", 12: "d12", 20: "d20", 100: "d%"
}

export function DicePanel({ serverUrl, characterId, dice3d, onToggleDice3d }: Props) {
  const [count, setCount]       = useState(1)
  const [modifier, setModifier] = useState(0)
  const [label, setLabel]       = useState("")
  const [secret, setSecret]     = useState(false)
  const [collapsed, setCollapsed]   = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const { roll, isRolling, results } = useDice(serverUrl)

  const handleRoll = (faces: DiceFace) => {
    roll(faces, { count, modifier: modifier || 0, label: label || undefined, isSecret: secret, characterId })
      .catch(() => {/* ignore */})
  }

  return (
    <div ref={panelRef} className="relative">
      {/* Settings modal — floats above panel */}
      {showSettings && (
        <DiceSettingsModal onClose={() => setShowSettings(false)} />
      )}

      <div className={clsx(
        "flex flex-col bg-neutral-900/90 backdrop-blur-sm border border-neutral-700/50 rounded-xl overflow-hidden transition-all",
        collapsed ? "w-40 h-10" : "w-64",
      )}>

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700/50 shrink-0">
          <span className="text-xs font-medium text-neutral-300">🎲 Dados</span>
          <div className="flex items-center gap-1.5">
            {/* 3D toggle */}
            <button
              onClick={onToggleDice3d}
              title={dice3d ? "Desativar animação 3D" : "Ativar animação 3D"}
              className={clsx(
                "text-[11px] px-1.5 py-0.5 rounded font-medium transition-colors",
                dice3d
                  ? "text-indigo-300 bg-indigo-900/60 hover:bg-indigo-900"
                  : "text-neutral-600 bg-neutral-800 hover:text-neutral-400",
              )}
            >
              3D
            </button>
            {/* Settings gear — only visible when 3D is on */}
            {dice3d && (
              <button
                onClick={() => setShowSettings((s) => !s)}
                title="Configurações dos dados 3D"
                className={clsx(
                  "text-[13px] transition-colors leading-none",
                  showSettings
                    ? "text-indigo-300"
                    : "text-neutral-500 hover:text-neutral-300",
                )}
              >
                ⚙
              </button>
            )}
            {/* Collapse */}
            <button
              onClick={() => { setCollapsed((c) => !c); setShowSettings(false) }}
              className="text-neutral-500 hover:text-neutral-300 text-xs"
            >
              {collapsed ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="p-3 space-y-3">
            {/* Options row */}
            <div className="flex items-center gap-2 text-xs">
              <label className="text-neutral-500">×</label>
              <input
                type="number" min={1} max={20} value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value))))}
                className="w-10 bg-neutral-800 text-neutral-200 text-center rounded px-1 py-0.5 border border-neutral-700"
              />
              <label className="text-neutral-500">+</label>
              <input
                type="number" min={-20} max={20} value={modifier}
                onChange={(e) => setModifier(Number(e.target.value))}
                className="w-12 bg-neutral-800 text-neutral-200 text-center rounded px-1 py-0.5 border border-neutral-700"
              />
              <button
                onClick={() => setSecret((s) => !s)}
                className={clsx(
                  "ml-auto px-2 py-0.5 rounded text-xs font-medium transition-colors",
                  secret ? "bg-purple-800 text-purple-200" : "bg-neutral-800 text-neutral-500",
                )}
                title="Rolagem secreta (só mestre vê)"
              >
                👁‍🗨
              </button>
            </div>

            {/* Label */}
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Rótulo (ex: Ataque)"
              className="w-full bg-neutral-800 text-neutral-300 text-xs rounded px-2 py-1 border border-neutral-700/50 outline-none focus:border-neutral-500 placeholder-neutral-600"
            />

            {/* Dice grid */}
            <div className="grid grid-cols-4 gap-1.5">
              {DICE_FACES.map((f) => (
                <button
                  key={f}
                  disabled={isRolling}
                  onClick={() => handleRoll(f)}
                  className={clsx(
                    "aspect-square flex items-center justify-center rounded-lg text-white text-xs font-bold",
                    "bg-gradient-to-b shadow-inner active:scale-95 transition-transform",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    DICE_COLORS[f],
                  )}
                >
                  {DICE_LABELS[f]}
                </button>
              ))}
            </div>

            {/* Last results */}
            {results.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between text-xs bg-neutral-800/60 rounded-lg px-2 py-1.5"
              >
                <div className="flex flex-col">
                  <span className="text-neutral-400 font-medium">
                    {r.fromName}
                    {r.label ? <span className="text-neutral-500 ml-1">· {r.label}</span> : null}
                  </span>
                  <span className="text-neutral-600 text-[10px]">
                    {r.diceCount}d{r.diceFaces}
                    {r.modifier !== 0 ? (r.modifier > 0 ? `+${r.modifier}` : r.modifier) : ""}
                    {" "}[{r.rolls.join(", ")}]
                  </span>
                </div>
                <span className={clsx(
                  "text-lg font-bold tabular-nums",
                  r.total >= r.diceFaces ? "text-amber-400" :
                  r.total <= r.diceCount  ? "text-red-400"  : "text-white",
                )}>
                  {r.total}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
