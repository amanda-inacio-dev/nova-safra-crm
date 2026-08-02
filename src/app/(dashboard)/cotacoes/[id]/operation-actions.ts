'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyUser } from '@/lib/notifications/create-notification'
import { sendNotificationEmail } from '@/lib/email/send-notification-email'
import { uploadDocument } from '@/lib/storage/upload-document'

const CTE_BUCKET = 'cte-documents'

export type OperationUser = { id: string; name: string; email: string }

/** Usuários da Operação ativos — alimenta o modal "Encaminhar para Operação". */
export async function getOperationUsers(): Promise<OperationUser[]> {
  await requireRole(['ADMIN', 'COMMERCIAL'])
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('role', 'OPERATION')
    .eq('active', true)
    .order('name')
  return (data ?? []) as OperationUser[]
}

/** Encaminha uma cotação aprovada para um ou mais usuários da Operação. */
export async function forwardToOperation(
  quotationId: string,
  userIds: string[],
  message?: string
): Promise<{ error?: string }> {
  const profile = await requireRole(['ADMIN', 'COMMERCIAL'])
  if (userIds.length === 0) return { error: 'Selecione ao menos um usuário da Operação.' }

  const supabase = await createClient()
  const { data: quotation } = await supabase
    .from('quotations')
    .select('id, code, status')
    .eq('id', quotationId)
    .single()
  if (!quotation) return { error: 'Cotação não encontrada.' }
  if (quotation.status !== 'APROVADA')
    return { error: 'Só cotações aprovadas podem ser encaminhadas.' }

  const { error: updateError } = await supabase
    .from('quotations')
    .update({ status: 'ENCAMINHADA' })
    .eq('id', quotationId)
  if (updateError) return { error: 'Não foi possível encaminhar a cotação.' }

  // Grava a mensagem do Comercial no histórico (visível pros dois lados em
  // "Histórico da cotação"), não só no e-mail — registro do evento em si é só
  // um extra de auditoria, não bloqueia o fluxo principal.
  await supabase.from('quotation_events').insert({
    quotation_id: quotationId,
    type: 'FORWARDED',
    actor_id: profile.id,
    client_comment: message?.trim() || null,
  })

  const admin = createAdminClient()
  const { data: settings } = await admin
    .from('app_settings')
    .select('company_name')
    .eq('id', 1)
    .single()
  const companyName = settings?.company_name ?? 'Nova Safra Transportes'
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cotacoes/${quotationId}/revisar`

  for (const userId of userIds) {
    await notifyUser({ userId, quotationId, type: 'FORWARDED_TO_OPERATION' })
    const { data: user } = await admin
      .from('users')
      .select('name, email, active')
      .eq('id', userId)
      .maybeSingle()
    if (user?.active && user.email) {
      await sendNotificationEmail({
        to: user.email,
        recipientName: user.name,
        quotationCode: quotation.code ?? '',
        companyName,
        type: 'FORWARDED_TO_OPERATION',
        comment: message?.trim() || null,
        dashboardUrl,
      })
    }
  }

  revalidatePath(`/cotacoes/${quotationId}/revisar`)
  revalidatePath('/cotacoes')
  return {}
}

/** Operação pede pro Comercial revisar de novo — volta o status pra APROVADA. */
export async function requestRevision(
  quotationId: string,
  observation: string
): Promise<{ error?: string }> {
  const profile = await requireRole(['ADMIN', 'OPERATION'])
  const trimmed = observation.trim()
  if (!trimmed) return { error: 'Escreva uma observação explicando o que precisa ser revisado.' }

  const supabase = await createClient()
  const { data: quotation } = await supabase
    .from('quotations')
    .select('id, code, created_by, status')
    .eq('id', quotationId)
    .single()
  if (!quotation) return { error: 'Cotação não encontrada.' }
  if (quotation.status !== 'ENCAMINHADA') {
    return { error: 'Só é possível solicitar revisão de cotações encaminhadas.' }
  }

  // O evento precisa ser gravado ANTES de mudar o status: a policy de insert de
  // quotation_events pra Operação só permite enquanto a cotação ainda está
  // ENCAMINHADA — depois de virar APROVADA, o insert seria barrado pela RLS.
  const { error: eventError } = await supabase.from('quotation_events').insert({
    quotation_id: quotationId,
    type: 'REVISION_REQUESTED',
    actor_id: profile.id,
    client_comment: trimmed,
  })
  if (eventError) return { error: 'Não foi possível solicitar a revisão.' }

  // Usa a função dedicada (SECURITY DEFINER) em vez de um update direto — ver
  // migration 0023 pro motivo (a policy genérica de UPDATE não se comportou
  // como esperado nessa transição específica ENCAMINHADA -> APROVADA).
  const { error: updateError } = await supabase.rpc('operation_request_revision', {
    p_quotation_id: quotationId,
  })
  if (updateError) return { error: 'Não foi possível solicitar a revisão.' }

  const admin = createAdminClient()
  await notifyUser({ userId: quotation.created_by, quotationId, type: 'REVISION_REQUESTED' })
  const { data: creator } = await admin
    .from('users')
    .select('name, email, active')
    .eq('id', quotation.created_by)
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
      quotationCode: quotation.code ?? '',
      companyName: settings?.company_name ?? 'Nova Safra Transportes',
      type: 'REVISION_REQUESTED',
      comment: trimmed,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cotacoes/${quotationId}/revisar`,
    })
  }

  revalidatePath(`/cotacoes/${quotationId}/revisar`)
  revalidatePath('/cotacoes')
  return {}
}

