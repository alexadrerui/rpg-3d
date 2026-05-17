import { Suspense, useCallback, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier"
import { DiceBody } from "./dice-body"
import type { DiceFace } from "@rpg3d/schema"
import type { DiceAppearance } from "../../store/dice-settings-store"

interface Props {
  diceCount:   number
  diceFaces:   DiceFace
  appearance:  DiceAppearance
  velMul:      number
  angMul:      number
  onAllSettled?: () => void
}

export function DiceScene({ diceCount, diceFaces, appearance, velMul, angMul, onAllSettled }: Props) {
  const settled = useRef(0)

  const handleSettled = useCallback(() => {
    settled.current++
    if (settled.current >= diceCount) onAllSettled?.()
  }, [diceCount, onAllSettled])

  return (
    <Canvas
      camera={{ position: [0, 7, 6], fov: 45 }}
      shadows
      gl={{ antialias: true }}
      style={{ width: "100%", height: "100%" }}
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

          {Array.from({ length: diceCount }, (_, i) => (
            <DiceBody
              key={i}
              faces={diceFaces}
              index={i}
              total={diceCount}
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
