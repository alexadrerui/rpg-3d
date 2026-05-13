import { clsx } from "clsx"
import type { Participant } from "@rpg3d/sync-client"

type Props = {
  participants: Participant[]
  isMaster:     boolean
}

export function ParticipantsPanel({ participants, isMaster }: Props) {
  const online  = participants.filter(p => p.isOnline)
  const offline = participants.filter(p => !p.isOnline)

  return (
    <div className="bg-neutral-900/90 backdrop-blur-sm border border-neutral-700/50 rounded-xl overflow-hidden w-48">
      <div className="px-3 py-2 border-b border-neutral-700/50">
        <span className="text-xs font-medium text-neutral-300">
          👥 Sessão
          <span className="ml-2 text-neutral-500">{online.length}/{participants.length}</span>
        </span>
      </div>
      <div className="p-2 space-y-1">
        {online.map(p => <ParticipantRow key={p.userId} p={p} isMaster={isMaster} />)}
        {offline.map(p => <ParticipantRow key={p.userId} p={p} isMaster={isMaster} offline />)}
      </div>
    </div>
  )
}

function ParticipantRow({ p, isMaster: viewerIsMaster, offline }: { p: Participant; isMaster: boolean; offline?: boolean }) {
  return (
    <div className={clsx("flex items-center gap-2 px-1 py-0.5 rounded", offline && "opacity-40")}>
      <div className={clsx(
        "w-2 h-2 rounded-full shrink-0",
        offline        ? "bg-neutral-600" :
        p.isMaster     ? "bg-purple-500"  : "bg-green-500"
      )} />
      <span className={clsx("text-xs truncate", p.isMaster ? "text-purple-300" : "text-neutral-300")}>
        {p.name}
      </span>
      {p.isMaster && <span className="text-[9px] text-purple-500 ml-auto shrink-0">Mestre</span>}
    </div>
  )
}
