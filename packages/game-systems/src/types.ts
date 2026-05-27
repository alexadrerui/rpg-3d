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
  price:       number
  tags:        string[]
  thumbnail?:  string
}

export interface GameSystem extends GameSystemMeta {
  defaultData:    () => Record<string, unknown>
  CharacterSheet: ComponentType<CharacterSheetProps>
}

// ── Manifest — define campos da ficha para sistemas externos ──────────────────

export interface ManifestField {
  id:           string
  label:        string
  type:         "text" | "number" | "textarea" | "select" | "boolean"
  options?:     string[]   // para type="select"
  min?:         number
  max?:         number
  group?:       string     // agrupa campos em seções/abas
  defaultValue?: string | number | boolean
  required?:    boolean
}

export interface SystemManifest {
  fields:           ManifestField[]
  combatAbilities?: boolean  // exibe seção de habilidades de combate
}
