import { useCallback, useEffect, useRef, useState } from "react"
import { clsx } from "clsx"
import { useDice } from "@rpg3d/sync-client"
import type { DiceResult } from "@rpg3d/sync-client"
import { DiceScene } from "./dice-scene"
import {
  useDiceSettings,
  SPEED_MS,
  FORCE_MUL,
} from "../../store/dice-settings-store"

const EXIT_MS = 350

type Phase = "rolling" | "result" | "exit"

interface Props {
  serverUrl?: string
}

export function DiceOverlay({ serverUrl }: Props) {
  const { lastResult } = useDice(serverUrl)
  const { appearance, display } = useDiceSettings()

  const [visible, setVisible] = useState(false)
  const [roll, setRoll]       = useState<DiceResult | null>(null)
  const [phase, setPhase]     = useState<Phase>("rolling")

  const seenId = useRef<string | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }

  const dismiss = useCallback(() => {
    clearTimers()
    setPhase("exit")
    timers.current.push(setTimeout(() => setVisible(false), EXIT_MS))
  }, [])

  useEffect(() => {
    if (!lastResult || lastResult.id === seenId.current) return
    seenId.current = lastResult.id

    const { roll: rollMs } = SPEED_MS[display.speed]
    const resultMs = display.autoHideDelay * 1000

    clearTimers()
    setRoll(lastResult)
    setPhase("rolling")
    setVisible(true)

    timers.current.push(
      setTimeout(() => setPhase("result"), rollMs),
      setTimeout(() => setPhase("exit"),   rollMs + resultMs),
      setTimeout(() => setVisible(false),  rollMs + resultMs + EXIT_MS),
    )
  }, [lastResult, display.speed, display.autoHideDelay])

  useEffect(() => clearTimers, [])

  if (!visible || !roll) return null

  const isCrit   = roll.rolls.length === 1 && roll.rolls[0] === roll.diceFaces
  const isFumble = roll.rolls.length === 1 && roll.rolls[0] === 1
  const showResult = phase === "result" || phase === "exit"

  const forceMul = FORCE_MUL[display.throwingForce]

  return (
    <div
      className={clsx(
        "absolute inset-0 z-50 flex items-center justify-center transition-opacity",
        phase === "exit" ? "opacity-0 duration-300" : "opacity-100 duration-200",
      )}
      onClick={dismiss}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[3px]" />

      {/* Dice canvas */}
      <div
        className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
        style={{ width: 520, height: 400 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* key={roll.id} remounts scene per roll → resets physics */}
        <DiceScene
          key={roll.id}
          diceCount={roll.diceCount}
          diceFaces={roll.diceFaces}
          appearance={appearance}
          velMul={forceMul.vel}
          angMul={forceMul.ang}
        />

        {/* Result panel — fades in after rolling phase */}
        <div className={clsx(
          "absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity duration-500 pointer-events-none",
          showResult ? "opacity-100" : "opacity-0",
        )}>
          <div className="bg-black/80 backdrop-blur-md rounded-2xl px-10 py-6 flex flex-col items-center gap-1.5">
            {isCrit && (
              <span className="text-amber-400 text-[11px] font-bold tracking-[0.2em] uppercase">
                Crítico!
              </span>
            )}
            {isFumble && (
              <span className="text-red-400 text-[11px] font-bold tracking-[0.2em] uppercase">
                Falha Crítica!
              </span>
            )}

            <span
              className={clsx(
                "text-7xl font-black tabular-nums leading-none",
                isCrit   ? "text-amber-400" :
                isFumble ? "text-red-400"   : "",
              )}
              style={!isCrit && !isFumble ? { color: appearance.labelColor } : undefined}
            >
              {roll.total}
            </span>

            <span className="text-neutral-400 text-sm mt-1">
              {roll.diceCount}d{roll.diceFaces}
              {roll.modifier !== 0
                ? (roll.modifier > 0 ? `+${roll.modifier}` : String(roll.modifier))
                : ""}
              {"  "}[{roll.rolls.join(", ")}]
            </span>

            {roll.label && (
              <span className="text-neutral-500 text-xs">{roll.label}</span>
            )}

            <span className="text-neutral-600 text-[11px] mt-1">{roll.fromName}</span>
          </div>
        </div>
      </div>

      <span className="absolute bottom-24 text-neutral-600 text-xs select-none pointer-events-none">
        clique para fechar
      </span>
    </div>
  )
}
