import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DodecahedronGeometry,
  IcosahedronGeometry,
  Matrix4,
  OctahedronGeometry,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  TetrahedronGeometry,
  Vector3,
} from "three"

// Esquema de troca de face (inspirado no Dice So Nice): o dado rola com física
// livre; quando assenta, detectamos qual face física aponta para cima e giramos
// APENAS a malha visual para que a face do resultado autoritativo (servidor)
// fique para cima. Como todos os sólidos aqui têm faces antípodas (o d4 usa
// leitura por vértice, cujo oposto é uma face), a face de baixo continua
// perfeitamente apoiada no chão após qualquer troca.

export type DieShape = 4 | 6 | 8 | 10 | 12 | 20

// "tens"/"units" são os dois d10 que compõem um d100 (dezena 00–90 e unidade 0–9)
export type LabelVariant = "std" | "tens" | "units"

export interface DieSlot {
  dir:   Vector3   // direção local de detecção (normal da face; direção do vértice no d4)
  value: number
}

export interface DieLabel {
  text:       string
  position:   Vector3
  quaternion: Quaternion
  size:       number
}

export interface DieLayout {
  geometry: BufferGeometry
  slots:    DieSlot[]
  labels:   DieLabel[]
}

// Plano 1×1 compartilhado por todos os labels (escalado por mesh.scale)
export const LABEL_PLANE = new PlaneGeometry(1, 1)

// Escala global dos dados (geometria + colliders + labels acompanham)
export const DIE_SCALE = 1.3

const LABEL_SIZE: Record<DieShape, number> = {
  4: 0.16, 6: 0.30, 8: 0.26, 10: 0.22, 12: 0.26, 20: 0.19,
}

// d10 real: trapezoedro pentagonal. A planaridade das faces "pipa" exige
// h = apex * (1 - cos36°) / (1 + cos36°) ≈ 0.1056 * apex.
function makeD10Geometry(): BufferGeometry {
  const APEX = 0.55
  const RING = 0.52
  const H = APEX * ((1 - Math.cos(Math.PI / 5)) / (1 + Math.cos(Math.PI / 5)))

  const ring: Vector3[] = []
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10
    ring.push(new Vector3(Math.cos(a) * RING, i % 2 ? H : -H, Math.sin(a) * RING))
  }
  const top    = new Vector3(0, APEX, 0)
  const bottom = new Vector3(0, -APEX, 0)

  const pos: number[] = []
  const tri = (a: Vector3, b: Vector3, c: Vector3) => {
    const n = new Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a))
    const outward = n.dot(a.clone().add(b).add(c)) >= 0
    const v2 = outward ? b : c
    const v3 = outward ? c : b
    pos.push(a.x, a.y, a.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z)
  }
  // pipa = ápice + 2 laterais + vértice oposto; diagonal ápice→oposto divide em 2 triângulos coplanares
  const kite = (apex: Vector3, s1: Vector3, far: Vector3, s2: Vector3) => {
    tri(apex, s1, far)
    tri(apex, far, s2)
  }
  for (let m = 0; m < 5; m++) {
    kite(top,    ring[(2 * m + 1) % 10]!, ring[(2 * m + 2) % 10]!, ring[(2 * m + 3) % 10]!)
    kite(bottom, ring[(2 * m) % 10]!,     ring[(2 * m + 1) % 10]!, ring[(2 * m + 2) % 10]!)
  }

  const geo = new BufferGeometry()
  geo.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3))
  geo.computeVertexNormals()
  return geo
}

export function makeDiceGeometry(shape: DieShape): BufferGeometry {
  const geo = (() => {
    switch (shape) {
      case 4:  return new TetrahedronGeometry(0.5)
      case 6:  return new BoxGeometry(0.65, 0.65, 0.65)
      case 8:  return new OctahedronGeometry(0.55)
      case 10: return makeD10Geometry()
      case 12: return new DodecahedronGeometry(0.55)
      case 20: return new IcosahedronGeometry(0.55)
    }
  })()
  return geo.scale(DIE_SCALE, DIE_SCALE, DIE_SCALE)
}

interface FaceData {
  normal:  Vector3
  center:  Vector3
  corners: Vector3[]
}

// Agrupa os triângulos coplanares da geometria em faces lógicas (normal + centro + cantos).
// Agrupamento por proximidade angular: faces adjacentes distam ≥ 36°, então um
// threshold apertado é seguro e imune a erro de ponto flutuante entre triângulos coplanares.
const COPLANAR_DOT = 0.9999 // ~0.8°

