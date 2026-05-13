"use client"
import { useState, useCallback, useEffect } from "react"
import { getSocket } from "./socket.js"
import type { EvDiceResult, EvRollDice, DiceFace } from "@rpg3d/schema"

export type DiceResult = EvDiceResult

export function useDice(serverUrl?: string) {
  const [results, setResults] = useState<DiceResult[]>([])
  const [isRolling, setIsRolling] = useState(false)

  useEffect(() => {
    const socket = getSocket(serverUrl)
    const handler = (r: DiceResult) => setResults(prev => [r, ...prev].slice(0, 50))
    socket.on("dice:result", handler)
    return () => { socket.off("dice:result", handler) }
  }, [serverUrl])

  const roll = useCallback((
    diceFaces: DiceFace,
    opts?: { count?: number; modifier?: number; label?: string; isSecret?: boolean; characterId?: string }
  ) => {
    setIsRolling(true)
    const payload: EvRollDice = {
      diceCount:   opts?.count      ?? 1,
      diceFaces,
      modifier:    opts?.modifier   ?? 0,
      label:       opts?.label,
      isSecret:    opts?.isSecret   ?? false,
      characterId: opts?.characterId,
    }
    return new Promise<DiceResult>((resolve, reject) => {
      // O resultado chega via evento "dice:result" — aqui apenas emitimos
      getSocket(serverUrl).emit("dice:roll", payload, (res) => {
        setIsRolling(false)
        if (!res.ok) reject(new Error(res.error))
        // resultado real chega pelo listener do evento
      })
    })
  }, [serverUrl])

  return { results, isRolling, roll, lastResult: results[0] ?? null }
}
