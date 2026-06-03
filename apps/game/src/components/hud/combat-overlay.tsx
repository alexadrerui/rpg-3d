import { useState } from "react"
import { clsx } from "clsx"
import type { CombatantEntry } from "@rpg3d/sync-client"

// ─────────────────────────────────────────────────────────────────────────────
// Painel de combate — overlay HTML sobre o canvas 3D.
// Aparece quando o jogador ativa a visão de combate (terceira pessoa).
// Exibe habilidades do personagem em cards na lateral esquerda.
// Ao armar uma habilidade, abre o seletor de alvo na lateral direita.
// ─────────────────────────────────────────────────────────────────────────────

export type AbilityEffect    = "damage" | "heal" | "none"
export type AbilityTargeting = "enemy" | "ally" | "self" | "any"

export interface CombatAbility {
  id:          string
  name:        string
  description: string
  cost:        number
  resource:    string
  effect?:     AbilityEffect
  dice?:       string
  attribute?:  string
  bonus?:      number
  targeting?:  AbilityTargeting
}

type Props = {
  abilities:     CombatAbility[]
  combatants:    CombatantEntry[]
  myCharacterId?: string
  onExit:        () => void
  onUseAbility?: (ability: CombatAbility, targetId: string) => void
}

/** Decide quais combatentes são alvos válidos para a habilidade armada. */
function validTargets(
  ab: CombatAbility,
  combatants: CombatantEntry[],
  myCharacterId?: string,
): CombatantEntry[] {
  const targeting = ab.targeting ?? (ab.effect === "heal" ? "ally" : "enemy")
  return combatants.filter(c => {
    if (c.isDefeated && ab.effect !== "heal") return false
    const isSelf = !!myCharacterId && c.id === myCharacterId
    switch (targeting) {
      case "self":  return isSelf
      case "enemy": return !c.isPlayer || (!isSelf && c.role != null)
      case "ally":  return c.isPlayer
      case "any":   return true
    }
  })
}

