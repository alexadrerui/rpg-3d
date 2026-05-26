import { useRef, useMemo } from "react"
import { useFrame }        from "@react-three/fiber"
import * as THREE          from "three"

// ─────────────────────────────────────────────────────────────────────────────
// CloudShadowLayer — sombra projetada pelas nuvens no terreno
//
// Plano horizontal com shader FBM animado que sincroniza com a deriva das
// nuvens do CloudLayer. depthTest=true → sombra oclusa por paredes (correto);
// renderOrder=1 → renderiza depois do terreno para alpha blend funcionar.
// ─────────────────────────────────────────────────────────────────────────────

// ── GLSL ─────────────────────────────────────────────────────────────────────

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG = /* glsl */`
  uniform float uTime;
  uniform float uCoverage;     // 0–1: cobertura de nuvens
  uniform float uSunElevation; // 0 (horizonte) → 1 (zênite)
  uniform float uMaxOpacity;   // opacidade máxima da sombra

  varying vec2 vUv;

  // ── Ruído ──────────────────────────────────────────────────────────────────

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  // FBM 5 oitavas — dá forma orgânica às manchas de sombra
  float fbm(vec2 p) {
    float v = 0.0, amp = 0.52;
    for (int i = 0; i < 5; i++) {
      v  += amp * vnoise(p);
      p   = p * 2.07 + vec2(1.7, 9.2);
      amp *= 0.46;
    }
    return v;
  }

  void main() {
    // Duas camadas de deriva — velocidades e ângulos distintos criam profundidade
    vec2 drift1 = vec2( uTime * 0.018,  uTime * 0.008);
    vec2 drift2 = vec2( uTime * 0.011, -uTime * 0.016);

    float f1 = fbm((vUv + drift1) * 2.8);
    float f2 = fbm((vUv + drift2) * 1.9);
    float cloud = f1 * 0.65 + f2 * 0.35;

    // Threshold: maior cobertura → threshold menor → manchas maiores e mais frequentes
    float thr    = mix(0.73, 0.56, uCoverage);
    float shadow = smoothstep(thr, thr + 0.14, cloud);

    // Fade nas bordas para o plano não ter corte abrupto
    vec2  edgeDist = abs(vUv - 0.5) * 2.0;
    float edge     = 1.0 - smoothstep(0.75, 1.0, max(edgeDist.x, edgeDist.y));

    // Sombra de nuvem tem leve tonalidade fria-azulada (não cinza neutro)
    vec3 shadowColor = vec3(0.0, 0.015, 0.06);

    float alpha = shadow * uSunElevation * uCoverage * uMaxOpacity * edge;

    gl_FragColor = vec4(shadowColor, alpha);
  }
`

// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  timeOfDay: number   // 0–24
  coverage?: number   // 0–1
}

function sunElevation(hour: number) {
  return Math.sin(((hour - 6) / 12) * Math.PI)
}

export function CloudShadowLayer({ timeOfDay, coverage = 0.35 }: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null!)

  // Uniforms criados uma vez — uTime acumula sem resetar a cada re-render
  const uniforms = useMemo(() => ({
    uTime:         { value: 0 },
    uCoverage:     { value: Math.max(0, coverage) },
    uSunElevation: { value: Math.max(0, sunElevation(timeOfDay)) },
    uMaxOpacity:   { value: 0.44 },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []) // [] intencional: objeto mutado via useFrame, não recriado

  // Atualiza uniforms a cada frame a partir dos props mais recentes (closure)
  useFrame((_, delta) => {
    const m = matRef.current
    if (!m) return
    m.uniforms["uTime"]!.value         += delta
    m.uniforms["uCoverage"]!.value      = Math.max(0, coverage)
    m.uniforms["uSunElevation"]!.value  = Math.max(0, sunElevation(timeOfDay))
  })

  // Só renderiza quando o sol está acima do horizonte e há cobertura
  const elev = sunElevation(timeOfDay)
  if (elev <= 0 || coverage <= 0) return null

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.08, 0]}
      renderOrder={1}
    >
      {/*
        600×600 cobre mapas típicos de RPG com margem.
        depthTest=true → sombra oclusa por paredes (comportamento correto).
        depthWrite=false → não corrompe o depth buffer.
      */}
      <planeGeometry args={[600, 600, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={true}
      />
    </mesh>
  )
}
