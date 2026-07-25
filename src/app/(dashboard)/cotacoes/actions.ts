'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { formatQuotationCode } from '@/lib/quotation/code'
import { validateOperation } from '@/lib/quotation/operation'
import { calculateLegsTotal } from '@/lib/quotation/totals'
import {
  calculateInsurance,
  grossUpWithIcms,
  CONTAINER_INSURANCE_NAME,
} from '@/lib/quotation/estimate'
import type { OperationType, Segment, VehicleType, ValueType } from '@/types'
import type { UnitBasis } from './nova/types'

export type QuotationLegInput = {
  origin: string
  destination: string
  value: number
}

export type QuotationAdditionalInput = {
  /** Vazio/nulo quando é um adicional manual (fora do catálogo). */
  additionalId?: string | null
  /** Nome livre de um adicional manual. */
  customName?: string | null
  subtypeId?: string | null
  /** Base do valor (ex.: Estadia por veículo/container). */
  unitBasis?: UnitBasis | null
  /** Alíquota de um adicional percentual (ex.: ICMS = 12). */
  percent?: number | null
  value?: number | null
  observation?: string | null
  /** Se este adicional entra no Total Estimado (padrão: true). */
  includeInTotal?: boolean
}

export type QuotationInput = {
  clientId: string
  sender: string
  recipient: string
  segment: Segment | ''
  product: string
  vehicleType: VehicleType | ''
  valueType: ValueType | ''
  operationType: OperationType | ''
  operationSubtype: string
  operationDetail: string
  emptyContainerPortId: string
  legs: QuotationLegInput[]
  additionals: QuotationAdditionalInput[]
  certificationIds: string[]
  /** Valor da mercadoria (base do seguro) — opcional. */
  merchandiseValue?: number | null
  /** Taxa do seguro em % (ex.: 0.10). */
  insuranceRate?: number | null
  /** Impostos suspensos (apenas quando a operação é DTA). */
  suspendedTaxes?: number | null
  /** Frete (trechos) entra no Total Estimado. */
  freightInTotal: boolean
  /** Seguro entra no Total Estimado. */
  insuranceInTotal: boolean
}

