import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type { ApiSession, ApiSessionLog } from "./api-client"

const LOG_LABEL: Record<string, string> = {
  JOIN:        "entrada",
  LEAVE:       "saída",
  CHAT:        "chat",
  DICE:        "dado",
  SCENE_LOAD:  "cena",
  NPC_SPAWN:   "npc+",
  NPC_DESPAWN: "npc-",
  NOTE_REVEAL: "nota",
  TRAP_DISARM: "armadilha",
  FOG_CLEAR:   "névoa",
}

function describeLog(log: ApiSessionLog): string {
  const d = (log.data ?? {}) as Record<string, unknown>
  switch (log.type) {
    case "JOIN":        return `entrou na sessão${d.isMaster ? " como mestre" : ""}`
    case "LEAVE":       return "saiu da sessão"
    case "CHAT":        return `"${String(d.content ?? "").slice(0, 120)}"`
    case "DICE": {
      const rolls = Array.isArray(d.rolls) ? (d.rolls as number[]).join(", ") : ""
      const mod   = typeof d.modifier === "number" && d.modifier !== 0
        ? (d.modifier > 0 ? `+${d.modifier}` : `${d.modifier}`) : ""
      return `rolou ${d.diceCount}d${d.diceFaces}${mod}: [${rolls}] = ${d.total}${d.label ? ` (${d.label})` : ""}`
    }
    case "SCENE_LOAD":  return "carregou cena"
    case "NPC_SPAWN":   return `invocou ${d.role ?? "NPC"} "${d.name ?? ""}"`
    case "NPC_DESPAWN": return "removeu NPC"
    case "NOTE_REVEAL": return "revelou uma nota"
    case "TRAP_DISARM": return "desarmou uma armadilha"
    case "FOG_CLEAR":   return "limpou a névoa de guerra"
    default:            return log.type
  }
}

function formatDuration(startedAt: string, endedAt?: string): string {
  if (!endedAt) return "sessão em andamento"
  const mins = Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000)
  if (mins < 1) return "< 1 min"
  const h = Math.floor(mins / 60), m = mins % 60
  return h > 0 ? `${h}h ${m}min` : `${mins}min`
}

export function exportSessionPdf(
  campaignName: string,
  session: ApiSession,
  logs: ApiSessionLog[],
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  const dateStr = new Date(session.startedAt).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  })
  const timeStr = new Date(session.startedAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit",
  })
  const duration = formatDuration(session.startedAt, session.endedAt)

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  doc.setFillColor(88, 28, 135)        // purple-900
  doc.rect(0, 0, 210, 28, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("Relatório de Sessão", 14, 12)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(campaignName, 14, 20)

  // ── Metadados ──────────────────────────────────────────────────────────────
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(9)
  doc.text(`Data: ${dateStr} às ${timeStr}`, 14, 36)
  doc.text(`Duração: ${duration}`, 14, 42)
  doc.text(`Eventos: ${logs.length}`, 14, 48)

  // ── Tabela de eventos ──────────────────────────────────────────────────────
  const rows = logs.map(log => [
    new Date(log.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    LOG_LABEL[log.type] ?? log.type,
    log.actorName ?? "—",
    describeLog(log),
  ])

  autoTable(doc, {
    startY: 55,
    head: [["Hora", "Tipo", "Ator", "Evento"]],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [88, 28, 135], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    columnStyles: {
      0: { cellWidth: 14, halign: "center" },
      1: { cellWidth: 20 },
      2: { cellWidth: 35 },
      3: { cellWidth: "auto" },
    },
    margin: { left: 14, right: 14 },
  })

  // ── Rodapé ─────────────────────────────────────────────────────────────────
  const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } })
    .internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(180, 180, 180)
    doc.text(`RPG 3D · ${campaignName}`, 14, 290)
    doc.text(`${i} / ${pageCount}`, 196, 290, { align: "right" })
  }

  const slug = dateStr.replace(/\s+de\s+/gi, "-").replace(/\s/g, "-").toLowerCase()
  doc.save(`sessao-${slug}.pdf`)
}
