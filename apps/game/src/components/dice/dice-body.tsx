import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import {
  RigidBody,
  CuboidCollider,
  ConvexHullCollider,
  type RapierRigidBody,
} from "@react-three/rapier"
import {
  BoxGeometry,
  DodecahedronGeometry,
  IcosahedronGeometry,
  OctahedronGeometry,
  TetrahedronGeometry,
} from "three"
import type { DiceFace } from "@rpg3d/schema"
import { MATERIAL_PROPS, type DiceAppearance } from "../../store/dice-settings-store"

interface Props {
  faces:      DiceFace
  index:      number
  total:      number
  appearance: DiceAppearance
  velMul:     number
  angMul:     number
  onSettled?: () => void
}

function makeGeo(faces: DiceFace) {
  switch (faces) {
    case 4:   return new TetrahedronGeometry(0.5)
    case 6:   return new BoxGeometry(0.65, 0.65, 0.65)
    case 8:   return new OctahedronGeometry(0.55)
    case 10:  return new OctahedronGeometry(0.55)
    case 12:  return new DodecahedronGeometry(0.55)
    case 20:  return new IcosahedronGeometry(0.55)
    case 100: return new OctahedronGeometry(0.55)
  }
}

export function DiceBody({ faces, index, total, appearance, velMul, angMul, onSettled }: Props) {
  const rbRef        = useRef<RapierRigidBody>(null)
  const settledRef   = useRef(false)
  const lowFrames    = useRef(0)

  const geo      = useMemo(() => makeGeo(faces), [faces])
  const vertices = useMemo(
    () => (faces !== 6 ? new Float32Array(geo.attributes.position.array) : null),
    [geo, faces],
  )

  useEffect(() => () => { geo.dispose() }, [geo])

  // Spread dice across a grid so they don't all land on top of each other
  const cols = Math.ceil(Math.sqrt(total))
  const col  = index % cols
  const row  = Math.floor(index / cols)
  const sx   = (col - (cols - 1) / 2) * 1.5 + (Math.random() - 0.5) * 0.4
  const sz   = (row - (Math.ceil(total / cols) - 1) / 2) * 1.5 + (Math.random() - 0.5) * 0.4

  const initPos:    [number, number, number] = [sx, 5 + index * 0.7, sz]
  const initLinVel: [number, number, number] = [
    (Math.random() - 0.5) * 4  * velMul,
    -(2 + Math.random() * 3)   * velMul,
    (Math.random() - 0.5) * 4  * velMul,
  ]
  const initAngVel: [number, number, number] = [
    (Math.random() - 0.5) * 28 * angMul,
    (Math.random() - 0.5) * 28 * angMul,
    (Math.random() - 0.5) * 28 * angMul,
  ]

  // Settled detection: velocity below threshold for 24 consecutive frames
  useFrame(() => {
    if (settledRef.current || !rbRef.current) return
    const { x: lx, y: ly, z: lz } = rbRef.current.linvel()
    const { x: ax, y: ay, z: az } = rbRef.current.angvel()
    const spd = Math.sqrt(lx * lx + ly * ly + lz * lz)
    const ang = Math.sqrt(ax * ax + ay * ay + az * az)

    if (spd < 0.08 && ang < 0.08) {
      if (++lowFrames.current > 24) {
        settledRef.current = true
        onSettled?.()
      }
    } else {
      lowFrames.current = 0
    }
  })

  const mat = MATERIAL_PROPS[appearance.material]

  return (
    <RigidBody
      ref={rbRef}
      colliders={false}
      position={initPos}
      linearVelocity={initLinVel}
      angularVelocity={initAngVel}
      restitution={0.35}
      friction={0.85}
      linearDamping={0.4}
      angularDamping={0.55}
    >
      {faces === 6
        ? <CuboidCollider args={[0.325, 0.325, 0.325]} />
        : vertices && <ConvexHullCollider args={[vertices]} />
      }
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial
          color={appearance.diceColor}
          roughness={mat.roughness}
          metalness={mat.metalness}
          transparent={mat.transparent}
          opacity={mat.opacity ?? 1}
          emissive={appearance.edgeColor}
          emissiveIntensity={0.12}
        />
      </mesh>
    </RigidBody>
  )
}
