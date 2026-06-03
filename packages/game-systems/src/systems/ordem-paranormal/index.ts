import type { GameSystem } from "../../types.js"
import { OrdemParanormalCharacterSheet } from "./sheet.js"

export const ordemParanormalSystem: GameSystem = {
  id:          "ordem-paranormal",
  name:        "Ordem Paranormal",
  description: "Sistema de RPG de horror e investigação da Jambô Editora. Agentes da Ordem enfrentam o Outro Lado com NEX, atributos, perícias, classes (Combatente, Especialista, Ocultista) e rituais. Fan content não-oficial.",
  version:     "1.0.0",
  price:       500,
  tags:        ["horror", "investigação", "moderno", "ordem-paranormal"],
  defaultData: () => ({
    characterName: "",
    classe:        "",
    origem:        "",
    patente:       "Recruta",
    nex:           5,
    FOR: 1, AGI: 1, INT: 1, PRE: 1, VIG: 1,
    pv: 12, pe: 2, san: 12,
    hp: 12, maxHp: 12,
    pvMax: 12, peMax: 2, sanMax: 12,
    defesa: 11, deslocamento: 9, dt: 11,
    pericias:        {},
    combatAbilities: [],
    avatar:          { type: "none" },
  }),
  CharacterSheet: OrdemParanormalCharacterSheet,
}
