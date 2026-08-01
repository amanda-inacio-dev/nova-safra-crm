import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { QuotationFilters } from '../../quotation-filters'
import { QuotationsTable } from '../../quotations-table'
import { loadQuotationList, loadFilterOptions } from '../../list-data'
import { parseListFilters, hasActiveFilters } from '@/lib/quotation/list-filters'
import { summarizeQuotations, formatPercent } from '@/lib/dashboard/metrics'

/** Histórico completo de um cliente, com os mesmos filtros da lista mestra. */
export default async function ClientQuotationHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const profile = await requireRole(['ADMIN', 'COMMERCIAL', 'OPERATION'])
  const isOperation = profile.role === 'OPERATION'
  const { clientId } = await params

  const supabase = await createClient()
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, cnpj, email, phone')
    .eq('id', clientId)
    .maybeSingle()

  if (!client) notFound()

  const filters = parseListFilters(await searchParams)
  const [rows, options] = await Promise.all([
    loadQuotationList(filters, { clientId }),
    loadFilterOptions(),
  ])

  const metrics = summarizeQuotations(
    rows.map((row) => ({ status: row.status, created_at: row.createdAt }))
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/cotacoes/por-cliente"
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            ← Cotações por cliente
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">{client.name}</h1>
          <p className="mt-1 text-slate-500">
            {[client.cnpj, client.email, client.phone].filter(Boolean).join(' · ') ||
              'Histórico de cotações do cliente.'}
          </p>
        </div>
        {!isOperation && (
          <Link href={`/clientes/${client.id}/editar`}>
            <Button variant="secondary">Ver cadastro</Button>
          </Link>
        )}
      </div>

      {/* Os indicadores da Operação são outros: ela nunca vê rascunho, cliente
          nem recusa — o fluxo dela é receber, devolver pra revisão e encerrar. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <SummaryTile label="Cotações" value={String(metrics.total)} />
        {isOperation ? (
          <>
            <SummaryTile
              label="Em aberto"
              value={String(metrics.forwarded)}
              hint="Aguardando a Operação"
            />
            <SummaryTile
              label="Enviadas para revisão"
              value={String(metrics.byStatus.APROVADA)}
              hint="Aguardando o Comercial"
            />
            <SummaryTile label="Concluídas" value={String(metrics.concluded)} />
            <SummaryTile label="Taxa de conclusão" value={formatPercent(metrics.conclusionRate)} />
          </>
        ) : (
          <>
            <SummaryTile label="Em aberto" value={String(metrics.open)} />
            <SummaryTile label="Aprovadas" value={String(metrics.approved)} />
            <SummaryTile
              label="Aprovação (enviadas)"
              value={formatPercent(metrics.approvalRateOnSent)}
              hint={`${metrics.approved} de ${metrics.sent}`}
            />
            <SummaryTile
              label="Aprovação (respondidas)"
              value={formatPercent(metrics.approvalRate)}
              hint={`${metrics.approved} de ${metrics.decided}`}
            />
          </>
        )}
      </div>

      <QuotationFilters
        action={`/cotacoes/por-cliente/${client.id}`}
        filters={filters}
        clients={options.clients}
        owners={options.owners}
        senders={options.senders}
        forOperation={isOperation}
        lockedClient
      />

      <QuotationsTable
        rows={rows}
        forOperation={isOperation}
        hideClient
        emptyMessage={
          hasActiveFilters(filters)
            ? 'Nenhuma cotação encontrada com esses filtros.'
            : 'Nenhuma cotação para este cliente ainda.'
        }
      />
    </div>
  )
}

function SummaryTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
