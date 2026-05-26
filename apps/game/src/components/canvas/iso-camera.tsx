import { useRef, useEffect } from "react"
import { useThree, useFrame } from "@react-three/fiber"
import { OrthographicCamera } from "@react-three/drei"
import * as THREE from "three"
import type { CameraConfig } from "@rpg3d/schema"

const ISO_ANGLE_Y = Math.PI / 4
const ISO_ANGLE_X = Math.atan(1 / Math.sqrt(2))  // ~35.26°
const ZOOM_SPEED  = 0.1
const PAN_SPEED   = 0.02
const CAM_DIST    = 30

// Fator de smoothing do lerp: "% restante após 1 frame a 60fps"
// pow(BASE, delta*60) é frame-rate independent
const FOLLOW_DECAY = 0.92

type Props = {
  config?:         CameraConfig
  targetPosition?: THREE.Vector3
}

export function IsoCamera({ config, targetPosition }: Props) {
  const { gl, size } = useThree()
  const camRef     = useRef<THREE.OrthographicCamera>(null)
  const targetRef  = useRef(new THREE.Vector3(0, 0, 0))
  const zoomRef    = useRef(20)
  const panningRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })

  // Config espelhado em ref — handlers leem daqui, sem precisar recriar listeners
  const configRef = useRef({
    minZoom: config?.minZoom ?? 5,
    maxZoom: config?.maxZoom ?? 50,
    bounds:  config?.bounds  ?? null as CameraConfig["bounds"] | null,
  })
  useEffect(() => {
    configRef.current = {
      minZoom: config?.minZoom ?? 5,
      maxZoom: config?.maxZoom ?? 50,
      bounds:  config?.bounds  ?? null,
    }
  }, [config])

  // ── Loop de render ─────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (!camRef.current) return

    if (targetPosition) {
      // Lerp frame-rate independent: mesmo resultado visual a 30, 60 ou 120fps
      const t = 1 - Math.pow(FOLLOW_DECAY, delta * 60)
      targetRef.current.lerp(targetPosition, t)
    }

    const tgt = targetRef.current
    camRef.current.position.set(
      tgt.x + CAM_DIST * Math.cos(ISO_ANGLE_X) * Math.cos(ISO_ANGLE_Y),
      tgt.y + CAM_DIST * Math.sin(ISO_ANGLE_X),
      tgt.z + CAM_DIST * Math.cos(ISO_ANGLE_X) * Math.sin(ISO_ANGLE_Y),
    )
    camRef.current.lookAt(tgt)
    camRef.current.zoom = zoomRef.current
    camRef.current.updateProjectionMatrix()
  })

  // ── Listeners — registrados uma vez, leem configRef para valores mutáveis ──
  useEffect(() => {
    const canvas = gl.domElement

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const { minZoom, maxZoom } = configRef.current
      zoomRef.current = Math.max(minZoom, Math.min(maxZoom,
        zoomRef.current - e.deltaY * ZOOM_SPEED,
      ))
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 1 || e.button === 2) {
        panningRef.current = true
        lastPosRef.current = { x: e.clientX, y: e.clientY }
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!panningRef.current) return
      const dx = e.clientX - lastPosRef.current.x
      const dy = e.clientY - lastPosRef.current.y
      lastPosRef.current = { x: e.clientX, y: e.clientY }

      const speed = PAN_SPEED * (50 / zoomRef.current)
      targetRef.current.x -= (dx * Math.cos(ISO_ANGLE_Y) + dy * Math.sin(ISO_ANGLE_Y)) * speed
      targetRef.current.z -= (dx * -Math.sin(ISO_ANGLE_Y) + dy * Math.cos(ISO_ANGLE_Y)) * speed

      const { bounds } = configRef.current
      if (bounds) {
        targetRef.current.x = Math.max(bounds.minX, Math.min(bounds.maxX, targetRef.current.x))
        targetRef.current.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, targetRef.current.z))
      }
    }

    const onMouseUp      = () => { panningRef.current = false }
    const onContextMenu  = (e: Event) => e.preventDefault()

    let lastTouchDist = 0
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastTouchDist = Math.hypot(
          e.touches[0]!.clientX - e.touches[1]!.clientX,
          e.touches[0]!.clientY - e.touches[1]!.clientY,
        )
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return
      const { minZoom, maxZoom } = configRef.current
      const dist = Math.hypot(
        e.touches[0]!.clientX - e.touches[1]!.clientX,
        e.touches[0]!.clientY - e.touches[1]!.clientY,
      )
      zoomRef.current = Math.max(minZoom, Math.min(maxZoom,
        zoomRef.current + (dist - lastTouchDist) * 0.05,
      ))
      lastTouchDist = dist
    }

    canvas.addEventListener("wheel",       onWheel,      { passive: false })
    canvas.addEventListener("mousedown",   onMouseDown)
    window.addEventListener("mousemove",   onMouseMove)
    window.addEventListener("mouseup",     onMouseUp)
    canvas.addEventListener("touchstart",  onTouchStart, { passive: true })
    canvas.addEventListener("touchmove",   onTouchMove,  { passive: true })
    canvas.addEventListener("contextmenu", onContextMenu)

    return () => {
      canvas.removeEventListener("wheel",       onWheel)
      canvas.removeEventListener("mousedown",   onMouseDown)
      window.removeEventListener("mousemove",   onMouseMove)
      window.removeEventListener("mouseup",     onMouseUp)
      canvas.removeEventListener("touchstart",  onTouchStart)
      canvas.removeEventListener("touchmove",   onTouchMove)
      canvas.removeEventListener("contextmenu", onContextMenu)
    }
  }, [gl]) // config nunca entra aqui — lido via configRef dentro dos handlers

  const aspect = size.width / size.height
  const s      = 10

  return (
    <OrthographicCamera
      ref={camRef}
      makeDefault
      left={-s * aspect} right={s * aspect}
      top={s}            bottom={-s}
      near={-1000}       far={1000}
      zoom={20}
    />
  )
}
