import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyUser } from '@/lib/notifications/create-notification'
import { sendNotificationEmail } from '@/lib/email/send-notification-email'
import { isEligibleForResponseAlert } from '@/lib/quotation/response-alert'
import type { QuotationStatus } from '@/types'

export const maxDuration = 60

type Candidate = {
  id: string
  code: string | null
  created_by: string
  status: QuotationStatus
  client_response_alert_enabled: boolean
  client_response_alert_days: number | null
  sent_to_client_at: string | null
  client_response_alert_sent_at: string | null
  client: { name: string } | null
}

/** Roda uma vez por dia (ver vercel.json) — avisa o comercial quando uma
 *  cotação enviada ao cliente passou do prazo configurado sem resposta
 *  (issue #16). Protegida pelo segredo do Vercel Cron: sem o header
 *  Authorization correto, a rota recusa a chamada. */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()

  const { data, error } = await admin
    .from('quotations')
    .select(
      'id, code, created_by, status, client_response_alert_enabled, client_response_alert_days, sent_to_client_at, client_response_alert_sent_at, client:clients(name)'
    )
    .eq('status', 'AGUARDANDO_CLIENTE')
    .eq('client_response_alert_enabled', true)
    .is('client_response_alert_sent_at', null)
    .not('sent_to_client_at', 'is', null)

  if (error) {
    console.error('[cron/client-response-alerts] falha ao buscar cotações:', error)
    return NextResponse.json({ error: 'Falha ao buscar cotações.' }, { status: 500 })
  }

  const candidates = (data ?? []) as unknown as Candidate[]
  let notified = 0

  for (const row of candidates) {
    // Comentário do cliente conta como resposta mesmo sem aprovar/reprovar
    // (o status só muda em APROVADA/REPROVADA) — ver issue #16.
    const { data: comments } = await admin
      .from('quotation_events')
      .select('created_at')
      .eq('quotation_id', row.id)
      .eq('type', 'COMMENTED')
      .gt('created_at', row.sent_to_client_at ?? '1970-01-01T00:00:00.000Z')
      .limit(1)

    const eligible = isEligibleForResponseAlert({
      status: row.status,
      alertEnabled: row.client_response_alert_enabled,
      alertDays: row.client_response_alert_days,
      sentToClientAt: row.sent_to_client_at,
      alertSentAt: row.client_response_alert_sent_at,
      hasClientCommentSinceSent: (comments ?? []).length > 0,
      now,
    })
    if (!eligible) continue

    try {
      await notifyUser({ userId: row.created_by, quotationId: row.id, type: 'NO_CLIENT_RESPONSE' })

      const { data: creator } = await admin
        .from('users')
        .select('name, email, active')
        .eq('id', row.created_by)
        .maybeSingle()
      if (creator?.active && creator.email) {
        const { data: settings } = await admin
          .from('app_settings')
          .select('company_name')
          .eq('id', 1)
          .single()
        await sendNotificationEmail({
          to: creator.email,
          recipientName: creator.name,
          clientName: row.client?.name ?? 'Cliente',
          quotationCode: row.code ?? '',
          companyName: settings?.company_name ?? 'Nova Safra Transportes',
          type: 'NO_CLIENT_RESPONSE',
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cotacoes/${row.id}/revisar`,
        })
      }

      // Marca como avisado mesmo se o e-mail falhar — a notificação in-app já
      // saiu, e não queremos tentar de novo amanhã (o cron roda diariamente).
      await admin
        .from('quotations')
        .update({ client_response_alert_sent_at: now.toISOString() })
        .eq('id', row.id)

      notified++
    } catch (err) {
      console.error(`[cron/client-response-alerts] falha ao notificar cotação ${row.id}:`, err)
    }
  }

  return NextResponse.json({ checked: candidates.length, notified })
}
