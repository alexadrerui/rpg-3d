import { Suspense, useEffect, useMemo, useRef, useState, lazy } from "react"
import { Canvas }             from "@react-three/fiber"
import { Grid, Circle, Text, Html, Sky } from "@react-three/drei"
import * as THREE             from "three"
import { useViewer }          from "@pascal-app/viewer"
import { IsoCamera }          from "./iso-camera"
import { ThirdPersonCamera }  from "./third-person-camera"
import { FogOfWarOverlay }    from "./fog-of-war"
import { WallCutaway }        from "./wall-cutaway"
import { CloudLayer }          from "./cloud-layer"
import { CloudShadowLayer }    from "./cloud-shadow-layer"
import { TokenMesh }          from "../tokens/token-mesh"
import { useSceneStore }      from "../../store/scene-store"
import { useAuthStore }       from "../../store/auth-store"
import { injectSceneIntoPascal, clearPascalScene } from "../../lib/pascal-bridge"
import type {
  ActiveScene, FogCell, TokenPosition, Participant, NpcToken,
} from "@rpg3d/sync-client"
import type { EnvironmentConfig, SpawnNode, EvSpawnNpc } from "@rpg3d/schema"

// Lazy — Pascal Viewer é pesado, carregado só quando necessário
const PascalViewer = lazy(() =>
  import("@pascal-app/viewer").then(m => ({ default: m.Viewer }))
)

// ─────────────────────────────────────────────────────────────────────────────
// GameCanvas — dois layers sobrepostos:
//   Layer 1 (baixo) : Pascal Viewer — renderiza a geometria da cena (WebGPU)
//   Layer 2 (cima)  : Canvas R3F    — grade de fundo enquanto a cena não carrega
//
// Tokens e marcadores NPC vivem em TokenLayer, renderizado em ambos os canvases
// via o mesmo componente. Layer 2 é desmontado após a transição completar
// (600ms > 500ms do CSS) para eliminar double rendering quando a cena está ativa.
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  activeScene:         ActiveScene | null
  fogCells:            FogCell[]
  tokens:              Record<string, TokenPosition>
  npcTokens:           Record<string, NpcToken>
  participants:        Participant[]
  isMaster:            boolean
  onTokenMove:         (characterId: string, pos: { x: number; y: number; z: number }, rotation: number) => void
  onNpcSpawn?:         (data: EvSpawnNpc) => void
  onNpcDespawn?:       (tokenId: string) => void
  firstPersonMode?:    boolean
  firstPersonTokenId?: string
}

function npcAsToken(npc: NpcToken): TokenPosition {
  return { characterId: npc.tokenId, userId: "", position: npc.position, rotation: npc.rotation }
}

