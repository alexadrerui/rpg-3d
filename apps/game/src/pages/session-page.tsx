import { useState, useEffect, useMemo } from "react"
import { useParams, useLocation } from "react-router-dom"
import { useGameRoom }   from "@rpg3d/sync-client"
import { useAuthStore }  from "../store/auth-store"
import { GameCanvas }    from "../components/canvas/game-canvas"
import { ChatPanel }     from "../components/chat/chat-panel"
import { DicePanel }     from "../components/dice/dice-panel"
import { ParticipantsPanel }     from "../components/hud/participants-panel"
import { MasterControls }        from "../components/hud/master-controls"
import { TriggerNotifications, pushTriggerNotification } from "../components/hud/trigger-notifications"
import { DiceOverlay } from "../components/dice/dice-overlay"
import { CombatOverlay } from "../components/hud/combat-overlay"
import { MediaPlayer }        from "../components/hud/media-player"
import { VideoPlayer }        from "../components/hud/video-player"
import { CinematicOverlay }   from "../components/hud/cinematic-overlay"
import type { CombatAbility } from "../components/hud/combat-overlay"
import { useSceneStore } from "../store/scene-store"
import { characters } from "../lib/api-client"

const SERVER_URL = (import.meta as unknown as Record<string,Record<string,string>>).env?.VITE_GAME_SERVER_URL ?? "http://localhost:4001"

