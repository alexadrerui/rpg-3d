"use client"
import { create } from "zustand"
import type { PlaylistItem, MediaConfig } from "@rpg3d/schema"

interface MediaStoreState {
  playlist:  PlaylistItem[]
  shuffle:   boolean
  loop:      boolean
  autoPlay:  boolean
  volume:    number

  addTrack:     (item: PlaylistItem) => void
  removeTrack:  (assetId: string) => void
  moveTrack:    (fromIdx: number, toIdx: number) => void
  setOption:    (key: keyof Pick<MediaStoreState, "shuffle" | "loop" | "autoPlay">, val: boolean) => void
  setVolume:    (v: number) => void
  getConfig:    () => MediaConfig
  loadConfig:   (cfg: MediaConfig) => void
  clear:        () => void
}

export const useMediaStore = create<MediaStoreState>((set, get) => ({
  playlist: [],
  shuffle:  false,
  loop:     true,
  autoPlay: false,
  volume:   0.7,

  addTrack: (item) => set((s) => ({ playlist: [...s.playlist, item] })),

  removeTrack: (assetId) => set((s) => ({
    playlist: s.playlist.filter((t) => t.assetId !== assetId),
  })),

  moveTrack: (fromIdx, toIdx) => set((s) => {
    const list = [...s.playlist]
    const [item] = list.splice(fromIdx, 1)
    list.splice(toIdx, 0, item!)
    return { playlist: list }
  }),

  setOption: (key, val) => set({ [key]: val }),

  setVolume: (volume) => set({ volume }),

  getConfig: (): MediaConfig => {
    const { playlist, shuffle, loop, autoPlay, volume } = get()
    return { playlist, shuffle, loop, autoPlay, volume }
  },

  loadConfig: (cfg) => set({
    playlist: cfg.playlist,
    shuffle:  cfg.shuffle,
    loop:     cfg.loop,
    autoPlay: cfg.autoPlay,
    volume:   cfg.volume,
  }),

  clear: () => set({ playlist: [], shuffle: false, loop: true, autoPlay: false, volume: 0.7 }),
}))
