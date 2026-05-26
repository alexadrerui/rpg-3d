"use client"
import { useState } from "react"
import { useMediaStore } from "../../store/media-store"
import { useAssetStore }  from "../../store/asset-store"
import type { PlaylistItem } from "@rpg3d/schema"

export function MediaSidebarTab() {
  const { playlist, shuffle, loop, autoPlay, volume, addTrack, removeTrack, moveTrack, setOption, setVolume } =
    useMediaStore()
  const { audio } = useAssetStore()

  const [activeSection, setActiveSection] = useState<"playlist" | "video">("playlist")

  return (
    <div className="flex flex-col gap-3 p-3 text-sm">

      {/* ── Navegação entre seções ────────────────────────────────────────── */}
      <div className="flex rounded overflow-hidden border border-neutral-700">
        {(["playlist", "video"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActiveSection(s)}
            className={`flex-1 py-1 text-xs transition-colors ${
              activeSection === s
                ? "bg-neutral-700 text-neutral-100"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {s === "playlist" ? "Playlist" : "Vídeo"}
          </button>
        ))}
      </div>

      {activeSection === "playlist" && (
        <PlaylistSection
          playlist={playlist}
          audioAssets={audio}
          shuffle={shuffle}
          loop={loop}
          autoPlay={autoPlay}
          volume={volume}
          onAddTrack={addTrack}
          onRemoveTrack={removeTrack}
          onMoveTrack={moveTrack}
          onSetOption={setOption}
          onSetVolume={setVolume}
        />
      )}

      {activeSection === "video" && <VideoSection />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Seção Playlist
// ─────────────────────────────────────────────────────────────────────────────

function PlaylistSection({
  playlist,
  audioAssets,
  shuffle,
  loop,
  autoPlay,
  volume,
  onAddTrack,
  onRemoveTrack,
  onMoveTrack,
  onSetOption,
  onSetVolume,
}: {
  playlist:     PlaylistItem[]
  audioAssets:  { id: string; url: string; mimeType?: string; sizeBytes?: number }[]
  shuffle:      boolean
  loop:         boolean
  autoPlay:     boolean
  volume:       number
  onAddTrack:   (item: PlaylistItem) => void
  onRemoveTrack:(assetId: string) => void
  onMoveTrack:  (from: number, to: number) => void
  onSetOption:  (key: "shuffle" | "loop" | "autoPlay", val: boolean) => void
  onSetVolume:  (v: number) => void
}) {
  const unaddedAudio = audioAssets.filter(
    (a) => !playlist.some((p) => p.assetId === a.id),
  )

  return (
    <>
      {/* Adicionar da lista de assets de áudio */}
      {unaddedAudio.length > 0 && (
        <section>
          <p className="text-[11px] text-neutral-500 uppercase tracking-wide mb-2">
            Áudios disponíveis
          </p>
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
            {unaddedAudio.map((a) => {
              const name = a.url.split("/").pop() ?? a.id
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() =>
                    onAddTrack({
                      assetId:  a.id,
                      url:      a.url,
                      name,
                      mimeType: a.mimeType,
                    })
                  }
                  className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-750 rounded px-2 py-1.5 text-left group transition-colors"
                >
                  <span className="text-[9px] bg-neutral-700 text-neutral-400 rounded px-1 py-0.5 font-mono shrink-0">SOM</span>
                  <span className="flex-1 truncate text-xs text-neutral-300">{name}</span>
                  <span className="text-neutral-600 group-hover:text-green-400 text-sm shrink-0">+</span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {audioAssets.length === 0 && (
        <p className="text-[11px] text-neutral-600 italic">
          Faça upload de áudios na aba Assets primeiro.
        </p>
      )}

      {/* Faixas da playlist */}
      {playlist.length > 0 && (
        <section>
          <p className="text-[11px] text-neutral-500 uppercase tracking-wide mb-2">
            Playlist ({playlist.length} faixa{playlist.length !== 1 ? "s" : ""})
          </p>
          <div className="flex flex-col gap-1">
            {playlist.map((item, idx) => (
              <div
                key={item.assetId}
                className="flex items-center gap-1.5 bg-neutral-800 rounded px-2 py-1.5 group"
              >
                <span className="text-[10px] text-neutral-600 w-4 shrink-0 text-right">{idx + 1}</span>
                <span className="flex-1 truncate text-xs text-neutral-300">
                  {item.name ?? item.url.split("/").pop()}
                </span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => onMoveTrack(idx, idx - 1)}
                    className="text-neutral-500 hover:text-neutral-200 disabled:opacity-30 px-0.5 text-xs"
                    title="Mover para cima"
                  >▲</button>
                  <button
                    type="button"
                    disabled={idx === playlist.length - 1}
                    onClick={() => onMoveTrack(idx, idx + 1)}
                    className="text-neutral-500 hover:text-neutral-200 disabled:opacity-30 px-0.5 text-xs"
                    title="Mover para baixo"
                  >▼</button>
                  <button
                    type="button"
                    onClick={() => onRemoveTrack(item.assetId)}
                    className="text-neutral-600 hover:text-red-400 px-0.5 text-sm leading-none ml-0.5"
                    title="Remover"
                  >×</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Opções de reprodução */}
      <section>
        <p className="text-[11px] text-neutral-500 uppercase tracking-wide mb-2">Reprodução</p>
        <div className="flex flex-col gap-2">
          {(
            [
              { key: "loop",     label: "Repetir playlist" },
              { key: "shuffle",  label: "Ordem aleatória" },
              { key: "autoPlay", label: "Iniciar automaticamente" },
            ] as { key: "loop" | "shuffle" | "autoPlay"; label: string }[]
          ).map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={key === "loop" ? loop : key === "shuffle" ? shuffle : autoPlay}
                onChange={(e) => onSetOption(key, e.target.checked)}
                className="accent-blue-500"
              />
              <span className="text-xs text-neutral-300">{label}</span>
            </label>
          ))}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-neutral-400">Volume padrão</label>
              <span className="text-[11px] text-neutral-500">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => onSetVolume(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>
      </section>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Seção Vídeo — informativo (gestão ocorre ao vivo na sessão pelo mestre)
// ─────────────────────────────────────────────────────────────────────────────

function VideoSection() {
  const { videos } = useAssetStore()

  return (
    <section>
      <p className="text-[11px] text-neutral-500 uppercase tracking-wide mb-2">
        Vídeos disponíveis
      </p>
      {videos.length === 0 ? (
        <p className="text-[11px] text-neutral-600 italic">
          Faça upload de vídeos na aba Assets primeiro.
          Durante a sessão, o mestre pode reproduzi-los para todos.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {videos.map((v) => {
            const name = v.url.split("/").pop() ?? v.id
            return (
              <div
                key={v.id}
                className="flex items-center gap-2 bg-neutral-800 rounded px-2 py-1.5"
              >
                <span className="text-[9px] bg-neutral-700 text-neutral-400 rounded px-1 py-0.5 font-mono shrink-0">VID</span>
                <span className="flex-1 truncate text-xs text-neutral-300">{name}</span>
              </div>
            )
          })}
        </div>
      )}
      <p className="text-[11px] text-neutral-600 mt-3 leading-relaxed">
        Na sessão ao vivo, use o painel de mídia para exibir vídeos a todos os jogadores.
      </p>
    </section>
  )
}
