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
