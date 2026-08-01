import Link from 'next/link'
import { requireUser } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { MetricCard } from '@/components/dashboard/metric-card'
import { MonthlyBarChart } from '@/components/dashboard/monthly-bar-chart'
import { PeriodFilter } from '@/components/dashboard/period-filter'
import {
  resolvePeriod,
  summarizeQuotations,
  monthlyCounts,
  formatPercent,
  type MetricsRow,
} from '@/lib/dashboard/metrics'
import { collapseVersions } from '@/lib/quotation/version'

/** "1 enviada" / "6 enviadas" — as legendas dos cards mostram a conta crua. */
function plural(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}

/**
 * Dashboard (issue #13) — indicadores do período escolhido.
 *
 * Os números saem das cotações que o perfil logado enxerga (a RLS já corta):
 * a Operação vê só o que foi encaminhado pra ela, então os cards dela falam do
 * fluxo dela (recebidas/em aberto/concluídas), não de aprovação comercial.
 */
export default async function DashboardHome({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string }>
}) {
  const profile = await requireUser()
  const isOperation = profile.role === 'OPERATION'

  const { periodo, de, ate } = await searchParams
  const period = resolvePeriod({ preset: periodo, from: de, to: ate })

  const supabase = await createClient()
  const { data } = await supabase
    .from('quotations')
    .select('id, status, created_at, parent_id, version')
    .gte('created_at', period.from.toISOString())
    .lte('created_at', period.to.toISOString())

  // Uma cotação com várias versões conta UMA vez: vale o status da versão mais
  // recente, na data em que a cotação foi gerada (a da 1ª versão).
  const rows: MetricsRow[] = collapseVersions(
    (data ?? []) as (MetricsRow & { id: string; parent_id: string | null; version: number })[]
  )
  const metrics = summarizeQuotations(rows)
  const buckets = monthlyCounts(rows, period.from, period.to)

  const rangeLabel = `${period.from.toLocaleDateString('pt-BR')} a ${period.to.toLocaleDateString('pt-BR')}`

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Bem-vindo, {profile.name || profile.email}
          </h1>
          <p className="mt-1 text-slate-500">Indicadores do período: {rangeLabel}</p>
        </div>
        <Link href="/cotacoes" className="text-brand-700 hover:text-brand-800 text-sm font-medium">
          Ver todas as cotações →
        </Link>
      </div>

      <PeriodFilter period={period} />

      {isOperation ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <MetricCard label="Recebidas" value={String(metrics.total)} hint="No período" />
          <MetricCard
            label="Em aberto"
            value={String(metrics.forwarded)}
            accent="neutral"
            hint="Aguardando a Operação"
          />
          {/* A RLS (migration 0025) só mostra APROVADA pra Operação quando foi
              ela mesma que pediu a revisão — por isso esse número é exatamente
              o das cotações devolvidas pro Comercial ajustar. */}
          <MetricCard
            label="Enviadas para revisão"
            value={String(metrics.byStatus.APROVADA)}
            hint="Aguardando o Comercial ajustar"
          />
          <MetricCard label="Concluídas" value={String(metrics.concluded)} accent="positive" />
          <MetricCard
            label="Taxa de conclusão"
            value={formatPercent(metrics.conclusionRate)}
            hint="Concluídas ÷ recebidas"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="Total geradas" value={String(metrics.total)} />
          <MetricCard
            label="Em aberto"
            value={String(metrics.open)}
            hint={`${metrics.pendingClient} aguardando o cliente`}
          />
          <MetricCard label="Aprovadas" value={String(metrics.approved)} accent="positive" />
          <MetricCard label="Reprovadas" value={String(metrics.rejected)} accent="negative" />
          <MetricCard label="Concluídas" value={String(metrics.concluded)} hint="Com CT-e" />
          <MetricCard
            label="Aprovação (sobre enviadas)"
            value={formatPercent(metrics.approvalRateOnSent)}
            accent="neutral"
            hint={`${metrics.approved} de ${metrics.sent} ${plural(metrics.sent, 'enviada', 'enviadas')} — inclui as sem resposta`}
          />
          <MetricCard
            label="Aprovação (sobre respondidas)"
            value={formatPercent(metrics.approvalRate)}
            hint={`${metrics.approved} de ${metrics.decided} ${plural(metrics.decided, 'respondida', 'respondidas')}`}
          />
        </div>
      )}

      <MonthlyBarChart
        buckets={buckets}
        title={isOperation ? 'Cotações recebidas por mês' : 'Cotações geradas por mês'}
        description={rangeLabel}
      />
    </div>
  )
}
