import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import {
  RigidBody,
  CuboidCollider,
  ConvexHullCollider,
  type RapierRigidBody,
} from "@react-three/rapier"
import { Quaternion, Vector3, type Group } from "three"
import { MATERIAL_PROPS, type DiceAppearance } from "../../store/dice-settings-store"
import {
  DIE_SCALE,
  getDieLayout,
  labelTexture,
  LABEL_PLANE,
  type DieShape,
  type LabelVariant,
} from "./dice-geometry"

interface Props {
  shape:        DieShape
  variant:      LabelVariant
  forcedResult: number | null  // resultado autoritativo do servidor; null = livre
  index:        number
  total:        number
  appearance:   DiceAppearance
  velMul:       number
  angMul:       number
  onSettled?:   () => void
}

const _q  = new Quaternion()
const _up = new Vector3()

// Decaimento por frame (a 60fps) do slerp da troca de face — quanto menor,
// mais rápida a convergência; 0.86 ≈ alinhamento completo em ~350 ms
const SWAP_SMOOTHING = 0.86

export function DiceBody({
  shape, variant, forcedResult, index, total, appearance, velMul, angMul, onSettled,
}: Props) {
  const rbRef      = useRef<RapierRigidBody>(null)
  const visRef     = useRef<Group>(null)
  const settledRef = useRef(false)
  const lowFrames  = useRef(0)
  const slowFrames = useRef(0)

  const layout   = useMemo(() => getDieLayout(shape, variant), [shape, variant])
  const vertices = useMemo(
    () => (shape !== 6 ? new Float32Array(layout.geometry.attributes.position!.array) : null),
    [layout, shape],
  )

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

  // Troca de face (esquema Dice So Nice): identifica a face física apontando
  // para cima (frame do corpo rígido) e calcula a rotação alvo do grupo visual
  // para que a face do resultado do servidor ocupe esse lugar. Idempotente.
  const updateSwapTarget = () => {
    const rb = rbRef.current
    if (!rb || forcedResult == null) return

    const desired = layout.slots.find((s) => s.value === forcedResult)
    if (!desired) return

    const r = rb.rotation()
    _q.set(r.x, r.y, r.z, r.w).invert()
    _up.set(0, 1, 0).applyQuaternion(_q) // "para cima" do mundo no espaço local do corpo

    let best = layout.slots[0]!
    let bestDot = -Infinity
    for (const s of layout.slots) {
      const d = s.dir.dot(_up)
      if (d > bestDot) { bestDot = d; best = s }
    }
    targetQuat.current.setFromUnitVectors(desired.dir, best.dir)
  }

  const targetQuat = useRef(new Quaternion())

  // Settled detection: velocity below threshold for 24 consecutive frames
  useFrame((_, delta) => {
    if (!rbRef.current) return

    // Suavização: o grupo visual converge por slerp até a rotação alvo em vez
    // de saltar — evita o "pulo" dos números quando a face física muda
    if (visRef.current) {
      const t = 1 - Math.pow(SWAP_SMOOTHING, delta * 60)
      visRef.current.quaternion.slerp(targetQuat.current, Math.min(1, t))
    }

    // Mesmo após "settled" o corpo pode continuar tombando lentamente até o
    // sleep real do Rapier — re-calcula o alvo para acompanhar
    if (settledRef.current) {
      updateSwapTarget()
      return
    }
    const { x: lx, y: ly, z: lz } = rbRef.current.linvel()
    const { x: ax, y: ay, z: az } = rbRef.current.angvel()
    const spd = Math.sqrt(lx * lx + ly * ly + lz * lz)
    const ang = Math.sqrt(ax * ax + ay * ay + az * az)

    // Quase parado: mira a troca cedo, enquanto o dado ainda dá a última
    // oscilação — a rearrumação dos números fica quase imperceptível
    if (spd < 0.6 && ang < 0.9) {
      if (++slowFrames.current >= 4) updateSwapTarget()
    } else {
      slowFrames.current = 0
    }

    if (spd < 0.08 && ang < 0.08) {
      if (++lowFrames.current > 24) {
        settledRef.current = true
        updateSwapTarget() // verificação final (caso outro dado tenha esbarrado neste)
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
      {shape === 6
        ? <CuboidCollider args={[0.325 * DIE_SCALE, 0.325 * DIE_SCALE, 0.325 * DIE_SCALE]} />
        : vertices && <ConvexHullCollider args={[vertices]} />
      }
      <group ref={visRef}>
        <mesh geometry={layout.geometry} castShadow>
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
        {layout.labels.map((l, i) => (
          <mesh
            key={i}
            geometry={LABEL_PLANE}
            position={l.position}
            quaternion={l.quaternion}
            scale={[l.size, l.size, 1]}
          >
            <meshBasicMaterial
              map={labelTexture(l.text, appearance.labelColor)}
              transparent
              alphaTest={0.05}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
        ))}
      </group>
    </RigidBody>
  )
}
