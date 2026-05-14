"use client"

import { Suspense, useEffect, useState, lazy } from "react"
import type { RpgViewerProps } from "./types"
import type { RpgSceneFile } from "@rpg3d/schema"

// Heavy — código-split para não bloquear o carregamento inicial
const PascalViewer = lazy(() =>
  import("@pascal-app/viewer").then(m => ({ default: m.Viewer }))
)

type LoadState = "idle" | "loading" | "ready" | "error"

export function RpgViewer({ mode, sceneUrl }: RpgViewerProps) {
  const [loadState, setLoadState] = useState<LoadState>("idle")
  const [pascalReady, setPascalReady] = useState(false)

  // Carrega a cena e injeta no Pascal
  useEffect(() => {
    if (!sceneUrl) {
      setLoadState("idle")
      setPascalReady(false)
      return
    }

    let cancelled = false
    setLoadState("loading")
    setPascalReady(false)

    ;(async () => {
      try {
        const res = await fetch(sceneUrl)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: RpgSceneFile = await res.json()
        if (cancelled) return

        // Importações dinâmicas para compatibilidade com SSR
        const [viewerModule, coreModule] = await Promise.all([
          import("@pascal-app/viewer"),
          import("@pascal-app/core"),
        ])
        if (cancelled) return

        // Configura o viewer para o modo isométrico RPG
        const { useViewer } = viewerModule
        const viewer = useViewer.getState()
        viewer.setTheme("dark")
        viewer.setCameraMode("orthographic")
        viewer.setWallMode("cutaway")
        viewer.setLevelMode("stacked")

        // Injeta os nodes da cena
        const { useScene } = coreModule
        useScene.getState().setScene(
          data.scene.nodes as Parameters<typeof useScene.getState().setScene>[0],
          data.scene.rootNodeIds,
        )

        if (!cancelled) {
          setPascalReady(true)
          setLoadState("ready")
        }
      } catch {
        if (!cancelled) setLoadState("error")
      }
    })()

    return () => { cancelled = true }
  }, [sceneUrl])

  // Limpa a cena ao desmontar o componente
  useEffect(() => {
    return () => {
      import("@pascal-app/core")
        .then(({ useScene }) => useScene.getState().unloadScene())
        .catch(() => {})
    }
  }, [])

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Pascal Viewer — aparece quando a cena está pronta */}
      <div style={{
        position: "absolute",
        inset: 0,
        opacity: pascalReady ? 1 : 0,
        transition: "opacity 500ms",
        pointerEvents: pascalReady ? "auto" : "none",
      }}>
        <Suspense fallback={null}>
          <PascalViewer selectionManager="custom" />
        </Suspense>
      </div>

      {/* Estado de carregamento */}
      {!pascalReady && (
        <StateOverlay loadState={loadState} />
      )}

      {/* Badge de modo */}
      {pascalReady && (
        <div style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "rgba(0,0,0,0.6)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 6,
          padding: "2px 8px",
          fontSize: 11,
          color: "#6b7280",
          fontFamily: "system-ui, sans-serif",
          pointerEvents: "none",
          userSelect: "none",
        }}>
          {mode === "master" ? "Mestre" : "Jogador"}
        </div>
      )}
    </div>
  )
}

function StateOverlay({ loadState }: { loadState: LoadState }) {
  const messages: Record<LoadState, { text: string; color: string }> = {
    idle:    { text: "Nenhum cenário selecionado", color: "#374151" },
    loading: { text: "Carregando cenário...",       color: "#6b7280" },
    ready:   { text: "",                            color: "transparent" },
    error:   { text: "Erro ao carregar o cenário",  color: "#f87171" },
  }

  const { text, color } = messages[loadState]
  if (!text) return null

  return (
    <div style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0a0010",
    }}>
      <p style={{ color, fontSize: 14, fontFamily: "system-ui, sans-serif" }}>{text}</p>
    </div>
  )
}
