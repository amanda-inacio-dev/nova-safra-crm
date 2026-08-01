import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { RevisarPdfPanel, type QuotationEvent, type VersionSummary } from './revisar-panel'
import { getOperationUsers, type CteAttachment } from '../operation-actions'
import { clientEmailOptions, type ClientEmailOption } from '@/lib/quotation/client-emails'
import type { QuotationStatus } from '@/types'

/**
 * Gerar o PDF sobe um Chrome headless — na Vercel isso passa fácil dos 10s
 * padrão numa execução "fria". 60s é o teto do plano Hobby e vale para todas
 * as Server Actions desta página (é aqui que o botão "Gerar PDF" vive).
 */
export const maxDuration = 60

export default async function RevisarQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const profile = await requireRole(['ADMIN', 'COMMERCIAL', 'OPERATION'])
  const { id } = await params

  const supabase = await createClient()
  const [{ data }, { data: eventsData }, { data: userRow }] = await Promise.all([
    supabase
      .from('quotations')
      .select(
        'id, code, status, pdf_url, version, parent_id, cte_url, client_id, operation_type, operation_subtype, client:clients(name, contact_name, email)'
      )
      .eq('id', id)
      .single(),
    supabase
      .from('quotation_events')
      .select('type, client_comment, created_at')
      .eq('quotation_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('users').select('signature_url').eq('id', profile.id).single(),
  ])

  if (!data) notFound()
  const events = (eventsData ?? []) as QuotationEvent[]

  const rootId = data.parent_id ?? data.id
  const { data: familyData } = await supabase
    .from('quotations')
    .select('id, code, version, status')
    .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
    .order('version', { ascending: true })
  const versions = (familyData ?? []) as VersionSummary[]

  const operationUsers =
    profile.role !== 'OPERATION' && data.status === 'APROVADA' ? await getOperationUsers() : []

  // CT-es anexados (migration 0032). Se ela ainda não foi aplicada, a consulta
  // falha e a tela abre sem a lista, em vez de quebrar.
  const { data: ctesData } = await supabase
    .from('quotation_ctes')
    .select('id, file_url, file_name, leg_group, created_at')
    .eq('quotation_id', id)
    .order('created_at')
  const ctes = (ctesData ?? []) as CteAttachment[]
  const isDtaDi = data.operation_type === 'IMPORTACAO' && data.operation_subtype === 'DTA_DI'

  // Destinatários possíveis: contato principal + adicionais (migration 0028).
  // A Operação não envia cotação ao cliente, então nem carrega essa lista.
  const client = data.client as unknown as {
    name: string
    contact_name: string | null
    email: string | null
  } | null
  let clientEmails: ClientEmailOption[] = []
  if (profile.role !== 'OPERATION') {
    const { data: contactsData } = await supabase
      .from('client_contacts')
      .select('name, email, role')
      .eq('client_id', data.client_id)
      .order('created_at')
    clientEmails = clientEmailOptions(client ?? {}, contactsData ?? [])
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Revisar cotação {data.code}</h1>
        <p className="mt-1 text-slate-500">
          {profile.role === 'OPERATION'
            ? 'Confira o documento e siga com o processo.'
            : 'Gere o PDF, confira o resultado e confirme para avançar a cotação.'}
        </p>
      </div>

      <RevisarPdfPanel
        quotationId={data.id}
        status={data.status as QuotationStatus}
        initialPdfUrl={data.pdf_url}
        events={events}
        initialSignatureUrl={userRow?.signature_url ?? null}
        version={data.version}
        versions={versions}
        role={profile.role}
        cteUrl={data.cte_url}
        operationUsers={operationUsers}
        clientEmails={clientEmails}
        ctes={ctes}
        isDtaDi={isDtaDi}
      />
    </div>
  )
}