export function SessionPage() {
  const { sessionId }  = useParams<{ sessionId: string }>()
  const { state }      = useLocation() as { state?: { campaignId?: string } }
  const auth           = useAuthStore()
  const { disarmTrap, revealNote, sceneFile } = useSceneStore()

  const room = useGameRoom({
    sessionId:   sessionId ?? "",
    campaignId:  state?.campaignId ?? auth.campaignId,
    characterId: auth.characterId,
    token:       auth.token,
    serverUrl:   SERVER_URL,
    avatarType:  auth.avatarType,
    avatarUrl:   auth.avatarUrl,

    onTriggerActivated: (ev) => {
      pushTriggerNotification(ev)
      // Sync runtime state
      if (ev.trigger.type === "trigger_trap") disarmTrap(ev.trigger.id)
      if (ev.trigger.type === "trigger_note") revealNote(ev.trigger.id)
    },
  })

  const isMaster = auth.isMaster

  // ── Mídia — playlist e vídeos da cena ─────────────────────────────────────
  const scenePlaylist  = useMemo(() => sceneFile?.media?.playlist ?? [], [sceneFile])
  const sceneVideos    = useMemo(() => sceneFile?.assets?.videos ?? [], [sceneFile])
  const defaultVolume  = sceneFile?.media?.volume ?? 0.7

  // AutoPlay ao carregar cena (se master e configurado)
  useEffect(() => {
    if (!isMaster) return
    if (!sceneFile?.media?.autoPlay || scenePlaylist.length === 0) return
    room.playMedia(0).catch(() => {})
  }, [sceneFile?.meta?.id])

  // ── Dim do jogo para modo cinematic ───────────────────────────────────────
  const [dimGame, setDimGame] = useState(false)

  // ── Estado de combate ──────────────────────────────────────────────────────
  const [combatMode,       setCombatMode]       = useState(false)
  const [charAbilities,    setCharAbilities]    = useState<CombatAbility[]>([])

  // Carrega habilidades do personagem ao entrar na sessão
  useEffect(() => {
    if (!auth.characterId) return
    characters.get(auth.characterId)
      .then(char => {
        const abs = char.sheetData?.combatAbilities as CombatAbility[] | undefined
        if (Array.isArray(abs)) setCharAbilities(abs)
      })
      .catch(() => {/* ignora silenciosamente */})
  }, [auth.characterId])

  const ownToken = useMemo(
    () => Object.values(room.tokens).find(
      t => t.userId === auth.userId || t.characterId === auth.characterId
    ),
    [room.tokens, auth.userId, auth.characterId],
  )

  // ── Dados ──────────────────────────────────────────────────────────────────
  const [dice3d, setDice3d] = useState(
    () => localStorage.getItem("dice3d") !== "false",
  )
  const toggleDice3d = () =>
    setDice3d(prev => {
      localStorage.setItem("dice3d", String(!prev))
      return !prev
    })

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-neutral-950 select-none">

      {/* ── Backdrop de escurecimento para modo cinematic ── */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-500 pointer-events-none"
        style={{ zIndex: 60, opacity: dimGame ? 1 : 0 }}
      />

      {/* ── Canvas 3D ── */}
      <GameCanvas
        activeScene={room.activeScene}
        fogCells={room.fogCells}
        tokens={room.tokens}
        npcTokens={room.npcTokens}
        participants={room.participants}
        isMaster={isMaster}
        onTokenMove={room.moveToken}
        onNpcSpawn={isMaster ? (data) => { room.spawnNpc(data).catch(console.error) } : undefined}
        onNpcDespawn={isMaster ? (id) => { room.despawnNpc(id).catch(console.error) } : undefined}
        firstPersonMode={combatMode && !!ownToken}
        firstPersonTokenId={ownToken?.characterId}
      />

      {/* ── HUD overlay ── */}
      <div className="absolute inset-0 pointer-events-none">

        {/* TOP LEFT — status + master controls */}
        <div className="absolute top-4 left-4 flex flex-col gap-3 pointer-events-auto">
          <StatusBar status={room.status} sceneName={room.activeScene?.sceneId} />
          {isMaster && (
            <MasterControls
              activeScene={room.activeScene}
              campaignId={auth.campaignId}
              onLoadScene={(id, fx) => room.loadScene({ sceneId: id, transitionFx: fx ?? "fade" })}
              onClearFog={room.clearFog}
            />
          )}
        </div>

        {/* TOP RIGHT — participantes */}
        <div className="absolute top-4 right-4 pointer-events-auto">
          <ParticipantsPanel participants={room.participants} isMaster={isMaster} />
        </div>

        {/* CENTER TOP — notificações de triggers */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto">
          <TriggerNotifications isMaster={isMaster} />
        </div>

        {/* BOTTOM LEFT — chat */}
        <div className="absolute bottom-4 left-4 pointer-events-auto">
          <ChatPanel isMaster={isMaster} serverUrl={SERVER_URL} />
        </div>

        {/* BOTTOM RIGHT — dados */}
        <div className="absolute bottom-4 right-4 pointer-events-auto">
          <DicePanel
            serverUrl={SERVER_URL}
            characterId={auth.characterId}
            dice3d={dice3d}
            onToggleDice3d={toggleDice3d}
          />
        </div>

        {/* Overlay de física 3D — só renderiza quando ativado */}
        {dice3d && <DiceOverlay serverUrl={SERVER_URL} />}

        {/* COMBATE — overlay de habilidades (jogador com token no mapa) */}
        {combatMode && !isMaster && (
          <CombatOverlay
            abilities={charAbilities}
            onExit={() => setCombatMode(false)}
          />
        )}

        {/* Botão de entrar no modo combate — só para jogadores com token */}
        {!combatMode && !isMaster && ownToken && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto">
            <button
              onClick={() => setCombatMode(true)}
              className="flex items-center gap-2 bg-neutral-950/85 hover:bg-neutral-900/90 text-neutral-400 hover:text-red-300 text-xs font-medium px-4 py-2 rounded-full border border-neutral-700/50 hover:border-red-900/60 transition-all backdrop-blur-sm shadow-lg"
            >
              <span>⚔</span>
              <span>Modo combate</span>
            </button>
          </div>
        )}

        {/* MÍDIA — player de playlist (bottom center, acima do botão de combate) */}
        {(room.mediaState?.playing || scenePlaylist.length > 0 || isMaster) && scenePlaylist.length > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
            <MediaPlayer
              mediaState={room.mediaState}
              playlist={scenePlaylist}
              isMaster={isMaster}
              volume={defaultVolume}
              onPlay={(idx) => room.playMedia(idx).catch(console.error)}
              onPause={() => room.pauseMedia().catch(console.error)}
              onNext={() => room.nextTrack().catch(console.error)}
              onPrev={() => room.prevTrack().catch(console.error)}
              onStop={() => room.stopMedia().catch(console.error)}
            />
          </div>
        )}

        {/* VÍDEO — routing por modo */}
        {(() => {
          const vs = room.videoState
          const vMode = vs?.mode

          // Jogadores não veem VideoPlayer em cinematic/overlay — CinematicOverlay cobre tudo
          if (!isMaster && (vMode === "cinematic" || vMode === "overlay")) return null

          return isMaster ? (
            <div className="absolute bottom-24 right-4 pointer-events-auto">
              <VideoPlayer
                videoState={room.videoState}
                videoAssets={sceneVideos}
                isMaster={isMaster}
                onPlay={(data) => room.playVideo(data).catch(console.error)}
                onPause={() => room.pauseVideo().catch(console.error)}
                onStop={() => room.stopVideo().catch(console.error)}
              />
            </div>
          ) : (vs?.url ? (
            <div className="pointer-events-auto">
              <VideoPlayer
                videoState={room.videoState}
                videoAssets={sceneVideos}
                isMaster={false}
                onPlay={() => {}}
                onPause={() => {}}
                onStop={() => {}}
              />
            </div>
          ) : null)
        })()}


        {/* Transition overlay (fade/dissolve) */}
        <SceneTransitionOverlay transitionFx={room.activeScene?.transitionFx} />
      </div>

      {/* ── CinematicOverlay — fixed, z-index acima do game ── */}
      {(room.videoState?.mode === "cinematic" || room.videoState?.mode === "overlay") && (
        <CinematicOverlay
          videoState={room.videoState}
          onDimGame={setDimGame}
        />
      )}

      {/* ── Botão de parada para o mestre em modo cinematic/overlay (fixed, acima de tudo) ── */}
      {isMaster && (room.videoState?.mode === "cinematic" || room.videoState?.mode === "overlay") && room.videoState?.url && (
        <button
          type="button"
          onClick={() => room.stopVideo().catch(console.error)}
          className="fixed top-4 right-4 flex items-center gap-2 bg-neutral-950/90 hover:bg-red-950/80 text-neutral-400 hover:text-red-300 text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-700/50 hover:border-red-900/60 transition-all backdrop-blur-sm shadow-lg"
          style={{ zIndex: 82 }}
        >
          <span>■</span>
          <span>Parar vídeo</span>
        </button>
      )}
    </div>
  )
}

// ── Status bar ────────────────────────────────────────────────────────────────
function StatusBar({ status, sceneName }: { status: string; sceneName?: string }) {
  const dot =
    status === "connected"    ? "bg-green-500"  :
    status === "connecting"   ? "bg-yellow-500 animate-pulse" :
    status === "error"        ? "bg-red-500"    : "bg-neutral-600"

  return (
    <div className="flex items-center gap-2 bg-neutral-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-neutral-700/50">
      <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <span className="text-xs text-neutral-400">
        {status === "connected" ? sceneName ?? "Conectado" :
         status === "connecting" ? "Conectando..." :
         status === "error" ? "Erro de conexão" : "Desconectado"}
      </span>
    </div>
  )
}

// ── Transition overlay ────────────────────────────────────────────────────────
function SceneTransitionOverlay({ transitionFx }: { transitionFx?: string }) {
  // Animação CSS simples de fade na troca de cena
  // Em produção: usar um estado de "transitioning" no room store
  return null
}
