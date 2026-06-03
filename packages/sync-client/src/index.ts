// @rpg3d/sync-client — WebSocket client for live RPG sessions

export { getSocket, setAuthToken, disconnectSocket } from "./socket.js"
export { useGameRoom, useRoomStore }                 from "./use-game-room.js"
export { useChat }                                   from "./use-chat.js"
export { useDice }                                   from "./use-dice.js"

export type { GameRoomStatus, Participant, TokenPosition, ActiveScene, FogCell, NpcToken, UseGameRoomOptions, MediaState, VideoState, CombatantEntry, CombatState } from "./use-game-room.js"
export type { ChatMessage, ChatChannel } from "./use-chat.js"
export type { DiceResult }               from "./use-dice.js"
