import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { QuotationForm } from './quotation-form'
import type { ClientOption, PortOption, CertOption, AdditionalOption, NameOption } from './types'

type SubtypeRow = { id: string; additional_id: string; name: string }

export default async function NewQuotationPage() {
  await requireRole(['ADMIN', 'COMMERCIAL'])

  const supabase = await createClient()
  const [
    clients,
    ports,
    additionals,
    subtypes,
    presets,
    certifications,
    senders,
    recipients,
    routeOrigins,
    routeDestinations,
  ] = await Promise.all([
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
    // Textos padrao da observacao (migration 0030) — atalhos no formulario.
    supabase
      .from('additional_presets')
      .select('additional_id, text')
      .eq('active', true)
      .order('created_at'),
    supabase.from('certifications').select('id, name, image_url').eq('active', true).order('name'),
    supabase.from('senders').select('id, name').eq('active', true).order('name'),
    supabase.from('recipients').select('id, name').eq('active', true).order('name'),
    supabase.from('route_origins').select('id, name').eq('active', true).order('name'),
    supabase.from('route_destinations').select('id, name').eq('active', true).order('name'),
  ])

  const subtypeRows = (subtypes.data ?? []) as SubtypeRow[]
  const presetRows = (presets.data ?? []) as { additional_id: string; text: string }[]
  const additionalOptions: AdditionalOption[] = (
    (additionals.data ?? []) as Omit<AdditionalOption, 'subtypes' | 'presets'>[]
  ).map((a) => ({
    ...a,
    subtypes: subtypeRows
      .filter((s) => s.additional_id === a.id)
      .map(({ id, name }) => ({ id, name })),
    presets: presetRows.filter((p) => p.additional_id === a.id).map((p) => p.text),
  }))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Nova cotação</h1>
      <QuotationForm
        clients={(clients.data ?? []) as ClientOption[]}
        ports={(ports.data ?? []) as PortOption[]}
        additionals={additionalOptions}
        certifications={(certifications.data ?? []) as CertOption[]}
        senders={(senders.data ?? []) as NameOption[]}
        recipients={(recipients.data ?? []) as NameOption[]}
        routeOrigins={(routeOrigins.data ?? []) as NameOption[]}
        routeDestinations={(routeDestinations.data ?? []) as NameOption[]}
      />
    </div>
  )
}
