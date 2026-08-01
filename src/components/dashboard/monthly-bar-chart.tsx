import type { MonthlyBucket } from '@/lib/dashboard/metrics'

/**
 * Gráfico de barras de cotações por mês — CSS puro (nenhuma biblioteca de
 * gráficos foi adicionada ao projeto por causa de uma única tela).
 *
 * Cada mês tem um "trilho" cinza de altura fixa; a barra colorida ocupa a
 * fração correspondente. Assim, mês sem cotação continua visível na régua.
 */
export function MonthlyBarChart({
  buckets,
  title,
  description,
}: {
  buckets: MonthlyBucket[]
  title: string
  description?: string
}) {
  const max = Math.max(1, ...buckets.map((b) => b.count))
  const isEmpty = buckets.every((b) => b.count === 0)

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>

      {isEmpty ? (
        <p className="py-12 text-center text-sm text-slate-500">
          Nenhuma cotação no período selecionado.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <div className="flex h-56 min-w-full items-stretch gap-2">
            {buckets.map((bucket) => (
              <div
                key={bucket.key}
                className="flex min-w-[38px] flex-1 flex-col items-center gap-1.5"
                title={`${bucket.label}: ${bucket.count}`}
              >
                <span className="text-xs font-medium text-slate-600">
                  {bucket.count > 0 ? bucket.count : ''}
                </span>
                <div className="flex w-full flex-1 items-end rounded bg-slate-100">
                  <div
                    className="bg-brand-700 w-full rounded"
                    style={{ height: `${(bucket.count / max) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] whitespace-nowrap text-slate-500">{bucket.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
