import { useEffect, useState } from "react"
import { clsx } from "clsx"
import type { CombatAbilityResult } from "@rpg3d/sync-client"

// ─────────────────────────────────────────────────────────────────────────────
// Combat log — feed flutuante de resoluções de habilidade.
// Cada entrada some sozinha após alguns segundos.
// ─────────────────────────────────────────────────────────────────────────────

export type CombatLogEntry = CombatAbilityResult & { _key: number }

const ENTRY_TTL_MS = 7000

export function CombatLog({ entries, onExpire }: {
  entries:  CombatLogEntry[]
  onExpire: (key: number) => void
}) {
  if (entries.length === 0) return null
  return (
    <div className="flex flex-col gap-1.5 items-center" style={{ width: 320 }}>
      {entries.map(e => (
        <CombatLogRow key={e._key} entry={e} onExpire={() => onExpire(e._key)} />
      ))}
    </div>
  )
}

function CombatLogRow({ entry, onExpire }: { entry: CombatLogEntry; onExpire: () => void }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const hide = setTimeout(() => setLeaving(true), ENTRY_TTL_MS - 400)
    const kill = setTimeout(onExpire, ENTRY_TTL_MS)
    return () => { clearTimeout(hide); clearTimeout(kill) }
  }, [])

  const isHeal   = entry.effect === "heal"
  const isDamage = entry.effect === "damage"
  const rollText = entry.rolls.length > 0
    ? `${entry.rolls.join("+")}${entry.modifier ? (entry.modifier > 0 ? `+${entry.modifier}` : entry.modifier) : ""}`
    : null

  return (
    <div
      className={clsx(
        "w-full rounded-lg border px-3 py-2 backdrop-blur-sm shadow-lg transition-all duration-300",
        leaving ? "opacity-0 -translate-y-1" : "opacity-100",
        isHeal
          ? "bg-green-950/85 border-green-800/50"
          : isDamage
          ? "bg-red-950/85 border-red-900/50"
          : "bg-neutral-950/85 border-neutral-800/60",
      )}
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-neutral-200 truncate">{entry.actorName}</span>
        <span className="text-neutral-500">usou</span>
        <span className="font-medium text-amber-300/90 truncate">{entry.abilityName}</span>
      </div>
      <div className="flex items-center gap-2 mt-1 text-[11px]">
        <span className="text-neutral-400">
          em <span className="text-neutral-200">{entry.targetName}</span>
        </span>
        {(isHeal || isDamage) && (
          <span
            className={clsx(
              "font-black tabular-nums px-1.5 py-0.5 rounded-sm",
              isHeal ? "bg-green-900/60 text-green-300" : "bg-red-900/60 text-red-300",
            )}
          >
            {isHeal ? "+" : "−"}{entry.total}
          </span>
        )}
        {rollText && (
          <span className="font-mono text-[10px] text-neutral-500">({rollText})</span>
        )}
        {entry.targetHpAfter != null && (
          <span className="ml-auto text-[10px] text-neutral-500 tabular-nums">
            HP {entry.targetHpAfter}
          </span>
        )}
        {entry.defeated && (
          <span className="text-[10px] font-bold text-red-400">💀 Derrotado</span>
        )}
      </div>
    </div>
  )
}
