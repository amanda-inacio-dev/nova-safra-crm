import Link from 'next/link'
import { requireRole } from '@/lib/auth/require-role'
import { Button } from '@/components/ui/button'
import { QuotationFilters } from './quotation-filters'
import { QuotationsTable } from './quotations-table'
import { loadQuotationList, loadFilterOptions } from './list-data'
import { parseListFilters, hasActiveFilters } from '@/lib/quotation/list-filters'

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const profile = await requireRole(['ADMIN', 'COMMERCIAL', 'OPERATION'])
  const isOperation = profile.role === 'OPERATION'

  const filters = parseListFilters(await searchParams)
  const [rows, options] = await Promise.all([loadQuotationList(filters), loadFilterOptions()])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Cotações</h1>
          <p className="mt-1 text-slate-500">
            {isOperation
              ? 'Cotações encaminhadas para a Operação.'
              : 'Cotações geradas pelo time comercial.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/cotacoes/por-cliente">
            <Button variant="secondary">Por cliente</Button>
          </Link>
          {!isOperation && (
            <Link href="/cotacoes/nova">
              <Button>Nova cotação</Button>
            </Link>
          )}
        </div>
      </div>

      <QuotationFilters
        action="/cotacoes"
        filters={filters}
        clients={options.clients}
        owners={options.owners}
        forOperation={isOperation}
      />

      <div className="flex flex-col gap-2">
        <p className="text-sm text-slate-500">
          {rows.length} {rows.length === 1 ? 'cotação encontrada' : 'cotações encontradas'}
          {rows.some((row) => row.version > 1) && (
            <span className="text-slate-400">
              {' '}
              · cotação revisada aparece uma vez só, na versão mais recente
            </span>
          )}
        </p>
        <QuotationsTable
          rows={rows}
          forOperation={isOperation}
          emptyMessage={
            hasActiveFilters(filters)
              ? 'Nenhuma cotação encontrada com esses filtros.'
              : isOperation
                ? 'Nenhuma cotação encaminhada para a Operação ainda.'
                : 'Nenhuma cotação ainda. Clique em “Nova cotação” para começar.'
          }
        />
      </div>
    </div>
  )
}
