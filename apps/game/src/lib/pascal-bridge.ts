import type { RpgSceneFile } from "@rpg3d/schema"

// ─────────────────────────────────────────────────────────────────────────────
// Injeta os nodes de um .rpgscene no useScene do Pascal
// Usa setScene que já faz as migrações de schema internamente
// ─────────────────────────────────────────────────────────────────────────────

export async function injectSceneIntoPascal(scene: RpgSceneFile): Promise<void> {
  const { default: useScene } = await import("@pascal-app/core")
  useScene.getState().setScene(
    scene.scene.nodes as Parameters<typeof useScene.getState().setScene>[0],
    scene.scene.rootNodeIds,
  )
}

export async function clearPascalScene(): Promise<void> {
  const { default: useScene } = await import("@pascal-app/core")
  useScene.getState().unloadScene()
}
