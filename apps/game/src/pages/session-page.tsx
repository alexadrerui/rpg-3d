import { useState, useEffect } from "react"
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
import type { CombatAbility } from "../components/hud/combat-overlay"
import { useSceneStore } from "../store/scene-store"
import { characters } from "../lib/api-client"

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

  // Token próprio do jogador (para câmera de combate)
  const ownToken = Object.values(room.tokens).find(
    t => t.userId === auth.userId || t.characterId === auth.characterId
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
