import { Suspense, useEffect, useRef, useState, lazy } from "react"
import { Canvas }             from "@react-three/fiber"
import { Grid }               from "@react-three/drei"
import * as THREE             from "three"
import { useViewer }          from "@pascal-app/viewer"
import { IsoCamera }          from "./iso-camera"
import { FogOfWarOverlay }    from "./fog-of-war"
import { TokenMesh }          from "../tokens/token-mesh"
import { useSceneStore }      from "../../store/scene-store"
import { useAuthStore }       from "../../store/auth-store"
import { injectSceneIntoPascal, clearPascalScene } from "../../lib/pascal-bridge"
import type {
  ActiveScene, FogCell, TokenPosition, Participant,
} from "@rpg3d/sync-client"
import type { EnvironmentConfig } from "@rpg3d/schema"

// Lazy — Pascal Viewer é pesado, carregado só quando necessário
const PascalViewer = lazy(() =>
  import("@pascal-app/viewer").then(m => ({ default: m.Viewer }))
)

// ─────────────────────────────────────────────────────────────────────────────
// GameCanvas — dois layers sobrepostos:
//   Layer 1 (baixo) : Pascal Viewer — renderiza a geometria da cena (WebGPU)
//   Layer 2 (cima)  : Canvas R3F    — câmera iso, tokens, fog of war, HUD 3D
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  activeScene:  ActiveScene | null
  fogCells:     FogCell[]
  tokens:       Record<string, TokenPosition>
  participants: Participant[]
  isMaster:     boolean
  onTokenMove:  (characterId: string, pos: { x: number; y: number; z: number }, rotation: number) => void
}

