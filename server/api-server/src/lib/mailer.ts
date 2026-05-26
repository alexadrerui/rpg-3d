// ─────────────────────────────────────────────────────────────────────────────
// Mailer — envio de e-mails via Resend API (fetch, sem dependência extra)
// Se RESEND_API_KEY não estiver definido, apenas loga e continua.
// ─────────────────────────────────────────────────────────────────────────────

const RESEND_URL  = "https://api.resend.com/emails"
const API_KEY     = process.env.RESEND_API_KEY
const FROM        = process.env.EMAIL_FROM ?? "noreply@rpg3d.app"
const DASHBOARD   = process.env.DASHBOARD_URL ?? "http://localhost:3003"

export async function sendInviteEmail(opts: {
  toEmail:       string
  recipientName: string
  campaignName:  string
  masterName:    string
  inviteUrl:     string
}): Promise<void> {
  if (!API_KEY) {
    console.log(`[mailer] RESEND_API_KEY não configurado — e-mail de convite não enviado para ${opts.toEmail}`)
    return
  }

  const { toEmail, recipientName, campaignName, masterName, inviteUrl } = opts

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Convite para campanha RPG</title></head>
<body style="font-family:system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#171717;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#3730a3,#7c3aed);padding:32px;text-align:center">
            <p style="margin:0;font-size:28px">⚔️</p>
            <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#fff">Convite para RPG</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 16px;color:#a3a3a3;font-size:15px">Olá${recipientName ? `, ${recipientName}` : ""}!</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#d4d4d4">
              <strong style="color:#c4b5fd">${masterName}</strong> te convidou para participar da campanha
              <strong style="color:#c4b5fd">${campaignName}</strong>.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:24px 0">
                <a href="${inviteUrl}"
                  style="background:#7c3aed;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:8px;display:inline-block">
                  Aceitar convite
                </a>
              </td></tr>
            </table>
            <p style="margin:16px 0 0;font-size:12px;color:#525252;text-align:center">
              Ou copie o link: <span style="color:#8b5cf6">${inviteUrl}</span>
            </p>
            <p style="margin:24px 0 0;font-size:12px;color:#404040;text-align:center">
              Este link expira em 7 dias. Se não esperava este e-mail, ignore-o.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    const res = await fetch(RESEND_URL, {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        from:    FROM,
        to:      [toEmail],
        subject: `Convite para a campanha "${campaignName}"`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`[mailer] falha ao enviar e-mail: ${res.status} ${err}`)
    } else {
      console.log(`[mailer] convite enviado para ${toEmail}`)
    }
  } catch (err) {
    console.error("[mailer] erro ao chamar Resend API:", err)
  }
}
