import type { RpgSceneFile } from "@rpg3d/schema"

// ─────────────────────────────────────────────────────────────────────────────
// Injeta os nodes de um .rpgscene no useScene do Pascal
// useScene é named export de @pascal-app/core (não default)
// ─────────────────────────────────────────────────────────────────────────────

export async function injectSceneIntoPascal(scene: RpgSceneFile): Promise<void> {
  const { useScene } = await import("@pascal-app/core")
  useScene.getState().setScene(
    scene.scene.nodes as any,
    scene.scene.rootNodeIds as any,
  )
}

export async function clearPascalScene(): Promise<void> {
  const { useScene } = await import("@pascal-app/core")
  useScene.getState().unloadScene()
}
