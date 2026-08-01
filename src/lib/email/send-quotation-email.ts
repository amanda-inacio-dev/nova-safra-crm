import { Resend } from 'resend'
import { escapeHtml as esc } from '@/lib/pdf/escape-html'

/** Monta o e-mail por concatenação de strings (mesmo motivo do template do PDF — ver
 *  src/lib/pdf/template.ts): evita JSX/react-dom em código alcançável por Server Action. */
function buildEmailHtml(params: {
  clientName: string
  quotationCode: string
  companyName: string
  portalUrl: string
  customMessage?: string | null
  senderName?: string | null
  signatureUrl?: string | null
}): string {
  const {
    clientName,
    quotationCode,
    companyName,
    portalUrl,
    customMessage,
    senderName,
    signatureUrl,
  } = params
  const customMessageBlock = customMessage
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
         <tr>
           <td style="background:#e7f1ea; border-radius:6px; padding:14px 16px; font-size:14px; line-height:1.5; white-space:pre-wrap;">
             ${esc(customMessage)}
           </td>
         </tr>
       </table>`
    : ''
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
              <p style="margin:0 0 16px; font-size:15px; line-height:1.5;">
                Sua cotação <strong>${esc(quotationCode)}</strong> está pronta. Acesse o link
                abaixo para visualizar o documento e registrar sua aprovação, reprovação ou
                comentário.
              </p>
              ${customMessageBlock}
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
              <p style="margin:0; font-size:11px; color:#5e6b62;">${esc(companyName)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Envia o e-mail de cotação ao cliente via Resend. Retorna `error` se a
 *  integração não estiver configurada (`.env.local`) ou se o envio falhar. */
export async function sendQuotationEmail(params: {
  to: string
  clientName: string
  quotationCode: string
  companyName: string
  portalUrl: string
  /** Recado opcional escrito pelo Comercial na hora de enviar. */
  customMessage?: string | null
  /** Nome de quem está enviando — aparece em "Atenciosamente, {nome}". */
  senderName?: string | null
  /** Imagem de assinatura cadastrada pelo usuário (opcional). */
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
    html: buildEmailHtml(params),
  })

  if (error) return { error: 'Não foi possível enviar o e-mail.' }
  return {}
}
