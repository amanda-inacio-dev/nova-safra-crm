'use server'

import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import {
  nextVersionNumber,
  rootQuotationId,
  buildNewVersionInsert,
  type InheritableQuotationFields,
} from '@/lib/quotation/version'

type Supabase = Awaited<ReturnType<typeof createClient>>

type PreviousQuotationRow = InheritableQuotationFields & {
  id: string
  code: string | null
  version: number
  parent_id: string | null
  status: string
}

type LegRow = {
  id: string
  origin: string | null
  destination: string | null
  value: number
  toll_value: number
  icms_rate: number | null
  leg_group: string | null
  freight_in_total: boolean
  toll_in_total: boolean
  leg_order: number
}

type LegAdditionalRow = {
  leg_id: string
  additional_id: string | null
  subtype_id: string | null
  value: number | null
  observation: string | null
  include_in_total: boolean
}

type AdditionalRow = {
  additional_id: string | null
  custom_name: string | null
  subtype_id: string | null
  unit_basis: string | null
  percent: number | null
  value: number | null
  observation: string | null
  include_in_total: boolean
}

/** Clona trechos (+ adicionais de cada trecho), adicionais gerais e certificações
 *  da cotação anterior para a nova versão — mesmo padrão de saveChildren em actions.ts. */
async function cloneChildren(
  supabase: Supabase,
  oldId: string,
  newId: string
): Promise<string | null> {
  const [legsRes, additionalsRes, certsRes] = await Promise.all([
    supabase
      .from('quotation_legs')
      .select(
        'id, origin, destination, value, toll_value, icms_rate, leg_group, freight_in_total, toll_in_total, leg_order'
      )
      .eq('quotation_id', oldId)
      .order('leg_order'),
    supabase
      .from('quotation_additionals')
      .select(
        'additional_id, custom_name, subtype_id, unit_basis, percent, value, observation, include_in_total'
      )
      .eq('quotation_id', oldId),
    supabase.from('quotation_certifications').select('certification_id').eq('quotation_id', oldId),
  ])

  const legs = (legsRes.data ?? []) as LegRow[]
  if (legs.length > 0) {
    const legRows = legs.map((l) => ({
      quotation_id: newId,
      origin: l.origin,
      destination: l.destination,
      value: l.value,
      toll_value: l.toll_value,
      icms_rate: l.icms_rate,
      leg_group: l.leg_group,
      freight_in_total: l.freight_in_total,
      toll_in_total: l.toll_in_total,
      leg_order: l.leg_order,
    }))
    const { data: insertedLegs, error: legsError } = await supabase
      .from('quotation_legs')
      .insert(legRows)
      .select('id')
    if (legsError || !insertedLegs) return 'Não foi possível copiar os trechos.'

    const legIdMap = new Map<string, string>()
    legs.forEach((old, i) => legIdMap.set(old.id, insertedLegs[i].id))

    const { data: legAddsData } = await supabase
      .from('quotation_leg_additionals')
      .select('leg_id, additional_id, subtype_id, value, observation, include_in_total')
      .in(
        'leg_id',
        legs.map((l) => l.id)
      )
    const legAdds = (legAddsData ?? []) as LegAdditionalRow[]
    if (legAdds.length > 0) {
      const legAddRows = legAdds.map((a) => ({
        leg_id: legIdMap.get(a.leg_id),
        additional_id: a.additional_id,
        subtype_id: a.subtype_id,
        value: a.value,
        observation: a.observation,
        include_in_total: a.include_in_total,
      }))
      const { error: laError } = await supabase.from('quotation_leg_additionals').insert(legAddRows)
      if (laError) return 'Não foi possível copiar os adicionais dos trechos.'
    }
  }

  const additionals = (additionalsRes.data ?? []) as AdditionalRow[]
  if (additionals.length > 0) {
    const addRows = additionals.map((a) => ({
      quotation_id: newId,
      additional_id: a.additional_id,
      custom_name: a.custom_name,
      subtype_id: a.subtype_id,
      unit_basis: a.unit_basis,
      percent: a.percent,
      value: a.value,
      observation: a.observation,
      include_in_total: a.include_in_total,
    }))
    const { error: addError } = await supabase.from('quotation_additionals').insert(addRows)
    if (addError) return 'Não foi possível copiar os adicionais.'
  }

  const certs = (certsRes.data ?? []) as { certification_id: string }[]
  if (certs.length > 0) {
    const certRows = certs.map((c) => ({
      quotation_id: newId,
      certification_id: c.certification_id,
    }))
    const { error: certError } = await supabase.from('quotation_certifications').insert(certRows)
    if (certError) return 'Não foi possível copiar as certificações.'
  }

  return null
}

/** Cria uma nova versão (v2, v3...) a partir de uma cotação APROVADA ou REPROVADA —
 *  herda todos os dados como pré-preenchimento, mas reinicia status/PDF/token do zero. */
export async function createNewVersion(quotationId: string): Promise<{ error?: string }> {
  const profile = await requireRole(['ADMIN', 'COMMERCIAL'])
  const supabase = await createClient()

  const { data: previous } = await supabase
    .from('quotations')
    .select(
      `id, code, version, parent_id, status, client_id, sender, recipient, segment, product,
       process_reference, validity, merchandise_value, vehicle_type, value_type, operation_type,
       operation_subtype, operation_detail, empty_container_port_id, insurance_rate,
       suspended_taxes_rate, insurance_in_total, total_value`
    )
    .eq('id', quotationId)
    .single()

  const prev = previous as PreviousQuotationRow | null
  if (!prev) return { error: 'Cotação não encontrada.' }
  if (prev.status !== 'APROVADA' && prev.status !== 'REPROVADA') {
    return { error: 'Só é possível criar uma nova versão de cotações aprovadas ou reprovadas.' }
  }

  const rootId = rootQuotationId(prev)

  const { data: family } = await supabase
    .from('quotations')
    .select('version')
    .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
  const newVersion = nextVersionNumber(
    ((family ?? []) as { version: number }[]).map((f) => f.version)
  )

  const inherited: InheritableQuotationFields = {
    client_id: prev.client_id,
    sender: prev.sender,
    recipient: prev.recipient,
    segment: prev.segment,
    product: prev.product,
    process_reference: prev.process_reference,
    validity: prev.validity,
    merchandise_value: prev.merchandise_value,
    vehicle_type: prev.vehicle_type,
    value_type: prev.value_type,
    operation_type: prev.operation_type,
    operation_subtype: prev.operation_subtype,
    operation_detail: prev.operation_detail,
    empty_container_port_id: prev.empty_container_port_id,
    insurance_rate: prev.insurance_rate,
    suspended_taxes_rate: prev.suspended_taxes_rate,
    insurance_in_total: prev.insurance_in_total,
    total_value: prev.total_value,
  }

  const insertPayload = buildNewVersionInsert({
    inherited,
    previousCode: prev.code ?? '',
    newVersion,
    rootId,
    createdBy: profile.id,
  })

  const { data: created, error: insertError } = await supabase
    .from('quotations')
    .insert(insertPayload)
    .select('id')
    .single()
  if (insertError || !created) return { error: 'Não foi possível criar a nova versão.' }

  const cloneError = await cloneChildren(supabase, quotationId, created.id)
  if (cloneError) return { error: cloneError }

  redirect(`/cotacoes/${created.id}/editar`)
}
