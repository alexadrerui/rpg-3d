import { useState, useRef, useEffect, useCallback } from "react"
import type { VideoState } from "@rpg3d/sync-client"
import type { AssetRef, EvVideoPlay } from "@rpg3d/schema"
import { EFFECT_LABELS } from "../../lib/transition-shaders"

interface VideoPlayerProps {
  videoState:   VideoState | null
  videoAssets:  AssetRef[]
  isMaster:     boolean
  onPlay:       (data: EvVideoPlay) => void
  onPause:      () => void
  onStop:       () => void
}

export function VideoPlayer({
  videoState,
  videoAssets,
  isMaster,
  onPlay,
  onPause,
  onStop,
}: VideoPlayerProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [pos, setPos]               = useState({ x: 0, y: 0 })
  const [dragging, setDragging]     = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const panelRef   = useRef<HTMLDivElement>(null)
  const videoRef   = useRef<HTMLVideoElement>(null)

  const isPanelMode = !videoState?.mode || videoState.mode === "panel"
  const isActive    = !!(videoState?.url) && isPanelMode

  // Sincroniza play/pause apenas no modo painel
  useEffect(() => {
    const vid = videoRef.current
    if (!vid || !videoState || !isPanelMode) return
    if (videoState.playing) vid.play().catch(() => {})
    else vid.pause()
  }, [videoState?.playing, isPanelMode])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!panelRef.current) return
    setDragging(true)
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.preventDefault()
  }, [pos])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y })
    const onUp   = () => setDragging(false)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
  }, [dragging])

  // O mestre vê o botão/picker mesmo sem vídeo ativo.
  // Jogadores só veem o painel quando há vídeo no modo panel.
  if (!isActive && !isMaster) return null

  return (
    <>
      {/* Botão do mestre quando não há vídeo ativo */}
      {isMaster && !isActive && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className="flex items-center gap-2 bg-neutral-950/85 hover:bg-neutral-900/90 text-neutral-400 hover:text-purple-300 text-xs font-medium px-4 py-2 rounded-full border border-neutral-700/50 hover:border-purple-900/60 transition-all backdrop-blur-sm shadow-lg"
          >
            <span>▶</span>
            <span>Exibir vídeo</span>
          </button>

          {showPicker && (
            <VideoPicker
              videos={videoAssets}
              onSelect={(data) => { onPlay(data); setShowPicker(false) }}
              onClose={() => setShowPicker(false)}
            />
          )}
        </div>
      )}

      {/* Painel de vídeo — modo painel ativo */}
      {isActive && videoState && (
        <div
          ref={panelRef}
          className="fixed z-50 flex flex-col bg-neutral-900 border border-neutral-700/60 rounded-xl shadow-2xl overflow-hidden pointer-events-auto"
          style={{
            width: 560,
            transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
            top:  "50%",
            left: "50%",
          }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 bg-neutral-800/80 cursor-grab active:cursor-grabbing select-none border-b border-neutral-700/50"
            onMouseDown={handleMouseDown}
          >
            <span className="text-[10px] bg-purple-900/60 text-purple-300 rounded px-1.5 py-0.5 font-mono shrink-0">VID</span>
            <span className="flex-1 text-xs text-neutral-300 truncate">
              {videoState.name ?? videoState.url?.split("/").pop() ?? "Vídeo"}
            </span>
            {isMaster && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => videoState.playing
                    ? onPause()
                    : onPlay({
                        url:                videoState.url!,
                        name:               videoState.name ?? undefined,
                        mode:               (videoState.mode ?? "panel") as EvVideoPlay["mode"],
                        transitionIn:       (videoState.transitionIn ?? "fade") as EvVideoPlay["transitionIn"],
                        transitionOut:      (videoState.transitionOut ?? "fade") as EvVideoPlay["transitionOut"],
                        transitionDuration: videoState.transitionDuration ?? 1500,
                        overlayOpacity:     videoState.overlayOpacity ?? 1.0,
                        overlayBlend:       (videoState.overlayBlend ?? "normal") as EvVideoPlay["overlayBlend"],
                      })
                  }
                  className="text-neutral-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-neutral-700 transition-colors"
                  title={videoState.playing ? "Pausar" : "Reproduzir"}
                >
                  {videoState.playing ? "⏸" : "▶"}
                </button>
                <button
                  type="button"
                  onClick={onStop}
                  className="text-neutral-500 hover:text-red-400 text-xs px-1.5 py-0.5 rounded hover:bg-neutral-700 transition-colors"
                  title="Fechar"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <video
            ref={videoRef}
            src={videoState.url ?? undefined}
            controls
            className="w-full max-h-[350px] bg-black"
            onEnded={isMaster ? onStop : undefined}
          />
        </div>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VideoPicker — seletor de vídeo com configuração de modo e transições
// ─────────────────────────────────────────────────────────────────────────────

const MODES = [
  { value: "panel",     label: "Painel flutuante" },
  { value: "cinematic", label: "Cinematográfico (tela cheia)" },
  { value: "overlay",   label: "Overlay (sobre o jogo)" },
] as const

const BLEND_MODES = [
  { value: "normal",   label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen",   label: "Screen" },
  { value: "overlay",  label: "Overlay" },
  { value: "lighten",  label: "Lighten" },
] as const

type ModeValue    = "panel" | "cinematic" | "overlay"
type EffectValue  = keyof typeof EFFECT_LABELS
type BlendValue   = "normal" | "multiply" | "screen" | "overlay" | "lighten"

function VideoPicker({
  videos,
  onSelect,
  onClose,
}: {
  videos:   AssetRef[]
  onSelect: (data: EvVideoPlay) => void
  onClose:  () => void
}) {
  const [mode, setMode]                       = useState<ModeValue>("panel")
  const [transitionIn, setTransitionIn]       = useState<EffectValue>("fade")
  const [transitionOut, setTransitionOut]     = useState<EffectValue>("fade")
  const [transitionDuration, setDuration]     = useState(1500)
  const [overlayOpacity, setOpacity]          = useState(1.0)
  const [overlayBlend, setBlend]              = useState<BlendValue>("normal")
  const [showTransitionHelp, setShowTransitionHelp] = useState(false)

  const effectOptions = Object.entries(EFFECT_LABELS) as [EffectValue, string][]

  const handleSelect = (url: string, name: string) => {
    onSelect({ url, name, mode, transitionIn, transitionOut, transitionDuration, overlayOpacity, overlayBlend })
  }

  return (
    <div className="absolute bottom-full mb-2 left-0 w-[320px] bg-neutral-900 border border-neutral-700/60 rounded-xl shadow-2xl overflow-hidden z-50 pointer-events-auto">

      {/* Header */}
      <div className="px-3 py-2 border-b border-neutral-800 flex items-center justify-between">
        <span className="text-[11px] text-neutral-400 uppercase tracking-wide">Exibir vídeo</span>
        <button type="button" onClick={onClose} className="text-neutral-600 hover:text-neutral-300 text-sm">✕</button>
      </div>

      {/* Modo de exibição */}
      <div className="px-3 py-2 border-b border-neutral-800/50 space-y-2">
        <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Modo</p>
        <div className="flex gap-1 flex-wrap">
          {MODES.map(m => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`text-[10px] px-2 py-1 rounded transition-colors ${
                mode === m.value
                  ? "bg-purple-700/80 text-purple-200 border border-purple-600/50"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 border border-transparent"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Opções de transição (modo cinematic) */}
      {mode === "cinematic" && (
        <div className="px-3 py-2 border-b border-neutral-800/50 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Transições</p>
            <button
              type="button"
              onClick={() => setShowTransitionHelp((v) => !v)}
              className="text-[10px] text-neutral-600 hover:text-purple-400 transition-colors flex items-center gap-1"
              title="Como funcionam as transições"
            >
              <span>{showTransitionHelp ? "▲" : "?"}</span>
              <span>Como funciona</span>
            </button>
          </div>

          {showTransitionHelp && (
            <div className="rounded-lg bg-neutral-800/70 border border-neutral-700/40 px-2.5 py-2.5 space-y-2">
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                No modo <span className="text-purple-300 font-medium">Cinematográfico</span>, o vídeo ocupa a tela inteira com efeito de entrada e saída via shader GLSL.
              </p>
              <ul className="space-y-1.5">
                {[
                  { label: "Entrada", desc: "Efeito aplicado quando o vídeo começa a aparecer (progresso 0 → 1)." },
                  { label: "Saída",   desc: "Efeito aplicado quando o mestre para o vídeo (progresso 1 → 0)." },
                  { label: "Duração", desc: "Tempo em milissegundos de cada transição. 300ms = rápido, 4000ms = lento e dramático." },
                ].map((item) => (
                  <li key={item.label} className="flex gap-2">
                    <span className="text-purple-400 text-[10px] font-medium shrink-0 w-12">{item.label}</span>
                    <span className="text-[10px] text-neutral-500 leading-snug">{item.desc}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-neutral-700/40 pt-2 space-y-1">
                <p className="text-[9px] text-neutral-600 font-medium uppercase tracking-wide">Efeitos disponíveis</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(EFFECT_LABELS).map(([k, v]) => (
                    <span key={k} className="text-[9px] bg-neutral-700/60 text-neutral-400 rounded px-1.5 py-0.5">{v}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-neutral-600 block mb-1">Entrada</label>
              <select
                value={transitionIn}
                onChange={e => setTransitionIn(e.target.value as EffectValue)}
                className="w-full text-[10px] bg-neutral-800 text-neutral-300 border border-neutral-700/50 rounded px-1.5 py-1"
              >
                {effectOptions.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] text-neutral-600 block mb-1">Saída</label>
              <select
                value={transitionOut}
                onChange={e => setTransitionOut(e.target.value as EffectValue)}
                className="w-full text-[10px] bg-neutral-800 text-neutral-300 border border-neutral-700/50 rounded px-1.5 py-1"
              >
                {effectOptions.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[9px] text-neutral-600 block mb-1">Duração: {transitionDuration}ms</label>
            <input
              type="range"
              min={300}
              max={4000}
              step={100}
              value={transitionDuration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full h-1 accent-purple-500"
            />
          </div>
        </div>
      )}

      {/* Opções de overlay */}
      {mode === "overlay" && (
        <div className="px-3 py-2 border-b border-neutral-800/50 space-y-2">
          <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Overlay</p>
          <div>
            <label className="text-[9px] text-neutral-600 block mb-1">Opacidade: {Math.round(overlayOpacity * 100)}%</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={overlayOpacity}
              onChange={e => setOpacity(Number(e.target.value))}
              className="w-full h-1 accent-purple-500"
            />
          </div>
          <div>
            <label className="text-[9px] text-neutral-600 block mb-1">Blend mode</label>
            <select
              value={overlayBlend}
              onChange={e => setBlend(e.target.value as BlendValue)}
              className="w-full text-[10px] bg-neutral-800 text-neutral-300 border border-neutral-700/50 rounded px-1.5 py-1"
            >
              {BLEND_MODES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Lista de vídeos / tutorial de upload */}
      {videos.length === 0 ? (
        <UploadTutorial />
      ) : (
        <div className="max-h-48 overflow-y-auto">
          {videos.map((v) => {
            const name = v.url.split("/").pop() ?? v.id
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => handleSelect(v.url, name)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-neutral-800 transition-colors"
              >
                <span className="text-[9px] bg-neutral-700 text-neutral-400 rounded px-1 py-0.5 font-mono shrink-0">VID</span>
                <span className="flex-1 truncate text-xs text-neutral-300">{name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tutorial de upload — exibido quando não há vídeos na cena
// ─────────────────────────────────────────────────────────────────────────────

function UploadTutorial() {
  return (
    <div className="px-3 py-3 space-y-3">
      <p className="text-[10px] text-neutral-500 uppercase tracking-wide font-medium">
        Nenhum vídeo nesta cena
      </p>

      <p className="text-[11px] text-neutral-500 leading-relaxed">
        Para exibir um vídeo na sessão, faça upload pelo editor e publique a cena. Siga os passos:
      </p>

      <ol className="space-y-2.5">
        {[
          {
            n: "1",
            title: "Abra o editor de cenas",
            body: "Acesse o editor (porta 3001) com a cena que deseja usar.",
          },
          {
            n: "2",
            title: 'Vá na aba "Assets"',
            body: 'Clique na aba Assets na barra lateral do editor.',
          },
          {
            n: "3",
            title: "Faça upload do vídeo",
            body: "Arraste ou selecione um arquivo de vídeo (.mp4, .webm, .mov, .mkv) na seção Vídeos. O upload é feito direto para o storage.",
          },
          {
            n: "4",
            title: "Publique a cena",
            body: 'Clique em "Publicar cena" para salvar os assets e gerar o .rpgscene atualizado.',
          },
          {
            n: "5",
            title: "Carregue a cena na sessão",
            body: "Use os controles do mestre para carregar a cena novamente — o vídeo aparecerá aqui.",
          },
        ].map((step) => (
          <li key={step.n} className="flex gap-2.5">
            <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-purple-900/60 text-purple-300 text-[9px] font-bold flex items-center justify-center">
              {step.n}
            </span>
            <div>
              <p className="text-[11px] text-neutral-300 font-medium leading-snug">{step.title}</p>
              <p className="text-[10px] text-neutral-500 leading-snug mt-0.5">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-lg bg-neutral-800/60 border border-neutral-700/40 px-2.5 py-2 mt-1">
        <p className="text-[10px] text-neutral-500 leading-relaxed">
          <span className="text-neutral-400 font-medium">Formatos suportados:</span>{" "}
          .mp4, .webm, .avi, .mov, .mkv
        </p>
      </div>
    </div>
  )
}
