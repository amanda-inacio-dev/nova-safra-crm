import Link from 'next/link'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { normalizeName } from '@/lib/quotation/estimate'
import { summarizeQuotations, formatPercent, type MetricsRow } from '@/lib/dashboard/metrics'
import { collapseVersions } from '@/lib/quotation/version'
import type { QuotationStatus } from '@/types'

/**
 * "Cotações por cliente" (issue #13) — lista os clientes que têm histórico,
 * com um resumo por linha; clicar abre o histórico completo daquele cliente.
 *
 * Só aparecem clientes com pelo menos uma cotação VISÍVEL pro perfil logado
 * (a RLS já faz esse corte) — um cliente sem nenhuma cotação abriria um
 * histórico vazio, e a Operação veria a carteira inteira do Comercial.
 */

type Row = {
  id: string
  parent_id: string | null
  version: number
  client_id: string
  status: QuotationStatus
  created_at: string
  client: { name: string } | null
}

type ClientSummary = {
  id: string
  name: string
  quotations: MetricsRow[]
  lastAt: string
}

export default async function QuotationsByClientPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const profile = await requireRole(['ADMIN', 'COMMERCIAL', 'OPERATION'])
  const { q } = await searchParams
  const search = (q ?? '').trim()

  const supabase = await createClient()
  const { data } = await supabase
    .from('quotations')
    .select('id, parent_id, version, client_id, status, created_at, client:clients(name)')
    .order('created_at', { ascending: false })

  // Uma cotação com várias versões conta UMA vez por cliente.
  const rows = collapseVersions((data ?? []) as unknown as Row[])

  const byClient = new Map<string, ClientSummary>()
  for (const row of rows) {
    const existing = byClient.get(row.client_id)
    if (existing) {
      existing.quotations.push({ status: row.status, created_at: row.created_at })
      continue
    }
    byClient.set(row.client_id, {
      id: row.client_id,
      name: row.client?.name ?? 'Cliente sem cadastro visível',
      quotations: [{ status: row.status, created_at: row.created_at }],
      // A consulta já vem em ordem decrescente — a 1ª linha de cada cliente é a mais recente.
      lastAt: row.created_at,
    })
  }

  const clients = [...byClient.values()]
    .filter((client) => !search || normalizeName(client.name).includes(normalizeName(search)))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Cotações por cliente</h1>
          <p className="mt-1 text-slate-500">
            Clique em um cliente para ver o histórico completo de cotações.
          </p>
        </div>
        <Link href="/cotacoes">
          <Button variant="secondary">Lista completa</Button>
        </Link>
      </div>

      <form method="get" action="/cotacoes/por-cliente" className="flex gap-2">
        <Input name="q" defaultValue={search} placeholder="Buscar cliente" className="max-w-sm" />
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
        {search && (
          <Link
            href="/cotacoes/por-cliente"
            className="flex items-center px-3 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Limpar
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Cotações</th>
              <th className="px-4 py-3">Em aberto</th>
              <th className="px-4 py-3">Aprovadas</th>
              <th className="px-4 py-3">Recusadas</th>
              {profile.role !== 'OPERATION' && (
                <th
                  className="px-4 py-3"
                  title="Aprovadas ÷ enviadas ao cliente (as sem resposta contam)"
                >
                  Aprovação (enviadas)
                </th>
              )}
              <th className="px-4 py-3">Última cotação</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td
                  colSpan={profile.role !== 'OPERATION' ? 7 : 6}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  {search
                    ? 'Nenhum cliente encontrado para a busca.'
                    : 'Nenhum cliente com cotações ainda.'}
                </td>
              </tr>
            ) : (
              clients.map((client) => {
                const metrics = summarizeQuotations(client.quotations)
                return (
                  <tr key={client.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium">
                      <Link
                        href={`/cotacoes/por-cliente/${client.id}`}
                        className="text-brand-700 hover:text-brand-800"
                      >
                        {client.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{metrics.total}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{metrics.open}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{metrics.approved}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{metrics.rejected}</td>
                    {profile.role !== 'OPERATION' && (
                      <td
                        className="px-4 py-3 text-sm text-slate-600"
                        title={`${metrics.approved} aprovadas de ${metrics.sent} enviadas · ${formatPercent(metrics.approvalRate)} sobre as respondidas`}
                      >
                        {formatPercent(metrics.approvalRateOnSent)}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-slate-600">
                      {new Date(client.lastAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
