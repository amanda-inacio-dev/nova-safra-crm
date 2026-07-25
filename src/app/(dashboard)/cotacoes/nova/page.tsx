import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { QuotationForm } from './quotation-form'
import type { ClientOption, PortOption, CertOption, AdditionalOption } from './types'

type SubtypeRow = { id: string; additional_id: string; name: string }

export default async function NewQuotationPage() {
  await requireRole(['ADMIN', 'COMMERCIAL'])

  const supabase = await createClient()
  const [clients, ports, additionals, subtypes, certifications] = await Promise.all([
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('ports').select('id, name').eq('active', true).order('name'),
    supabase
      .from('additionals')
      .select('id, name, input_type, has_unit_basis')
      .eq('active', true)
      .order('name'),
    supabase
      .from('additional_subtypes')
      .select('id, additional_id, name')
      .eq('active', true)
      .order('created_at'),
    supabase.from('certifications').select('id, name, image_url').eq('active', true).order('name'),
  ])

  const subtypeRows = (subtypes.data ?? []) as SubtypeRow[]
  const additionalOptions: AdditionalOption[] = (
    (additionals.data ?? []) as Omit<AdditionalOption, 'subtypes'>[]
  ).map((a) => ({
    ...a,
    subtypes: subtypeRows
      .filter((s) => s.additional_id === a.id)
      .map(({ id, name }) => ({ id, name })),
  }))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Nova cotação</h1>
      <QuotationForm
        clients={(clients.data ?? []) as ClientOption[]}
        ports={(ports.data ?? []) as PortOption[]}
        additionals={additionalOptions}
        certifications={(certifications.data ?? []) as CertOption[]}
      />
    </div>
  )
}
