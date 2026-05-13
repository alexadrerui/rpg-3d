export type ViewerMode = "master" | "player"

export type RpgViewerProps = {
  mode: ViewerMode
  sceneUrl: string
  characterId?: string
}
