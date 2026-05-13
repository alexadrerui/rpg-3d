import { useRef, useEffect } from "react"
import { useThree, useFrame } from "@react-three/fiber"
import { OrthographicCamera } from "@react-three/drei"
import * as THREE from "three"
import type { CameraConfig } from "@rpg3d/schema"

// ─────────────────────────────────────────────────────────────────────────────
// Câmera isométrica RPG
// Ângulo fixo 45° em Y, 35.26° em X (isométrico clássico)
// Pan com botão direito/meio, zoom com scroll
// ─────────────────────────────────────────────────────────────────────────────

const ISO_ANGLE_Y = Math.PI / 4          // 45°
const ISO_ANGLE_X = Math.atan(1 / Math.sqrt(2)) // ~35.26°
const ZOOM_SPEED  = 0.1
const PAN_SPEED   = 0.02

type Props = {
  config?: CameraConfig
  targetPosition?: THREE.Vector3
}

export function IsoCamera({ config, targetPosition }: Props) {
  const { gl, size } = useThree()
  const camRef     = useRef<THREE.OrthographicCamera>(null)
  const targetRef  = useRef(new THREE.Vector3(0, 0, 0))
  const zoomRef    = useRef(20)
  const panningRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })

  const minZoom = config?.minZoom ?? 5
  const maxZoom = config?.maxZoom ?? 50

  // Segue um token alvo suavemente
  useFrame(() => {
    if (!camRef.current) return
    if (targetPosition) {
      targetRef.current.lerp(targetPosition, 0.08)
    }

    const dist   = 30
    const target = targetRef.current
    camRef.current.position.set(
      target.x + dist * Math.cos(ISO_ANGLE_X) * Math.cos(ISO_ANGLE_Y),
      target.y + dist * Math.sin(ISO_ANGLE_X),
      target.z + dist * Math.cos(ISO_ANGLE_X) * Math.sin(ISO_ANGLE_Y),
    )
    camRef.current.lookAt(target)
    camRef.current.zoom = zoomRef.current
    camRef.current.updateProjectionMatrix()
  })

  // Eventos de mouse/touch
  useEffect(() => {
    const canvas = gl.domElement

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoomRef.current = Math.max(minZoom, Math.min(maxZoom,
        zoomRef.current - e.deltaY * ZOOM_SPEED
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

      // Pan no plano XZ (isométrico)
      const speed = PAN_SPEED * (50 / zoomRef.current)
      targetRef.current.x -= (dx * Math.cos(ISO_ANGLE_Y) + dy * Math.sin(ISO_ANGLE_Y)) * speed
      targetRef.current.z -= (dx * -Math.sin(ISO_ANGLE_Y) + dy * Math.cos(ISO_ANGLE_Y)) * speed

      // Respeita limites do config
      if (config?.bounds) {
        const { minX, maxX, minZ, maxZ } = config.bounds
        targetRef.current.x = Math.max(minX, Math.min(maxX, targetRef.current.x))
        targetRef.current.z = Math.max(minZ, Math.min(maxZ, targetRef.current.z))
      }
    }

    const onMouseUp = () => { panningRef.current = false }

    // Touch
    let lastTouchDist = 0
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        )
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        )
        zoomRef.current = Math.max(minZoom, Math.min(maxZoom,
          zoomRef.current + (dist - lastTouchDist) * 0.05
        ))
        lastTouchDist = dist
      }
    }

    canvas.addEventListener("wheel",       onWheel,      { passive: false })
    canvas.addEventListener("mousedown",   onMouseDown)
    window.addEventListener("mousemove",   onMouseMove)
    window.addEventListener("mouseup",     onMouseUp)
    canvas.addEventListener("touchstart",  onTouchStart, { passive: true })
    canvas.addEventListener("touchmove",   onTouchMove,  { passive: true })
    canvas.addEventListener("contextmenu", (e) => e.preventDefault())

    return () => {
      canvas.removeEventListener("wheel",       onWheel)
      canvas.removeEventListener("mousedown",   onMouseDown)
      window.removeEventListener("mousemove",   onMouseMove)
      window.removeEventListener("mouseup",     onMouseUp)
      canvas.removeEventListener("touchstart",  onTouchStart)
      canvas.removeEventListener("touchmove",   onTouchMove)
    }
  }, [gl, config, minZoom, maxZoom])

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
