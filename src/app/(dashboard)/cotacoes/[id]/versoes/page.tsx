import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { VersionHistory, type VersionSummary } from '../quotation-history'

/**
 * Versões de uma cotação, abertas pela lista de Cotações.
 *
 * A Operação NÃO entra aqui: ela acompanha apenas a versão que lhe foi
 * encaminhada — as anteriores são negociação do Comercial com o cliente.
 */
export default async function QuotationVersionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const profile = await requireRole(['ADMIN', 'COMMERCIAL', 'OPERATION'])
  if (profile.role === 'OPERATION') redirect('/403')

  const { id } = await params
  const supabase = await createClient()

  const { data: quotation } = await supabase
    .from('quotations')
    .select('id, code, parent_id')
    .eq('id', id)
    .maybeSingle()

  if (!quotation) notFound()

  const rootId = quotation.parent_id ?? quotation.id
  const { data } = await supabase
    .from('quotations')
    .select('id, code, version, status')
    .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
    .order('version', { ascending: true })

  const versions = (data ?? []) as VersionSummary[]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/cotacoes" className="text-sm font-medium text-slate-500 hover:text-slate-700">
          ← Cotações
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Versões da cotação {quotation.code ?? ''}
        </h1>
        <p className="mt-1 text-slate-500">
          Clique em uma versão para abri-la. A mais recente é a que pode ser enviada ao cliente.
        </p>
      </div>

      {versions.length <= 1 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
          Esta cotação tem apenas uma versão.
        </div>
      ) : (
        <VersionHistory versions={versions} currentId={id} title="Todas as versões" />
      )}
    </div>
  )
}
