import type { AnyTriggerNode } from "@rpg3d/schema"

type Vec3 = { x: number; y: number; z: number }

// ─────────────────────────────────────────────────────────────────────────────
// Detecção de colisão server-side (simples — sem física real)
// Usado para validar triggers quando um token se move
// ─────────────────────────────────────────────────────────────────────────────

export function isInsideTrigger(trigger: AnyTriggerNode, position: Vec3): boolean {
  const dx = position.x - trigger.position.x
  const dy = position.y - trigger.position.y
  const dz = position.z - trigger.position.z
  const shape = trigger.shape

  switch (shape.kind) {
    case "sphere":
      return Math.sqrt(dx * dx + dy * dy + dz * dz) <= shape.radius

    case "box":
      return (
        Math.abs(dx) <= shape.width  / 2 &&
        Math.abs(dy) <= shape.height / 2 &&
        Math.abs(dz) <= shape.depth  / 2
      )

    case "cylinder":
      return (
        Math.sqrt(dx * dx + dz * dz) <= shape.radius &&
        Math.abs(dy) <= shape.height / 2
      )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fog of war — calcula quais células de grid o token revela
// ─────────────────────────────────────────────────────────────────────────────

export function computeRevealedCells(
  position: Vec3,
  radius: number,
  cellSize = 1
): { x: number; z: number }[] {
  const cells: { x: number; z: number }[] = []
  const r = Math.ceil(radius / cellSize)

  for (let dx = -r; dx <= r; dx++) {
    for (let dz = -r; dz <= r; dz++) {
      const wx = Math.round(position.x / cellSize) + dx
      const wz = Math.round(position.z / cellSize) + dz
      // Círculo aproximado
      if (dx * dx + dz * dz <= r * r) {
        cells.push({ x: wx * cellSize, z: wz * cellSize })
      }
    }
  }
  return cells
}
