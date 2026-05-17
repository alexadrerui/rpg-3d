import { create } from "zustand"
import type { AssetRef } from "@rpg3d/schema"

interface AssetStoreState {
  models:     AssetRef[]
  textures:   AssetRef[]
  audio:      AssetRef[]
  addModel:   (asset: AssetRef) => void
  addTexture: (asset: AssetRef) => void
  addAudio:   (asset: AssetRef) => void
  removeAsset:(id: string) => void
  clear:      () => void
}

export const useAssetStore = create<AssetStoreState>((set) => ({
  models:   [],
  textures: [],
  audio:    [],

  addModel:   (asset) => set((s) => ({ models:   [...s.models,   asset] })),
  addTexture: (asset) => set((s) => ({ textures: [...s.textures, asset] })),
  addAudio:   (asset) => set((s) => ({ audio:    [...s.audio,    asset] })),

  removeAsset: (id) => set((s) => ({
    models:   s.models.filter((a)   => a.id !== id),
    textures: s.textures.filter((a) => a.id !== id),
    audio:    s.audio.filter((a)    => a.id !== id),
  })),

  clear: () => set({ models: [], textures: [], audio: [] }),
}))