function extractFaces(geo: BufferGeometry): FaceData[] {
  const g = geo.index ? geo.toNonIndexed() : geo
  const p = g.attributes.position!
  const groups: { normal: Vector3; verts: Vector3[] }[] = []

  for (let i = 0; i < p.count; i += 3) {
    const a = new Vector3().fromBufferAttribute(p, i)
    const b = new Vector3().fromBufferAttribute(p, i + 1)
    const c = new Vector3().fromBufferAttribute(p, i + 2)
    const n = new Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize()
    let gr = groups.find((x) => x.normal.dot(n) > COPLANAR_DOT)
    if (!gr) {
      gr = { normal: n, verts: [] }
      groups.push(gr)
    }
    for (const v of [a, b, c]) {
      if (!gr.verts.some((w) => w.distanceToSquared(v) < 1e-8)) gr.verts.push(v)
    }
  }

  return groups.map((gr) => ({
    normal:  gr.normal,
    center:  gr.verts.reduce((s, v) => s.add(v), new Vector3()).multiplyScalar(1 / gr.verts.length),
    corners: gr.verts,
  }))
}

function quatFromBasis(normal: Vector3, up: Vector3): Quaternion {
  const x = new Vector3().crossVectors(up, normal).normalize()
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, up.clone(), normal.clone()))
}

// Orientação do texto: topo do número para o "norte" natural da face
function labelQuat(normal: Vector3): Quaternion {
  const ref = Math.abs(normal.y) > 0.9 ? new Vector3(0, 0, -1) : new Vector3(0, 1, 0)
  const up = ref.sub(normal.clone().multiplyScalar(ref.dot(normal))).normalize()
  return quatFromBasis(normal, up)
}

function faceValues(shape: DieShape, variant: LabelVariant, count: number): number[] {
  // d6 da BoxGeometry extrai na ordem +X,−X,+Y,−Y,+Z,−Z → pares opostos somam 7
  if (shape === 6) return [1, 6, 2, 5, 3, 4]
  if (shape === 10 && variant !== "std") return Array.from({ length: count }, (_, i) => i) // 0–9
  return Array.from({ length: count }, (_, i) => i + 1)
}

function labelText(variant: LabelVariant, value: number): string {
  return variant === "tens" ? `${value}0` : String(value)
}

const LABEL_OFFSET = 0.012

function buildLayout(shape: DieShape, variant: LabelVariant): DieLayout {
  const geometry = makeDiceGeometry(shape)
  const faces = extractFaces(geometry)
  const slots: DieSlot[] = []
  const labels: DieLabel[] = []

  if (shape === 4) {
    // d4 estilo "ápice": resultado = vértice para cima; cada face mostra, perto
    // de cada canto, o valor do vértice daquele canto (como um d4 real)
    const verts: Vector3[] = []
    for (const f of faces) {
      for (const c of f.corners) {
        if (!verts.some((v) => v.distanceToSquared(c) < 1e-8)) verts.push(c)
      }
    }
    verts.forEach((v, i) => slots.push({ dir: v.clone().normalize(), value: i + 1 }))

    for (const f of faces) {
      for (const c of f.corners) {
        const dir = c.clone().normalize()
        const slot = slots.find((s) => s.dir.distanceToSquared(dir) < 1e-6)
        if (!slot) continue
        const up = c.clone().sub(f.center).normalize()
        labels.push({
          text:       String(slot.value),
          position:   f.center.clone()
                        .add(c.clone().sub(f.center).multiplyScalar(0.52))
                        .add(f.normal.clone().multiplyScalar(LABEL_OFFSET)),
          quaternion: quatFromBasis(f.normal, up),
          size:       LABEL_SIZE[4] * DIE_SCALE,
        })
      }
    }
  } else {
    const values = faceValues(shape, variant, faces.length)
    faces.forEach((f, i) => {
      const value = values[i]!
      slots.push({ dir: f.normal.clone(), value })
      labels.push({
        text:       labelText(variant, value),
        position:   f.center.clone().add(f.normal.clone().multiplyScalar(LABEL_OFFSET)),
        quaternion: labelQuat(f.normal),
        size:       LABEL_SIZE[shape] * DIE_SCALE * (variant === "tens" ? 0.85 : 1),
      })
    })
  }

  return { geometry, slots, labels }
}

const layoutCache = new Map<string, DieLayout>()

export function getDieLayout(shape: DieShape, variant: LabelVariant = "std"): DieLayout {
  const key = `${shape}|${variant}`
  let layout = layoutCache.get(key)
  if (!layout) {
    layout = buildLayout(shape, variant)
    layoutCache.set(key, layout)
  }
  return layout
}

const textureCache = new Map<string, CanvasTexture>()

export function labelTexture(text: string, color: string): CanvasTexture {
  const key = `${text}|${color}`
  let tex = textureCache.get(key)
  if (tex) return tex

  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = color
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = `900 ${text.length > 1 ? 64 : 90}px system-ui, sans-serif`
  ctx.fillText(text, 64, 58)
  // sublinhado para desambiguar 6 e 9
  if (text === "6" || text === "9") ctx.fillRect(42, 106, 44, 8)

  tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  textureCache.set(key, tex)
  return tex
}
