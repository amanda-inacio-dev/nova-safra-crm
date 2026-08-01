import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { CteAttachments } from '../revisar/cte-attachments'
import type { CteAttachment } from '../operation-actions'

/**
 * CT-es de uma cotação, abertos pela lista de Cotações.
 *
 * Só leitura: quem anexa e remove é a Operação, na tela da cotação.
 */
export default async function QuotationCtesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ADMIN', 'COMMERCIAL', 'OPERATION'])
  const { id } = await params

  const supabase = await createClient()
  const [{ data: quotation }, { data: ctesData }] = await Promise.all([
    supabase
      .from('quotations')
      .select('id, code, status, cte_url, operation_type, operation_subtype, client:clients(name)')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('quotation_ctes')
      .select('id, file_url, file_name, leg_group, created_at')
      .eq('quotation_id', id)
      .order('created_at'),
  ])

  if (!quotation) notFound()

  const ctes = (ctesData ?? []) as CteAttachment[]
  const client = quotation.client as unknown as { name: string } | null
  const isDtaDi =
    quotation.operation_type === 'IMPORTACAO' && quotation.operation_subtype === 'DTA_DI'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/cotacoes" className="text-sm font-medium text-slate-500 hover:text-slate-700">
          ← Cotações
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          CT-es da cotação {quotation.code ?? ''}
        </h1>
        <p className="mt-1 text-slate-500">{client?.name ?? 'Cliente não informado'}</p>
      </div>

      {ctes.length === 0 && quotation.cte_url ? (
        // Cotação encerrada antes da tabela de anexos existir: só o arquivo único.
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <a
            href={quotation.cte_url}
            target="_blank"
            rel="noreferrer"
            className="text-brand-700 hover:text-brand-800 font-medium"
          >
            Abrir CT-e
          </a>
        </div>
      ) : (
        <CteAttachments quotationId={id} initial={ctes} canEdit={false} isDtaDi={isDtaDi} />
      )}

      <div>
        <Link
          href={`/cotacoes/${id}/revisar`}
          className="text-brand-700 hover:text-brand-800 text-sm font-medium"
        >
          Abrir cotação →
        </Link>
      </div>
    </div>
  )
}
