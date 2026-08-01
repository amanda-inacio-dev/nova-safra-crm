import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { QuotationForm, type QuotationInitial } from '../../nova/quotation-form'
import { emptyLeg, type LegRow, type LegGroup } from '../../nova/legs-editor'
import { DeleteQuotationButton } from './delete-button'
import type {
  ClientOption,
  PortOption,
  CertOption,
  AdditionalOption,
  UnitBasis,
  NameOption,
} from '../../nova/types'
import type { QuotationAdditionalInput } from '../../actions'
import type { OperationType, Segment, VehicleType, ValueType, QuotationStatus } from '@/types'

type SubtypeRow = { id: string; additional_id: string; name: string }

type QuotationRow = {
  id: string
  code: string | null
  status: QuotationStatus
  client_id: string
  sender: string | null
  recipient: string | null
  segment: Segment | null
  product: string | null
  process_reference: string | null
  validity: string | null
  merchandise_value: number | null
  vehicle_type: VehicleType | null
  value_type: ValueType | null
  operation_type: OperationType | null
  operation_subtype: string | null
  operation_detail: string | null
  empty_container_port_id: string | null
  insurance_rate: number | null
  suspended_taxes_rate: number | null
  insurance_in_total: boolean
}

type LegDbRow = {
  id: string
  origin: string | null
  destination: string | null
  value: number
  toll_value: number
  icms_rate: number | null
  leg_group: LegGroup | null
  freight_in_total: boolean
  toll_in_total: boolean
}

type LegAdditionalDbRow = {
  leg_id: string
  additional_id: string | null
  subtype_id: string | null
  value: number | null
  observation: string | null
  include_in_total: boolean
}

type AdditionalDbRow = {
  additional_id: string | null
  custom_name: string | null
  subtype_id: string | null
  unit_basis: UnitBasis | null
  percent: number | null
  value: number | null
  observation: string | null
  include_in_total: boolean
}

