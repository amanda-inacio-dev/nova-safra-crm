import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { ClientForm, type ClientInitial } from '../../client-form'
import { updateClientAction } from '../../actions'

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ADMIN', 'COMMERCIAL'])
  const { id } = await params

  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('id, name, contact_name, cnpj, email, phone, notes, logo_url')
    .eq('id', id)
    .single()

  if (!data) notFound()

  // Contatos adicionais (migration 0028). Enquanto a migration não for
  // aplicada, a consulta falha e a tela abre sem eles, em vez de quebrar.
  const { data: contactsData } = await supabase
    .from('client_contacts')
    .select('name, email, phone, role')
    .eq('client_id', id)
    .order('created_at')

  const initial = { ...data, contacts: contactsData ?? [] } as ClientInitial

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Editar cliente</h1>
      {/* Mais largo que antes: a lista de contatos tem 4 colunas por linha. */}
      <div className="max-w-4xl rounded-lg border border-slate-200 bg-white p-6">
        <ClientForm action={updateClientAction} initial={initial} />
      </div>
    </div>
  )
}
