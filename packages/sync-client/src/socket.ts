import { io, type Socket } from "socket.io-client"
import type { ServerToClientMap, ClientToServerMap } from "@rpg3d/schema"

export type RpgSocket = Socket<ServerToClientMap, ClientToServerMap>

let socket: RpgSocket | null = null

export function getSocket(serverUrl?: string): RpgSocket {
  // Reusa a instância SEMPRE (mesmo desconectada/conectando) — checar `connected`
  // fazia cada hook montado antes do connect receber uma instância diferente:
  // o room:join ficava num socket e dice/chat emitiam noutro (NOT_IN_ROOM).
  if (socket) return socket

  const url = serverUrl ?? (
    typeof window !== "undefined"
      ? (window as unknown as Record<string, string>).__VITE_GAME_SERVER_URL__
      : undefined
  ) ?? "http://localhost:4001"

  socket = io(url, {
    autoConnect:     false,
    reconnection:    true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    timeout:         10_000,
  }) as RpgSocket

  return socket
}

export function setAuthToken(token: string): void {
  const s = getSocket()
  s.auth = { token }
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}