export function GameCanvas({ activeScene, fogCells, tokens, participants, isMaster, onTokenMove }: Props) {
  const { load, clear, sceneFile, environment, loadState } = useSceneStore()
  const { characterId, userId } = useAuthStore()
  const [pascalReady, setPascalReady] = useState(false)

  // ── 1. Configurar o viewer Pascal ──────────────────────────────────────────
  useEffect(() => {
    const viewer = useViewer.getState()
    viewer.setTheme("dark")
    viewer.setCameraMode("orthographic")   // câmera controlada por nós
    viewer.setWallMode("cutaway")          // paredes recortadas — visão isométrica
    viewer.setLevelMode("stacked")
  }, [])

  // ── 2. Carregar .rpgscene quando a cena ativa muda ──────────────────────
  useEffect(() => {
    if (!activeScene?.sceneUrl) {
      clearPascalScene().catch(console.error)
      clear()
      setPascalReady(false)
      return
    }

    load(activeScene.sceneUrl).then(() => {
      const file = useSceneStore.getState().sceneFile
      if (file) {
        injectSceneIntoPascal(file)
          .then(() => setPascalReady(true))
          .catch(console.error)
      }
    })
  }, [activeScene?.sceneUrl])

  const fogConfig  = environment?.fogOfWar
  const camConfig  = environment?.camera
  const envConfig  = environment

  return (
    <div className="absolute inset-0">

      {/* ── Layer 1: Pascal Viewer (WebGPU) ─────────────────────────────────
          Ocupa 100% do espaço, renderiza a geometria 3D da cena
          pointer-events: none quando não há cena (deixa grid R3F visível)
      ─────────────────────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-0 transition-opacity duration-500"
        style={{ opacity: pascalReady ? 1 : 0 }}
      >
        <Suspense fallback={null}>
          <PascalViewer
            selectionManager="custom"   // desabilita seleção no game
          >
            {/* R3F children do Viewer — câmera iso e fog de guerra ficam aqui */}
            <IsoCamera config={camConfig} />
            <SceneEnvironment envConfig={envConfig} />
            <FogOfWarOverlay
              cells={fogCells}
              config={fogConfig ?? { enabled: false, color: "#000000", opacity: 0.92, revealRadius: 5, revealMode: "circle", persistRevealed: true }}
              enabled={!isMaster && (fogConfig?.enabled ?? false)}
            />
            {/* Tokens de personagem — dentro do Viewer para herdar iluminação */}
            <Suspense fallback={null}>
              {Object.values(tokens).map(token => {
                const participant = participants.find(p => p.characterId === token.characterId)
                const isOwn = token.userId === userId || token.characterId === characterId
                return (
                  <TokenMesh
                    key={token.characterId}
                    token={token}
                    name={participant?.name ?? token.characterId}
                    role={participant?.isMaster ? "master" : "player"}
                    isOwn={isOwn}
                    isMaster={isMaster}
                    onMove={(pos, rot) => onTokenMove(token.characterId, pos, rot)}
                  />
                )
              })}
            </Suspense>
          </PascalViewer>
        </Suspense>
      </div>

      {/* ── Layer 2: Canvas R3F leve (WebGL) ────────────────────────────────
          Só quando não há cena carregada — grade de fundo + câmera de posição
          Quando o Viewer está ativo, este canvas fica oculto (opacity: 0)
      ─────────────────────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-0 transition-opacity duration-500"
        style={{ opacity: pascalReady ? 0 : 1, pointerEvents: pascalReady ? "none" : "auto" }}
      >
        <Canvas
          shadows
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
          style={{ background: "#0a0010" }}
        >
          <IsoCamera config={camConfig} />
          <ambientLight intensity={0.15} />
          <directionalLight position={[10, 20, 10]} intensity={0.6} castShadow />
          <Grid
            args={[60, 60]}
            cellSize={1}
            cellThickness={0.4}
            cellColor="#1e1e2e"
            sectionSize={5}
            sectionThickness={0.8}
            sectionColor="#2d2d44"
            fadeDistance={60}
            fadeStrength={1.5}
            position={[0, 0, 0]}
          />
          {/* Tokens já visíveis antes da cena carregar */}
          <Suspense fallback={null}>
            {Object.values(tokens).map(token => {
              const participant = participants.find(p => p.characterId === token.characterId)
              const isOwn = token.userId === userId || token.characterId === characterId
              return (
                <TokenMesh
                  key={token.characterId}
                  token={token}
                  name={participant?.name ?? token.characterId}
                  role={participant?.isMaster ? "master" : "player"}
                  isOwn={isOwn}
                  isMaster={isMaster}
                  onMove={(pos, rot) => onTokenMove(token.characterId, pos, rot)}
                />
              )
            })}
          </Suspense>
        </Canvas>
      </div>

      {/* ── Overlays de estado ──────────────────────────────────────────────── */}
      <LoadingOverlay loadState={loadState} pascalReady={pascalReady} activeScene={activeScene} />
      <NoSceneHint activeScene={activeScene} isMaster={isMaster} loadState={loadState} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Iluminação e atmosfera baseadas no EnvironmentConfig da cena
// Montado DENTRO do Pascal Viewer (children do Canvas)
// ─────────────────────────────────────────────────────────────────────────────

function SceneEnvironment({ envConfig }: { envConfig: EnvironmentConfig | null }) {
  const lighting = envConfig?.lighting
  const atm      = envConfig?.atmosphere

  return (
    <>
      <ambientLight
        color={lighting?.ambient?.color ?? "#1a0a2e"}
        intensity={lighting?.ambient?.intensity ?? 0.25}
      />
      <directionalLight
        color={lighting?.directional?.color ?? "#6040a0"}
        intensity={lighting?.directional?.intensity ?? 0.6}
        position={[
          lighting?.directional?.position?.x ?? 5,
          lighting?.directional?.position?.y ?? 15,
          lighting?.directional?.position?.z ?? 5,
        ]}
        castShadow={lighting?.directional?.castShadow ?? true}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-near={0.1}
      />
      {/* Cor de fundo da cena */}
      {atm?.skybox?.kind === "color" && (
        <color attach="background" args={[atm.skybox.color]} />
      )}
      {(!atm || !atm.skybox || atm.skybox.kind === "none") && (
        <color attach="background" args={["#0a0010"]} />
      )}
      {/* Fog volumétrico */}
      {atm?.fog?.enabled && (
        <fog
          attach="fog"
          color={atm.fog.color}
          near={atm.fog.near}
          far={atm.fog.far}
        />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Overlays de estado
// ─────────────────────────────────────────────────────────────────────────────

function LoadingOverlay({
  loadState,
  pascalReady,
  activeScene,
}: {
  loadState:    string
  pascalReady:  boolean
  activeScene:  ActiveScene | null
}) {
  const isLoading = !!activeScene && (loadState === "loading" || (loadState === "ready" && !pascalReady))
  if (!isLoading) return null

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral-950/70 backdrop-blur-sm pointer-events-none">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border-2 border-purple-500/30 rounded-full" />
          <div className="absolute inset-0 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm text-neutral-400 font-medium">
          {loadState === "loading" ? "Baixando cenário..." : "Renderizando geometria..."}
        </p>
      </div>
    </div>
  )
}

function NoSceneHint({
  activeScene,
  isMaster,
  loadState,
}: {
  activeScene: ActiveScene | null
  isMaster:    boolean
  loadState:   string
}) {
  if (activeScene || loadState !== "idle") return null

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
      <div className="text-center space-y-2 max-w-xs">
        <p className="text-neutral-500 text-sm font-medium">
          {isMaster ? "Nenhum cenário carregado" : "Aguardando o mestre..."}
        </p>
        <p className="text-neutral-700 text-xs">
          {isMaster
            ? "Use os controles do mestre para selecionar um cenário"
            : "O cenário aparecerá quando o mestre iniciar a cena"}
        </p>
      </div>
    </div>
  )
}
