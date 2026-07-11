// Autoplay em clientes que ainda não interagiram com a página (jogador que
// acabou de abrir/recarregar a sessão): o Chrome rejeita play() com som.
// Fallback: reproduz mutado (sempre permitido) e a UI oferece "ativar som".
export async function playWithAutoplayFallback(
  vid: HTMLVideoElement,
): Promise<"ok" | "muted" | "blocked"> {
  try {
    await vid.play()
    return "ok"
  } catch {
    vid.muted = true
    try {
      await vid.play()
      return "muted"
    } catch {
      return "blocked"
    }
  }
}
