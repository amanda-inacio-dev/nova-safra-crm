import Link from 'next/link'
import { STATUS_LABEL, statusColorClass } from '@/lib/quotation/status-label'
import type { QuotationStatus, QuotationEventType } from '@/types'

/**
 * Blocos de "Versões" e "Histórico" da cotação.
 *
 * Ficam aqui, e não dentro do painel de revisão, porque a mesma informação é
 * mostrada em três lugares: na tela de revisar, na tela de Versões e na de
 * Histórico (abertas pela lista de cotações). Uma cópia só evita que os três
 * comecem a divergir.
 */

export type QuotationEvent = {
  type: QuotationEventType
  client_comment: string | null
  created_at: string
}

export type VersionSummary = {
  id: string
  code: string | null
  version: number
  status: QuotationStatus
}

const EVENT_LABEL: Record<QuotationEventType, string> = {
  APPROVED: 'Cliente aprovou a cotação',
  REJECTED: 'Cliente reprovou a cotação',
  COMMENTED: 'Cliente comentou',
  FORWARDED: 'Encaminhada para a Operação',
  REVISION_REQUESTED: 'Revisão solicitada',
  CLOSED: 'Processo encerrado',
}

const EVENT_BADGE_CLASS: Record<QuotationEventType, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  COMMENTED: 'bg-slate-100 text-slate-600',
  FORWARDED: 'bg-brand-50 text-brand-700',
  REVISION_REQUESTED: 'bg-amber-50 text-amber-700',
  CLOSED: 'bg-emerald-50 text-emerald-700',
}

/** Eventos que são resposta do CLIENTE — a Operação não deve enxergar. */
const CLIENT_EVENT_TYPES: QuotationEventType[] = ['APPROVED', 'REJECTED', 'COMMENTED']

export function isClientEvent(type: QuotationEventType): boolean {
  return CLIENT_EVENT_TYPES.includes(type)
}

/**
 * Remove do histórico o que é conversa com o cliente.
 * A Operação acompanha o processo interno, não a negociação comercial.
 */
export function visibleEvents(events: QuotationEvent[], forOperation: boolean): QuotationEvent[] {
  if (!forOperation) return events
  return events.filter((e) => !isClientEvent(e.type))
}

export function VersionHistory({
  versions,
  currentId,
  title = 'Histórico de versões',
}: {
  versions: VersionSummary[]
  currentId: string
  title?: string
}) {
  if (versions.length <= 1) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-800">{title}</p>
      <div className="flex flex-col gap-2">
        {versions.map((v) => (
          <Link
            key={v.id}
            href={`/cotacoes/${v.id}/revisar`}
            className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
              v.id === currentId
                ? 'border-brand-200 bg-brand-50 text-brand-800 font-medium'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>
              v{v.version} — {v.code ?? '—'}
            </span>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColorClass(v.status, false, false)}`}
            >
              {STATUS_LABEL[v.status]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function QuotationHistory({
  events,
  title = 'Histórico da cotação',
  emptyMessage,
}: {
  events: QuotationEvent[]
  title?: string
  /** Quando informado, mostra o bloco mesmo sem eventos (telas dedicadas). */
  emptyMessage?: string
}) {
  if (events.length === 0 && !emptyMessage) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-800">{title}</p>
      {events.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((e, i) => (
            <div key={i} className="flex flex-col gap-1 border-l-2 border-slate-200 pl-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${EVENT_BADGE_CLASS[e.type]}`}
                >
                  {EVENT_LABEL[e.type]}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(e.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
              {e.client_comment && <p className="text-sm text-slate-700">{e.client_comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
