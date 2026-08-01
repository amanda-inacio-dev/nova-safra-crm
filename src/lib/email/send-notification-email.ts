import { Resend } from 'resend'
import { escapeHtml as esc } from '@/lib/pdf/escape-html'
import { textToEmailHtml } from './text-to-html'
import type { NotificationType } from '@/types'

const EVENT_COLOR: Record<NotificationType, string> = {
  CLIENT_APPROVED: '#3c8c5c',
  CLIENT_REJECTED: '#c0392b',
  CLIENT_COMMENTED: '#123822',
  FORWARDED_TO_OPERATION: '#123822',
  REVISION_REQUESTED: '#c0392b',
  QUOTATION_CLOSED: '#3c8c5c',
}

const SUBJECT_TEXT: Record<NotificationType, (clientName: string) => string> = {
  CLIENT_APPROVED: (c) => `${c} aprovou a cotação`,
  CLIENT_REJECTED: (c) => `${c} reprovou a cotação`,
  CLIENT_COMMENTED: (c) => `${c} comentou na cotação`,
  FORWARDED_TO_OPERATION: () => 'Cotação encaminhada para você',
  REVISION_REQUESTED: () => 'A Operação solicitou revisão da cotação',
  QUOTATION_CLOSED: () => 'Processo concluído — CT-e anexado da cotação',
}

function headline(params: {
  type: NotificationType
  clientName?: string | null
  quotationCode: string
}): string {
  const code = esc(params.quotationCode)
  const client = esc(params.clientName ?? 'Cliente')
  switch (params.type) {
    case 'CLIENT_APPROVED':
      return `O cliente <strong>${client}</strong> aprovou a cotação <strong>${code}</strong>.`
    case 'CLIENT_REJECTED':
      return `O cliente <strong>${client}</strong> reprovou a cotação <strong>${code}</strong>.`
    case 'CLIENT_COMMENTED':
      return `O cliente <strong>${client}</strong> comentou na cotação <strong>${code}</strong>.`
    case 'FORWARDED_TO_OPERATION':
      return `A cotação <strong>${code}</strong> foi encaminhada para você — já pode ser processada pela Operação.`
    case 'REVISION_REQUESTED':
      return `A Operação solicitou revisão da cotação <strong>${code}</strong>.`
    case 'QUOTATION_CLOSED':
      return `A Operação concluiu o processo da cotação <strong>${code}</strong> e anexou o CT-e.`
  }
}

/** Mesma técnica de string-template do restante dos e-mails/PDF (ver
 *  src/lib/pdf/template.ts) — evita JSX/react-dom em código de Server Action. */
function buildNotificationHtml(params: {
  recipientName: string
  clientName?: string | null
  quotationCode: string
  companyName: string
  type: NotificationType
  comment?: string | null
  dashboardUrl: string
  /** Link direto pro documento final (CT-e) — mostra um botão extra quando informado. */
  attachmentUrl?: string | null
}): string {
  const { recipientName, companyName, type, comment, dashboardUrl, attachmentUrl } = params
  // Texto colado nas tags de propósito — ver src/lib/email/text-to-html.ts.
  const commentHtml = comment ? textToEmailHtml(comment) : ''
  const commentBlock = commentHtml
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0;">
         <tr>
           <td style="background:#f2f7f3; border-radius:6px; padding:14px 16px; font-size:14px; line-height:1.5;">“${commentHtml}”</td>
         </tr>
       </table>`
    : ''
  const attachmentButton = attachmentUrl
    ? `<td style="background:#fff; border:1px solid #3c8c5c; border-radius:6px;">
         <a href="${esc(attachmentUrl)}" style="display:inline-block; padding:12px 24px; color:#3c8c5c; font-size:14px; font-weight:600; text-decoration:none;">
           Ver CT-e
         </a>
       </td>`
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
            <td style="background:${EVENT_COLOR[type]}; padding:24px 32px;">
              <p style="margin:0; color:#fff; font-size:18px; font-weight:700;">${esc(companyName)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px; font-size:15px;">Olá, ${esc(recipientName)}!</p>
              <p style="margin:0 0 16px; font-size:15px; line-height:1.5;">${headline(params)}</p>
              ${commentBlock}
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td style="background:#3c8c5c; border-radius:6px;">
                    <a href="${esc(dashboardUrl)}" style="display:inline-block; padding:12px 24px; color:#fff; font-size:14px; font-weight:600; text-decoration:none;">
                      Ver cotação
                    </a>
                  </td>
                  ${attachmentButton ? `<td style="width:12px;"></td>${attachmentButton}` : ''}
                </tr>
              </table>
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

/** Avisa alguém (Comercial ou Operação) de um evento da cotação — cliente
 *  aprovou/reprovou/comentou, cotação foi encaminhada, ou revisão foi pedida.
 *  Silencioso se o Resend não estiver configurado — a notificação in-app
 *  (tabela notifications) é o canal garantido, o e-mail é um extra. */
export async function sendNotificationEmail(params: {
  to: string
  recipientName: string
  clientName?: string | null
  quotationCode: string
  companyName: string
  type: NotificationType
  comment?: string | null
  dashboardUrl: string
  attachmentUrl?: string | null
}): Promise<{ error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) return { error: 'Envio de e-mail não configurado.' }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: `${params.companyName} <${from}>`,
    to: params.to,
    subject: `${SUBJECT_TEXT[params.type](params.clientName ?? 'Cliente')} ${params.quotationCode}`,
    html: buildNotificationHtml(params),
  })

  if (error) return { error: 'Não foi possível enviar o e-mail de notificação.' }
  return {}
}
