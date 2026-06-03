"use client"
import { useState, useCallback, useEffect } from "react"
import { getSocket } from "./socket.js"
import type { EvMessageReceived, EvSendMessage, ChatChannel } from "@rpg3d/schema"

const MAX_MESSAGES = 200
export type ChatMessage = EvMessageReceived
export type { ChatChannel }

export function useChat(serverUrl?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    const socket = getSocket(serverUrl)
    const handler = (msg: ChatMessage) =>
      setMessages(prev => { const n = [...prev, msg]; return n.length > MAX_MESSAGES ? n.slice(-MAX_MESSAGES) : n })
    socket.on("chat:message", handler)
    return () => { socket.off("chat:message", handler) }
  }, [serverUrl])

  const send = useCallback((content: string, channel: ChatChannel = "general", opts?: { toUserId?: string; speakAs?: EvSendMessage["speakAs"] }) =>
    new Promise<void>((res, rej) => {
      const payload: EvSendMessage = { content, channel, toUserId: opts?.toUserId, speakAs: opts?.speakAs ?? "character" }
      getSocket(serverUrl).emit("chat:send", payload, r => r.ok ? res() : rej(new Error(r.error)))
    }), [serverUrl])

  const byChannel  = useCallback((ch: ChatChannel) => messages.filter(m => m.channel === ch), [messages])
  const clearLocal = useCallback(() => setMessages([]), [])

  return { messages, send, byChannel, clearLocal }
}
