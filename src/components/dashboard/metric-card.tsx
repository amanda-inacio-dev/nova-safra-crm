import { cn } from '@/lib/utils/cn'

/** Card de indicador do Dashboard: rótulo, número grande e uma legenda curta. */
export function MetricCard({
  label,
  value,
  hint,
  accent = 'default',
}: {
  label: string
  value: string
  hint?: string
  accent?: 'default' | 'positive' | 'negative' | 'neutral'
}) {
  const accentClass = {
    default: 'text-slate-900',
    positive: 'text-emerald-600',
    negative: 'text-red-600',
    neutral: 'text-brand-700',
  }[accent]

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</p>
      <p className={cn('mt-2 text-3xl font-semibold', accentClass)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
