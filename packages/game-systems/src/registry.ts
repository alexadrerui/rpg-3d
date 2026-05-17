import type { GameSystem } from "./types.js"

const _systems = new Map<string, GameSystem>()

export const systemRegistry = {
  register(system: GameSystem): void {
    _systems.set(system.id, system)
  },
  get(id: string): GameSystem | undefined {
    return _systems.get(id)
  },
  list(): GameSystem[] {
    return [..._systems.values()]
  },
}
