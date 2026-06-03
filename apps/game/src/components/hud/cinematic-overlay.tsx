import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react"
import type { VideoState } from "@rpg3d/sync-client"
import {
  VERTEX_SHADER,
  FRAGMENT_SHADERS,
  compileShader,
  createProgram,
} from "../../lib/transition-shaders"

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

type Phase =
  | "idle"
  | "transition_in"
  | "playing"
  | "transition_out"
  | "overlay"

interface GlState {
  gl:        WebGL2RenderingContext
  program:   WebGLProgram
  texture:   WebGLTexture
  posBuffer: WebGLBuffer
  uProgress: WebGLUniformLocation
  uTime:     WebGLUniformLocation
  uVideo:    WebGLUniformLocation
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface CinematicOverlayProps {
  videoState: VideoState | null
  /** Sinaliza à session-page que o jogo deve ser obscurecido */
  onDimGame:  (dim: boolean) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// CinematicOverlay
// ─────────────────────────────────────────────────────────────────────────────

export function CinematicOverlay({ videoState, onDimGame }: CinematicOverlayProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const videoRef   = useRef<HTMLVideoElement>(null)
  const glRef      = useRef<GlState | null>(null)
  const phaseRef   = useRef<Phase>("idle")
  const rafRef     = useRef<number>(0)
  const startRef   = useRef<number>(0)
  const progressRef= useRef<number>(0)
  const timeRef    = useRef<number>(0)
  const effectRef  = useRef<string>("fade")

  const [phase, setPhase]     = useState<Phase>("idle")
  const [showCanvas, setShowCanvas] = useState(false)
  const [showVideo, setShowVideo]   = useState(false)

  // ── WebGL setup ────────────────────────────────────────────────────────────

  const initGl = useCallback((effect: string) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    // Reusa o contexto se já existe
    const existing = glRef.current
    if (existing) {
      // Recompila só o fragment shader se o efeito mudou
      try {
        const { gl } = existing
        const fsSrc = FRAGMENT_SHADERS[effect] ?? FRAGMENT_SHADERS.fade ?? ""
        const vs = compileShader(gl, gl.VERTEX_SHADER,   VERTEX_SHADER)
        const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc)
        const prog = createProgram(gl, vs, fs)
        gl.deleteProgram(existing.program)
        existing.program      = prog
        existing.uProgress    = gl.getUniformLocation(prog, "uProgress")!
        existing.uTime        = gl.getUniformLocation(prog, "uTime")!
        existing.uVideo       = gl.getUniformLocation(prog, "uVideo")!
        return existing
      } catch (e) {
        console.error("[cinematic] shader compile:", e)
        return existing
      }
    }

    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: false })
    if (!gl) { console.error("[cinematic] WebGL2 não disponível"); return null }

    try {
      const fsSrc = FRAGMENT_SHADERS[effect] ?? FRAGMENT_SHADERS.fade ?? ""
      const vs   = compileShader(gl, gl.VERTEX_SHADER,   VERTEX_SHADER)
      const fs   = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc)
      const prog = createProgram(gl, vs, fs)

