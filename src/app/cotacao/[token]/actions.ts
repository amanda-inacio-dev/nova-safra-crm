'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyUser } from '@/lib/notifications/create-notification'
import { sendNotificationEmail } from '@/lib/email/send-notification-email'
import type { QuotationStatus, NotificationType } from '@/types'

type QuotationForNotify = {
  id: string
  status: QuotationStatus
  code: string | null
  created_by: string
  client: { name: string } | null
}

/** Busca o essencial para validar a ação e notificar o Comercial responsável — o
 *  client_token é a única credencial aqui, não há sessão de usuário no portal público. */
async function findQuotationByToken(token: string): Promise<QuotationForNotify | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('quotations')
    .select('id, status, code, created_by, client:clients(name)')
    .eq('client_token', token)
    .maybeSingle()
  return (data as unknown as QuotationForNotify | null) ?? null
}

/** Notifica (in-app + e-mail) o Comercial que criou a cotação. Silencioso em
 *  qualquer falha — a resposta do cliente já foi registrada, isso é um extra. */
async function notifyCreator(
  quotation: QuotationForNotify,
  type: NotificationType,
  comment: string | null
): Promise<void> {
  await notifyUser({ userId: quotation.created_by, quotationId: quotation.id, type })

  const admin = createAdminClient()
  const { data: creator } = await admin
    .from('users')
    .select('name, email, active')
    .eq('id', quotation.created_by)
    .maybeSingle()
  if (!creator?.active || !creator.email) return

  const { data: settings } = await admin
    .from('app_settings')
    .select('company_name')
    .eq('id', 1)
    .single()

  await sendNotificationEmail({
    to: creator.email,
    recipientName: creator.name,
    clientName: quotation.client?.name ?? 'Cliente',
    quotationCode: quotation.code ?? '',
    companyName: settings?.company_name ?? 'Nova Safra Transportes',
    type,
    comment,
    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cotacoes/${quotation.id}/revisar`,
  })
}

/** Registra a aprovação/reprovação do cliente e avança o status da cotação.
 *  Idempotente: uma vez respondida, uma nova tentativa é rejeitada. */
export async function respondToQuotation(
  token: string,
  decision: 'APPROVED' | 'REJECTED',
  comment: string
): Promise<{ error?: string }> {
  const quotation = await findQuotationByToken(token)
  if (!quotation) return { error: 'Cotação não encontrada.' }
  if (quotation.status === 'APROVADA' || quotation.status === 'REPROVADA') {
    return { error: 'Esta cotação já foi respondida.' }
  }

  const admin = createAdminClient()
  const trimmedComment = comment.trim() || null

  const { error: eventError } = await admin.from('quotation_events').insert({
    quotation_id: quotation.id,
    type: decision,
    client_comment: trimmedComment,
  })
  if (eventError) return { error: 'Não foi possível registrar sua resposta.' }

  const { error: statusError } = await admin
    .from('quotations')
    .update({ status: decision === 'APPROVED' ? 'APROVADA' : 'REPROVADA' })
    .eq('id', quotation.id)
  if (statusError) return { error: 'Não foi possível atualizar o status da cotação.' }

  await notifyCreator(
    quotation,
    decision === 'APPROVED' ? 'CLIENT_APPROVED' : 'CLIENT_REJECTED',
    trimmedComment
  )

  revalidatePath(`/cotacao/${token}`)
  revalidatePath(`/cotacoes/${quotation.id}/revisar`)
  revalidatePath('/cotacoes')
  return {}
}

/** Registra um comentário do cliente sem alterar o status — pode ser enviado
 *  mesmo depois de já ter aprovado/reprovado (não tem restrição de idempotência). */
export async function addQuotationComment(
  token: string,
  comment: string
): Promise<{ error?: string }> {
  const trimmed = comment.trim()
  if (!trimmed) return { error: 'Escreva um comentário antes de enviar.' }

  const quotation = await findQuotationByToken(token)
  if (!quotation) return { error: 'Cotação não encontrada.' }

  const admin = createAdminClient()
  const { error } = await admin.from('quotation_events').insert({
    quotation_id: quotation.id,
    type: 'COMMENTED',
    client_comment: trimmed,
  })
  if (error) return { error: 'Não foi possível enviar o comentário.' }

  await notifyCreator(quotation, 'CLIENT_COMMENTED', trimmed)

  revalidatePath(`/cotacao/${token}`)
  revalidatePath(`/cotacoes/${quotation.id}/revisar`)
  revalidatePath('/cotacoes')
  return {}
}
