import { useRef, useState, useCallback, Component } from "react"
import type { ErrorInfo, ReactNode } from "react"
import { useFrame, useThree }  from "@react-three/fiber"
import { Text, Circle, Billboard, useTexture } from "@react-three/drei"
import { useGLTF }             from "@react-three/drei"
import * as THREE from "three"
import type { TokenPosition }  from "@rpg3d/sync-client"

// ─────────────────────────────────────────────────────────────────────────────
// Token — disco 3D que representa um personagem no mapa
// Draggable (só o próprio jogador move o dele; mestre move qualquer um)
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_COLORS: Record<string, string> = {
  player:  "#3b82f6",
  enemy:   "#ef4444",
  npc:     "#f59e0b",
  master:  "#8b5cf6",
}

type Props = {
  token:        TokenPosition
  name:         string
  role?:        "player" | "enemy" | "npc" | "master"
  isOwn:        boolean
  isMaster:     boolean
  avatarType?:  "none" | "image" | "model"
  avatarUrl?:   string
  onMove?:      (pos: { x: number; y: number; z: number }, rotation: number) => void
  onDespawn?:   () => void
}

export function TokenMesh({ token, name, role = "player", isOwn, isMaster, avatarType, avatarUrl, onMove, onDespawn }: Props) {
  const meshRef   = useRef<THREE.Group>(null)
  const isDragging = useRef(false)
  const dragPlane  = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const dragOffset = useRef(new THREE.Vector3())
  const { camera, raycaster, gl } = useThree()
  const [hovered, setHovered] = useState(false)

  // Posição alvo — interpola suavemente
  const targetPos = useRef(new THREE.Vector3(
    token.position.x, token.position.y, token.position.z
  ))

  useFrame(() => {
    if (!meshRef.current || isDragging.current) return
    targetPos.current.set(token.position.x, token.position.y, token.position.z)
    meshRef.current.position.lerp(targetPos.current, 0.12)
  })

  const canDrag = isOwn || isMaster

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!canDrag) return
    e.stopPropagation()
    isDragging.current = true
    gl.domElement.setPointerCapture(e.pointerId)

    // Calcula offset para drag suave
    const intersect = new THREE.Vector3()
    raycaster.ray.intersectPlane(dragPlane.current, intersect)
    if (meshRef.current) dragOffset.current.subVectors(meshRef.current.position, intersect)
  }, [canDrag, gl, raycaster])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !meshRef.current) return
    e.stopPropagation()

    const intersect = new THREE.Vector3()
    raycaster.setFromCamera(
      { x: (e.clientX / window.innerWidth) * 2 - 1, y: -(e.clientY / window.innerHeight) * 2 + 1 },
      camera
    )
    raycaster.ray.intersectPlane(dragPlane.current, intersect)
    if (!intersect) return

    meshRef.current.position.copy(intersect.add(dragOffset.current))
    meshRef.current.position.y = 0
  }, [camera, raycaster])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !meshRef.current) return
    isDragging.current = false
    gl.domElement.releasePointerCapture(e.pointerId)

    const pos = meshRef.current.position
    onMove?.(
      { x: pos.x, y: pos.y, z: pos.z },
      meshRef.current.rotation.y * (180 / Math.PI)
    )
  }, [gl, onMove])

  const color = TOKEN_COLORS[role] ?? TOKEN_COLORS.player!

  const canDespawn = !!onDespawn && isMaster

  return (
    <group
      ref={meshRef}
      position={[token.position.x, 0, token.position.z]}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onDoubleClick={canDespawn ? (e) => { e.stopPropagation(); onDespawn() } : undefined}
    >
      {/* Base disc */}
      <Circle
        args={[0.45, 32]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.5 : 0.15}
          roughness={0.4}
          metalness={0.3}
        />
      </Circle>

      {/* Border ring */}
      <Circle
        args={[0.48, 32]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0]}
      >
        <meshStandardMaterial color="#ffffff" opacity={0.3} transparent />
      </Circle>

      {/* Avatar — image billboard, GLTF model, or default cylinder */}
      <AvatarBoundary fallback={<TokenCylinder color={color} name={name} />}>
        {avatarType === "image" && avatarUrl
          ? <AvatarImage url={avatarUrl} />
          : avatarType === "model" && avatarUrl
          ? <AvatarModel url={avatarUrl} />
          : <TokenCylinder color={color} name={name} />
        }
      </AvatarBoundary>

      {/* Name label / despawn hint ao hover */}
      {hovered && (
        <Text
          position={[0, 0.7, 0]}
          fontSize={0.18}
          color={canDespawn ? "#ef4444" : "#ffffff"}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {canDespawn ? `${name} [2x]` : name}
        </Text>
      )}

      {/* Own token indicator */}
      {isOwn && (
        <pointLight
          position={[0, 1.5, 0]}
          intensity={3}
          distance={4}
          color={color}
        />
      )}
    </group>
  )
}

// ── Default cylinder token (no avatar) ───────────────────────────────────────

function TokenCylinder({ color, name }: { color: string; name: string }) {
  return (
    <>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.42, 0.24, 16]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} emissive={color} emissiveIntensity={0.1} />
      </mesh>
      <Text position={[0, 0.28, 0]} fontSize={0.28} color="#ffffff" anchorX="center" anchorY="middle">
        {name.charAt(0).toUpperCase()}
      </Text>
    </>
  )
}

// ── Image billboard avatar (PNG with transparency) ────────────────────────────

function AvatarImage({ url }: { url: string }) {
  const texture = useTexture(url)
  return (
    <Billboard follow lockX={false} lockY={false} lockZ={false}>
      <mesh position={[0, 0.75, 0]}>
        <planeGeometry args={[0.9, 1.5]} />
        <meshBasicMaterial map={texture} transparent alphaTest={0.05} side={THREE.DoubleSide} />
      </mesh>
    </Billboard>
  )
}

// ── GLTF 3D model avatar ──────────────────────────────────────────────────────

function AvatarModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene.clone()} position={[0, 0, 0]} scale={[0.4, 0.4, 0.4]} />
}

// ── Error boundary — keeps token visible if avatar fails to load ──────────────

type BoundaryState = { hasError: boolean }
class AvatarBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, BoundaryState> {
  state: BoundaryState = { hasError: false }
  static getDerivedStateFromError(): BoundaryState { return { hasError: true } }
  componentDidCatch(_err: Error, _info: ErrorInfo) {}
  render() { return this.state.hasError ? this.props.fallback : this.props.children }
}
