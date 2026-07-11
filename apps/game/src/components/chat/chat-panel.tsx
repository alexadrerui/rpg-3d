import { useState, useRef, useEffect } from "react"
import { useChat }   from "@rpg3d/sync-client"
import type { ChatChannel, ChatMessage } from "@rpg3d/sync-client"
import { clsx } from "clsx"

// ─────────────────────────────────────────────────────────────────────────────
// ChatPanel — janela de chat flutuante
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  isMaster:   boolean
  serverUrl?: string
}

const CHANNELS: { key: ChatChannel; label: string; masterOnly?: boolean }[] = [
  { key: "general",  label: "Geral" },
  { key: "game_log", label: "Log" },
  { key: "master",   label: "Mestre", masterOnly: true },
]

const CHANNEL_COLORS: Record<ChatChannel, string> = {
  general:  "text-neutral-200",
  master:   "text-purple-400",
  whisper:  "text-amber-400",
  game_log: "text-blue-400",
}

const CHANNEL_ICONS: Record<ChatChannel, string> = {
  general:  "💬",
  master:   "👁",
  whisper:  "🤫",
  game_log: "🎲",
}

export function ChatPanel({ isMaster, serverUrl }: Props) {
  const [activeChannel, setActiveChannel] = useState<ChatChannel>("general")
  const [input, setInput] = useState("")
  const [collapsed, setCollapsed] = useState(false)
  const [speakAs, setSpeakAs] = useState<"player" | "character" | "narrator">("character")
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, send } = useChat(serverUrl)

  const visible = messages.filter(m => {
    if (m.channel === "master" && !isMaster) return false
    return m.channel === activeChannel
  })

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [visible.length])

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    setInput("")
    try {
      await send(text, activeChannel, { speakAs })
    } catch { /* ignore */ }
  }

  const channels = CHANNELS.filter(c => !c.masterOnly || isMaster)

  return (
    <div className={clsx(
      "flex flex-col bg-neutral-900/90 backdrop-blur-sm border border-neutral-700/50 rounded-xl overflow-hidden transition-all duration-200",
      collapsed ? "w-48 h-10" : "w-80 h-72"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700/50 shrink-0">
        <div className="flex gap-1">
          {channels.map(ch => (
            <button
              key={ch.key}
              onClick={() => { setActiveChannel(ch.key); if (collapsed) setCollapsed(false) }}
              className={clsx(
                "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                activeChannel === ch.key
                  ? "bg-neutral-700 text-neutral-100"
                  : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              {ch.label}
              {/* Unread badge */}
              {activeChannel !== ch.key && messages.filter(m => m.channel === ch.key).length > 0 && (
                <span className="ml-1 w-1.5 h-1.5 bg-blue-500 rounded-full inline-block" />
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-neutral-500 hover:text-neutral-300 text-xs ml-1"
        >
          {collapsed ? "▲" : "▼"}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
            {visible.length === 0 && (
              <p className="text-xs text-neutral-600 italic">Nenhuma mensagem ainda...</p>
            )}
            {visible.map(msg => (
              <MessageRow key={msg.id} msg={msg} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {activeChannel !== "game_log" && (
            <div className="flex items-center gap-2 px-3 py-2 border-t border-neutral-700/50 shrink-0">
              {isMaster && activeChannel === "general" && (
                <select
                  value={speakAs}
                  onChange={e => setSpeakAs(e.target.value as typeof speakAs)}
                  className="text-xs bg-neutral-800 text-neutral-400 border-none rounded px-1 py-0.5"
                >
                  <option value="character">Personagem</option>
                  <option value="narrator">Narrador</option>
                  <option value="player">Jogador</option>
                </select>
              )}
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder={activeChannel === "master" ? "Nota do mestre..." : "Digite..."}
                className="flex-1 bg-neutral-800 text-neutral-200 text-xs rounded px-2 py-1.5 placeholder-neutral-600 outline-none border border-neutral-700/50 focus:border-neutral-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="text-xs text-blue-400 hover:text-blue-300 disabled:text-neutral-600 font-medium"
              >
                ↵
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MessageRow({ msg }: { msg: ChatMessage }) {
  const icon  = CHANNEL_ICONS[msg.channel] ?? "💬"
  const color = CHANNEL_COLORS[msg.channel] ?? "text-neutral-200"
  const time  = new Date(msg.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

  const nameStyle = msg.speakAs === "narrator"
    ? "text-amber-300 italic"
    : msg.speakAs === "player"
    ? "text-neutral-400"
    : "text-blue-300"

  return (
    <div className="text-xs leading-relaxed">
      <span className="text-neutral-600 mr-1">{time}</span>
      <span className="mr-1 opacity-60">{icon}</span>
      <span className={clsx("font-medium mr-1", nameStyle)}>{msg.fromName}:</span>
      <span
        className={color}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
      />
    </div>
  )
}

// Mini markdown — só bold e italic.
// IMPORTANTE: escapar o HTML do texto ANTES de gerar as tags — o resultado vai
// para dangerouslySetInnerHTML, então texto do usuário nunca pode virar markup.
function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
}
