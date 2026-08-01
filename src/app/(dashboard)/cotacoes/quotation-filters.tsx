import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { STATUS_LABEL } from '@/lib/quotation/status-label'
import { OPERATION_TYPE_LABEL, SEGMENT_LABEL, VEHICLE_LABEL } from '@/lib/quotation/labels'
import { hasActiveFilters, type QuotationListFilters } from '@/lib/quotation/list-filters'
import type { FilterOption } from './list-data'
import type { QuotationStatus } from '@/types'

/**
 * Barra de filtros da lista mestra — um `<form method="get">` puro: cada
 * filtro vira querystring, então a URL filtrada pode ser copiada, salva nos
 * favoritos e recarregada sem depender de estado no cliente.
 */

const STAFF_STATUSES: QuotationStatus[] = [
  'RASCUNHO',
  'PRONTA',
  'AGUARDANDO_CLIENTE',
  'APROVADA',
  'REPROVADA',
  'ENCAMINHADA',
  'CONCLUIDA',
]

/** A Operação só enxerga estes três (RLS) — e com os nomes dela. */
const OPERATION_STATUS_LABEL: Partial<Record<QuotationStatus, string>> = {
  ENCAMINHADA: 'Aberta',
  APROVADA: 'Revisão solicitada',
  CONCLUIDA: 'Concluída',
}

/**
 * Rótulo curto acima de cada filtro. Usa `<label>` puro, não o componente
 * `Label` do projeto: ele já traz text-sm/slate-700 fixos e o `cn()` daqui só
 * concatena classes (não é tailwind-merge), então o override não seria confiável.
 */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-slate-500">{label}</span>
      {children}
    </label>
  )
}

export function QuotationFilters({
  action,
  filters,
  clients,
  owners,
  forOperation,
  lockedClient = false,
}: {
  /** Para onde o formulário envia (a própria tela). */
  action: string
  filters: QuotationListFilters
  clients: FilterOption[]
  owners: FilterOption[]
  forOperation: boolean
  /** Histórico de um cliente específico: o filtro de cliente não faz sentido. */
  lockedClient?: boolean
}) {
  const statuses = forOperation
    ? (Object.keys(OPERATION_STATUS_LABEL) as QuotationStatus[])
    : STAFF_STATUSES

  return (
    <form
      method="get"
      action={action}
      className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="q"
          defaultValue={filters.q}
          placeholder="Buscar por código, cliente, origem, destino, remetente…"
          className="sm:max-w-md"
        />
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
        {hasActiveFilters(filters) && (
          <Link
            href={action}
            className="flex items-center px-3 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Limpar filtros
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {!lockedClient && (
          <Field label="Cliente">
            <Select name="cliente" defaultValue={filters.clientId}>
              <option value="">Todos</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Status">
          <Select name="status" defaultValue={filters.status}>
            <option value="">Todos</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {forOperation ? OPERATION_STATUS_LABEL[status] : STATUS_LABEL[status]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Tipo de operação">
          <Select name="operacao" defaultValue={filters.operationType}>
            <option value="">Todos</option>
            {Object.entries(OPERATION_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Veículo">
          <Select name="veiculo" defaultValue={filters.vehicleType}>
            <option value="">Todos</option>
            {Object.entries(VEHICLE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Segmento">
          <Select name="segmento" defaultValue={filters.segment}>
            <option value="">Todos</option>
            {Object.entries(SEGMENT_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Responsável">
          <Select name="responsavel" defaultValue={filters.ownerId}>
            <option value="">Todos</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="De">
          <Input type="date" name="de" defaultValue={filters.from} />
        </Field>

        <Field label="Até">
          <Input type="date" name="ate" defaultValue={filters.to} />
        </Field>
      </div>
    </form>
  )
}