export function GameCanvas({
  activeScene, fogCells, tokens, npcTokens, participants, isMaster,
  onTokenMove, onNpcSpawn, onNpcDespawn,
  firstPersonMode, firstPersonTokenId,
}: Props) {
  const { load, clear, environment, loadState } = useSceneStore()
  const { characterId, userId } = useAuthStore()
  const [pascalReady, setPascalReady] = useState(false)

  // Layer 2 desmonta 600ms após pascalReady (> 500ms do CSS fade)
  // para eliminar double rendering enquanto a cena está ativa.
  const [showFallback, setShowFallback] = useState(true)
  useEffect(() => {
    if (!pascalReady) { setShowFallback(true); return }
    const id = setTimeout(() => setShowFallback(false), 600)
    return () => clearTimeout(id)
  }, [pascalReady])

  // Derivados para a câmera de combate — memoizados para não recriar a cada re-render
  const fpToken = useMemo(
    () => firstPersonMode && firstPersonTokenId ? tokens[firstPersonTokenId] : undefined,
    [firstPersonMode, firstPersonTokenId, tokens],
  )
  const enemies = useMemo(
    () => Object.values(npcTokens).filter(t => t.role === "enemy"),
    [npcTokens],
  )

  // ── 1. Configurar o viewer Pascal ──────────────────────────────────────────
  useEffect(() => {
    const viewer = useViewer.getState()
    viewer.setTheme("dark")
    viewer.setCameraMode("orthographic")
    viewer.setWallMode("cutaway")
    viewer.setLevelMode("stacked")
  }, [])

  // ── 2. Carregar .rpgscene quando a cena ativa muda ────────────────────────
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

  const fogConfig = environment?.fogOfWar
  const camConfig = environment?.camera
  const envConfig = environment

  // Céu físico + nuvens — calculado uma vez em GameCanvas e passado para os dois layers
  // Em dev sem cena carregada, ativa preview do céu físico para inspeção visual
  const DEV_PSKY = import.meta.env.DEV
    ? { enabled: true, timeOfDay: 14, clouds: { enabled: true, coverage: 0.4 } }
    : undefined
  const psky = environment?.atmosphere?.physicalSky ?? DEV_PSKY
  const solar = useMemo(
    () => psky?.enabled ? computeTimeOfDay(psky.timeOfDay) : null,
    [psky?.enabled, psky?.timeOfDay],
  )
  const cloudsEnabled = !!(psky?.enabled && psky?.clouds?.enabled)

  // Props partilhadas entre os dois TokenLayer — evita repetir cada prop manualmente
  const tokenLayerProps = {
    tokens, npcTokens, participants, isMaster, userId, characterId,
    onTokenMove, onNpcDespawn, onNpcSpawn,
  }

  return (
    <div className="absolute inset-0">

      {/* ── Layer 1: Pascal Viewer (WebGPU) ──────────────────────────────────
          Renderiza a geometria 3D da cena. Tokens e marcadores NPC vivem aqui
          quando a cena está ativa (pascalReady = true).
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-0 transition-opacity duration-500"
        style={{ opacity: pascalReady ? 1 : 0 }}
      >
        <Suspense fallback={null}>
          <PascalViewer selectionManager="custom">
            {fpToken
              ? <ThirdPersonCamera token={fpToken} enemies={enemies} />
              : <IsoCamera config={camConfig} />
            }
            <SceneEnvironment envConfig={envConfig} />
            <FogOfWarOverlay
              cells={fogCells}
              config={fogConfig ?? { enabled: false, color: "#000000", opacity: 0.92, revealRadius: 5, revealMode: "circle", persistRevealed: true }}
              enabled={!isMaster && (fogConfig?.enabled ?? false)}
            />
            <TokenLayer {...tokenLayerProps} />
            <WallCutaway tokens={tokens} />
            {cloudsEnabled && solar && (<>
              <CloudShadowLayer timeOfDay={psky!.timeOfDay} coverage={psky!.clouds!.coverage} />
              <CloudLayer       timeOfDay={psky!.timeOfDay} coverage={psky!.clouds!.coverage} />
            </>)}
          </PascalViewer>
        </Suspense>
      </div>

      {/* ── Layer 2: Canvas R3F leve (WebGL) ─────────────────────────────────
          Grade de fundo + tokens enquanto o Pascal Viewer ainda está carregando.
          Desmontado 600ms após pascalReady para eliminar double rendering.
      ──────────────────────────────────────────────────────────────────────── */}
      {showFallback && (
        <div
          className="absolute inset-0 z-0 transition-opacity duration-500"
          style={{ opacity: pascalReady ? 0 : 1, pointerEvents: pascalReady ? "none" : "auto" }}
        >
          <Canvas
            shadows
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
            style={{ background: solar ? undefined : "#0a0010" }}
          >
            {fpToken
              ? <ThirdPersonCamera token={fpToken} enemies={enemies} />
              : <IsoCamera config={camConfig} />
            }
            {solar
              ? <>
                  <ambientLight color={solar.ambientColor} intensity={solar.ambientIntensity} />
                  {solar.lightIntensity > 0.01 && (
                    <directionalLight color={solar.lightColor} intensity={solar.lightIntensity} position={solar.sunPos} castShadow shadow-mapSize={SHADOW_MAP_SIZE} />
                  )}
                  <Sky distance={450000} sunPosition={solar.sunPos} turbidity={8} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
                </>
              : <>
                  <ambientLight intensity={0.15} />
                  <directionalLight position={[10, 20, 10]} intensity={0.6} castShadow />
                </>
            }
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
            <TokenLayer {...tokenLayerProps} />
            {cloudsEnabled && solar && (<>
              <CloudShadowLayer timeOfDay={psky!.timeOfDay} coverage={psky!.clouds!.coverage} />
              <CloudLayer       timeOfDay={psky!.timeOfDay} coverage={psky!.clouds!.coverage} />
            </>)}
          </Canvas>
        </div>
      )}

      {/* ── Overlays de estado ───────────────────────────────────────────────── */}
      <LoadingOverlay loadState={loadState} pascalReady={pascalReady} activeScene={activeScene} />
      <NoSceneHint activeScene={activeScene} isMaster={isMaster} loadState={loadState} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TokenLayer — fonte canônica de tokens + marcadores NPC.
// Renderizado em cada canvas separadamente (contextos WebGL distintos),
// mas definido uma única vez aqui.
// ─────────────────────────────────────────────────────────────────────────────

type TokenLayerProps = {
  tokens:        Record<string, TokenPosition>
  npcTokens:     Record<string, NpcToken>
  participants:  Participant[]
  isMaster:      boolean
  userId:        string
  characterId:   string | undefined
  onTokenMove:   (id: string, pos: { x: number; y: number; z: number }, rotation: number) => void
  onNpcDespawn?: (tokenId: string) => void
  onNpcSpawn?:   (data: EvSpawnNpc) => void
}

function TokenLayer({
  tokens, npcTokens, participants, isMaster, userId, characterId,
  onTokenMove, onNpcDespawn, onNpcSpawn,
}: TokenLayerProps) {
  return (
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
            avatarType={participant?.avatarType}
            avatarUrl={participant?.avatarUrl}
            onMove={(pos, rot) => onTokenMove(token.characterId, pos, rot)}
          />
        )
      })}
      {Object.values(npcTokens).map(npc => (
        <TokenMesh
          key={npc.tokenId}
          token={npcAsToken(npc)}
          name={npc.name}
          role={npc.role}
          isOwn={isMaster}
          isMaster={isMaster}
          avatarType={npc.avatarType}
          avatarUrl={npc.avatarUrl}
          onMove={(pos, rot) => onTokenMove(npc.tokenId, pos, rot)}
          onDespawn={onNpcDespawn ? () => onNpcDespawn(npc.tokenId) : undefined}
        />
      ))}
      <NpcSpawnMarkers isMaster={isMaster} onSpawn={onNpcSpawn} />
    </Suspense>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Marcadores de spawn NPC/enemy — visíveis apenas ao mestre
