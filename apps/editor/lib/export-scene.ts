import type { RpgSceneFile } from "@rpg3d/schema"

/** Converte o estado atual do editor em um .rpgscene e faz download */
export function downloadScene(scene: RpgSceneFile): void {
  const blob = new Blob([JSON.stringify(scene, null, 2)], { type: "application/json" })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement("a"), {
    href:     url,
    download: `${scene.meta.name}.rpgscene`,
  })
  a.click()
  URL.revokeObjectURL(url)
}
