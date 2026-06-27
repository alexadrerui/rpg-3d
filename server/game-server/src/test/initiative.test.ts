import { describe, it, expect } from "vitest"
import {
  resolveInitiativeSpec,
  rollInitiative,
  computeInitiative,
} from "@rpg3d/game-systems/initiative"

/** RNG determinístico: consome a sequência fornecida, em [0,1). */
function seqRng(values: number[]): () => number {
  let i = 0
  return () => values[i++ % values.length]!
}

describe("resolveInitiativeSpec", () => {
  it("D&D 5e: 1d20 + modificador de Destreza", () => {
    const spec = resolveInitiativeSpec("dnd5e", { sheet: { dexterity: 16 }, isPlayer: true })
    expect(spec).toMatchObject({ count: 1, faces: 20, keep: "sum", modifier: 3 })
  })

  it("D&D 5e: ficha vazia (NPC) usa Destreza 10 → +0", () => {
    const spec = resolveInitiativeSpec("dnd5e", { sheet: {}, isPlayer: false })
    expect(spec.modifier).toBe(0)
  })

  it("Ordem Paranormal: rola AGI d20s mantendo o melhor + treino de Iniciativa", () => {
    const spec = resolveInitiativeSpec("ordem-paranormal", {
      sheet: { AGI: 3, pericias: { Iniciativa: 5 } }, isPlayer: true,
    })
    expect(spec).toMatchObject({ count: 3, faces: 20, keep: "highest", modifier: 5 })
  })

  it("Ordem Paranormal: AGI 0 → 2d20 mantendo o pior", () => {
    const spec = resolveInitiativeSpec("ordem-paranormal", { sheet: { AGI: 0 }, isPlayer: true })
    expect(spec).toMatchObject({ count: 2, faces: 20, keep: "lowest", modifier: 0 })
  })

  it("sistema desconhecido cai no fallback 1d20", () => {
    const spec = resolveInitiativeSpec("sistema-inexistente", { sheet: {}, isPlayer: true })
    expect(spec).toMatchObject({ count: 1, faces: 20, keep: "sum", modifier: 0 })
  })

  it("systemId undefined cai no fallback 1d20", () => {
    const spec = resolveInitiativeSpec(undefined, { sheet: {}, isPlayer: false })
    expect(spec).toMatchObject({ count: 1, faces: 20, keep: "sum", modifier: 0 })
  })
})

describe("rollInitiative", () => {
  it("soma: 1d20+3 com dado=1 → 4", () => {
    const spec = resolveInitiativeSpec("dnd5e", { sheet: { dexterity: 16 }, isPlayer: true })
    expect(rollInitiative(spec, seqRng([0]))).toBe(4) // floor(0*20)+1 = 1; +3
  })

  it("mantém o melhor: 3d20 (1,20,11) + 5 → 25", () => {
    const spec = resolveInitiativeSpec("ordem-paranormal", {
      sheet: { AGI: 3, pericias: { Iniciativa: 5 } }, isPlayer: true,
    })
    // 0→1, 0.95→20, 0.5→11  ⇒ melhor = 20, +5 = 25
    expect(rollInitiative(spec, seqRng([0, 0.95, 0.5]))).toBe(25)
  })

  it("mantém o pior: 2d20 (20,1) → 1", () => {
    const spec = resolveInitiativeSpec("ordem-paranormal", { sheet: { AGI: 0 }, isPlayer: true })
    // 0.95→20, 0→1  ⇒ pior = 1
    expect(rollInitiative(spec, seqRng([0.95, 0]))).toBe(1)
  })
})

describe("computeInitiative", () => {
  it("retorna valor + receita coerentes", () => {
    const { value, spec } = computeInitiative(
      "dnd5e", { sheet: { dexterity: 8 }, isPlayer: true }, seqRng([0]),
    )
    expect(spec.modifier).toBe(-1) // mod(8) = -1
    expect(value).toBe(0)          // dado 1 + (-1)
  })
})
