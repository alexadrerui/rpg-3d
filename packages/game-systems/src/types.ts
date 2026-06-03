import type { ComponentType } from "react"

export interface CharacterSheetProps {
  data:     Record<string, unknown>
  onSave:   (patch: Record<string, unknown>) => Promise<void>
  saving:   boolean
  readOnly?: boolean
}

/** Como uma habilidade é resolvida quando usada contra um alvo em combate. */
export type AbilityEffect    = "damage" | "heal" | "none"
export type AbilityTargeting = "enemy" | "ally" | "self" | "any"

export interface CombatAbility {
  id:          string
  name:        string
  description: string
  cost:        number
  resource:    string  // "PD", "PM", "PA", "Ação", "Gratuito", etc.

  // ── Resolução (opcional — ausente = só narrativa) ──────────────────────────
  effect?:     AbilityEffect      // dano, cura ou nenhum (default "none")
  dice?:       string             // fórmula rolada pelo servidor, ex: "1d8", "2d6"
  attribute?:  string             // chave do sheet cujo modificador (D&D) é somado, ex: "strength"
  bonus?:      number             // bônus fixo somado ao total
  targeting?:  AbilityTargeting   // quem pode ser alvo (default "enemy")
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
