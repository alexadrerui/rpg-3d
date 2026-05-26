import { useMemo } from "react"
import { Clouds, Cloud } from "@react-three/drei"
import * as THREE from "three"

// ─────────────────────────────────────────────────────────────────────────────
// CloudLayer — nuvens volumétricas usando @react-three/drei <Cloud>/<Clouds>
//
// Funciona com WebGL e WebGPU (mesh-based, sem postprocessing).
// A cor e opacidade mudam com a hora do dia para acompanhar o céu físico.
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  timeOfDay: number   // 0–24
  coverage?:  number  // 0–1, default 0.35
}

type CloudGroup = {
  seed:    number
  pos:     [number, number, number]
  bounds:  [number, number, number]
  volume:  number
  segs:    number
  speed:   number
  growth:  number
}

// Gera layout das nuvens proporcional ao coverage
function buildGroups(coverage: number): CloudGroup[] {
  const d = Math.max(0.05, coverage)
  return [
    // Cirros altos — finos, espalhados
    { seed: 1, pos: [  0,  65,   0], bounds: [60, 1, 60], volume: d * 4,  segs: 18, speed: 0.06, growth: 4 },
    { seed: 6, pos: [ 20,  60, -30], bounds: [40, 1, 40], volume: d * 3,  segs: 15, speed: 0.05, growth: 4 },
    // Cúmulos médios — volumosos
    { seed: 2, pos: [-32,  47,  12], bounds: [22, 6, 22], volume: d * 12, segs: 42, speed: 0.13, growth: 6 },
    { seed: 3, pos: [ 38,  44, -22], bounds: [19, 7, 19], volume: d * 14, segs: 38, speed: 0.10, growth: 5 },
    { seed: 4, pos: [-20,  52, -38], bounds: [26, 4, 26], volume: d * 9,  segs: 32, speed: 0.09, growth: 5 },
    { seed: 5, pos: [ 48,  49,  28], bounds: [16, 5, 16], volume: d * 10, segs: 28, speed: 0.11, growth: 6 },
  ]
}

// Eleva ângulo solar: -1 (meia-noite) → 0 (amanhecer/entardecer) → 1 (meio-dia)
function solarElevation(hour: number) {
  return Math.sin(((hour - 6) / 12) * Math.PI)
}

function isGoldenHour(hour: number) {
  return (hour >= 5 && hour <= 8) || (hour >= 16 && hour <= 20)
}

export function CloudLayer({ timeOfDay, coverage = 0.35 }: Props) {
  const elev   = solarElevation(timeOfDay)
  const golden = isGoldenHour(timeOfDay)

  const color: string =
    elev <= 0 ? "#1a1a28"   // noite: azul-cinza escuro
    : golden  ? "#ffb070"   // golden hour: laranja quente
               : "#f2f2ff"  // dia: branco levemente azulado

  const opacity =
    elev <= 0 ? 0.07        // quase invisível à noite
    : golden  ? 0.90        // mais denso no golden hour
               : 0.82

  const groups = useMemo(() => buildGroups(coverage), [coverage])

  if (coverage <= 0) return null

  return (
    <Clouds material={THREE.MeshLambertMaterial} limit={600} range={600}>
      {groups.map(g => (
        <Cloud
          key={g.seed}
          seed={g.seed}
          position={g.pos}
          bounds={g.bounds}
          volume={g.volume}
          segments={g.segs}
          speed={g.speed}
          growth={g.growth}
          color={color}
          opacity={opacity}
          concentrate="outside"
          fade={90}
        />
      ))}
    </Clouds>
  )
}
