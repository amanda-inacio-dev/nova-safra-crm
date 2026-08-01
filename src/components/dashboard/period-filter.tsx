import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { PERIOD_LABEL, type Period, type PeriodPreset } from '@/lib/dashboard/metrics'

const PRESETS: PeriodPreset[] = ['MES', 'TRIMESTRE', 'ANO']

/**
 * Filtro de período do Dashboard: atalhos (mês/trimestre/ano) como links e um
 * intervalo personalizado como formulário GET. Tudo vira querystring, então os
 * indicadores recarregam do servidor já filtrados, sem estado no cliente.
 */
export function PeriodFilter({ period }: { period: Period }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const active = period.preset === preset
          return (
            <Link
              key={preset}
              href={`/?periodo=${preset}`}
              className={cn(
                'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-brand-700 bg-brand-700 text-white'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              )}
            >
              {PERIOD_LABEL[preset]}
            </Link>
          )
        })}
      </div>

      <form method="get" action="/" className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="periodo" value="PERSONALIZADO" />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500" htmlFor="periodo-de">
            De
          </label>
          <Input id="periodo-de" type="date" name="de" defaultValue={period.fromInput} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500" htmlFor="periodo-ate">
            Até
          </label>
          <Input id="periodo-ate" type="date" name="ate" defaultValue={period.toInput} />
        </div>
        <Button type="submit" variant={period.preset === 'PERSONALIZADO' ? 'primary' : 'secondary'}>
          Aplicar
        </Button>
      </form>
    </div>
  )
}
