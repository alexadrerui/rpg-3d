export type LogEventType =
  | "JOIN" | "LEAVE" | "CHAT" | "DICE"
  | "SCENE_LOAD" | "NPC_SPAWN" | "NPC_DESPAWN"
  | "NOTE_REVEAL" | "TRAP_DISARM" | "FOG_CLEAR"

export type LogEntry = {
  sessionId:  string
  campaignId: string
  type:       LogEventType
  actorName?: string
  data?:      Record<string, unknown>
}

const FLUSH_INTERVAL_MS = 5_000
const FLUSH_SIZE        = 20

class LogQueue {
  private queue: LogEntry[] = []
  private timer: ReturnType<typeof setTimeout> | null = null

  private get apiUrl() { return process.env.API_URL ?? "http://localhost:4000" }
  private get secret() { return process.env.SERVER_SECRET ?? "dev-server-secret" }

  push(entry: LogEntry): void {
    this.queue.push(entry)
    if (this.queue.length >= FLUSH_SIZE) {
      this.flush().catch(console.error)
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush().catch(console.error), FLUSH_INTERVAL_MS)
    }
  }

  async endSession(sessionId: string): Promise<void> {
    await this.flush()
    try {
      await fetch(`${this.apiUrl}/internal/session-end`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "x-server-secret": this.secret },
        body:    JSON.stringify({ sessionId }),
      })
    } catch (err) {
      console.error("[log-queue] session-end failed:", err)
    }
  }

  private async flush(): Promise<void> {
    if (this.timer) { clearTimeout(this.timer); this.timer = null }
    if (this.queue.length === 0) return

    const entries = this.queue.splice(0)
    try {
      await fetch(`${this.apiUrl}/internal/session-log`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "x-server-secret": this.secret },
        body:    JSON.stringify({ entries }),
      })
    } catch (err) {
      console.error("[log-queue] flush failed:", err)
    }
  }
}

export const logQueue = new LogQueue()
