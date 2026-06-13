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
    .select('id, name, contact_name, cnpj, email, phone, logo_url')
    .eq('id', id)
    .single()

  if (!data) notFound()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Editar cliente</h1>
      <ClientForm action={updateClientAction} initial={data as ClientInitial} />
    </div>
  )
}