export function CombatOverlay({ abilities, combatants, myCharacterId, onExit, onUseAbility }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    abilities[0]?.id ?? null
  )
  // Habilidade "armada" aguardando seleção de alvo
  const [armed, setArmed] = useState<CombatAbility | null>(null)

  const handlePick = (ab: CombatAbility) => {
    setSelectedId(ab.id)
    const targets = validTargets(ab, combatants, myCharacterId)
    // Sem alvo possível, ou alvo único óbvio (self) → resolve direto
    if (targets.length === 0) { setArmed(null); return }
    if ((ab.targeting ?? "enemy") === "self" && targets.length === 1) {
      onUseAbility?.(ab, targets[0].id)
      setArmed(null)
      return
    }
    setArmed(ab)
  }

  const handleConfirmTarget = (targetId: string) => {
    if (armed) onUseAbility?.(armed, targetId)
    setArmed(null)
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none">

      {/* Vignette cinematográfica */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, rgba(0,0,0,0.7) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Barra superior com indicador + botão de saída */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 pointer-events-auto">
        <div className="flex items-center gap-2 bg-neutral-950/80 border border-red-900/40 text-red-400/80 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          Visão de combate
        </div>
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs px-3 py-1.5 rounded-full border border-neutral-700/50 hover:border-neutral-500/60 transition-all backdrop-blur-sm"
        >
          <span>↩</span>
          <span>Sair</span>
        </button>
      </div>

      {/* Cards de habilidades — lado esquerdo, centralizado verticalmente */}
      <div
        className="absolute left-5 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2 pointer-events-auto"
        style={{ width: 310 }}
      >
        {abilities.length === 0 && (
          <div className="bg-neutral-950/85 border border-neutral-800/60 rounded-lg px-5 py-8 text-center backdrop-blur-sm">
            <p className="text-neutral-500 text-xs">Nenhuma habilidade cadastrada.</p>
            <p className="text-neutral-700 text-xs mt-1">Adicione habilidades na aba "Habilidades" da ficha.</p>
          </div>
        )}

        {abilities.map(ab => {
          const active = ab.id === selectedId
          return (
            <button
              key={ab.id}
              onClick={() => handlePick(ab)}
              className={clsx(
                "relative text-left overflow-hidden rounded-sm transition-all duration-200 group",
                "border",
                active
                  ? "border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2),inset_0_0_30px_rgba(245,158,11,0.04)]"
                  : "border-neutral-700/40 hover:border-neutral-600/60",
              )}
              style={{
                background: active
                  ? "linear-gradient(135deg, rgba(28,20,8,0.97) 0%, rgba(20,14,5,0.97) 100%)"
                  : "linear-gradient(135deg, rgba(16,16,20,0.94) 0%, rgba(12,12,16,0.94) 100%)",
                backdropFilter: "blur(8px)",
              }}
            >
              {/* Barra esquerda colorida */}
              <div
                className={clsx(
                  "absolute left-0 top-0 bottom-0 w-[3px] transition-colors duration-200",
                  active ? "bg-amber-500" : "bg-red-900/70 group-hover:bg-red-800/80",
                )}
              />

              <div className="pl-4 pr-3 pt-2.5 pb-2.5">
                {/* Linha de título + custo */}
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={clsx(
                      "font-black text-xs tracking-[0.15em] uppercase leading-tight flex-1",
                      active ? "text-amber-300" : "text-neutral-100",
                    )}
                  >
                    {ab.name || "—"}
                  </h3>
                  <div
                    className={clsx(
                      "shrink-0 mt-0.5 px-1.5 py-0.5 text-[10px] font-black tracking-wider rounded-sm",
                      active
                        ? "bg-amber-950/90 text-amber-400 border border-amber-800/60"
                        : "bg-neutral-900 text-neutral-400 border border-neutral-700/30",
                    )}
                  >
                    {ab.cost} {ab.resource}
                  </div>
                </div>

                {/* Descrição */}
                {ab.description && (
                  <p
                    className={clsx(
                      "text-[11px] mt-1.5 leading-relaxed",
                      active ? "text-amber-100/50" : "text-neutral-500",
                    )}
                  >
                    {ab.description}
                  </p>
                )}

                {/* Resolução — dado/efeito */}
                {ab.effect && ab.effect !== "none" && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span
                      className={clsx(
                        "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm border",
                        ab.effect === "heal"
                          ? "bg-green-950/60 text-green-400 border-green-800/50"
                          : "bg-red-950/60 text-red-400 border-red-800/50",
                      )}
                    >
                      {ab.effect === "heal" ? "✚ Cura" : "⚔ Dano"}
                    </span>
                    {ab.dice && (
                      <span className="text-[9px] font-mono text-neutral-400 bg-neutral-900/80 border border-neutral-700/40 px-1.5 py-0.5 rounded-sm">
                        {ab.dice}
                        {ab.attribute ? `+${ab.attribute.slice(0, 3).toUpperCase()}` : ""}
                        {ab.bonus ? `+${ab.bonus}` : ""}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Seletor de alvo — lado direito quando há habilidade armada */}
      {armed && (
        <TargetPicker
          ability={armed}
          targets={validTargets(armed, combatants, myCharacterId)}
          onPick={handleConfirmTarget}
          onCancel={() => setArmed(null)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Seletor de alvo — aparece à direita ao armar uma habilidade
// ─────────────────────────────────────────────────────────────────────────────

function TargetPicker({
  ability, targets, onPick, onCancel,
}: {
  ability: CombatAbility
  targets: CombatantEntry[]
  onPick:  (targetId: string) => void
  onCancel: () => void
}) {
  const isHeal = ability.effect === "heal"
  return (
    <div
      className="absolute right-5 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 pointer-events-auto"
      style={{ width: 280 }}
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/90">
          Alvo · {ability.name || "—"}
        </span>
        <button
          onClick={onCancel}
          className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          Cancelar
        </button>
      </div>

      {targets.length === 0 && (
        <div className="bg-neutral-950/85 border border-neutral-800/60 rounded-lg px-4 py-6 text-center backdrop-blur-sm">
          <p className="text-neutral-500 text-xs">Nenhum alvo válido.</p>
        </div>
      )}

      {targets.map(t => {
        const hpPct = t.hp != null && t.maxHp != null && t.maxHp > 0
          ? Math.max(0, (t.hp / t.maxHp) * 100) : null
        return (
          <button
            key={t.id}
            onClick={() => onPick(t.id)}
            className={clsx(
              "text-left rounded-md border px-3 py-2 transition-all backdrop-blur-sm",
              "bg-neutral-950/85 hover:bg-neutral-900/90",
              isHeal
                ? "border-green-900/40 hover:border-green-600/60"
                : "border-red-900/40 hover:border-red-600/60",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm leading-none">
                {t.role === "enemy" ? "⚔" : t.isPlayer ? "🧙" : "🗣"}
              </span>
              <span className="text-xs font-medium text-neutral-200 flex-1 truncate">
                {t.name}
              </span>
              {t.hp != null && (
                <span className="text-[10px] tabular-nums text-neutral-500">
                  {t.hp}{t.maxHp != null ? `/${t.maxHp}` : ""}
                </span>
              )}
            </div>
            {hpPct != null && (
              <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden mt-1.5">
                <div
                  className={clsx("h-full transition-all", hpPct > 50 ? "bg-green-500" : hpPct > 25 ? "bg-yellow-500" : "bg-red-500")}
                  style={{ width: `${hpPct}%` }}
                />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
