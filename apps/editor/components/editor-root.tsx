"use client"
import { useCallback, useEffect, useRef } from "react"
import { Raycaster, Vector2, Vector3, Plane } from "three"
import { Editor, applySceneGraphToEditor, type SceneGraph, ItemsPanel } from "@pascal-app/editor"
import { useScene }        from "@pascal-app/core"
import { useViewer }       from "@pascal-app/viewer"
import { useTriggerStore, makeNote, makeTrap, makeSpawn, makeTransition, makeAmbientAudio } from "../store/trigger-store"
import { useEnvironmentStore } from "../store/environment-store"
import { RpgToolbarSlot }        from "./toolbar/rpg-toolbar-slot"
import { TriggerSidebarTab }     from "./triggers/trigger-sidebar-tab"
import { EnvironmentSidebarTab } from "./environment/environment-sidebar-tab"
import { downloadScene }   from "../lib/export-scene"
import { uploadSceneFile }  from "../lib/upload-asset"
import { AssetSidebarTab }  from "./assets/asset-sidebar-tab"
import { MediaSidebarTab }  from "./media/media-sidebar-tab"
import { useAssetStore }     from "../store/asset-store"
import { useMediaStore }     from "../store/media-store"
import { useEditorAuthStore } from "../store/auth-store"
import type { RpgSceneFile } from "@rpg3d/schema"

// ─────────────────────────────────────────────────────────────────────────────
// Chaves de persistência
// ─────────────────────────────────────────────────────────────────────────────

const SCENE_STORAGE_KEY   = "rpg3d-editor-scene"
const TRIGGER_STORAGE_KEY = "rpg3d-editor-triggers"

// ─────────────────────────────────────────────────────────────────────────────
// EditorRoot — monta o Pascal Editor v2 com a camada RPG integrada via API oficial
// ─────────────────────────────────────────────────────────────────────────────

