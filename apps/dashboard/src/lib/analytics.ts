// ─────────────────────────────────────────────────────────────────────────────
// Google Analytics 4 — só carrega após consentimento explícito do usuário
// ─────────────────────────────────────────────────────────────────────────────

const CONSENT_KEY   = "rpg3d-cookie-consent"
const MEASUREMENT_ID = (import.meta as unknown as { env: Record<string, string> }).env.VITE_GA_MEASUREMENT_ID

type ConsentStatus = "accepted" | "declined" | null

export function getConsentStatus(): ConsentStatus {
  return (localStorage.getItem(CONSENT_KEY) as ConsentStatus) ?? null
}

export function saveConsent(status: "accepted" | "declined"): void {
  localStorage.setItem(CONSENT_KEY, status)
}

// Injeta o script do GA4 e inicializa — chamado apenas após aceite
export function loadGA(): void {
  if (!MEASUREMENT_ID || document.getElementById("ga4-script")) return

  // Define gtag antes de carregar o script
  window.dataLayer = window.dataLayer ?? []
  window.gtag = function (...args: unknown[]) { window.dataLayer.push(args) }
  window.gtag("js", new Date())
  window.gtag("config", MEASUREMENT_ID, { anonymize_ip: true })

  const script  = document.createElement("script")
  script.id     = "ga4-script"
  script.async  = true
  script.src    = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)
}

// Rastreia eventos customizados (só executa se GA4 já foi carregado)
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params)
  }
}

// Inicializa ao carregar a app se consentimento já foi dado anteriormente
export function initAnalytics(): void {
  if (getConsentStatus() === "accepted") loadGA()
}

// Extensão do Window para TypeScript
declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}