// ─────────────────────────────────────────────────────────────────────────────

const NPC_COLORS: Record<string, string> = {
  npc:   "#f59e0b",
  enemy: "#ef4444",
  any:   "#6b7280",
}

function NpcSpawnMarkers({ isMaster, onSpawn }: { isMaster: boolean; onSpawn?: (data: EvSpawnNpc) => void }) {
  const triggers = useSceneStore(s => s.triggers)
  if (!isMaster) return null

  const spawns = triggers.filter(
    (t): t is SpawnNode =>
      t.type === "trigger_spawn" && (t.forRole === "npc" || t.forRole === "enemy")
  )
  if (spawns.length === 0) return null

  return (
    <>
      {spawns.map(node => (
        <NpcMarker key={node.id} node={node} onSpawn={onSpawn} />
      ))}
    </>
  )
}

function NpcMarker({ node, onSpawn }: { node: SpawnNode; onSpawn?: (data: EvSpawnNpc) => void }) {
  const [hovered, setHovered] = useState(false)
  const [open, setOpen]       = useState(false)
  const [name, setName]       = useState("")

  const color       = NPC_COLORS[node.forRole] ?? NPC_COLORS.any!
  const defaultName = node.label ?? (node.forRole === "npc" ? "NPC" : "Inimigo")
  const canSpawn    = !!onSpawn && (node.forRole === "npc" || node.forRole === "enemy")

  const handleOpen    = () => { setName(defaultName); setOpen(true) }
  const handleClose   = () => setOpen(false)
  const handleConfirm = () => {
    if (!canSpawn) return
    onSpawn({ role: node.forRole as "npc" | "enemy", name: name.trim() || defaultName, position: node.position, rotation: node.facing ?? 0 })
    setOpen(false)
  }

  return (
    <group
      position={[node.position.x, 0, node.position.z]}
      onClick={canSpawn && !open ? (e) => { e.stopPropagation(); handleOpen() } : undefined}
      onPointerEnter={canSpawn ? () => setHovered(true) : undefined}
      onPointerLeave={canSpawn ? () => setHovered(false) : undefined}
    >
      <Circle args={[0.45, 32]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={open ? 0.9 : hovered ? 0.7 : 0.3}
          roughness={0.5}
          opacity={0.75}
          transparent
        />
      </Circle>
      <Circle args={[0.52, 32]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <meshStandardMaterial color={color} opacity={0.25} transparent />
      </Circle>
      {!open && (
        <Text
          position={[0, 0.6, 0]}
          fontSize={0.2}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000000"
        >
          {hovered ? `+ ${defaultName}` : defaultName}
        </Text>
      )}
      {open && (
        <Html position={[0, 1.4, 0]} center distanceFactor={8} zIndexRange={[100, 0]}>
          <div
            className="bg-neutral-900 border border-neutral-700 rounded-xl p-3 shadow-2xl"
            style={{ minWidth: 176 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[11px] font-semibold mb-2" style={{ color }}>
              {node.forRole === "enemy" ? "Inimigo" : "NPC"}
            </p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm()
                if (e.key === "Escape") handleClose()
              }}
              placeholder={defaultName}
              className="w-full bg-neutral-800 text-white text-sm rounded px-2 py-1.5 border border-neutral-600 outline-none focus:border-neutral-400 placeholder-neutral-500 mb-2"
            />
            <div className="flex gap-1.5">
              <button
                onClick={handleConfirm}
                className="flex-1 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-medium rounded py-1.5 transition-colors"
              >
                Spawnar
              </button>
              <button
                onClick={handleClose}
                className="px-2 text-neutral-500 hover:text-neutral-200 text-xs transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SceneEnvironment — iluminação e atmosfera baseadas no EnvironmentConfig
// ─────────────────────────────────────────────────────────────────────────────

const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
const SHADOW_MAP_SIZE: [number, number] = isMobile ? [512, 512] : [2048, 2048]

// Calcula posição do sol + cores de iluminação a partir da hora do dia (0–24)
function computeTimeOfDay(hour: number) {
  // Ângulo: 0 no amanhecer (6h), π/2 ao meio-dia, π no anoitecer (18h)
  const t        = ((hour - 6) / 12) * Math.PI
  const elevation = Math.sin(t)           // -1 (meia-noite) → 1 (meio-dia)
  const azimuth   = Math.cos(t)           // 1 (leste) → -1 (oeste)

  const sunPos: [number, number, number] = [azimuth * 80, elevation * 100, 40]

  // Intensidade da luz direcional proporcional à elevação solar
  const lightIntensity = Math.max(0, elevation) * 1.3

  // Cor da luz: laranja no amanhecer/anoitecer, branca ao meio-dia
  const isGoldenHour = (hour >= 5 && hour <= 8) || (hour >= 16 && hour <= 20)
  const lightColor   = elevation <= 0 ? "#000000" : isGoldenHour ? "#ffa040" : "#fff8e1"

  // Luz ambiente: quase nula à noite, fria de dia, quente no crepúsculo
  const ambientColor     = elevation <= 0 ? "#03030a" : isGoldenHour ? "#1a0e04" : "#0d1a28"
  const ambientIntensity = elevation <= 0 ? 0.04 : isGoldenHour ? 0.35 : 0.55

  return { sunPos, lightIntensity, lightColor, ambientColor, ambientIntensity }
}

function SceneEnvironment({ envConfig }: { envConfig: EnvironmentConfig | null }) {
  const lighting = envConfig?.lighting
  const atm      = envConfig?.atmosphere
  const psky     = atm?.physicalSky

  const solar = useMemo(
    () => psky?.enabled ? computeTimeOfDay(psky.timeOfDay) : null,
    [psky?.enabled, psky?.timeOfDay],
  )

  const ambientColor     = solar?.ambientColor     ?? lighting?.ambient?.color     ?? "#1a0a2e"
  const ambientIntensity = solar?.ambientIntensity ?? lighting?.ambient?.intensity ?? 0.25
  const dirColor         = solar?.lightColor       ?? lighting?.directional?.color ?? "#6040a0"
  const dirIntensity     = solar?.lightIntensity   ?? lighting?.directional?.intensity ?? 0.6
  const dirPos           = solar?.sunPos ?? ([
    lighting?.directional?.position?.x ?? 5,
    lighting?.directional?.position?.y ?? 15,
    lighting?.directional?.position?.z ?? 5,
  ] as [number, number, number])
  const dirEnabled = solar ? solar.lightIntensity > 0.01 : (lighting?.directional?.enabled ?? true)

  return (
    <>
      <ambientLight color={ambientColor} intensity={ambientIntensity} />

      {dirEnabled && (
        <directionalLight
          color={dirColor}
          intensity={dirIntensity}
          position={dirPos}
          castShadow={lighting?.directional?.castShadow ?? true}
          shadow-mapSize={SHADOW_MAP_SIZE}
          shadow-camera-far={100}
          shadow-camera-near={0.1}
        />
      )}

      {/* Céu físico (Preetham) — substitui fundo de cor quando ativo */}
      {psky?.enabled
        ? <Sky distance={450000} sunPosition={solar!.sunPos} turbidity={8} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
        : atm?.skybox?.kind === "color"
          ? <color attach="background" args={[atm.skybox.color]} />
          : <color attach="background" args={["#0a0010"]} />
      }

      {atm?.fog?.enabled && (
        <fog attach="fog" args={[atm.fog.color, atm.fog.near, atm.fog.far]} />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Overlays de estado
// ─────────────────────────────────────────────────────────────────────────────

function LoadingOverlay({
  loadState, pascalReady, activeScene,
}: {
  loadState: string; pascalReady: boolean; activeScene: ActiveScene | null
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
  activeScene, isMaster, loadState,
}: {
  activeScene: ActiveScene | null; isMaster: boolean; loadState: string
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