export default async function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ADMIN', 'COMMERCIAL'])
  const { id } = await params

  const supabase = await createClient()
  const [
    quotationRes,
    legsRes,
    additionalsRes,
    certsRes,
    clientsRes,
    portsRes,
    additionalsCatalogRes,
    subtypesRes,
    presetsRes,
    certOptionsRes,
    sendersRes,
    recipientsRes,
    routeOriginsRes,
    routeDestinationsRes,
  ] = await Promise.all([
    supabase
      .from('quotations')
      .select(
        'id, code, status, client_id, sender, recipient, segment, product, process_reference, validity, merchandise_value, vehicle_type, value_type, operation_type, operation_subtype, operation_detail, empty_container_port_id, insurance_rate, suspended_taxes_rate, insurance_in_total'
      )
      .eq('id', id)
      .single(),
    supabase
      .from('quotation_legs')
      .select(
        'id, origin, destination, value, toll_value, icms_rate, leg_group, freight_in_total, toll_in_total, leg_order'
      )
      .eq('quotation_id', id)
      .order('leg_order'),
    supabase
      .from('quotation_additionals')
      .select(
        'additional_id, custom_name, subtype_id, unit_basis, percent, value, observation, include_in_total'
      )
      .eq('quotation_id', id)
      // Reabre o formulário na ordem que a pessoa deixou salva (migration 0031).
      .order('sort_order'),
    supabase.from('quotation_certifications').select('certification_id').eq('quotation_id', id),
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

  const quotation = quotationRes.data as QuotationRow | null
  if (!quotation) notFound()

  const legRows = (legsRes.data ?? []) as LegDbRow[]
  const legIds = legRows.map((l) => l.id)
  const { data: legAdditionalsData } =
    legIds.length > 0
      ? await supabase
          .from('quotation_leg_additionals')
          .select('leg_id, additional_id, subtype_id, value, observation, include_in_total')
          .in('leg_id', legIds)
      : { data: [] as LegAdditionalDbRow[] }
  const legAdditionalRows = (legAdditionalsData ?? []) as LegAdditionalDbRow[]

  const legs: LegRow[] =
    legRows.length > 0
      ? legRows.map((l) => ({
          origin: l.origin ?? '',
          destination: l.destination ?? '',
          freightValue: String(l.value ?? ''),
          freightIncluded: l.freight_in_total,
          tollValue: String(l.toll_value ?? ''),
          tollIncluded: l.toll_in_total,
          icmsRate: l.icms_rate != null ? String(l.icms_rate) : '',
          legGroup: l.leg_group ?? '',
          additionals: legAdditionalRows
            .filter((a) => a.leg_id === l.id)
            .map((a) => ({
              additionalId: a.additional_id,
              subtypeId: a.subtype_id,
              value: a.value,
              observation: a.observation,
              includeInTotal: a.include_in_total,
            })),
        }))
      : [emptyLeg()]

  const additionalRows = (additionalsRes.data ?? []) as AdditionalDbRow[]
  const additionalsInitial: QuotationAdditionalInput[] = additionalRows.map((a) => ({
    additionalId: a.additional_id,
    customName: a.custom_name,
    subtypeId: a.subtype_id,
    unitBasis: a.unit_basis,
    percent: a.percent,
    value: a.value,
    observation: a.observation,
    includeInTotal: a.include_in_total,
  }))

  const certificationIds = ((certsRes.data ?? []) as { certification_id: string }[]).map(
    (c) => c.certification_id
  )

  const subtypeRows = (subtypesRes.data ?? []) as SubtypeRow[]
  const presetRows = (presetsRes.data ?? []) as { additional_id: string; text: string }[]
  const additionalOptions: AdditionalOption[] = (
    (additionalsCatalogRes.data ?? []) as Omit<AdditionalOption, 'subtypes' | 'presets'>[]
  ).map((a) => ({
    ...a,
    subtypes: subtypeRows
      .filter((s) => s.additional_id === a.id)
      .map(({ id, name }) => ({ id, name })),
    presets: presetRows.filter((p) => p.additional_id === a.id).map((p) => p.text),
  }))

  // Reconstrói quais adicionais GERAIS estavam marcados no Total Estimado (os campos
  // de cada trecho já trazem seu próprio "incluído" direto nas colunas/linhas dele).
  const includeMap: Record<string, boolean> = {}
  for (const a of additionalsInitial) {
    const key =
      a.subtypeId && a.additionalId
        ? `sub:${a.additionalId}:${a.subtypeId}`
        : a.additionalId
          ? `add:${a.additionalId}`
          : `manual:${a.customName ?? ''}`
    includeMap[key] = a.includeInTotal ?? true
  }

  const initial: QuotationInitial = {
    clientId: quotation.client_id,
    sender: quotation.sender ?? '',
    recipient: quotation.recipient ?? '',
    segment: quotation.segment ?? '',
    product: quotation.product ?? '',
    processReference: quotation.process_reference ?? '',
    validity: quotation.validity ?? '',
    merchandiseValue:
      quotation.merchandise_value != null ? String(quotation.merchandise_value) : '',
    operation: {
      operationType: quotation.operation_type ?? '',
      subtype: quotation.operation_subtype ?? '',
      detail: quotation.operation_detail ?? '',
    },
    vehicleType: quotation.vehicle_type ?? '',
    valueType: quotation.value_type ?? '',
    legs,
    portId: quotation.empty_container_port_id ?? '',
    additionals: additionalsInitial,
    certificationIds,
    insuranceRate: quotation.insurance_rate != null ? String(quotation.insurance_rate) : '',
    suspendedTaxesRate:
      quotation.suspended_taxes_rate != null ? String(quotation.suspended_taxes_rate) : '',
    insuranceIncluded: quotation.insurance_in_total,
    includeMap,
  }

  const isReadOnly = quotation.status === 'CONCLUIDA'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          Editar cotação {quotation.code ?? ''}
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href={`/cotacoes/${quotation.id}/revisar`}
            className="text-brand-700 hover:text-brand-800 text-sm font-medium"
          >
            Gerar PDF →
          </Link>
          {!isReadOnly && <DeleteQuotationButton quotationId={quotation.id} />}
        </div>
      </div>

      {isReadOnly && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Esta cotação está <strong>concluída</strong> e é somente-leitura — não é mais possível
          alterá-la.
        </div>
      )}

      <QuotationForm
        readOnly={isReadOnly}
        clients={(clientsRes.data ?? []) as ClientOption[]}
        ports={(portsRes.data ?? []) as PortOption[]}
        additionals={additionalOptions}
        certifications={(certOptionsRes.data ?? []) as CertOption[]}
        senders={(sendersRes.data ?? []) as NameOption[]}
        recipients={(recipientsRes.data ?? []) as NameOption[]}
        routeOrigins={(routeOriginsRes.data ?? []) as NameOption[]}
        routeDestinations={(routeDestinationsRes.data ?? []) as NameOption[]}
        quotationId={quotation.id}
        initial={initial}
      />
    </div>
  )
}
