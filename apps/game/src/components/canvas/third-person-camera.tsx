import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { PerspectiveCamera } from "@react-three/drei"
import * as THREE from "three"
import type { TokenPosition, NpcToken } from "@rpg3d/sync-client"

// ─────────────────────────────────────────────────────────────────────────────
// Câmera de terceira pessoa — fica atrás e acima do token do jogador,
// mira automaticamente para o inimigo mais próximo (ou para frente se não houver).
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  token:   TokenPosition
  enemies: NpcToken[]
}

const BACK_DIST  = 3.2
const CAM_HEIGHT = 2.0
const LERP_SPEED = 0.1

export function ThirdPersonCamera({ token, enemies }: Props) {
  const camRef      = useRef<THREE.PerspectiveCamera>(null)
  const camPosRef   = useRef(new THREE.Vector3())
  const lookPosRef  = useRef(new THREE.Vector3())
  const initialized = useRef(false)

  useFrame(() => {
    if (!camRef.current) return

    const { position, rotation } = token
    const rotRad = (rotation * Math.PI) / 180

    // Direção forward do token (assumption: rotation 0 = -Z)
    const fwdX = -Math.sin(rotRad)
    const fwdZ = -Math.cos(rotRad)

    // Posição desejada: atrás + acima
    const destPos = new THREE.Vector3(
      position.x - fwdX * BACK_DIST,
      position.y + CAM_HEIGHT,
      position.z - fwdZ * BACK_DIST,
    )

    // Inimigo mais próximo
    const nearest = enemies
      .filter(e => e.role === "enemy")
      .sort((a, b) =>
        Math.hypot(a.position.x - position.x, a.position.z - position.z) -
        Math.hypot(b.position.x - position.x, b.position.z - position.z)
      )[0]

    const destLook = nearest
      ? new THREE.Vector3(nearest.position.x, nearest.position.y + 1.2, nearest.position.z)
      : new THREE.Vector3(
          position.x + fwdX * 8,
          position.y + 1.0,
          position.z + fwdZ * 8,
        )

    // Snap on first frame to avoid jarring camera teleport
    if (!initialized.current) {
      camPosRef.current.copy(destPos)
      lookPosRef.current.copy(destLook)
      initialized.current = true
    } else {
      camPosRef.current.lerp(destPos, LERP_SPEED)
      lookPosRef.current.lerp(destLook, LERP_SPEED)
    }

    camRef.current.position.copy(camPosRef.current)
    camRef.current.lookAt(lookPosRef.current)
  })

  return (
    <PerspectiveCamera
      ref={camRef}
      makeDefault
      fov={65}
      near={0.1}
      far={500}
    />
  )
}
