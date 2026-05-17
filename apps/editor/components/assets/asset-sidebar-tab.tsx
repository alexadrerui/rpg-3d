"use client"
import { useCallback, useRef, useState } from "react"
import { useEditorAuthStore } from "../../store/auth-store"
import { useAssetStore }      from "../../store/asset-store"
import { uploadAsset }        from "../../lib/upload-asset"
import type { AssetRef }      from "@rpg3d/schema"

type AssetKind = "model" | "texture" | "audio"

interface UploadEntry {
  name:     string
  progress: number
  status:   "uploading" | "done" | "error"
  error:    string | null
}

const ACCEPT: Record<AssetKind, string> = {
  model:   ".glb,.gltf",
  texture: ".png,.jpg,.jpeg,.webp,.ktx2",
  audio:   ".mp3,.ogg,.wav",
}

const KIND_LABEL: Record<AssetKind, string> = {
  model:   "Modelo 3D (.glb)",
  texture: "Textura (.png/.jpg)",
  audio:   "Áudio (.mp3/.ogg)",
}

const KIND_TAG: Record<AssetKind, string> = {
  model:   "3D",
  texture: "TEX",
  audio:   "SOM",
}

// ─────────────────────────────────────────────────────────────────────────────

export function AssetSidebarTab() {
  const { token, apiUrl, campaignId, sceneName, setToken, setApiUrl, setCampaignId, setSceneName, clear } =
    useEditorAuthStore()
  const { models, textures, audio, addModel, addTexture, addAudio, removeAsset } = useAssetStore()
  const [uploads, setUploads] = useState<Record<string, UploadEntry>>({})

  // ── sem token: painel de conexão ─────────────────────────────────────────

  if (!token) {
    return <ConnectPanel apiUrl={apiUrl} setApiUrl={setApiUrl} setToken={setToken} />
  }

  // ── upload de arquivo ─────────────────────────────────────────────────────

  const handleFile = useCallback(
    async (file: File, kind: AssetKind) => {
      if (!campaignId.trim()) return
      const key = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2)}`

      setUploads((u) => ({
        ...u,
        [key]: { name: file.name, progress: 0, status: "uploading", error: null },
      }))

      try {
        const asset = await uploadAsset(apiUrl, token, campaignId, file, (pct) => {
          setUploads((u) => ({ ...u, [key]: { ...u[key]!, progress: pct } }))
        })

        if (kind === "model")   addModel(asset)
        if (kind === "texture") addTexture(asset)
        if (kind === "audio")   addAudio(asset)

        setUploads((u) => ({ ...u, [key]: { ...u[key]!, status: "done", progress: 100 } }))
        setTimeout(() => setUploads((u) => { const { [key]: _, ...rest } = u; return rest }), 3000)
      } catch (err) {
        setUploads((u) => ({
          ...u,
          [key]: { ...u[key]!, status: "error", error: String(err) },
        }))
      }
    },
    [token, apiUrl, campaignId, addModel, addTexture, addAudio],
  )

  // ── lista de todos os assets desta sessão ─────────────────────────────────

  const allAssets: [AssetRef, AssetKind][] = [
    ...models.map((a): [AssetRef, AssetKind]   => [a, "model"]),
    ...textures.map((a): [AssetRef, AssetKind] => [a, "texture"]),
    ...audio.map((a): [AssetRef, AssetKind]    => [a, "audio"]),
  ]

  return (
    <div className="flex flex-col gap-3 p-3 text-sm">

      {/* ── Configuração de publicação ──────────────────────────────────── */}
      <section>
        <p className="text-[11px] text-neutral-500 uppercase tracking-wide mb-2">Publicação</p>
        <div className="flex flex-col gap-2">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">ID da campanha</label>
            <input
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              placeholder="cuid da campanha…"
              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs outline-none focus:border-neutral-500 placeholder:text-neutral-600"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Nome da cena</label>
            <input
              value={sceneName}
              onChange={(e) => setSceneName(e.target.value)}
              placeholder="Nome da cena…"
              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs outline-none focus:border-neutral-500 placeholder:text-neutral-600"
            />
          </div>
        </div>
        {!campaignId.trim() && (
          <p className="text-[11px] text-amber-500/80 mt-1">Preencha o ID da campanha para fazer upload.</p>
        )}
      </section>

      {/* ── Zonas de upload ─────────────────────────────────────────────── */}
      <section>
        <p className="text-[11px] text-neutral-500 uppercase tracking-wide mb-2">Adicionar asset</p>
        <div className="flex flex-col gap-1.5">
          {(["model", "texture", "audio"] as AssetKind[]).map((kind) => (
            <UploadZone
              key={kind}
              kind={kind}
              disabled={!campaignId.trim()}
              onFile={(f) => handleFile(f, kind)}
            />
          ))}
        </div>
      </section>

      {/* ── Uploads em andamento ─────────────────────────────────────────── */}
      {Object.entries(uploads).map(([key, u]) => (
        <div key={key} className="bg-neutral-800/80 rounded p-2 text-xs border border-neutral-700">
          <div className="flex items-center justify-between mb-1">
            <span className="text-neutral-300 truncate max-w-[80%]">{u.name}</span>
            {u.status === "uploading" && <span className="text-neutral-500">{u.progress}%</span>}
            {u.status === "done"      && <span className="text-green-400">✓</span>}
            {u.status === "error"     && <span className="text-red-400">✗</span>}
          </div>
          {u.status === "uploading" && (
            <div className="h-0.5 bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-0.5 bg-blue-500 rounded-full transition-all duration-200"
                style={{ width: `${u.progress}%` }}
              />
            </div>
          )}
          {u.status === "error" && <p className="text-red-400/80 text-[10px] mt-0.5">{u.error}</p>}
        </div>
      ))}

      {/* ── Lista de assets desta sessão ─────────────────────────────────── */}
      {allAssets.length > 0 && (
        <section>
          <p className="text-[11px] text-neutral-500 uppercase tracking-wide mb-2">
            Assets ({allAssets.length})
          </p>
          <div className="flex flex-col gap-1">
            {allAssets.map(([asset, kind]) => (
              <div
                key={asset.id}
                className="flex items-center gap-2 bg-neutral-800 rounded px-2 py-1.5 group"
              >
                <span className="text-[9px] bg-neutral-700 text-neutral-400 rounded px-1 py-0.5 font-mono shrink-0">
                  {KIND_TAG[kind]}
                </span>
                <span className="flex-1 truncate text-xs text-neutral-300">
                  {asset.url.split("/").pop()}
                </span>
                <button
                  type="button"
                  onClick={() => removeAsset(asset.id)}
                  className="text-neutral-600 hover:text-red-400 text-sm leading-none opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  title="Remover"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Rodapé ───────────────────────────────────────────────────────── */}
      <div className="pt-1 border-t border-neutral-800">
        <p className="text-[11px] text-neutral-600 mb-1">
          Conectado a <span className="text-neutral-400">{apiUrl}</span>
        </p>
        <button
          type="button"
          onClick={clear}
          className="text-[11px] text-neutral-600 hover:text-red-400 transition-colors"
        >
          Desconectar
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ConnectPanel — exibido quando não há token salvo
// ─────────────────────────────────────────────────────────────────────────────

function ConnectPanel({
  apiUrl,
  setApiUrl,
  setToken,
}: {
  apiUrl:    string
  setApiUrl: (u: string) => void
  setToken:  (t: string) => void
}) {
  const [url, setUrl]     = useState(apiUrl)
  const [tok, setTok]     = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${url}/auth/me`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (!res.ok) throw new Error(`Token inválido ou API inacessível (${res.status})`)
      setApiUrl(url)
      setToken(tok)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3 text-sm">
      <p className="text-xs text-neutral-400 leading-relaxed">
        Conecte ao api-server para fazer upload de assets e publicar cenas diretamente no storage.
      </p>

      <div>
        <label className="block text-xs text-neutral-400 mb-1">API URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs outline-none focus:border-neutral-500"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-400 mb-1">JWT Token</label>
        <input
          type="password"
          value={tok}
          onChange={(e) => setTok(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConnect()}
          placeholder="Cole o token do login…"
          className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs outline-none focus:border-neutral-500 placeholder:text-neutral-600"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleConnect}
        disabled={loading || !tok.trim()}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded px-3 py-1.5 text-xs font-medium transition-colors"
      >
        {loading ? "Conectando…" : "Conectar"}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// UploadZone — botão que abre file picker por tipo
// ─────────────────────────────────────────────────────────────────────────────

function UploadZone({
  kind,
  disabled,
  onFile,
}: {
  kind:     AssetKind
  disabled: boolean
  onFile:   (f: File) => void
}) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={ACCEPT[kind]}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) { onFile(f); e.target.value = "" }
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => ref.current?.click()}
        className="w-full border border-dashed border-neutral-700 hover:border-neutral-500 rounded py-2 text-xs text-neutral-500 hover:text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        + {KIND_LABEL[kind]}
      </button>
    </>
  )
}
