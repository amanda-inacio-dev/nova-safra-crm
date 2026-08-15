import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { AdditionalsManager, type Additional } from './additionals-manager'
import type { Subtype } from './subtypes-manager'
import { PortsManager, type Port } from './ports-manager'
import { CertificationsManager, type Certification } from './certifications-manager'
import { SettingsForm, type AppSettings } from './settings-form'
import { SimpleCatalogManager, type CatalogItem } from './simple-catalog-manager'

type SubtypeRow = Subtype & { additional_id: string }
type PresetRow = { id: string; additional_id: string; text: string }

export default async function AdminConfigPage() {
  await requireRole(['ADMIN'])

  const supabase = await createClient()
  const [
    additionals,
    subtypes,
    ports,
    certifications,
    settings,
    senders,
    recipients,
    routeOrigins,
    routeDestinations,
    presets,
  ] = await Promise.all([
    supabase
      .from('additionals')
      .select('id, name, input_type, has_unit_basis, active')
      .order('name'),
    supabase
      .from('additional_subtypes')
      .select('id, additional_id, name, active')
      .order('created_at'),
    supabase.from('ports').select('id, name, active').order('name'),
    supabase.from('certifications').select('id, name, image_url, active').order('name'),
    supabase.from('app_settings').select('company_name, logo_url').eq('id', 1).single(),
    supabase.from('senders').select('id, name, active').order('name'),
    supabase.from('recipients').select('id, name, active').order('name'),
    supabase.from('route_origins').select('id, name, active').order('name'),
    supabase.from('route_destinations').select('id, name, active').order('name'),
    // Textos padrão de observação (migration 0030). Se ela ainda não foi
    // aplicada, a consulta falha e a tela abre sem os atalhos, sem quebrar.
    supabase.from('additional_presets').select('id, additional_id, text').order('created_at'),
  ])

  const subtypeRows = (subtypes.data ?? []) as SubtypeRow[]
  const presetRows = (presets.data ?? []) as PresetRow[]
  const additionalsWithSubtypes: Additional[] = (
    (additionals.data ?? []) as Omit<Additional, 'subtypes' | 'presets'>[]
  ).map((a) => ({
    ...a,
    subtypes: subtypeRows
      .filter((s) => s.additional_id === a.id)
      .map(({ id, name, active }) => ({ id, name, active })),
    presets: presetRows
      .filter((p) => p.additional_id === a.id)
      .map(({ id, text }) => ({ id, text })),
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Configurações da Cotação</h1>
        <p className="mt-1 text-slate-500">
          Listas de domínio usadas nas cotações e dados gerais da empresa.
        </p>
      </div>

      <AdditionalsManager items={additionalsWithSubtypes} />
      <PortsManager items={(ports.data ?? []) as Port[]} />
      <CertificationsManager items={(certifications.data ?? []) as Certification[]} />

      <SimpleCatalogManager
        table="senders"
        title="Remetentes"
        description="Sugestões para o campo Remetente da cotação — não impede digitar um nome novo."
        placeholder="Ex.: Fazenda Boa Vista"
        emptyLabel="Nenhum remetente cadastrado."
        items={(senders.data ?? []) as CatalogItem[]}
      />
      <SimpleCatalogManager
        table="recipients"
        title="Destinatários"
        description="Sugestões para o campo Destinatário da cotação — não impede digitar um nome novo."
        placeholder="Ex.: Indústria Café Forte"
        emptyLabel="Nenhum destinatário cadastrado."
        items={(recipients.data ?? []) as CatalogItem[]}
      />
      <SimpleCatalogManager
        table="route_origins"
        title="Origens"
        description="Sugestões para o campo Origem de cada trecho — não impede digitar um endereço novo."
        placeholder="Ex.: Santos/SP"
        emptyLabel="Nenhuma origem cadastrada."
        items={(routeOrigins.data ?? []) as CatalogItem[]}
      />
      <SimpleCatalogManager
        table="route_destinations"
        title="Destinos"
        description="Sugestões para o campo Destino de cada trecho — não impede digitar um endereço novo."
        placeholder="Ex.: Varginha/MG"
        emptyLabel="Nenhum destino cadastrado."
        items={(routeDestinations.data ?? []) as CatalogItem[]}
      />

      <SettingsForm
        settings={(settings.data ?? { company_name: '', logo_url: null }) as AppSettings}
      />
    </div>
  )
}
