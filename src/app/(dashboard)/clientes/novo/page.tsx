import { requireRole } from '@/lib/auth/require-role'
import { ClientForm } from '../client-form'
import { createClientAction } from '../actions'

export default async function NewClientPage() {
  await requireRole(['ADMIN', 'COMMERCIAL'])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Novo cliente</h1>
      <ClientForm action={createClientAction} />
    </div>
  )
}
