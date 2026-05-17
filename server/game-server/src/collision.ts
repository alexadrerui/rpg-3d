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
// Geometria de paredes — extraída dos nodes Pascal da cena
// ─────────────────────────────────────────────────────────────────────────────

/** Segmento de parede 2D no plano XZ. */
export type WallSegment = {
  x1: number; z1: number
  x2: number; z2: number
}

/**
 * Lê o dicionário de nodes Pascal (PascalNodeSnapshot.nodes) e retorna
 * todos os WallNodes como segmentos 2D.
 *
 * WallNode tem: type="wall", start:[x,z], end:[x,z]
 */
export function extractWallSegments(nodes: Record<string, unknown>): WallSegment[] {
  const segs: WallSegment[] = []

  for (const node of Object.values(nodes)) {
    if (!node || typeof node !== "object") continue
    const n = node as Record<string, unknown>
    if (n.type !== "wall") continue

    const s = n.start
    const e = n.end
    if (!Array.isArray(s) || !Array.isArray(e) || s.length < 2 || e.length < 2) continue

    const x1 = Number(s[0]), z1 = Number(s[1])
    const x2 = Number(e[0]), z2 = Number(e[1])
    if (!isFinite(x1) || !isFinite(z1) || !isFinite(x2) || !isFinite(z2)) continue

    segs.push({ x1, z1, x2, z2 })
  }

  return segs
}

// ─────────────────────────────────────────────────────────────────────────────
// Geometria 2D — interseção de segmentos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna true se os segmentos A→B e C→D se intersectam.
 * t ∈ (0.001, 0.999) exclui os extremos do ray (origem e alvo).
 */
function segmentsIntersect(
  ax1: number, az1: number, ax2: number, az2: number,
  bx1: number, bz1: number, bx2: number, bz2: number,
): boolean {
  const d1x = ax2 - ax1, d1z = az2 - az1
  const d2x = bx2 - bx1, d2z = bz2 - bz1
  const cross = d1x * d2z - d1z * d2x
  if (Math.abs(cross) < 1e-10) return false // paralelo ou colinear
  const t = ((bx1 - ax1) * d2z - (bz1 - az1) * d2x) / cross
  const u = ((bx1 - ax1) * d1z - (bz1 - az1) * d1x) / cross
  return t > 0.001 && t < 0.999 && u >= 0 && u <= 1
}

/** Verifica se alguma parede bloqueia a linha entre dois pontos. */
function blockedByWall(
  ox: number, oz: number,
  cx: number, cz: number,
  walls: WallSegment[],
): boolean {
  for (const w of walls) {
    if (segmentsIntersect(ox, oz, cx, cz, w.x1, w.z1, w.x2, w.z2)) return true
  }
  return false
}

// ─────────────────────────────────────────────────────────────────────────────
// Fog of war — três modos de revelação
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Modo circle (padrão): revela todas as células dentro do raio,
 * sem considerar linha de visão.
 */
export function computeRevealedCells(
  position: Vec3,
  radius: number,
  cellSize = 1,
): { x: number; z: number }[] {
  const cells: { x: number; z: number }[] = []
  const r = Math.ceil(radius / cellSize)

  for (let dx = -r; dx <= r; dx++) {
    for (let dz = -r; dz <= r; dz++) {
      if (dx * dx + dz * dz > r * r) continue
      cells.push({
        x: (Math.round(position.x / cellSize) + dx) * cellSize,
        z: (Math.round(position.z / cellSize) + dz) * cellSize,
      })
    }
  }
  return cells
}

/**
 * Modo raycast: revela apenas células com linha de visão direta
 * (sem paredes bloqueando o segmento observador→célula).
 * Sem dados de paredes: retorna o mesmo resultado do modo circle.
 */
export function computeRaycastCells(
  position: Vec3,
  radius: number,
  walls: WallSegment[],
  cellSize = 1,
): { x: number; z: number }[] {
  if (walls.length === 0) return computeRevealedCells(position, radius, cellSize)

  const cells: { x: number; z: number }[] = []
  const r  = Math.ceil(radius / cellSize)
  const ox = position.x
  const oz = position.z

  for (let dx = -r; dx <= r; dx++) {
    for (let dz = -r; dz <= r; dz++) {
      if (dx * dx + dz * dz > r * r) continue

      const cx = (Math.round(position.x / cellSize) + dx) * cellSize
      const cz = (Math.round(position.z / cellSize) + dz) * cellSize

      if (!blockedByWall(ox, oz, cx, cz, walls)) {
        cells.push({ x: cx, z: cz })
      }
    }
  }
  return cells
}

/**
 * Modo room: BFS a partir da posição do token, expandindo para células
 * adjacentes enquanto o caminho não cruzar nenhuma parede.
 * Revela o espaço conectado ao redor do token (a "sala" atual).
 * Sem dados de paredes: revela um círculo maior (raio × 3).
 */
export function computeRoomCells(
  position: Vec3,
  maxDistance: number,
  walls: WallSegment[],
  cellSize = 1,
): { x: number; z: number }[] {
  if (walls.length === 0) {
    return computeRevealedCells(position, maxDistance / 3, cellSize)
  }

  const startX = Math.round(position.x / cellSize) * cellSize
  const startZ = Math.round(position.z / cellSize) * cellSize

  const visited = new Set<string>()
  const result:  { x: number; z: number }[] = []
  const queue:   { x: number; z: number }[] = [{ x: startX, z: startZ }]

  const key  = (x: number, z: number) => `${x}:${z}`
  const maxD2 = maxDistance * maxDistance
  const LIMIT  = 2000  // teto de segurança — evita flood em cenas abertas

  visited.add(key(startX, startZ))

  const DIRS = [
    { dx: cellSize,  dz: 0        },
    { dx: -cellSize, dz: 0        },
    { dx: 0,         dz: cellSize  },
    { dx: 0,         dz: -cellSize },
  ]

  while (queue.length > 0 && result.length < LIMIT) {
    const cur = queue.shift()!
    result.push(cur)

    // Não expande além de maxDistance
    if ((cur.x - startX) ** 2 + (cur.z - startZ) ** 2 >= maxD2) continue

    for (const dir of DIRS) {
      const nx = cur.x + dir.dx
      const nz = cur.z + dir.dz
      const nk = key(nx, nz)

      if (visited.has(nk)) continue
      visited.add(nk)

      // Verifica se a borda cur→vizinho cruza alguma parede
      if (!blockedByWall(cur.x, cur.z, nx, nz, walls)) {
        queue.push({ x: nx, z: nz })
      }
    }
  }

  return result
}
