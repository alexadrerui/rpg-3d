import { useState } from "react"
import { clsx } from "clsx"

// ─────────────────────────────────────────────────────────────────────────────
// Painel de combate — overlay HTML sobre o canvas 3D.
// Aparece quando o jogador ativa a visão de combate (terceira pessoa).
// Exibe habilidades do personagem em cards na lateral esquerda.
// ─────────────────────────────────────────────────────────────────────────────

export interface CombatAbility {
  id:          string
  name:        string
  description: string
  cost:        number
  resource:    string
}

type Props = {
  abilities:     CombatAbility[]
  onExit:        () => void
  onUseAbility?: (ability: CombatAbility) => void
}

export function CombatOverlay({ abilities, onExit, onUseAbility }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    abilities[0]?.id ?? null
  )

  const handleUse = (ab: CombatAbility) => {
    setSelectedId(ab.id)
    onUseAbility?.(ab)
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
              onClick={() => handleUse(ab)}
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
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
