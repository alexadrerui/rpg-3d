import { useState, useEffect, useRef } from "react"
import type { MediaState } from "@rpg3d/sync-client"
import type { PlaylistItem } from "@rpg3d/schema"

interface MediaPlayerProps {
  mediaState:  MediaState | null
  playlist:    PlaylistItem[]
  isMaster:    boolean
  volume:      number
  onPlay:      (trackIndex?: number) => void
  onPause:     () => void
  onNext:      () => void
  onPrev:      () => void
  onStop:      () => void
}

export function MediaPlayer({
  mediaState,
  playlist,
  isMaster,
  volume,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onStop,
}: MediaPlayerProps) {
  const audioRef           = useRef<HTMLAudioElement | null>(null)
  const [localVolume, setLocalVolume] = useState(volume)
  const [expanded, setExpanded]       = useState(false)
  const [duration, setDuration]       = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  // Cria o elemento de áudio uma vez
  useEffect(() => {
    const audio = new Audio()
    audio.preload = "metadata"
    audioRef.current = audio

    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime))
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration))
    audio.addEventListener("ended", () => {
      if (isMaster) onNext()
    })

    return () => { audio.pause(); audio.src = "" }
  }, [])

  // Sincroniza com o estado recebido do servidor
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !mediaState) return

    const track = playlist[mediaState.trackIndex]
    const url   = track?.url ?? mediaState.trackUrl ?? ""

    if (audio.src !== url && url) {
      audio.src = url
      audio.load()
    }

    if (mediaState.playing) {
      audio.play().catch(() => {/* autoplay bloqueado — usuário precisa interagir */})
    } else {
      audio.pause()
    }
  }, [mediaState, playlist])

  // Aplica volume local
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = localVolume
  }, [localVolume])

  if (!mediaState && playlist.length === 0) return null
  if (!isMaster && !mediaState?.playing && !mediaState?.trackUrl) return null

  const track      = playlist[mediaState?.trackIndex ?? 0]
  const trackName  = track?.name ?? track?.url?.split("/").pop() ?? mediaState?.trackName ?? "—"
  const isPlaying  = mediaState?.playing ?? false
  const pct        = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="flex flex-col bg-neutral-900/90 backdrop-blur-sm border border-neutral-700/50 rounded-xl shadow-2xl overflow-hidden min-w-[260px]">

      {/* Cabeçalho — sempre visível */}
      <div className="flex items-center gap-3 px-3 py-2">
        {/* Ícone / animação */}
        <div className="shrink-0 w-7 h-7 rounded-lg bg-purple-900/60 border border-purple-700/40 flex items-center justify-center">
          {isPlaying
            ? <WaveIcon />
            : <span className="text-purple-400 text-xs">♪</span>
          }
        </div>

        {/* Nome da faixa */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-neutral-200 truncate leading-tight">{trackName}</p>
          {playlist.length > 1 && (
            <p className="text-[10px] text-neutral-500">
              {(mediaState?.trackIndex ?? 0) + 1} / {playlist.length}
            </p>
          )}
        </div>

        {/* Expandir */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-neutral-500 hover:text-neutral-300 text-xs px-1 transition-colors shrink-0"
          title={expanded ? "Recolher" : "Expandir"}
        >
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {/* Barra de progresso */}
      <div className="h-0.5 bg-neutral-800 mx-3 mb-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Controles — master only */}
      {isMaster && (
        <div className="flex items-center justify-center gap-1 px-3 pb-2">
          <CtrlBtn onClick={onStop}             title="Parar"     disabled={!isPlaying && !mediaState?.trackUrl}>■</CtrlBtn>
          <CtrlBtn onClick={onPrev}             title="Anterior"  disabled={playlist.length < 2}>⏮</CtrlBtn>
          <CtrlBtn
            onClick={() => isPlaying ? onPause() : onPlay()}
            title={isPlaying ? "Pausar" : "Reproduzir"}
            primary
          >
            {isPlaying ? "⏸" : "▶"}
          </CtrlBtn>
          <CtrlBtn onClick={onNext}             title="Próxima"   disabled={playlist.length < 2}>⏭</CtrlBtn>

          {/* Volume */}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={localVolume}
            onChange={(e) => setLocalVolume(Number(e.target.value))}
            className="w-16 accent-purple-500 ml-1"
            title="Volume"
          />
        </div>
      )}

      {/* Lista de faixas — expandida */}
      {expanded && playlist.length > 0 && (
        <div className="border-t border-neutral-800 max-h-40 overflow-y-auto">
          {playlist.map((item, idx) => (
            <button
              key={item.assetId}
              type="button"
              onClick={() => isMaster ? onPlay(idx) : undefined}
              disabled={!isMaster}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                idx === (mediaState?.trackIndex ?? 0)
                  ? "bg-purple-900/30 text-purple-300"
                  : "text-neutral-400 hover:bg-neutral-800/60 disabled:cursor-default"
              }`}
            >
              <span className="text-[10px] text-neutral-600 w-4 text-right shrink-0">{idx + 1}</span>
              <span className="flex-1 truncate text-xs">
                {item.name ?? item.url.split("/").pop()}
              </span>
              {idx === (mediaState?.trackIndex ?? 0) && isPlaying && (
                <span className="text-purple-500 text-[10px] shrink-0">♪</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function CtrlBtn({
  children,
  onClick,
  title,
  disabled = false,
  primary  = false,
}: {
  children: React.ReactNode
  onClick:  () => void
  title?:   string
  disabled?: boolean
  primary?:  boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        primary
          ? "bg-purple-700 hover:bg-purple-600 text-white"
          : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
      }`}
    >
      {children}
    </button>
  )
}

function WaveIcon() {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {[3, 5, 4, 5, 3].map((h, i) => (
        <div
          key={i}
          className="w-[2px] bg-purple-400 rounded-full animate-pulse"
          style={{ height: `${h * 2}px`, animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )
}
