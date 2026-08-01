import { QuotationRow } from './quotation-row'
import { ClientResponseBadge } from './client-response-badge'
import { statusDisplayLabel, statusColorClass } from '@/lib/quotation/status-label'
import { OPERATION_TYPE_LABEL, SEGMENT_LABEL, VEHICLE_LABEL, labelOf } from '@/lib/quotation/labels'
import type { QuotationListRow } from './list-data'

/**
 * Tabela da lista mestra (issue #13) — usada em /cotacoes e no histórico por
 * cliente. São muitas colunas, então a tabela rola na horizontal em telas
 * estreitas em vez de espremer o texto.
 */
export function QuotationsTable({
  rows,
  forOperation,
  emptyMessage,
  hideClient = false,
}: {
  rows: QuotationListRow[]
  forOperation: boolean
  emptyMessage: string
  /** No histórico de um cliente, repetir o nome dele em toda linha é ruído. */
  hideClient?: boolean
}) {
  const columns = hideClient ? 9 : 10

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[1100px]">
        <thead>
          <tr className="bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
            <th className="px-4 py-3">Código</th>
            {!hideClient && <th className="px-4 py-3">Cliente</th>}
            <th className="px-4 py-3">Origem</th>
            <th className="px-4 py-3">Destino</th>
            <th className="px-4 py-3">Operação</th>
            <th className="px-4 py-3">Veículo</th>
            <th className="px-4 py-3">Segmento</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Responsável</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns} className="px-4 py-8 text-center text-sm text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <QuotationRow key={row.id} id={row.id} target={forOperation ? 'revisar' : 'editar'}>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.code ?? '—'}</td>
                {!hideClient && (
                  <td className="px-4 py-3 text-sm text-slate-600">{row.clientName ?? '—'}</td>
                )}
                <td className="px-4 py-3 text-sm text-slate-600" title={row.route ?? undefined}>
                  {row.origin || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600" title={row.route ?? undefined}>
                  {row.destination || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {labelOf(OPERATION_TYPE_LABEL, row.operationType)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {labelOf(VEHICLE_LABEL, row.vehicleType)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {labelOf(SEGMENT_LABEL, row.segment)}
                </td>
                <td className="px-4 py-3">
                  <ClientResponseBadge
                    statusLabel={statusDisplayLabel(row.status, row.hasBeenRevised, forOperation)}
                    colorClass={statusColorClass(row.status, row.hasBeenRevised, forOperation)}
                    latestComment={row.latestComment}
                  />
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap text-slate-600">
                  {new Date(row.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{row.ownerName ?? '—'}</td>
              </QuotationRow>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
