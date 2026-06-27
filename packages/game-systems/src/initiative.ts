// ─────────────────────────────────────────────────────────────────────────────
// Iniciativa POR SISTEMA DE JOGO
//
// ⚠️ Este módulo é IMPORTADO PELO GAME-SERVER (Node puro). Mantenha-o livre de
// React / JSX / DOM — só lógica pura. Ele é exportado como subpath
// "@rpg3d/game-systems/initiative" justamente para o servidor poder importá-lo
// sem arrastar as fichas .tsx (que dependem de React).
//
// Cada sistema declara COMO rolar iniciativa via um `InitiativeResolver`. O
// servidor resolve a "receita" (`InitiativeSpec`) a partir da ficha do
// combatente e a rola de forma autoritativa. Sistemas desconhecidos (ex.:
// manifest/terceiros sem resolver) caem no fallback 1d20.
// ─────────────────────────────────────────────────────────────────────────────

export interface InitiativeInput {
  /** Última versão da ficha do combatente (sheetState). Vazia para NPC sem ficha. */
  sheet:    Record<string, unknown>
  /** true = personagem de jogador; false = NPC/inimigo. */
  isPlayer: boolean
}

/** Como combinar os dados rolados. */
export type KeepMode = "sum" | "highest" | "lowest"

/** Receita declarativa de uma rolagem de iniciativa, resolvida pelo servidor. */
export interface InitiativeSpec {
  count:    number     // quantidade de dados
  faces:    number     // faces por dado
  keep:     KeepMode   // somar / manter o melhor / manter o pior
  modifier: number     // bônus fixo somado ao resultado
  label:    string     // descrição p/ log/UI, ex.: "3d20 (melhor) + 5 Iniciativa"
}

export type InitiativeResolver = (input: InitiativeInput) => InitiativeSpec

const num = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback

// ── D&D 5e ─────────────────────────────────────────────────────────────────────
// 1d20 + modificador de Destreza.
export const dnd5eInitiative: InitiativeResolver = ({ sheet }) => {
  const dex = num(sheet.dexterity, 10)
  const mod = Math.floor((dex - 10) / 2)
  return { count: 1, faces: 20, keep: "sum", modifier: mod, label: "1d20 + Destreza" }
}

// ── Ordem Paranormal ────────────────────────────────────────────────────────────
// Teste da perícia Iniciativa (atributo AGI): rola um d20 por ponto de AGI e
// mantém o MELHOR; com AGI 0 rola 2d20 e mantém o PIOR. Soma o bônus de treino da
// perícia Iniciativa (Treinado +5 / Veterano +10 / Expert +15), armazenado em
// `sheet.pericias["Iniciativa"]` como número.
export const ordemParanormalInitiative: InitiativeResolver = ({ sheet }) => {
  const agi      = num(sheet.AGI, 1)
  const pericias = sheet.pericias && typeof sheet.pericias === "object"
    ? (sheet.pericias as Record<string, unknown>)
    : {}
  const treino   = num(pericias["Iniciativa"], 0)

  const count: number       = agi <= 0 ? 2 : agi
  const keep:  KeepMode      = agi <= 0 ? "lowest" : "highest"
  const treinoLabel          = treino ? ` + ${treino} Iniciativa` : ""
  return {
    count, faces: 20, keep, modifier: treino,
    label: `${count}d20 (${keep === "lowest" ? "pior" : "melhor"})${treinoLabel}`,
  }
}

// ── Genérico ─────────────────────────────────────────────────────────────────────
// 1d20 puro.
export const genericInitiative: InitiativeResolver = () =>
  ({ count: 1, faces: 20, keep: "sum", modifier: 0, label: "1d20" })

// ── Registry id → resolver ───────────────────────────────────────────────────────
// Fonte única para servidor e cliente. Para registrar um sistema novo, adicione
// seu resolver aqui (e referencie-o no `GameSystem.initiative`).
export const initiativeResolvers: Record<string, InitiativeResolver> = {
  "dnd5e":            dnd5eInitiative,
  "ordem-paranormal": ordemParanormalInitiative,
  "generic":          genericInitiative,
}

/** Fallback p/ sistemas sem resolver registrado: 1d20 puro. */
export const fallbackInitiative: InitiativeResolver = () =>
  ({ count: 1, faces: 20, keep: "sum", modifier: 0, label: "1d20" })

/** Resolve a receita de iniciativa para um sistema (com fallback seguro). */
export function resolveInitiativeSpec(
  systemId: string | undefined,
  input: InitiativeInput,
): InitiativeSpec {
  const resolver = (systemId && initiativeResolvers[systemId]) || fallbackInitiative
  return resolver(input)
}

/** Rola a iniciativa a partir da receita. `rng` é injetável p/ testes determinísticos. */
export function rollInitiative(spec: InitiativeSpec, rng: () => number = Math.random): number {
  const n = Math.max(1, Math.floor(spec.count))
  const rolls: number[] = []
  for (let i = 0; i < n; i++) rolls.push(1 + Math.floor(rng() * spec.faces))
  const base =
    spec.keep === "highest" ? Math.max(...rolls) :
    spec.keep === "lowest"  ? Math.min(...rolls) :
                              rolls.reduce((a, b) => a + b, 0)
  return base + spec.modifier
}

/** Atalho: resolve a receita e já rola, retornando valor + receita usada. */
export function computeInitiative(
  systemId: string | undefined,
  input: InitiativeInput,
  rng: () => number = Math.random,
): { value: number; spec: InitiativeSpec } {
  const spec = resolveInitiativeSpec(systemId, input)
  return { value: rollInitiative(spec, rng), spec }
}
