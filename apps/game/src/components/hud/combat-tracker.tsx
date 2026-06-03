import { useState } from "react"
import { clsx } from "clsx"
import type { CombatantEntry, CombatState } from "@rpg3d/sync-client"

// ─────────────────────────────────────────────────────────────────────────────
// Faixa de iniciativa — exibida no topo da tela durante combate por turno
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  combatState:      CombatState
  sheetStates:      Record<string, Record<string, unknown>>
  isMaster:         boolean
  myCharacterId?:   string
  onNextTurn:       () => void
  onEndCombat:      () => void
  onSetHp:          (combatantId: string, hp: number) => void
}

export function CombatTracker({
  combatState, sheetStates, isMaster, myCharacterId,
  onNextTurn, onEndCombat, onSetHp,
}: Props) {
  const { active, round, turnIndex, combatants } = combatState
  if (!active || combatants.length === 0) return null

  const current = combatants[turnIndex]
  const isMyTurn = !!myCharacterId && current?.id === myCharacterId
  const canAdvance = isMaster || isMyTurn

  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center gap-2 px-3 py-1.5 bg-neutral-950/95 border-b border-neutral-800/70 backdrop-blur-md pointer-events-auto"
      style={{ zIndex: 35 }}
    >
      {/* Round counter */}
      <div className="shrink-0 flex flex-col items-center leading-none mr-1">
        <span className="text-[9px] text-neutral-600 uppercase tracking-widest">Round</span>
        <span className="text-lg font-black text-neutral-300 tabular-nums">{round}</span>
      </div>

      <div className="w-px h-8 bg-neutral-800 shrink-0" />

      {/* Combatant cards — scrollable */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-1.5 min-w-max">
          {combatants.map((c, i) => (
            <CombatantCard
              key={c.id}
              combatant={c}
              isCurrent={i === turnIndex}
              isPast={i < turnIndex}
              sheetHp={sheetStates[c.id]?.hp as number | undefined}
              sheetMaxHp={sheetStates[c.id]?.maxHp as number | undefined}
              isMaster={isMaster}
              onSetHp={onSetHp}
            />
          ))}
        </div>
      </div>

      <div className="w-px h-8 bg-neutral-800 shrink-0" />

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-2">
        {isMyTurn && !isMaster && (
          <div className="text-[10px] text-amber-400/80 font-semibold animate-pulse">
            Seu turno!
          </div>
        )}
        {canAdvance && (
          <button
            onClick={onNextTurn}
            className="flex items-center gap-1.5 bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 hover:text-amber-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-800/50 hover:border-amber-700/60 transition-all"
          >
            <span>▶</span>
            <span>Passar</span>
          </button>
        )}
        {isMaster && (
          <button
            onClick={onEndCombat}
            className="text-[10px] text-neutral-600 hover:text-red-400 px-2 py-1.5 rounded border border-neutral-800/50 hover:border-red-900/50 transition-colors"
          >
            ✕ Encerrar
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Card individual de combatente
// ─────────────────────────────────────────────────────────────────────────────

function CombatantCard({
  combatant, isCurrent, isPast, sheetHp, sheetMaxHp, isMaster, onSetHp,
}: {
  combatant:  CombatantEntry
  isCurrent:  boolean
  isPast:     boolean
  sheetHp?:   number
  sheetMaxHp?: number
  isMaster:   boolean
  onSetHp:    (id: string, hp: number) => void
}) {
  const [editingHp, setEditingHp] = useState(false)
  const [hpInput,   setHpInput]   = useState("")

  const hp    = sheetHp    ?? combatant.hp
  const maxHp = sheetMaxHp ?? combatant.maxHp
  const hpPct = hp != null && maxHp != null && maxHp > 0 ? (hp / maxHp) * 100 : null

  const hpColor =
    hpPct == null   ? "bg-neutral-600" :
    hpPct > 60      ? "bg-green-500"   :
    hpPct > 25      ? "bg-yellow-500"  :
                      "bg-red-500"

  const isEnemy = combatant.role === "enemy"

  const commitHp = () => {
    const val = parseInt(hpInput, 10)
    if (!isNaN(val) && val >= 0) onSetHp(combatant.id, val)
    setEditingHp(false)
    setHpInput("")
  }

  return (
    <div
      className={clsx(
        "relative flex flex-col items-center rounded-lg px-2 py-1 gap-0.5 transition-all duration-200 cursor-default",
        "border",
        isCurrent
          ? "bg-amber-950/70 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
          : isPast
          ? "bg-neutral-900/40 border-neutral-800/40 opacity-60"
          : "bg-neutral-900/60 border-neutral-800/40",
        combatant.isDefeated && "opacity-30 grayscale",
      )}
      style={{ minWidth: 68, maxWidth: 80 }}
    >
      {/* Initiative badge */}
      <div
        className={clsx(
          "text-[10px] font-black tabular-nums",
          isCurrent ? "text-amber-400" : "text-neutral-500",
        )}
      >
        {combatant.initiative}
      </div>

      {/* Role icon */}
      <div className="text-[11px] leading-none">
        {combatant.isDefeated ? "💀" : isEnemy ? "⚔" : combatant.isPlayer ? "🧙" : "🗣"}
      </div>

      {/* Name */}
      <div
        className={clsx(
          "text-[10px] leading-tight text-center font-medium truncate w-full",
          isCurrent ? "text-amber-200" : "text-neutral-300",
          combatant.isDefeated && "line-through",
        )}
        title={combatant.name}
      >
        {combatant.name}
      </div>

      {/* HP bar / editor */}
      {hp != null && (
        <div className="w-full mt-0.5">
          {isMaster && editingHp ? (
            <input
              autoFocus
              type="number"
              value={hpInput}
              onChange={e => setHpInput(e.target.value)}
              onBlur={commitHp}
              onKeyDown={e => { if (e.key === "Enter") commitHp(); if (e.key === "Escape") setEditingHp(false) }}
              className="w-full text-[10px] text-center bg-neutral-800 border border-amber-700/60 rounded text-amber-300 outline-none px-0.5 py-px"
              placeholder={String(hp)}
            />
          ) : (
            <button
              className="w-full"
              disabled={!isMaster}
              onClick={() => { if (isMaster) { setHpInput(String(hp)); setEditingHp(true) } }}
              title={isMaster ? "Clique para editar HP" : undefined}
            >
              <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${hpColor}`}
                  style={{ width: `${Math.max(0, hpPct ?? 0)}%` }}
                />
              </div>
              <div className="text-[9px] text-neutral-600 text-center tabular-nums mt-0.5">
                {hp}{maxHp != null ? `/${maxHp}` : ""}
              </div>
            </button>
          )}
        </div>
      )}

      {/* Actions remaining (current actor only) */}
      {isCurrent && !combatant.isDefeated && (
        <div className="flex gap-0.5 mt-0.5">
          <ActionDot label="A" active={combatant.hasAction} />
          <ActionDot label="B" active={combatant.hasBonusAction} />
          <ActionDot label="M" active={combatant.hasMovement} />
        </div>
      )}
    </div>
  )
}

function ActionDot({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      title={label === "A" ? "Ação" : label === "B" ? "Ação Bônus" : "Movimento"}
      className={clsx(
        "w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black border",
        active
          ? "bg-amber-500/20 border-amber-600/60 text-amber-400"
          : "bg-neutral-900 border-neutral-700/40 text-neutral-700",
      )}
    >
      {label}
    </div>
  )
}
