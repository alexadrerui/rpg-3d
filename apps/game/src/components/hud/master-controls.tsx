import { useState, useEffect } from "react"
import { clsx }                from "clsx"
import { scenes as scenesApi } from "../../lib/api-client"
import type { ActiveScene }    from "@rpg3d/sync-client"
import type { ApiScene }       from "../../lib/api-client"

type Props = {
  activeScene:  ActiveScene | null
  campaignId:   string
  onLoadScene:  (sceneId: string, fx?: "fade" | "dissolve" | "none") => Promise<void>
  onClearFog:   () => Promise<void>
}

export function MasterControls({ activeScene, campaignId, onLoadScene, onClearFog }: Props) {
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [sceneList, setSceneList] = useState<ApiScene[]>([])
  const [fetching, setFetching]  = useState(false)

  // Busca cenas da campanha na API
  useEffect(() => {
    if (!campaignId) return
    setFetching(true)
    scenesApi.list(campaignId)
      .then(setSceneList)
      .catch(console.error)
      .finally(() => setFetching(false))
  }, [campaignId])

  const handleLoad = async (id: string) => {
    setLoading(true)
    try { await onLoadScene(id, "fade") }
    finally { setLoading(false); setOpen(false) }
  }

  const handleClearFog = async () => {
    if (!confirm("Limpar todo o fog de guerra?")) return
    await onClearFog()
  }

  const activeName = sceneList.find(s => s.id === activeScene?.sceneId)?.name

  return (
    <div className="flex flex-col gap-2 w-52">
      {/* Scene picker */}
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 bg-neutral-800/90 backdrop-blur-sm hover:bg-neutral-700/90 text-neutral-200 text-xs px-3 py-2 rounded-lg border border-neutral-600/50 transition-colors w-full"
        >
          <span>🗺</span>
          <span className="flex-1 text-left truncate">
            {fetching ? "Carregando..." : activeName ?? (activeScene ? "Cena ativa" : "Escolher cenário")}
          </span>
          <span className="text-neutral-500">{open ? "▲" : "▼"}</span>
        </button>

        {open && (
          <div className="absolute bottom-full mb-1 left-0 w-full bg-neutral-800 border border-neutral-600/50 rounded-lg overflow-hidden shadow-xl z-20 max-h-48 overflow-y-auto">
            {sceneList.length === 0 && (
              <p className="text-xs text-neutral-500 px-3 py-2">
                {fetching ? "Buscando cenários..." : "Nenhum cenário criado ainda"}
              </p>
            )}
            {sceneList.map(scene => (
              <button
                key={scene.id}
                disabled={loading || activeScene?.sceneId === scene.id}
                onClick={() => handleLoad(scene.id)}
                className={clsx(
                  "w-full text-left text-xs px-3 py-2 transition-colors",
                  activeScene?.sceneId === scene.id
                    ? "text-blue-400 bg-blue-950/30"
                    : "text-neutral-300 hover:bg-neutral-700"
                )}
              >
                {activeScene?.sceneId === scene.id && "✓ "}
                {scene.name}
                <span className="text-neutral-600 ml-1">v{scene.version}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fog controls */}
      {activeScene && (
        <button
          onClick={handleClearFog}
          className="text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-800/70 hover:bg-neutral-700/70 px-3 py-1.5 rounded-lg border border-neutral-700/50 transition-colors text-left"
        >
          ☁ Limpar névoa de guerra
        </button>
      )}

      {/* Reload scenes */}
      {!fetching && (
        <button
          onClick={() => {
            setFetching(true)
            scenesApi.list(campaignId).then(setSceneList).finally(() => setFetching(false))
          }}
          className="text-[10px] text-neutral-600 hover:text-neutral-400 text-left px-1"
        >
          ↺ Atualizar lista
        </button>
      )}
    </div>
  )
}
