import type { ComponentType } from "react"

export interface CharacterSheetProps {
  data:     Record<string, unknown>
  onSave:   (patch: Record<string, unknown>) => Promise<void>
  saving:   boolean
  readOnly?: boolean
}

export interface CombatAbility {
  id:          string
  name:        string
  description: string
  cost:        number
  resource:    string  // "PD", "PM", "PA", "Ação", "Gratuito", etc.
}

export interface GameSystemMeta {
  id:          string
  name:        string
  description: string
  version:     string
  price:       number    // 0 = gratuito; > 0 em créditos internos
  tags:        string[]
  thumbnail?:  string
}

export interface GameSystem extends GameSystemMeta {
  defaultData:    () => Record<string, unknown>
  CharacterSheet: ComponentType<CharacterSheetProps>
}