export async function createQuotation(input: QuotationInput): Promise<{ error?: string }> {
  const profile = await requireRole(['ADMIN', 'COMMERCIAL'])

  if (!input.clientId) return { error: 'Selecione o cliente.' }
  if (!input.segment) return { error: 'Selecione o segmento.' }
  if (!input.vehicleType) return { error: 'Selecione o tipo de veículo.' }
  if (!input.valueType) return { error: 'Selecione o tipo de valor.' }
  if (input.operationType !== 'IMPORTACAO' && input.operationType !== 'EXPORTACAO') {
    return { error: 'Selecione o tipo de operação.' }
  }

  const op = validateOperation({
    operationType: input.operationType,
    subtype: input.operationSubtype,
    detail: input.operationDetail,
  })
  if (!op.ok) return { error: op.error }

  const legs = input.legs.filter((l) => l.origin.trim() || l.destination.trim())
  if (legs.length === 0) return { error: 'Adicione pelo menos um trecho.' }

  // Todo adicional precisa referenciar o catálogo ou ter um nome (manual).
  for (const a of input.additionals) {
    if (!a.additionalId && !a.customName?.trim()) {
      return { error: 'Informe o nome de todos os adicionais manuais.' }
    }
  }

  const supabase = await createClient()

  // Número sequencial atômico + código
  const { data: seq, error: seqError } = await supabase.rpc('next_quotation_number', {
    op_type: input.operationType,
  })
  if (seqError || typeof seq !== 'number') {
    return { error: 'Não foi possível gerar o código da cotação.' }
  }
  const code = formatQuotationCode(input.operationType, seq)

  // --- Seguro: base do contêiner = soma do adicional "Valor para efeito do contêiner" ---
  const { data: containerAdd } = await supabase
    .from('additionals')
    .select('id')
    .ilike('name', CONTAINER_INSURANCE_NAME)
    .maybeSingle()
  const containerBase = containerAdd
    ? input.additionals
        .filter((a) => a.additionalId === containerAdd.id)
        .reduce((s, a) => s + (Number(a.value) || 0), 0)
    : 0

  const isDTA = input.operationType === 'IMPORTACAO' && input.operationSubtype === 'DTA'
  const merchandiseValue = Number(input.merchandiseValue) || 0
  const insuranceRate = Number(input.insuranceRate) || 0
  const suspendedTaxes = isDTA ? Number(input.suspendedTaxes) || 0 : 0
  const insuranceValue = calculateInsurance({
    merchandiseValue,
    containerBase,
    suspendedTaxes,
    ratePercent: insuranceRate,
  })

  // --- Total Estimado: soma apenas os campos selecionados (exclui ICMS/percentuais) ---
  const legsTotal = calculateLegsTotal(legs)
  const freight = input.freightInTotal ? legsTotal : 0
  const includedAdditionals = input.additionals
    .filter((a) => a.percent == null && (a.includeInTotal ?? true))
    .reduce((s, a) => s + (Number(a.value) || 0), 0)
  const insurance = input.insuranceInTotal ? insuranceValue : 0
  const selectedSum = freight + includedAdditionals + insurance

  // ICMS "por dentro" sobre a soma selecionada.
  const icmsSelection = input.additionals.find(
    (a) => a.percent != null && (a.includeInTotal ?? true)
  )
  const icmsRate = icmsSelection ? Number(icmsSelection.percent) || 0 : 0
  const { total: totalValue, icmsValue } = grossUpWithIcms(selectedSum, icmsRate)

  // Resolve o valor gravado de cada adicional (ICMS recebe o valor calculado).
  const resolvedAdditionals = input.additionals.map((a) => {
    if (a.percent != null) {
      return { ...a, value: (a.includeInTotal ?? true) ? icmsValue : null }
    }
    return { ...a, value: a.value ?? null }
  })

  // Cotação
  const { data: quotation, error: qError } = await supabase
    .from('quotations')
    .insert({
      code,
      client_id: input.clientId,
      created_by: profile.id,
      status: 'RASCUNHO',
      segment: input.segment,
      product: input.product || null,
      vehicle_type: input.vehicleType,
      value_type: input.valueType,
      operation_type: input.operationType,
      operation_subtype: input.operationSubtype,
      operation_detail: input.operationDetail || null,
      empty_container_port_id: input.emptyContainerPortId || null,
      sender: input.sender || null,
      recipient: input.recipient || null,
      merchandise_value: merchandiseValue || null,
      insurance_rate: insuranceRate || null,
      suspended_taxes: suspendedTaxes || null,
      insurance_value: insuranceValue || null,
      icms_rate: icmsRate || null,
      icms_value: icmsValue || null,
      freight_in_total: input.freightInTotal,
      insurance_in_total: input.insuranceInTotal,
      total_value: totalValue,
    })
    .select('id')
    .single()

  if (qError || !quotation) {
    return { error: 'Não foi possível salvar a cotação.' }
  }

  const quotationId = quotation.id

  // Trechos
  const legRows = legs.map((l, i) => ({
    quotation_id: quotationId,
    origin: l.origin,
    destination: l.destination,
    value: Number(l.value) || 0,
    leg_order: i,
  }))
  const { error: legsError } = await supabase.from('quotation_legs').insert(legRows)
  if (legsError) return { error: 'Não foi possível salvar os trechos.' }

  // Adicionais
  if (resolvedAdditionals.length > 0) {
    const addRows = resolvedAdditionals.map((a) => ({
      quotation_id: quotationId,
      additional_id: a.additionalId || null,
      custom_name: a.customName?.trim() || null,
      subtype_id: a.subtypeId ?? null,
      unit_basis: a.unitBasis ?? null,
      percent: a.percent ?? null,
      value: a.value ?? null,
      observation: a.observation?.trim() || null,
      include_in_total: a.includeInTotal ?? true,
    }))
    const { error: addError } = await supabase.from('quotation_additionals').insert(addRows)
    if (addError) return { error: 'Não foi possível salvar os adicionais.' }
  }

  // Certificações
  if (input.certificationIds.length > 0) {
    const certRows = input.certificationIds.map((id) => ({
      quotation_id: quotationId,
      certification_id: id,
    }))
    const { error: certError } = await supabase.from('quotation_certifications').insert(certRows)
    if (certError) return { error: 'Não foi possível salvar as certificações.' }
  }

  revalidatePath('/cotacoes')
  redirect('/cotacoes')
}
