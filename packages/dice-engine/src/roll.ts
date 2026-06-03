export type DiceRollResult = {
  rolls:    number[]
  total:    number
  modifier: number
}

/** Rolagem server-side / sem física (usado no game-server para validar) */
export function rollDice(count: number, faces: number, modifier = 0): DiceRollResult {
  const rolls = Array.from({ length: count }, () => Math.ceil(Math.random() * faces))
  return { rolls, total: rolls.reduce((a, b) => a + b, 0) + modifier, modifier }
}

/**
 * Rola uma fórmula textual no formato "NdF±M" (ex: "2d6", "1d8+3", "d20-1").
 * `extraModifier` é somado por cima (ex: modificador de atributo).
 * Fórmula inválida ou vazia → rola nada (rolls vazio), retornando só os modificadores.
 */
export function rollFormula(formula: string, extraModifier = 0): DiceRollResult {
  const match = /^\s*(\d*)\s*d\s*(\d+)\s*([+-]\s*\d+)?\s*$/i.exec(formula ?? "")
  if (!match) {
    // Sem dado — talvez seja só um número fixo
    const flat = Number.parseInt((formula ?? "").trim(), 10)
    const base = Number.isNaN(flat) ? 0 : flat
    return { rolls: [], total: base + extraModifier, modifier: base + extraModifier }
  }
  const [, rawCount, rawFaces, rawMod] = match
  const count    = !rawCount ? 1 : Math.min(Number.parseInt(rawCount, 10), 100)
  const faces    = Math.max(1, Number.parseInt(rawFaces ?? "1", 10))
  const inlineMod = rawMod ? Number.parseInt(rawMod.replace(/\s+/g, ""), 10) : 0
  const modifier = inlineMod + extraModifier
  const rolls    = Array.from({ length: count }, () => Math.ceil(Math.random() * faces))
  return { rolls, total: rolls.reduce((a, b) => a + b, 0) + modifier, modifier }
}