      // Fullscreen quad (triangle-strip)
      const quad = new Float32Array([-1,-1, 1,-1, -1,1, 1,1])
      const buf  = gl.createBuffer()!
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW)

      // Textura de vídeo
      const tex = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

      const state: GlState = {
        gl,
        program:   prog,
        texture:   tex,
        posBuffer: buf,
        uProgress: gl.getUniformLocation(prog, "uProgress")!,
        uTime:     gl.getUniformLocation(prog, "uTime")!,
        uVideo:    gl.getUniformLocation(prog, "uVideo")!,
      }
      glRef.current = state
      return state
    } catch (e) {
      console.error("[cinematic] WebGL init:", e)
      return null
    }
  }, [])

  // ── Render loop WebGL ──────────────────────────────────────────────────────

  const renderFrame = useCallback((ts: number) => {
    const state = glRef.current
    if (!state) return

    const { gl, program, texture, posBuffer, uProgress, uTime, uVideo } = state
    const vid = videoRef.current

    // Sincroniza canvas com tamanho da tela
    const w = window.innerWidth
    const h = window.innerHeight
    if (gl.canvas.width !== w || gl.canvas.height !== h) {
      ;(gl.canvas as HTMLCanvasElement).width  = w
      ;(gl.canvas as HTMLCanvasElement).height = h
      gl.viewport(0, 0, w, h)
    }

    // Atualiza textura com frame do vídeo
    if (vid && vid.readyState >= 2) {
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, vid)
    }

    // Calcula progresso baseado na fase atual
    const elapsed = ts - startRef.current
    const duration = (videoState?.transitionDuration ?? 1500)

    if (phaseRef.current === "transition_in") {
      progressRef.current = Math.min(elapsed / duration, 1)
      if (progressRef.current >= 1) {
        phaseRef.current = "playing"
        setPhase("playing")
        // Em playing, o canvas fica com progresso=1 (passthrough)
      }
    } else if (phaseRef.current === "transition_out") {
      progressRef.current = 1 - Math.min(elapsed / duration, 1)
      if (progressRef.current <= 0) {
        phaseRef.current = "idle"
        setPhase("idle")
        setShowCanvas(false)
        setShowVideo(false)
        onDimGame(false)
        cancelAnimationFrame(rafRef.current)
        return
      }
    }

    // Draw
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    gl.useProgram(program)

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
    const posAttr = gl.getAttribLocation(program, "aPosition")
    gl.enableVertexAttribArray(posAttr)
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.uniform1i(uVideo, 0)
    gl.uniform1f(uProgress, progressRef.current)
    gl.uniform1f(uTime, (ts - startRef.current) * 0.001)

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    rafRef.current = requestAnimationFrame(renderFrame)
  }, [videoState?.transitionDuration, onDimGame])

  // ── Máquina de estados principal ───────────────────────────────────────────

  useEffect(() => {
    const vs = videoState

    // Overlay mode: exibe vídeo transparente sobre o jogo sem shader
    if (vs?.url && vs.mode === "overlay") {
      phaseRef.current = "overlay"
      setPhase("overlay")
      setShowVideo(true)
      setShowCanvas(false)
      onDimGame(false)
      if (videoRef.current) {
        videoRef.current.src = vs.url
        if (vs.playing) videoRef.current.play().catch(() => {})
        else videoRef.current.pause()
      }
      return
    }

    // Cinematic mode: transição com shader
    if (vs?.url && vs.mode === "cinematic" && vs.playing) {
      const effect = vs.transitionIn ?? "fade"
      effectRef.current = effect
      const state = initGl(effect)
      if (!state) return

      // Carrega o vídeo no elemento oculto (fonte de textura + áudio)
      if (videoRef.current) {
        videoRef.current.src = vs.url
        videoRef.current.play().catch(() => {})
      }

      // Inicia transição
      phaseRef.current = "transition_in"
      setPhase("transition_in")
      setShowCanvas(true)
      setShowVideo(false)
      onDimGame(true)
      startRef.current = performance.now()
      progressRef.current = 0

      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(renderFrame)
      return
    }

    // Vídeo parou (url = null ou playing = false) e estava ativo
    const prevPhase = phaseRef.current
    if (
      (!vs?.url || !vs?.playing) &&
      (prevPhase === "playing" || prevPhase === "transition_in" || prevPhase === "overlay")
    ) {
      if (prevPhase === "overlay") {
        setPhase("idle")
        setShowVideo(false)
        phaseRef.current = "idle"
        if (videoRef.current) { videoRef.current.pause(); videoRef.current.src = "" }
        return
      }

      // Transição de saída
      const effect = vs?.transitionOut ?? effectRef.current ?? "fade"
      initGl(effect)
      phaseRef.current = "transition_out"
      setPhase("transition_out")
      setShowCanvas(true)
      startRef.current = performance.now()
      progressRef.current = 1

      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(renderFrame)
      return
    }

    // Sincroniza play/pause no overlay
    if (vs && videoRef.current) {
      if (vs.playing) videoRef.current.play().catch(() => {})
      else videoRef.current.pause()
    }
  }, [
    videoState?.url,
    videoState?.playing,
    videoState?.mode,
    videoState?.transitionIn,
    videoState?.transitionOut,
  ])

  // Limpeza
  useEffect(() => () => { cancelAnimationFrame(rafRef.current) }, [])

  // ── Render ─────────────────────────────────────────────────────────────────

  const isOverlay  = phase === "overlay"
  const isActive   = phase !== "idle"

  const overlayOpacity = videoState?.overlayOpacity ?? 1
  const blendMode      = (videoState?.overlayBlend ?? "normal") as React.CSSProperties["mixBlendMode"]

  if (!isActive) return null

  return (
    <>
      {/* Vídeo oculto — fonte de áudio e textura WebGL em modo cinematic */}
      {/* Em overlay mode, este vídeo É o que o usuário vê */}
      <video
        ref={videoRef}
        loop={false}
        playsInline
        crossOrigin="anonymous"
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{
          objectFit: "cover",
          zIndex: 65,
          opacity: isOverlay ? overlayOpacity : 0,
          mixBlendMode: isOverlay ? blendMode : "normal",
          transition: isOverlay ? "opacity 600ms ease" : "none",
          display: showVideo || isOverlay ? "block" : "none",
        }}
      />

      {/* Canvas WebGL — transições shader em modo cinematic */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 70,
          width:  "100%",
          height: "100%",
          display: showCanvas ? "block" : "none",
        }}
      />

      {/* Letterbox cinematográfico durante playing */}
      {phase === "playing" && (
        <LetterboxBars />
      )}

      {/* Indicador de fase (debug — remover em produção) */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[80] text-[10px] text-white/40 pointer-events-none">
          [{phase}] p={progressRef.current.toFixed(2)}
        </div>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Barras de letterbox cinematográfico (16:9 em telas mais largas/altas)
// ─────────────────────────────────────────────────────────────────────────────

function LetterboxBars() {
  return (
    <>
      <div
        className="fixed left-0 right-0 top-0 bg-black pointer-events-none"
        style={{ zIndex: 68, height: "6vh", transition: "height 600ms ease" }}
      />
      <div
        className="fixed left-0 right-0 bottom-0 bg-black pointer-events-none"
        style={{ zIndex: 68, height: "6vh", transition: "height 600ms ease" }}
      />
    </>
  )
}
