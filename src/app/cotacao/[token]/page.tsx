import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/admin'
import { ClientPortalPanel } from './client-portal-panel'
import type { QuotationStatus } from '@/types'

type QuotationRow = {
  code: string | null
  status: QuotationStatus
  pdf_url: string | null
  client: { name: string } | null
}

export default async function ClientPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const [{ data: quotation }, { data: settings }] = await Promise.all([
    admin
      .from('quotations')
      .select('code, status, pdf_url, client:clients(name)')
      .eq('client_token', token)
      .maybeSingle(),
    admin.from('app_settings').select('company_name, logo_url').eq('id', 1).single(),
  ])

  if (!quotation) notFound()

  const q = quotation as unknown as QuotationRow
  const companyName = settings?.company_name ?? 'Nova Safra Transportes'

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center bg-gradient-to-br from-[#123822] to-[#1f5c39] px-4 py-10">
      {/* Largura generosa: o PDF é o conteúdo principal desta tela e precisa
          caber com folga para o cliente ler sem apertar os olhos. */}
      <div className="w-full max-w-6xl">
        <div className="mb-6 flex flex-col items-center">
          <div className="rounded-xl bg-white p-3 shadow-lg">
            {settings?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL vem do Storage, não é um asset local
              <img src={settings.logo_url} alt={companyName} className="h-12 w-auto" />
            ) : (
              <Image
                src="/assets/logo-nova-safra.jpeg"
                alt={companyName}
                width={160}
                height={64}
                priority
                className="h-12 w-auto"
              />
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-xl sm:p-8">
          <h1 className="text-xl font-semibold text-slate-900">
            Cotação {q.code} — {companyName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Olá, {q.client?.name ?? 'cliente'}! Registre sua resposta abaixo — o documento completo
            está logo em seguida.
          </p>

          <ClientPortalPanel token={token} status={q.status} pdfUrl={q.pdf_url} />
        </div>

        <p className="mt-6 text-center text-xs text-white/70">
          {companyName} — Sistema de Cotações
        </p>
      </div>
    </div>
  )
}