export function EditorRoot() {
  const { triggers, setTriggers } = useTriggerStore()
  const { env }                   = useEnvironmentStore()
  const publishedRef = useRef(false)

  // ── Configura tema escuro no viewer ──────────────────────────────────────
  useEffect(() => {
    useViewer.getState().setTheme("dark")
    useViewer.getState().setCameraMode("orthographic")
    useViewer.getState().setWallMode("cutaway")
  }, [])

  // ── Persistência de triggers separada do scene do Pascal ─────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TRIGGER_STORAGE_KEY)
      if (raw) setTriggers(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(TRIGGER_STORAGE_KEY, JSON.stringify(triggers))
    } catch { /* ignore */ }
  }, [triggers])

  // ── onLoad — carrega cena do localStorage ─────────────────────────────────
  const onLoad = useCallback(async (): Promise<SceneGraph | null> => {
    try {
      const raw = localStorage.getItem(SCENE_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])

  // ── onSave — persiste no localStorage ─────────────────────────────────────
  const onSave = useCallback(async (scene: SceneGraph) => {
    try {
      localStorage.setItem(SCENE_STORAGE_KEY, JSON.stringify(scene))
    } catch { /* ignore */ }
  }, [])

  // ── Publicar → upload para storage (se conectado) ou download local ──────
  const handlePublish = useCallback(async () => {
    if (publishedRef.current) return
    publishedRef.current = true

    const sceneState = useScene.getState()
    const graph: SceneGraph = {
      nodes:       sceneState.nodes as unknown as Record<string, unknown>,
      rootNodeIds: sceneState.rootNodeIds,
    }

    const { models, textures, audio, videos } = useAssetStore.getState()
    const { token, apiUrl, campaignId, sceneName } = useEditorAuthStore.getState()
    const mediaConfig = useMediaStore.getState().getConfig()

    const scene: RpgSceneFile = {
      $schema: "rpg-scene/v1",
      meta: {
        id:         crypto.randomUUID(),
        campaignId: campaignId || crypto.randomUUID(),
        name:       sceneName || "Cenário exportado",
        createdAt:  new Date().toISOString(),
        updatedAt:  new Date().toISOString(),
        createdBy:  "editor",
        version:    1,
        tags:       [],
      },
      scene: {
        nodes:       graph.nodes,
        rootNodeIds: graph.rootNodeIds,
      },
      assets:      { models, textures, audio, videos },
      triggers,
      environment: env,
      media:       mediaConfig.playlist.length > 0 ? mediaConfig : undefined,
    }

    if (token && campaignId) {
      try {
        const fileUrl = await uploadSceneFile(
          apiUrl, token, campaignId,
          JSON.stringify(scene, null, 2),
          scene.meta.name,
        )
        await fetch(`${apiUrl}/scenes`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ campaignId, name: scene.meta.name, fileUrl }),
        })
      } catch {
        // falha no upload → fallback para download local
        downloadScene(scene)
      }
    } else {
      downloadScene(scene)
    }

    setTimeout(() => { publishedRef.current = false }, 2000)
  }, [triggers, env])

  // ── Sidebar tabs: os do Pascal + aba de triggers RPG ──────────────────────
  const sidebarTabs = [
    {
      id:        "site",
      label:     "Cena",
      component: () => null,          // painel padrão do Pascal
      mobileDefaultSnap: 0.5,
      mobileIcon: null,
    },
    {
      id:        "items",
      label:     "Itens",
      component: ItemsPanel,
      mobileDefaultSnap: 0.5,
      mobileIcon: null,
    },
    {
      id:        "triggers",
      label:     "Triggers RPG",
      component: TriggerSidebarTab,  // nosso painel
      mobileDefaultSnap: 0.5,
      mobileIcon: null,
    },
    {
      id:        "environment",
      label:     "Ambiente",
      component: EnvironmentSidebarTab,
      mobileDefaultSnap: 0.5,
      mobileIcon: null,
    },
    {
      id:        "assets",
      label:     "Assets",
      component: AssetSidebarTab,
      mobileDefaultSnap: 0.5,
      mobileIcon: null,
    },
    {
      id:        "media",
      label:     "Mídia",
      component: MediaSidebarTab,
      mobileDefaultSnap: 0.5,
      mobileIcon: null,
    },
  ]

  return (
    <div className="relative h-screen w-screen">
      <Editor
        layoutVersion="v2"
        projectId="rpg3d-local"
        sidebarTabs={sidebarTabs as Parameters<typeof Editor>[0]["sidebarTabs"]}
        viewerToolbarRight={
          <RpgToolbarSlot onPublish={handlePublish} />
        }
        onLoad={onLoad}
        onSave={onSave}
      />

      {/* Overlay de posicionamento de trigger — ativado quando uma tool RPG está selecionada */}
      <TriggerPlacementOverlay onPublish={handlePublish} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// screenToWorld — raycasting real contra o plano Y=0 usando a câmera R3F do
// Pascal Editor. Acessa o estado interno do R3F via canvas.__r3f (API estável
// no R3F 8/9). Snap de 0.5u. Fallback linear se a câmera não estiver pronta.
// ─────────────────────────────────────────────────────────────────────────────

const _raycaster = new Raycaster()
const _ndc       = new Vector2()
const _hit       = new Vector3()
const _ground    = new Plane(new Vector3(0, 1, 0), 0)

function screenToWorld(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
): { x: number; y: number; z: number } {
  const rect = canvas.getBoundingClientRect()

  // Tenta acessar a câmera Three.js via estado interno do R3F
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const camera = (canvas as any).__r3f?.root?.getState?.()?.camera ?? null

  if (camera) {
    _ndc.set(
      ((clientX - rect.left) / rect.width)  * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )
    _raycaster.setFromCamera(_ndc, camera)

    if (_raycaster.ray.intersectPlane(_ground, _hit)) {
      // Snap para grade de 0.5u (tiles do RPG)
      return {
        x: Math.round(_hit.x * 2) / 2,
        y: 0,
        z: Math.round(_hit.z * 2) / 2,
      }
    }
  }

  // Fallback: aproximação linear quando câmera não acessível (ex: primeiro frame)
  const nx = (clientX - rect.left) / rect.width
  const nz = (clientY - rect.top)  / rect.height
  return { x: (nx - 0.5) * 30, y: 0, z: (nz - 0.5) * 30 }
}

// ─────────────────────────────────────────────────────────────────────────────
// TriggerPlacementOverlay — captura cliques sobre o canvas do Pascal quando
// uma tool RPG está ativa e cria o trigger na posição clicada
// ─────────────────────────────────────────────────────────────────────────────

function TriggerPlacementOverlay({ onPublish }: { onPublish: () => void }) {
  const { activeTool, addTrigger, setSelectedId, setActiveTool } = useTriggerStore()
  const isPlacing = activeTool && activeTool !== "select"

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacing) return
    e.stopPropagation()

    const canvas = document.querySelector("canvas")
    const pos = canvas
      ? screenToWorld(e.clientX, e.clientY, canvas)
      : { x: 0, y: 0, z: 0 }

    let created
    switch (activeTool) {
      case "note":          created = makeNote(pos);         break
      case "trap":          created = makeTrap(pos);         break
      case "spawn":         created = makeSpawn(pos);        break
      case "transition":    created = makeTransition(pos);   break
      case "ambient_audio": created = makeAmbientAudio(pos); break
      default: return
    }

    addTrigger(created)
    setSelectedId(created.id)
    setActiveTool("select")
  }, [isPlacing, activeTool, addTrigger, setSelectedId, setActiveTool])

  if (!isPlacing) return null

  return (
    <div
      className="absolute inset-0 z-20"
      style={{ cursor: "crosshair" }}
      onClick={handleClick}
    >
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-neutral-900/90 backdrop-blur text-neutral-200 text-xs px-4 py-2 rounded-full border border-neutral-600/50 shadow-xl">
          Clique no canvas para posicionar · <kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-[10px]">Esc</kbd> para cancelar
        </div>
      </div>
    </div>
  )
}
