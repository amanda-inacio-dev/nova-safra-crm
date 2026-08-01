import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  displayStatusLabel,
  STAFF_DISPLAY_STATUSES,
  OPERATION_DISPLAY_STATUSES,
} from '@/lib/quotation/status-label'
import { OPERATION_TYPE_LABEL, SEGMENT_LABEL, VEHICLE_LABEL } from '@/lib/quotation/labels'
import { hasActiveFilters, type QuotationListFilters } from '@/lib/quotation/list-filters'
import { MultiSelectFilter } from './multi-select-filter'
import type { FilterOption } from './list-data'

/**
 * Barra de filtros da lista mestra — um `<form method="get">` puro: cada
 * filtro vira querystring, então a URL filtrada pode ser copiada, salva nos
 * favoritos e recarregada sem depender de estado no cliente.
 *
 * Todos os filtros aceitam várias opções ao mesmo tempo (caixas de seleção).
 */
function optionsFrom(map: Record<string, string>): FilterOption[] {
  return Object.entries(map).map(([id, name]) => ({ id, name }))
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
  const statusOptions = (forOperation ? OPERATION_DISPLAY_STATUSES : STAFF_DISPLAY_STATUSES).map(
    (key) => ({ id: key, name: displayStatusLabel(key, forOperation) })
  )

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
          <MultiSelectFilter
            name="cliente"
            label="Cliente"
            options={clients}
            selected={filters.clientIds}
          />
        )}

        <MultiSelectFilter
          name="status"
          label="Status"
          options={statusOptions}
          selected={filters.statuses}
        />

        <MultiSelectFilter
          name="operacao"
          label="Tipo de operação"
          options={optionsFrom(OPERATION_TYPE_LABEL)}
          selected={filters.operationTypes}
        />

        <MultiSelectFilter
          name="veiculo"
          label="Veículo"
          options={optionsFrom(VEHICLE_LABEL)}
          selected={filters.vehicleTypes}
        />

        <MultiSelectFilter
          name="segmento"
          label="Segmento"
          options={optionsFrom(SEGMENT_LABEL)}
          selected={filters.segments}
        />

        <MultiSelectFilter
          name="responsavel"
          label="Responsável"
          options={owners}
          selected={filters.ownerIds}
        />

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">De</span>
            <Input type="date" name="de" defaultValue={filters.from} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Até</span>
            <Input type="date" name="ate" defaultValue={filters.to} />
          </label>
        </div>
      </div>
    </form>
  )
}
