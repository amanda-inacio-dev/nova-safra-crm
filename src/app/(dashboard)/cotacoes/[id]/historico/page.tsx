import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { QuotationHistory, visibleEvents, type QuotationEvent } from '../quotation-history'
import {
  statusDisplayLabel,
  statusColorClass,
  hasRevisionEvent,
} from '@/lib/quotation/status-label'
import type { QuotationStatus } from '@/types'

/** Histórico completo de uma cotação, aberto pela lista de Cotações. */
export default async function QuotationHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const profile = await requireRole(['ADMIN', 'COMMERCIAL', 'OPERATION'])
  const isOperation = profile.role === 'OPERATION'
  const { id } = await params

  const supabase = await createClient()
  const [{ data: quotation }, { data: eventsData }] = await Promise.all([
    supabase
      .from('quotations')
      .select('id, code, status, created_at, client:clients(name)')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('quotation_events')
      .select('type, client_comment, created_at')
      .eq('quotation_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!quotation) notFound()

  const allEvents = (eventsData ?? []) as QuotationEvent[]
  // A Operação não vê aprovação/reprovação/comentário do cliente.
  const events = visibleEvents(allEvents, isOperation)
  const client = quotation.client as unknown as { name: string } | null
  const status = quotation.status as QuotationStatus

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/cotacoes" className="text-sm font-medium text-slate-500 hover:text-slate-700">
          ← Cotações
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Histórico da cotação {quotation.code ?? ''}
        </h1>
        <p className="mt-1 text-slate-500">
          {client?.name ?? 'Cliente não informado'} · criada em{' '}
          {new Date(quotation.created_at).toLocaleDateString('pt-BR')}
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <span className="text-sm text-slate-500">Status atual</span>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColorClass(status, hasRevisionEvent(allEvents), isOperation)}`}
        >
          {statusDisplayLabel(status, hasRevisionEvent(allEvents), isOperation)}
        </span>
        <Link
          href={`/cotacoes/${id}/revisar`}
          className="text-brand-700 hover:text-brand-800 ml-auto text-sm font-medium"
        >
          Abrir cotação →
        </Link>
      </div>

      <QuotationHistory
        events={events}
        title="Linha do tempo"
        emptyMessage="Nada registrado ainda. Os eventos aparecem quando a cotação é enviada, respondida pelo cliente, encaminhada ou encerrada."
      />
    </div>
  )
}
