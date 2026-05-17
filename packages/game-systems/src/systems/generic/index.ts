import type { GameSystem } from "../../types.js"
import { GenericCharacterSheet } from "./sheet.js"

export const genericSystem: GameSystem = {
  id:          "generic",
  name:        "Sistema Genérico",
  description: "Um sistema simples sem regras de jogo específicas. Ideal para campanhas narrativas, investigação e homebrew.",
  version:     "1.0.0",
  price:       0,
  tags:        ["gratuito", "narrativo", "homebrew"],
  defaultData: () => ({
    characterName: "",
    notes:         "",
    avatar:        { type: "none" },
  }),
  CharacterSheet: GenericCharacterSheet,
}
