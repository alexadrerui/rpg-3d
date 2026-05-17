"use client"
import { useCallback, useEffect, useRef } from "react"
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
import { useAssetStore }     from "../store/asset-store"
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

    const { models, textures, audio } = useAssetStore.getState()
    const { token, apiUrl, campaignId, sceneName } = useEditorAuthStore.getState()

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
      assets:      { models, textures, audio },
      triggers,
      environment: env,
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
// TriggerPlacementOverlay — captura cliques sobre o canvas do Pascal quando
// uma tool RPG está ativa e cria o trigger na posição clicada
// ─────────────────────────────────────────────────────────────────────────────

function TriggerPlacementOverlay({ onPublish }: { onPublish: () => void }) {
  const { activeTool, addTrigger, setSelectedId, setActiveTool } = useTriggerStore()
  const isPlacing = activeTool && activeTool !== "select"

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacing) return
    e.stopPropagation()

    // Converte posição de tela para world usando raycasting no plano Y=0
    // Como estamos sobrepondo o canvas Pascal, usamos coordenadas normalizadas
    const rect = e.currentTarget.getBoundingClientRect()
    const nx   = (e.clientX - rect.left)  / rect.width
    const nz   = (e.clientY - rect.top)   / rect.height

    // Estimativa de world position no plano XZ (refinado com raycasting real)
    const worldScale = 30
    const pos = {
      x: (nx - 0.5) * worldScale,
      y: 0,
      z: (nz - 0.5) * worldScale,
    }

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
    // Volta para select após colocar
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