export type CteAttachment = {
  id: string
  file_url: string
  file_name: string | null
  leg_group: 'DTA' | 'DI' | null
  created_at: string
}

/**
 * Anexa mais um CT-e à cotação (migration 0032).
 *
 * Uma operação pode gerar vários CT-es; numa DTA+DI eles são de etapas
 * diferentes, por isso o anexo pode ser marcado como DTA ou DI.
 */
export async function addCte(
  quotationId: string,
  formData: FormData
): Promise<{ error?: string; cte?: CteAttachment }> {
  const profile = await requireRole(['ADMIN', 'OPERATION'])

  const file = formData.get('cte')
  if (!(file instanceof File) || file.size === 0) return { error: 'Selecione o arquivo do CT-e.' }

  const rawGroup = String(formData.get('leg_group') ?? '').trim()
  const legGroup = rawGroup === 'DTA' || rawGroup === 'DI' ? rawGroup : null

  const { url, error: uploadError } = await uploadDocument(CTE_BUCKET, file, `${quotationId}/`)
  if (uploadError || !url) return { error: uploadError ?? 'Não foi possível enviar o CT-e.' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('quotation_ctes')
    .insert({
      quotation_id: quotationId,
      file_url: url,
      file_name: file.name,
      leg_group: legGroup,
      uploaded_by: profile.id,
    })
    .select('id, file_url, file_name, leg_group, created_at')
    .single()

  if (error || !data) {
    console.error('[addCte] falha ao salvar o anexo:', error)
    return { error: 'Não foi possível salvar o CT-e.' }
  }

  revalidatePath(`/cotacoes/${quotationId}/revisar`)
  return { cte: data as CteAttachment }
}

/** Remove um anexo — só quem enviou (ou um Admin), conforme a policy 0032. */
export async function deleteCte(quotationId: string, cteId: string): Promise<{ error?: string }> {
  await requireRole(['ADMIN', 'OPERATION'])

  const supabase = await createClient()
  const { error } = await supabase.from('quotation_ctes').delete().eq('id', cteId)
  if (error) {
    console.error('[deleteCte] falha ao remover o anexo:', error)
    return { error: 'Não foi possível remover o CT-e.' }
  }

  revalidatePath(`/cotacoes/${quotationId}/revisar`)
  return {}
}

/** Encerra o processo: exige pelo menos um CT-e anexado, status -> CONCLUIDA. */
export async function closeQuotation(
  quotationId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const profile = await requireRole(['ADMIN', 'OPERATION'])

  const observation = String(formData.get('observation') ?? '').trim()

  const supabase = await createClient()
  const { data: quotation } = await supabase
    .from('quotations')
    .select('id, code, created_by, status')
    .eq('id', quotationId)
    .single()
  if (!quotation) return { error: 'Cotação não encontrada.' }
  if (quotation.status !== 'ENCAMINHADA') {
    return { error: 'Só é possível encerrar cotações encaminhadas.' }
  }

  // Os CT-es agora são anexados antes (podem ser vários) — encerrar só confere
  // se existe pelo menos um.
  const { data: ctes } = await supabase
    .from('quotation_ctes')
    .select('file_url')
    .eq('quotation_id', quotationId)
    .order('created_at')

  const attached = (ctes ?? []) as { file_url: string }[]
  if (attached.length === 0) {
    return { error: 'Anexe pelo menos um CT-e antes de encerrar.' }
  }

  // `cte_url` continua guardando o primeiro anexo: é o que as telas antigas e
  // o e-mail de aviso usam como "o CT-e" da cotação.
  const { error: updateError } = await supabase
    .from('quotations')
    .update({ status: 'CONCLUIDA', cte_url: attached[0].file_url })
    .eq('id', quotationId)
  if (updateError) return { error: 'Não foi possível encerrar o processo.' }

  await supabase.from('quotation_events').insert({
    quotation_id: quotationId,
    type: 'CLOSED',
    actor_id: profile.id,
    client_comment: observation || null,
  })

  // Avisa o Comercial responsável — com o CT-e já anexado, direto no e-mail.
  const admin = createAdminClient()
  await notifyUser({ userId: quotation.created_by, quotationId, type: 'QUOTATION_CLOSED' })
  const { data: creator } = await admin
    .from('users')
    .select('name, email, active')
    .eq('id', quotation.created_by)
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
      quotationCode: quotation.code ?? '',
      companyName: settings?.company_name ?? 'Nova Safra Transportes',
      type: 'QUOTATION_CLOSED',
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cotacoes/${quotationId}/revisar`,
      // O botão do e-mail leva ao primeiro CT-e; os demais ficam na tela da cotação.
      attachmentUrl: attached[0].file_url,
    })
  }

  revalidatePath(`/cotacoes/${quotationId}/revisar`)
  revalidatePath('/cotacoes')
  return {}
}
