import Link from 'next/link'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import type { QuotationStatus } from '@/types'

const STATUS_LABEL: Record<QuotationStatus, string> = {
  RASCUNHO: 'Rascunho',
  PRONTA: 'Pronta',
  AGUARDANDO_CLIENTE: 'Aguardando cliente',
  APROVADA: 'Aprovada',
  REPROVADA: 'Reprovada',
  ENCAMINHADA: 'Encaminhada',
  CONCLUIDA: 'Concluída',
}

type Row = {
  id: string
  code: string | null
  status: QuotationStatus
  operation_type: string | null
  created_at: string
  client: { name: string } | null
}

export default async function QuotationsPage() {
  await requireRole(['ADMIN', 'COMMERCIAL'])

  const supabase = await createClient()
  const { data } = await supabase
    .from('quotations')
    .select('id, code, status, operation_type, created_at, client:clients(name)')
    .order('created_at', { ascending: false })

  const rows = (data ?? []) as unknown as Row[]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Cotações</h1>
          <p className="mt-1 text-slate-500">Cotações geradas pelo time comercial.</p>
        </div>
        <Link href="/cotacoes/nova">
          <Button>Nova cotação</Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Operação</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  Nenhuma cotação ainda. Clique em “Nova cotação” para começar.
                </td>
              </tr>
            ) : (
              rows.map((q) => (
                <tr key={q.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{q.code ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{q.client?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {q.operation_type === 'IMPORTACAO'
                      ? 'Importação'
                      : q.operation_type === 'EXPORTACAO'
                        ? 'Exportação'
                        : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {STATUS_LABEL[q.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(q.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
