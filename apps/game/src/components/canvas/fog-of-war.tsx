import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { useFrame, useThree }                          from "@react-three/fiber"
import * as THREE from "three"
import {
  Fn, If, instancedArray, instanceIndex, uniform,
  storageTexture as tslStorageTexture, textureStore,
  texture as tslTexture,
  uv, float, int, uint, vec4, vec2, ivec2,
  select, min as tslMin,
} from "three/tsl"
import type { FogOfWarConfig } from "@rpg3d/schema"
import type { FogCell } from "@rpg3d/sync-client"

// ─────────────────────────────────────────────────────────────────────────────
// Fog of War — WebGPU path usa compute shader + StorageTexture;
// fallback automático para DataTexture em renderers sem suporte a compute.
// ─────────────────────────────────────────────────────────────────────────────

const GRID_SIZE    = 100   // cells por eixo
const CELL_SIZE    = 1     // unidades world por cell
const TEXTURE_SIZE = 128   // resolução da textura de fog
const MAX_CELLS    = 4096  // máximo de cells delta por batch

type Props = {
  cells:   FogCell[]
  config:  FogOfWarConfig
  enabled: boolean
}

export function FogOfWarOverlay({ cells, config, enabled }: Props) {
  const { gl } = useThree()

  // WebGPU: renderer expõe .compute()
  const isWebGPU = useMemo(() => typeof (gl as any).compute === "function", [gl])

  // ── Estado compartilhado ──────────────────────────────────────────────────
  const dirtyRef = useRef(true)
  const prevLen  = useRef(0)
  const initRef  = useRef(false)

  useLayoutEffect(() => { dirtyRef.current = true }, [cells])

  // ── WebGPU path ───────────────────────────────────────────────────────────
  const [r0, g0, b0] = hexToRgb(config.color)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const gpu = useMemo(() => {
    if (!isWebGPU) return null

    // Textura de estado da névoa: canal R = opacidade (1.0 = opaco, 0.0 = revelado)
    const fogTex   = new (THREE as any).StorageTexture(TEXTURE_SIZE, TEXTURE_SIZE)
    const fogStore = tslStorageTexture(fogTex)
    const fogRead  = tslTexture(fogTex)

    // Buffer de células delta (CPU → GPU a cada evento)
    const cellBuf   = instancedArray(new Float32Array(MAX_CELLS * 2), "vec2")
    const cellCount = uniform(0)
    const fogColor  = uniform(new THREE.Color(r0 / 255, g0 / 255, b0 / 255))
    const fogOpacity = uniform(config.opacity)

    // Compute: preenche todos os texels com 1.0 (opaco total)
    const computeReset = Fn(() => {
      const px = int(instanceIndex).mod(int(TEXTURE_SIZE))
      const pz = int(instanceIndex).div(int(TEXTURE_SIZE))
      textureStore(fogStore, ivec2(px, pz), vec4(1.0, 0.0, 0.0, 1.0))
    })().compute(TEXTURE_SIZE * TEXTURE_SIZE)

    // Compute: revela células delta (escreve 0.0 = revelado no texel do centro)
    const computeReveal = Fn(() => {
      If(instanceIndex.lessThan(uint(cellCount)), () => {
        const cell   = cellBuf.element(instanceIndex)
        const offset = float(GRID_SIZE / 2)
        const scale  = float(TEXTURE_SIZE / GRID_SIZE)
        const tx     = cell.x.div(float(CELL_SIZE)).add(offset).mul(scale).round().toInt()
        const tz     = cell.y.div(float(CELL_SIZE)).add(offset).mul(scale).round().toInt() // z em .y
        const TEX    = int(TEXTURE_SIZE)

        const clamp0 = (v: any) => v.clamp(int(0), TEX.sub(1))
        textureStore(fogStore, ivec2(clamp0(tx), clamp0(tz)), vec4(0.0, 0.0, 0.0, 1.0))
      })
    })().compute(MAX_CELLS)

    // Fragment: soft reveal via amostragem 3×3 na GPU.
    // Se algum vizinho está revelado (0.0), o pixel borda fica em 80/255 do fog original.
    const TEXEL = float(1.0 / TEXTURE_SIZE)
    const NEIGHBORS: [number, number][] = [
      [-1,-1],[-1,0],[-1,1],
      [ 0,-1],        [0,1],
      [ 1,-1],[ 1,0],[ 1,1],
    ]
    const fragNode = Fn(() => {
      const uvCoord = uv()
      const center  = tslTexture(fogTex, uvCoord).r

      // Min dos 8 vizinhos — loop desdobrado em tempo de build (TSL Fn roda no JS)
      let nearMin: any = center
      for (const [dx, dz] of NEIGHBORS) {
        const off = vec2(float(dx).mul(TEXEL), float(dz).mul(TEXEL))
        nearMin = tslMin(nearMin, tslTexture(fogTex, uvCoord.add(off)).r)
      }

      // Vizinho revelado → pixel borda recebe 80/255 do fog (em vez de 1.0)
      const scale = select(nearMin.lessThan(float(0.01)), float(80.0 / 255.0), float(1.0))
      const fogVal = center.mul(scale)

      return vec4(fogColor, fogVal.mul(fogOpacity))
    })()

    const material = new (THREE as any).MeshBasicNodeMaterial({
      transparent: true,
      depthWrite:  false,
    }) as THREE.Material
    ;(material as any).outputNode = fragNode

    return { cellBuf, cellCount, fogColor, fogOpacity, computeReset, computeReveal, material }
  // config.color e config.opacity gerenciados via useEffect abaixo para evitar re-criar shaders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWebGPU])

  // Atualiza uniforms de cor/opacidade sem recriar os shaders
  useEffect(() => {
    if (!gpu) return
    const [r, g, b] = hexToRgb(config.color)
    gpu.fogColor.value.set(r / 255, g / 255, b / 255)
    gpu.fogOpacity.value = config.opacity
  }, [gpu, config.color, config.opacity])

  useFrame(({ gl: renderer }) => {
    const dirty     = dirtyRef.current
    const unchanged = cells.length === prevLen.current

    if (!dirty && unchanged) return

    const wasCleared   = dirty && cells.length === 0 && prevLen.current > 0
    prevLen.current    = cells.length
    dirtyRef.current   = false

    if (isWebGPU && gpu) {
      const r = renderer as any

      if (!initRef.current) { r.compute(gpu.computeReset); initRef.current = true }
      if (wasCleared)       { r.compute(gpu.computeReset); return }
      if (cells.length === 0) return

      const count = Math.min(cells.length, MAX_CELLS)
      const arr   = gpu.cellBuf.value.array as Float32Array
      for (let i = 0; i < count; i++) {
        arr[i * 2]     = cells[i]!.x
        arr[i * 2 + 1] = cells[i]!.z  // z gravado na componente Y do vec2
      }
      gpu.cellBuf.value.needsUpdate = true
      gpu.cellCount.value = count
      r.compute(gpu.computeReveal)
      return
    }

    // ── Legacy DataTexture path ──────────────────────────────────────────────
    if (!legacyTexRef.current) return
    const data = legacyData.current
    if (wasCleared) {
      for (let i = 3; i < data.length; i += 4) data[i] = 255
      legacyTexRef.current.needsUpdate = true
      return
    }
    const offset = GRID_SIZE / 2
    for (const cell of cells) {
      const tx = Math.round((cell.x / CELL_SIZE + offset) * (TEXTURE_SIZE / GRID_SIZE))
      const tz = Math.round((cell.z / CELL_SIZE + offset) * (TEXTURE_SIZE / GRID_SIZE))
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const px = tx + dx
          const pz = tz + dz
          if (px < 0 || px >= TEXTURE_SIZE || pz < 0 || pz >= TEXTURE_SIZE) continue
          const idx = (pz * TEXTURE_SIZE + px) * 4
          data[idx + 3] = (dx === 0 && dz === 0) ? 0 : Math.min(data[idx + 3]!, 80)
        }
      }
    }
    legacyTexRef.current.needsUpdate = true
  })

  // ── Legacy path: DataTexture + ShaderMaterial ─────────────────────────────
  const legacyData   = useRef(new Uint8Array(TEXTURE_SIZE * TEXTURE_SIZE * 4))
  const legacyTexRef = useRef<THREE.DataTexture | null>(null)

  const legacyMaterial = useMemo(() => {
    if (isWebGPU) return null
    const data = legacyData.current
    for (let i = 0; i < data.length; i += 4) {
      data[i] = data[i + 1] = data[i + 2] = 0
      data[i + 3] = 255
    }
    const tex = new THREE.DataTexture(data, TEXTURE_SIZE, TEXTURE_SIZE, THREE.RGBAFormat)
    tex.needsUpdate = true
    legacyTexRef.current = tex
    const [r, g, b] = hexToRgb(config.color)
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite:  false,
      uniforms: {
        uFogTex:  { value: tex },
        uColor:   { value: new THREE.Color(r / 255, g / 255, b / 255) },
        uOpacity: { value: config.opacity },
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
          float fog = texture2D(uFogTex, vUv).a;
          gl_FragColor = vec4(uColor, fog * uOpacity);
        }
      `,
    })
  }, [isWebGPU, config.color, config.opacity])

  // ── Render ────────────────────────────────────────────────────────────────
  if (!enabled) return null

  const worldSize = GRID_SIZE * CELL_SIZE
  const material  = isWebGPU ? gpu?.material : legacyMaterial

  return (
    <mesh
      position={[0, 0.05, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      material={material ?? undefined}
      renderOrder={10}
    >
      <planeGeometry args={[worldSize, worldSize]} />
    </mesh>
  )
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) ?? 0,
    parseInt(hex.slice(3, 5), 16) ?? 0,
    parseInt(hex.slice(5, 7), 16) ?? 0,
  ]
}
