import { useState, useEffect } from "react"
import { getConsentStatus, saveConsent, loadGA } from "../lib/analytics"

// ─────────────────────────────────────────────────────────────────────────────
// CookieBanner — aparece na primeira visita, respeita LGPD
// ─────────────────────────────────────────────────────────────────────────────

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (getConsentStatus() === null) setVisible(true)
  }, [])

  if (!visible) return null

  const handle = (status: "accepted" | "declined") => {
    saveConsent(status)
    if (status === "accepted") loadGA()
    setVisible(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-700/60 rounded-xl shadow-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-xs text-neutral-400 flex-1 leading-relaxed">
          Usamos cookies analíticos (Google Analytics) para entender como a plataforma é utilizada
          e melhorá-la continuamente. Nenhum dado é compartilhado com terceiros para fins de publicidade.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => handle("declined")}
            className="text-xs text-neutral-500 hover:text-neutral-300 border border-neutral-700/50 hover:border-neutral-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            Recusar
          </button>
          <button
            onClick={() => handle("accepted")}
            className="text-xs bg-purple-700 hover:bg-purple-600 text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
          >
            Aceitar cookies
          </button>
        </div>
      </div>
    </div>
  )
}
