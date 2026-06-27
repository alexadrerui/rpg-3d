import type { GameSystem } from "../../types.js"
import { dnd5eInitiative } from "../../initiative.js"
import { Dnd5eCharacterSheet } from "./sheet.js"

export const dnd5eSystem: GameSystem = {
  id:          "dnd5e",
  name:        "D&D 5ª Edição",
  description: "Dungeons & Dragons 5ª Edição — o sistema de RPG de fantasia mais popular do mundo com mecânicas completas de raças, classes e atributos.",
  version:     "1.0.0",
  price:       500,
  tags:        ["fantasia", "d20", "high-fantasy"],
  defaultData: () => ({
    characterName:  "",
    race:           "",
    class:          "",
    level:          1,
    strength:       10,
    dexterity:      10,
    constitution:   10,
    intelligence:   10,
    wisdom:         10,
    charisma:       10,
    background:     "",
    personality:    "",
    bonds:          "",
    flaws:          "",
    age:            "",
    height:         "",
    weight:         "",
    eyes:           "",
    hair:           "",
    skin:           "",
    appearanceNotes: "",
    avatar:         { type: "none" },
  }),
  CharacterSheet: Dnd5eCharacterSheet,
  initiative:     dnd5eInitiative,
}
