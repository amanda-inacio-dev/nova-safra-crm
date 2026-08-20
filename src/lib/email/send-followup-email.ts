import { Resend } from 'resend'
import { escapeHtml as esc } from '@/lib/pdf/escape-html'
import { textToEmailHtml } from './text-to-html'

/** Mesma técnica de string-template dos demais e-mails (ver send-quotation-email.ts). */
function buildFollowUpEmailHtml(params: {
  clientName: string
  quotationCode: string
  companyName: string
  portalUrl: string
  message: string
  senderName?: string | null
  signatureUrl?: string | null
}): string {
  const { clientName, quotationCode, companyName, portalUrl, message, senderName, signatureUrl } =
    params
  const messageHtml = textToEmailHtml(message)
  const signatureBlock = senderName
    ? `<p style="margin:20px 0 0; font-size:14px; line-height:1.5;">
         Atenciosamente,<br />${esc(senderName)}
       </p>
       ${signatureUrl ? `<img src="${esc(signatureUrl)}" alt="Assinatura de ${esc(senderName)}" style="max-height:60px; width:auto; margin-top:8px; display:block;" />` : ''}`
    : ''
  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8" /></head>
<body style="margin:0; padding:0; background:#f2f7f3; font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color:#1b231d;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f7f3; padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="background:#123822; padding:24px 32px;">
              <p style="margin:0; color:#f2f7f3; font-size:18px; font-weight:700;">${esc(companyName)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px; font-size:15px;">Olá, ${esc(clientName)}!</p>
              <p style="margin:0 0 16px; font-size:15px; line-height:1.5;">${messageHtml}</p>
              ${signatureBlock}
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td style="background:#3c8c5c; border-radius:6px;">
                    <a href="${esc(portalUrl)}" style="display:inline-block; padding:12px 24px; color:#fff; font-size:14px; font-weight:600; text-decoration:none;">
                      Ver cotação
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0; font-size:12px; color:#5e6b62; word-break:break-all;">
                Ou copie e cole este link no navegador: ${esc(portalUrl)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px; border-top:1px solid #e7edea;">
              <p style="margin:0; font-size:11px; color:#5e6b62;">${esc(companyName)} — Cotação ${esc(quotationCode)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Envia o e-mail de solicitação de retorno (issue #17) — mesmo remetente/Resend
 *  usado no envio original da cotação, com o texto que o Comercial confirmou
 *  (editado ou o padrão do template). */
export async function sendFollowUpEmail(params: {
  to: string | string[]
  clientName: string
  quotationCode: string
  companyName: string
  portalUrl: string
  message: string
  senderName?: string | null
  signatureUrl?: string | null
}): Promise<{ error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) {
    return { error: 'Envio de e-mail não configurado (RESEND_API_KEY / RESEND_FROM_EMAIL).' }
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: `${params.companyName} <${from}>`,
    to: params.to,
    subject: `Cotação ${params.quotationCode} — ${params.companyName}`,
    html: buildFollowUpEmailHtml(params),
  })

  if (error) return { error: 'Não foi possível enviar o e-mail.' }
  return {}
}
