import { clsx } from "clsx"
import {
  useDiceSettings,
  COLORSETS,
  MATERIAL_PROPS,
  type MaterialPreset,
  type SpeedPreset,
  type ForcePreset,
} from "../../store/dice-settings-store"

const MATERIALS: [MaterialPreset, string][] = [
  ["plastic", "Plástico"],
  ["metal",   "Metal"],
  ["glass",   "Vidro"],
  ["chrome",  "Cromo"],
  ["stone",   "Pedra"],
  ["wood",    "Madeira"],
]

const SPEEDS: [SpeedPreset, string][] = [
  ["slow",   "Lenta"],
  ["normal", "Normal"],
  ["fast",   "Rápida"],
]

const FORCES: [ForcePreset, string][] = [
  ["weak",   "Suave"],
  ["medium", "Média"],
  ["strong", "Forte"],
]

const COLOR_FIELDS = [
  ["diceColor",  "Corpo"]  ,
  ["labelColor", "Número"] ,
  ["edgeColor",  "Borda"]  ,
] as const

export function DiceSettingsModal({ onClose }: { onClose: () => void }) {
  const { appearance, display, setAppearance, setDisplay, applyColorset } = useDiceSettings()

  const activeColorset = Object.entries(COLORSETS).find(
    ([, cs]) => cs.diceColor === appearance.diceColor
             && cs.material  === appearance.material
  )?.[0]

  return (
    <div className="absolute bottom-full right-0 mb-2 w-72 bg-neutral-900/97 backdrop-blur-md border border-neutral-700/60 rounded-xl shadow-2xl z-50">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700/50">
        <span className="text-xs font-semibold text-neutral-300">Configurações dos Dados</span>
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-neutral-300 text-xs leading-none"
        >
          ✕
        </button>
      </div>

      <div className="p-3 space-y-4 max-h-[72vh] overflow-y-auto">

        {/* ── Colorsets ── */}
        <section>
          <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-2">Tema</p>
          <div className="grid grid-cols-5 gap-1.5">
            {Object.entries(COLORSETS).map(([name, cs]) => (
              <button
                key={name}
                onClick={() => applyColorset(name)}
                title={name}
                className={clsx(
                  "aspect-square rounded-lg border-2 transition-all hover:scale-110",
                  activeColorset === name
                    ? "border-white/80 scale-110 shadow-lg"
                    : "border-transparent hover:border-white/30",
                )}
                style={{ background: cs.diceColor }}
              />
            ))}
          </div>
          {activeColorset && (
            <p className="text-[10px] text-neutral-500 text-center mt-1">{activeColorset}</p>
          )}
        </section>

        {/* ── Colors ── */}
        <section>
          <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-2">Cores</p>
          <div className="space-y-2">
            {COLOR_FIELDS.map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="text-xs text-neutral-400 w-14 shrink-0">{label}</span>
                <div className="flex items-center gap-1.5 flex-1 justify-end">
                  <input
                    type="text"
                    value={appearance[key]}
                    onChange={(e) => {
                      const v = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setAppearance({ [key]: v })
                    }}
                    maxLength={7}
                    className="w-[5.5rem] bg-neutral-800 text-neutral-300 text-[11px] text-center rounded px-1.5 py-0.5 border border-neutral-700 font-mono tracking-wide"
                  />
                  <input
                    type="color"
                    value={appearance[key]}
                    onChange={(e) => setAppearance({ [key]: e.target.value })}
                    className="w-7 h-7 rounded-md cursor-pointer bg-transparent border-0 p-0.5"
                    style={{ background: "transparent" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Material ── */}
        <section>
          <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-2">Material</p>
          <div className="grid grid-cols-3 gap-1.5">
            {MATERIALS.map(([m, label]) => {
              const props = MATERIAL_PROPS[m]
              return (
                <button
                  key={m}
                  onClick={() => setAppearance({ material: m })}
                  title={`Rugosidade ${props.roughness} · Metal ${props.metalness}`}
                  className={clsx(
                    "py-1.5 rounded-lg border transition-colors text-[11px] font-medium",
                    appearance.material === m
                      ? "bg-indigo-800/80 border-indigo-500 text-white"
                      : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-500",
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </section>

        <div className="border-t border-neutral-700/40" />

        {/* ── Speed ── */}
        <section>
          <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-2">Velocidade da animação</p>
          <div className="grid grid-cols-3 gap-1.5">
            {SPEEDS.map(([v, label]) => (
              <button
                key={v}
                onClick={() => setDisplay({ speed: v })}
                className={clsx(
                  "py-1.5 rounded-lg border transition-colors text-[11px] font-medium",
                  display.speed === v
                    ? "bg-indigo-800/80 border-indigo-500 text-white"
                    : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-500",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Throwing force ── */}
        <section>
          <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-2">Força do arremesso</p>
          <div className="grid grid-cols-3 gap-1.5">
            {FORCES.map(([v, label]) => (
              <button
                key={v}
                onClick={() => setDisplay({ throwingForce: v })}
                className={clsx(
                  "py-1.5 rounded-lg border transition-colors text-[11px] font-medium",
                  display.throwingForce === v
                    ? "bg-indigo-800/80 border-indigo-500 text-white"
                    : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-500",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Auto-hide delay ── */}
        <section>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Ocultar resultado após</p>
            <span className="text-[11px] text-indigo-400 font-semibold tabular-nums">
              {display.autoHideDelay}s
            </span>
          </div>
          <input
            type="range"
            min={2}
            max={10}
            step={1}
            value={display.autoHideDelay}
            onChange={(e) => setDisplay({ autoHideDelay: Number(e.target.value) })}
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-600 mt-0.5">
            <span>2s</span>
            <span>10s</span>
          </div>
        </section>

      </div>
    </div>
  )
}
