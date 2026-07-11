import { Suspense, useCallback, useMemo, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier"
import { DiceBody } from "./dice-body"
import type { DiceFace } from "@rpg3d/schema"
import type { DiceAppearance } from "../../store/dice-settings-store"
import type { DieShape, LabelVariant } from "./dice-geometry"

interface Props {
  diceCount:   number
  diceFaces:   DiceFace
  rolls?:      number[]  // resultados autoritativos do servidor, um por dado
  appearance:  DiceAppearance
  velMul:      number
  angMul:      number
  onAllSettled?: () => void
}

interface SpawnSpec {
  shape:   DieShape
  variant: LabelVariant
  forced:  number | null
}

export function DiceScene({ diceCount, diceFaces, rolls, appearance, velMul, angMul, onAllSettled }: Props) {
  const settled = useRef(0)

  // d100 vira dois d10 (dezena 00–90 + unidade 0–9), como no Dice So Nice
  const specs = useMemo<SpawnSpec[]>(() => {
    const out: SpawnSpec[] = []
    for (let i = 0; i < diceCount; i++) {
      const r = rolls?.[i] ?? null
      if (diceFaces === 100) {
        out.push({ shape: 10, variant: "tens",  forced: r != null ? Math.floor(r / 10) % 10 : null })
        out.push({ shape: 10, variant: "units", forced: r != null ? r % 10 : null })
      } else {
        out.push({ shape: diceFaces, variant: "std", forced: r })
      }
    }
    return out
  }, [diceCount, diceFaces, rolls])

  const handleSettled = useCallback(() => {
    settled.current++
    if (settled.current >= specs.length) onAllSettled?.()
  }, [specs.length, onAllSettled])

  return (
    <Canvas
      camera={{ position: [0, 7, 6], fov: 45 }}
      shadows
      gl={{ antialias: true }}
      style={{ width: "100%", height: "100%" }}
      onCreated={(state) => {
        // handle de debug para inspecionar a cena dos dados no console (só dev)
        if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__diceScene = state.scene
      }}
    >
      <color attach="background" args={["#0d1117"]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[4, 9, 4]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.1}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <pointLight position={[-3, 5, -3]} intensity={0.4} color="#3355cc" />

      {/* Visual floor — outside physics, decoration only */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#16213e" roughness={0.95} />
      </mesh>

      <Suspense fallback={null}>
        <Physics gravity={[0, -30, 0]} timeStep="vary">
          {/* Compound fixed body: floor + 4 invisible walls */}
          <RigidBody type="fixed">
            <CuboidCollider args={[6, 0.05, 6]}  position={[0,     -0.05, 0   ]} />
            <CuboidCollider args={[0.1, 3, 6]}   position={[-4.5,   1.5,  0   ]} />
            <CuboidCollider args={[0.1, 3, 6]}   position={[4.5,    1.5,  0   ]} />
            <CuboidCollider args={[6, 3, 0.1]}   position={[0,      1.5, -4.5 ]} />
            <CuboidCollider args={[6, 3, 0.1]}   position={[0,      1.5,  4.5 ]} />
          </RigidBody>

          {specs.map((spec, i) => (
            <DiceBody
              key={i}
              shape={spec.shape}
              variant={spec.variant}
              forcedResult={spec.forced}
              index={i}
              total={specs.length}
              appearance={appearance}
              velMul={velMul}
              angMul={angMul}
              onSettled={handleSettled}
            />
          ))}
        </Physics>
      </Suspense>
    </Canvas>
  )
}
