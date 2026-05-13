import { useMemo, useRef } from "react"
import { useFrame }        from "@react-three/fiber"
import * as THREE from "three"
import type { FogCell, FogOfWarConfig } from "@rpg3d/schema"

// ─────────────────────────────────────────────────────────────────────────────
// Fog of War — plano renderizado sobre a cena com shader de máscara
// Células reveladas ficam transparentes, o resto fica opaco
// ─────────────────────────────────────────────────────────────────────────────

const GRID_SIZE   = 100   // cells total por eixo
const CELL_SIZE   = 1     // unidades world por cell
const TEXTURE_SIZE = 128  // resolução da texture de fog

type Props = {
  cells:   FogCell[]
  config:  FogOfWarConfig
  enabled: boolean
}

export function FogOfWarOverlay({ cells, config, enabled }: Props) {
  const meshRef    = useRef<THREE.Mesh>(null)
  const textureRef = useRef<THREE.DataTexture | null>(null)
  const dataRef    = useRef(new Uint8Array(TEXTURE_SIZE * TEXTURE_SIZE * 4))
  const dirtyRef   = useRef(true)
  const prevLen    = useRef(0)

  // Monta a DataTexture uma vez
  const texture = useMemo(() => {
    const data = dataRef.current
    // Começa tudo opaco (fog total)
    for (let i = 0; i < data.length; i += 4) {
      data[i]     = 0
      data[i + 1] = 0
      data[i + 2] = 0
      data[i + 3] = 255
    }
    const tex = new THREE.DataTexture(data, TEXTURE_SIZE, TEXTURE_SIZE, THREE.RGBAFormat)
    tex.needsUpdate = true
    textureRef.current = tex
    return tex
  }, [])

  // Shader material
  const material = useMemo(() => {
    const [r, g, b] = hexToRgb(config.color)
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite:  false,
      uniforms: {
        uFogTex:   { value: texture },
        uColor:    { value: new THREE.Color(r / 255, g / 255, b / 255) },
        uOpacity:  { value: config.opacity },
        uGridSize: { value: GRID_SIZE },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uFogTex;
        uniform vec3      uColor;
        uniform float     uOpacity;
        varying vec2      vUv;
        void main() {
          float fog = texture2D(uFogTex, vUv).a / 255.0;
          gl_FragColor = vec4(uColor, fog * uOpacity);
        }
      `,
    })
  }, [texture, config.color, config.opacity])

  // Atualiza texture quando cells mudam
  useFrame(() => {
    if (!dirtyRef.current && cells.length === prevLen.current) return
    if (!textureRef.current) return

    prevLen.current = cells.length
    dirtyRef.current = false

    const data   = dataRef.current
    const offset = GRID_SIZE / 2

    // Revela as células
    for (const cell of cells) {
      const tx = Math.round((cell.x / CELL_SIZE + offset) * (TEXTURE_SIZE / GRID_SIZE))
      const tz = Math.round((cell.z / CELL_SIZE + offset) * (TEXTURE_SIZE / GRID_SIZE))

      // Soft reveal (3x3 kernel com fade)
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const px = tx + dx
          const pz = tz + dz
          if (px < 0 || px >= TEXTURE_SIZE || pz < 0 || pz >= TEXTURE_SIZE) continue
          const idx    = (pz * TEXTURE_SIZE + px) * 4
          const center = dx === 0 && dz === 0
          data[idx + 3] = center ? 0 : Math.min(data[idx + 3]!, 80)
        }
      }
    }

    textureRef.current.needsUpdate = true
  })

  // Marca dirty quando cells mudam
  useMemo(() => { dirtyRef.current = true }, [cells])

  if (!enabled) return null

  const worldSize = GRID_SIZE * CELL_SIZE

  return (
    <mesh
      ref={meshRef}
      position={[0, 0.05, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      material={material}
      renderOrder={10}
    >
      <planeGeometry args={[worldSize, worldSize]} />
    </mesh>
  )
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r ?? 0, g ?? 0, b ?? 0]
}
