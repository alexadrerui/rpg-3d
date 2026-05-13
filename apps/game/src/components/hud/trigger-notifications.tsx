import { useState, useEffect } from "react"
import { clsx }                from "clsx"
import type { EvTriggerActivated } from "@rpg3d/schema"

// ─────────────────────────────────────────────────────────────────────────────
// TriggerNotification — popup que aparece quando um trigger é ativado
// ─────────────────────────────────────────────────────────────────────────────

type Notif = EvTriggerActivated & { notifId: string; ts: number }

type Props = {
  isMaster: boolean
}

// Singleton store via module-level array (sem zustand para não criar dep circular)
let _notifications: Notif[] = []
let _listeners:     Array<() => void> = []

function subscribe(fn: () => void) {
  _listeners.push(fn)
  return () => { _listeners = _listeners.filter(l => l !== fn) }
}

function notify() { _listeners.forEach(fn => fn()) }

export function pushTriggerNotification(ev: EvTriggerActivated) {
  _notifications = [
    { ...ev, notifId: Math.random().toString(36).slice(2), ts: Date.now() },
    ..._notifications.slice(0, 4),
  ]
  notify()
}

export function TriggerNotifications({ isMaster }: Props) {
  const [notifs, setNotifs] = useState<Notif[]>([])

  useEffect(() => subscribe(() => setNotifs([..._notifications])), [])

  // Auto-dismiss após 6s
  useEffect(() => {
    if (!notifs.length) return
    const t = setTimeout(() => {
      const cutoff = Date.now() - 6000
      _notifications = _notifications.filter(n => n.ts > cutoff)
      setNotifs([..._notifications])
    }, 6000)
    return () => clearTimeout(t)
  }, [notifs])

  if (!notifs.length) return null

  return (
    <div className="flex flex-col gap-2 w-80">
      {notifs.map(n => (
        <TriggerCard
          key={n.notifId}
          notif={n}
          isMaster={isMaster}
          onDismiss={() => {
            _notifications = _notifications.filter(x => x.notifId !== n.notifId)
            setNotifs([..._notifications])
          }}
        />
      ))}
    </div>
  )
}

function TriggerCard({ notif, isMaster, onDismiss }: { notif: Notif; isMaster: boolean; onDismiss: () => void }) {
  const { trigger } = notif
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  const icon =
    trigger.type === "trigger_note"           ? "📜" :
    trigger.type === "trigger_trap"           ? "⚠️" :
    trigger.type === "trigger_transition"     ? "🚪" :
    trigger.type === "trigger_ambient_audio"  ? "🔊" : "⚡"

  const title =
    trigger.type === "trigger_note"       ? (isMaster ? trigger.title : "Algo foi revelado") :
    trigger.type === "trigger_trap"       ? (trigger.label ?? "Armadilha ativada!") :
    trigger.type === "trigger_transition" ? (trigger.label ?? "Transição de cena") :
    trigger.type === "trigger_ambient_audio" ? "Áudio ambiente alterado" : "Evento"

  const borderColor =
    trigger.type === "trigger_trap"  ? "border-red-600/60"    :
    trigger.type === "trigger_note"  ? "border-amber-600/60"  :
    "border-blue-600/60"

  const bgColor =
    trigger.type === "trigger_trap"  ? "bg-red-950/80"    :
    trigger.type === "trigger_note"  ? "bg-amber-950/80"  :
    "bg-blue-950/80"

  return (
    <div className={clsx(
      "rounded-xl border px-4 py-3 backdrop-blur-sm transition-all duration-300",
      bgColor, borderColor,
      visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-lg shrink-0 mt-0.5">{icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white leading-tight">{title}</p>

            {/* Conteúdo da nota (só mestre ou se revealOn === "enter_zone") */}
            {trigger.type === "trigger_note" && isMaster && (
              <p className="text-xs text-amber-200/80 mt-0.5 line-clamp-3">{trigger.content}</p>
            )}

            {/* Efeitos da armadilha */}
            {trigger.type === "trigger_trap" && (
              <div className="mt-1 space-y-0.5">
                {trigger.effects.map((eff, i) => {
                  if (eff.kind === "damage") return (
                    <p key={i} className="text-xs text-red-300">
                      💥 {eff.diceCount}d{eff.diceFaces}{eff.modifier ? `+${eff.modifier}` : ""} {eff.damageType}
                    </p>
                  )
                  if (eff.kind === "condition") return (
                    <p key={i} className="text-xs text-orange-300">
                      🩹 {eff.condition} ({eff.durationRounds} rodadas)
                    </p>
                  )
                  return null
                })}
                {trigger.savingThrow && (
                  <p className="text-xs text-yellow-300">
                    🛡 Resistência {trigger.savingThrow.attribute.toUpperCase()} CD {trigger.savingThrow.dc}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-neutral-500 hover:text-neutral-300 text-xs shrink-0"
        >✕</button>
      </div>
    </div>
  )
}
