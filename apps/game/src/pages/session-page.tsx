import { useParams, useLocation } from "react-router-dom"
import { useGameRoom }   from "@rpg3d/sync-client"
import { useAuthStore }  from "../store/auth-store"
import { GameCanvas }    from "../components/canvas/game-canvas"
import { ChatPanel }     from "../components/chat/chat-panel"
import { DicePanel }     from "../components/dice/dice-panel"
import { ParticipantsPanel }     from "../components/hud/participants-panel"
import { MasterControls }        from "../components/hud/master-controls"
import { TriggerNotifications, pushTriggerNotification } from "../components/hud/trigger-notifications"
import { useSceneStore } from "../store/scene-store"

const SERVER_URL = (import.meta as unknown as Record<string,Record<string,string>>).env?.VITE_GAME_SERVER_URL ?? "http://localhost:4001"

export function SessionPage() {
  const { sessionId }  = useParams<{ sessionId: string }>()
  const { state }      = useLocation() as { state?: { campaignId?: string } }
  const auth           = useAuthStore()
  const { disarmTrap, revealNote } = useSceneStore()

  const room = useGameRoom({
    sessionId:   sessionId ?? "",
    campaignId:  state?.campaignId ?? auth.campaignId,
    characterId: auth.characterId,
    token:       auth.token,
    serverUrl:   SERVER_URL,

    onTriggerActivated: (ev) => {
      pushTriggerNotification(ev)
      // Sync runtime state
      if (ev.trigger.type === "trigger_trap") disarmTrap(ev.trigger.id)
      if (ev.trigger.type === "trigger_note") revealNote(ev.trigger.id)
    },
  })

  const isMaster = auth.isMaster

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-neutral-950 select-none">

      {/* ── Canvas 3D ── */}
      <GameCanvas
        activeScene={room.activeScene}
        fogCells={room.fogCells}
        tokens={room.tokens}
        participants={room.participants}
        isMaster={isMaster}
        onTokenMove={room.moveToken}
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
          <DicePanel serverUrl={SERVER_URL} characterId={auth.characterId} />
        </div>

        {/* Transition overlay (fade/dissolve) */}
        <SceneTransitionOverlay transitionFx={room.activeScene?.transitionFx} />
      </div>
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
