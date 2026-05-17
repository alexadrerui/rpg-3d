import { useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { sceneRegistry } from "@pascal-app/core"
import type { TokenPosition } from "@rpg3d/sync-client"

// ─────────────────────────────────────────────────────────────────────────────
// Parâmetros do cutaway
// ─────────────────────────────────────────────────────────────────────────────

const CUTAWAY_RADIUS = 5.5  // raio XZ em unidades world — paredes dentro desse raio do token somem
const FADE_SPEED     = 0.14 // lerp por frame — ~0.4s para fade completo
const HIDDEN_OPACITY = 0.06 // quase transparente; silhueta de portas/janelas ainda visível
const R2             = CUTAWAY_RADIUS * CUTAWAY_RADIUS

type Props = {
  tokens: Record<string, TokenPosition>
}

// ─────────────────────────────────────────────────────────────────────────────
// WallCutaway
//
// Executa dentro do PascalViewer (mesmo contexto R3F).
// Cada frame:
//   1. Calcula quais paredes estão entre a câmera e algum token
//      usando profundidade relativa à câmera + proximidade XZ
//   2. Faz lerp de opacidade para HIDDEN_OPACITY (sumir) ou 1.0 (aparecer)
//
// Paredes gerenciadas por nós ficam em `ourWalls` para serem restauradas
// quando o token se afasta. Paredes que nunca bloquearam não são tocadas
// (Pascal pode gerenciá-las via setWallMode("cutaway")).
// ─────────────────────────────────────────────────────────────────────────────

export function WallCutaway({ tokens }: Props) {
  const { camera } = useThree()

  // Vetores pré-alocados — evita GC pressure a 60fps
  const _camFwd  = useRef(new THREE.Vector3())
  const _wallPos = useRef(new THREE.Vector3())
  const _tmp     = useRef(new THREE.Vector3())

  // Paredes cujo opacity estamos gerenciando (para restaurar ao sair do raio)
  const ourWalls = useRef(new Set<string>())

  useFrame(() => {
    camera.getWorldDirection(_camFwd.current)

    // Profundidade e posição XZ de cada token (sem alocação de Vector3)
    const tokenData = Object.values(tokens).map(t => ({
      depth: _tmp.current.set(t.position.x, t.position.y, t.position.z)
                 .sub(camera.position).dot(_camFwd.current),
      x: t.position.x,
      z: t.position.z,
    }))

    // Loop único: determina visibilidade e aplica opacidade
    for (const id of sceneRegistry.byType.wall) {
      const obj = sceneRegistry.nodes.get(id)
      if (!obj) continue

      obj.getWorldPosition(_wallPos.current)
      const wallDepth = _tmp.current.copy(_wallPos.current)
        .sub(camera.position).dot(_camFwd.current)

      let shouldHide = false
      for (const token of tokenData) {
        if (wallDepth >= token.depth) continue  // parede atrás ou na mesma profundidade do token

        const dx = _wallPos.current.x - token.x
        const dz = _wallPos.current.z - token.z
        if (dx * dx + dz * dz < R2) {
          shouldHide = true
          break
        }
      }

      const isOurs = ourWalls.current.has(id)
      if (!shouldHide && !isOurs) continue  // Pascal gerencia — não tocar

      if (shouldHide) ourWalls.current.add(id)
      else            ourWalls.current.delete(id)

      const target = shouldHide ? HIDDEN_OPACITY : 1.0

      obj.traverse(child => {
        if (!(child instanceof THREE.Mesh)) return
        if (child.name === "collision-mesh") return

        const mats = Array.isArray(child.material) ? child.material : [child.material]
        for (const mat of mats) {
          if (!mat || !("opacity" in mat)) continue
          const m = mat as THREE.MeshStandardMaterial
          m.transparent = true
          m.opacity     = THREE.MathUtils.lerp(m.opacity, target, FADE_SPEED)
          m.depthWrite  = m.opacity > 0.9
        }
      })
    }
  })

  return null
}
