import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { PerspectiveCamera } from "@react-three/drei"
import * as THREE from "three"
import type { TokenPosition, NpcToken } from "@rpg3d/sync-client"

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

  // Vetores pré-alocados — evita new THREE.Vector3() dentro do loop de render (GC pressure)
  const _destPos  = useRef(new THREE.Vector3())
  const _destLook = useRef(new THREE.Vector3())

  useFrame(() => {
    if (!camRef.current) return

    const { position, rotation } = token
    const rotRad = (rotation * Math.PI) / 180
    const fwdX   = -Math.sin(rotRad)
    const fwdZ   = -Math.cos(rotRad)

    _destPos.current.set(
      position.x - fwdX * BACK_DIST,
      position.y + CAM_HEIGHT,
      position.z - fwdZ * BACK_DIST,
    )

    // Inimigo mais próximo — linear scan, sem sort() nem alloc por frame
    let nearest: NpcToken | null = null
    let nearestDist2 = Infinity
    for (const e of enemies) {
      const dx = e.position.x - position.x
      const dz = e.position.z - position.z
      const d2 = dx * dx + dz * dz
      if (d2 < nearestDist2) { nearestDist2 = d2; nearest = e }
    }

    if (nearest) {
      _destLook.current.set(nearest.position.x, nearest.position.y + 1.2, nearest.position.z)
    } else {
      _destLook.current.set(position.x + fwdX * 8, position.y + 1.0, position.z + fwdZ * 8)
    }

    if (!initialized.current) {
      camPosRef.current.copy(_destPos.current)
      lookPosRef.current.copy(_destLook.current)
      initialized.current = true
    } else {
      camPosRef.current.lerp(_destPos.current, LERP_SPEED)
      lookPosRef.current.lerp(_destLook.current, LERP_SPEED)
    }

    camRef.current.position.copy(camPosRef.current)
    camRef.current.lookAt(lookPosRef.current)
  })

  return (
    <PerspectiveCamera ref={camRef} makeDefault fov={65} near={0.1} far={500} />
  )
}
