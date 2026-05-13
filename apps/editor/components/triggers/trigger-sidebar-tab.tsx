"use client"
import { TriggerPanel } from "./trigger-panel"
import { useTriggerStore } from "../../store/trigger-store"

// ─────────────────────────────────────────────────────────────────────────────
// TriggerSidebarTab — wrapper que adapta o TriggerPanel para a API de tab do Pascal Editor
// Montado como { id: "triggers", component: TriggerSidebarTab } no sidebarTabs
// ─────────────────────────────────────────────────────────────────────────────

export function TriggerSidebarTab() {
  const { triggers } = useTriggerStore()

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      {/* Header com contagem */}
      <div className="px-4 py-3 border-b border-neutral-800 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-300">Triggers RPG</span>
          <span className="text-[10px] text-neutral-600 bg-neutral-800 px-1.5 py-0.5 rounded-full">
            {triggers.length}
          </span>
        </div>
        <p className="text-[10px] text-neutral-600 mt-1">
          Use a toolbar acima para adicionar triggers no canvas
        </p>
      </div>

      {/* Painel de triggers */}
      <div className="flex-1 overflow-hidden">
        <TriggerPanel />
      </div>
    </div>
  )
}
