'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { formatQuotationCode } from '@/lib/quotation/code'
import { validateOperation } from '@/lib/quotation/operation'
import {
  calculateInsurance,
  suspendedTaxesAmount,
  CONTAINER_INSURANCE_NAME,
} from '@/lib/quotation/estimate'
import {
  summarizeQuotationGrandTotal,
  keyForSelection,
  type LegChargeInput,
} from '@/lib/quotation/summary'
import type { OperationType, Segment, VehicleType, ValueType } from '@/types'
import type { UnitBasis } from './nova/types'

type Supabase = Awaited<ReturnType<typeof createClient>>

export type QuotationAdditionalInput = {
  /** Vazio/nulo quando é um adicional manual (fora do catálogo). */
  additionalId?: string | null
  /** Nome livre de um adicional manual. */
  customName?: string | null
  subtypeId?: string | null
  /** Base do valor (ex.: Estadia por veículo/container). */
  unitBasis?: UnitBasis | null
  /** Alíquota de um adicional percentual — não usado mais para ICMS (agora por trecho). */
  percent?: number | null
  value?: number | null
  observation?: string | null
  /** Se este adicional entra no Total Estimado (padrão: true). */
  includeInTotal?: boolean
}

export type QuotationLegInput = {
  origin: string
  destination: string
  freightValue: number
  freightIncluded: boolean
  tollValue: number
  tollIncluded: boolean
  /** Alíquota de ICMS deste trecho (%) — aplicada só sobre a soma dele mesmo. */
  icmsRate: number
  /** Só usado quando a operação é DTA+DI. */
  legGroup: 'DTA' | 'DI' | null
  /** Margens esquerda (Retirada/Entrega/Retirada e entrega) lançadas neste trecho. */
  additionals: QuotationAdditionalInput[]
}

export type QuotationInput = {
  clientId: string
  sender: string
  recipient: string
  segment: Segment | ''
  product: string
  /** Texto livre, referência interna do processo do cliente. */
  processReference?: string | null
  /** Texto livre, ex.: "10 dias", "até 30/08". */
  validity?: string | null
  vehicleType: VehicleType | ''
  valueType: ValueType | ''
  operationType: OperationType | ''
  operationSubtype: string
  operationDetail: string
  emptyContainerPortId: string
  legs: QuotationLegInput[]
  /** Adicionais GERAIS da cotação (Estadia, Handling etc.) — sem ICMS/margens esquerda. */
  additionals: QuotationAdditionalInput[]
  certificationIds: string[]
  /** Valor da mercadoria (base do seguro) — opcional. */
  merchandiseValue?: number | null
  /** Taxa do seguro em % (ex.: 0.10). */
  insuranceRate?: number | null
  /** Impostos suspensos em % da mercadoria (apenas quando a operação é DTA/DTA+DI). */
  suspendedTaxesRate?: number | null
  /** Seguro entra nos trechos (valor cheio, o mesmo em todos). */
  insuranceInTotal: boolean
}

type Prepared = {
  legs: QuotationLegInput[]
  merchandiseValue: number
  insuranceRate: number
  suspendedTaxesRate: number
  suspendedTaxesValue: number
  insuranceValue: number
  totalValue: number
  icmsValueSum: number
}

/** Valida a cotação e calcula seguro/ICMS por trecho/total — compartilhado entre criar e editar. */
async function prepareQuotation(
  supabase: Supabase,
  input: QuotationInput
): Promise<{ error: string } | Prepared> {
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
  if (!op.ok) return { error: op.error ?? 'Operação inválida.' }

  const legs = input.legs.filter((l) => l.origin.trim() || l.destination.trim())
  if (legs.length === 0) return { error: 'Adicione pelo menos um trecho.' }

  // Todo adicional (geral ou por trecho) precisa referenciar o catálogo ou ter um nome (manual).
  const allAdditionalSelections = [...input.additionals, ...legs.flatMap((l) => l.additionals)]
  for (const a of allAdditionalSelections) {
    if (!a.additionalId && !a.customName?.trim()) {
      return { error: 'Informe o nome de todos os adicionais manuais.' }
    }
  }

  // --- Seguro: base do contêiner = soma do adicional geral "Valor para efeito do contêiner" ---
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

  const isDTA =
    input.operationType === 'IMPORTACAO' &&
    (input.operationSubtype === 'DTA' || input.operationSubtype === 'DTA_DI')
  const merchandiseValue = Number(input.merchandiseValue) || 0
  const insuranceRate = Number(input.insuranceRate) || 0
  const suspendedTaxesRate = isDTA ? Number(input.suspendedTaxesRate) || 0 : 0
  const suspendedTaxesValue = suspendedTaxesAmount(merchandiseValue, suspendedTaxesRate)
  const insuranceValue = calculateInsurance({
    merchandiseValue,
    suspendedTaxesRate,
    containerBase,
    ratePercent: insuranceRate,
  })

  // --- Cada trecho aplica sua própria alíquota de ICMS sobre a soma dele mesmo. Os nomes
  // dos adicionais não importam aqui (só afetam o rótulo de exibição, não o valor somado). ---
  const legChargeInputs: LegChargeInput[] = legs.map((leg) => ({
    freightValue: Number(leg.freightValue) || 0,
    freightIncluded: leg.freightIncluded,
    tollValue: Number(leg.tollValue) || 0,
    tollIncluded: leg.tollIncluded,
    additionalSelections: leg.additionals,
    additionals: [],
    insuranceValue,
    insuranceIncluded: input.insuranceInTotal,
    icmsRatePercent: Number(leg.icmsRate) || 0,
  }))

  const generalIncludeMap = Object.fromEntries(
    input.additionals.map((a) => [keyForSelection(a), a.includeInTotal ?? true])
  )
  const grand = summarizeQuotationGrandTotal({
    legs: legChargeInputs,
    generalSelections: input.additionals,
    generalAdditionals: [],
    generalIncludeMap,
  })

  const icmsValueSum = grand.legSummaries.reduce((s, l) => s + l.icmsValue, 0)

  return {
    legs,
    merchandiseValue,
    insuranceRate,
    suspendedTaxesRate,
    suspendedTaxesValue,
    insuranceValue,
    totalValue: grand.grandTotal,
    icmsValueSum,
  }
}

/** Grava trechos (+ margens esquerda de cada um), adicionais gerais e certificações. */
async function saveChildren(
  supabase: Supabase,
  quotationId: string,
  legs: QuotationLegInput[],
  generalAdditionals: QuotationAdditionalInput[],
  certificationIds: string[]
): Promise<string | null> {
  const legRows = legs.map((l, i) => ({
    quotation_id: quotationId,
    origin: l.origin,
    destination: l.destination,
    value: Number(l.freightValue) || 0,
    toll_value: Number(l.tollValue) || 0,
    icms_rate: l.icmsRate || null,
    leg_group: l.legGroup,
    freight_in_total: l.freightIncluded,
    toll_in_total: l.tollIncluded,
    leg_order: i,
  }))
  const { data: insertedLegs, error: legsError } = await supabase
    .from('quotation_legs')
    .insert(legRows)
    .select('id')
  if (legsError || !insertedLegs) return 'Não foi possível salvar os trechos.'

  const legAdditionalRows = legs.flatMap((leg, i) =>
    leg.additionals.map((a) => ({
      leg_id: insertedLegs[i].id,
      additional_id: a.additionalId || null,
      subtype_id: a.subtypeId ?? null,
      value: a.value ?? null,
      observation: a.observation?.trim() || null,
      include_in_total: a.includeInTotal ?? true,
    }))
  )
  if (legAdditionalRows.length > 0) {
    const { error } = await supabase.from('quotation_leg_additionals').insert(legAdditionalRows)
    if (error) return 'Não foi possível salvar os adicionais dos trechos.'
  }

  if (generalAdditionals.length > 0) {
    // `sort_order` guarda a ordem escolhida no formulário (migration 0031) —
    // é ela que manda no PDF. O índice do array já vem na ordem certa.
    const addRows = generalAdditionals.map((a, index) => ({
      quotation_id: quotationId,
      additional_id: a.additionalId || null,
      custom_name: a.customName?.trim() || null,
      subtype_id: a.subtypeId ?? null,
      unit_basis: a.unitBasis ?? null,
      percent: a.percent ?? null,
      value: a.value ?? null,
      observation: a.observation?.trim() || null,
      include_in_total: a.includeInTotal ?? true,
      sort_order: index,
    }))
    const { error: addError } = await supabase.from('quotation_additionals').insert(addRows)
    if (addError) return 'Não foi possível salvar os adicionais.'
  }

  if (certificationIds.length > 0) {
    const certRows = certificationIds.map((id) => ({
      quotation_id: quotationId,
      certification_id: id,
    }))
    const { error: certError } = await supabase.from('quotation_certifications').insert(certRows)
    if (certError) return 'Não foi possível salvar as certificações.'
  }

  return null
}

export async function createQuotation(input: QuotationInput): Promise<{ error?: string }> {
  const profile = await requireRole(['ADMIN', 'COMMERCIAL'])
  const supabase = await createClient()

  const prepared = await prepareQuotation(supabase, input)
  if ('error' in prepared) return { error: prepared.error }
  const {
    legs,
    merchandiseValue,
    insuranceRate,
    suspendedTaxesRate,
    suspendedTaxesValue,
    insuranceValue,
    totalValue,
    icmsValueSum,
  } = prepared

  // Número sequencial atômico + código
  const { data: seq, error: seqError } = await supabase.rpc('next_quotation_number', {
    op_type: input.operationType,
  })
  if (seqError || typeof seq !== 'number') {
    return { error: 'Não foi possível gerar o código da cotação.' }
  }
  const code = formatQuotationCode(input.operationType as OperationType, seq)

  const { data: quotation, error: qError } = await supabase
    .from('quotations')
    .insert({
      code,
      client_id: input.clientId,
      created_by: profile.id,
      status: 'RASCUNHO',
      segment: input.segment,
      product: input.product || null,
      process_reference: input.processReference?.trim() || null,
      vehicle_type: input.vehicleType,
      value_type: input.valueType,
      operation_type: input.operationType,
      operation_subtype: input.operationSubtype,
      operation_detail: input.operationDetail || null,
      empty_container_port_id: input.emptyContainerPortId || null,
      sender: input.sender || null,
      recipient: input.recipient || null,
      validity: input.validity?.trim() || null,
      merchandise_value: merchandiseValue || null,
      insurance_rate: insuranceRate || null,
      suspended_taxes_rate: suspendedTaxesRate || null,
      suspended_taxes: suspendedTaxesValue || null,
      insurance_value: insuranceValue || null,
      icms_rate: null,
      icms_value: icmsValueSum || null,
      freight_in_total: true,
      insurance_in_total: input.insuranceInTotal,
      total_value: totalValue,
    })
    .select('id')
    .single()

  if (qError || !quotation) {
    return { error: 'Não foi possível salvar a cotação.' }
  }

  const childError = await saveChildren(
    supabase,
    quotation.id,
    legs,
    input.additionals,
    input.certificationIds
  )
  if (childError) return { error: childError }

  revalidatePath('/cotacoes')
  redirect('/cotacoes')
}

export async function updateQuotation(
  quotationId: string,
  input: QuotationInput
): Promise<{ error?: string }> {
  await requireRole(['ADMIN', 'COMMERCIAL'])
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('quotations')
    .select('status')
    .eq('id', quotationId)
    .single()
  if (existing?.status === 'CONCLUIDA') {
    return { error: 'Esta cotação está concluída e não pode mais ser editada.' }
  }

  const prepared = await prepareQuotation(supabase, input)
  if ('error' in prepared) return { error: prepared.error }
  const {
    legs,
    merchandiseValue,
    insuranceRate,
    suspendedTaxesRate,
    suspendedTaxesValue,
    insuranceValue,
    totalValue,
    icmsValueSum,
  } = prepared

  const { error: qError } = await supabase
    .from('quotations')
    .update({
      client_id: input.clientId,
      segment: input.segment,
      product: input.product || null,
      process_reference: input.processReference?.trim() || null,
      vehicle_type: input.vehicleType,
      value_type: input.valueType,
      operation_type: input.operationType,
      operation_subtype: input.operationSubtype,
      operation_detail: input.operationDetail || null,
      empty_container_port_id: input.emptyContainerPortId || null,
      sender: input.sender || null,
      recipient: input.recipient || null,
      validity: input.validity?.trim() || null,
      merchandise_value: merchandiseValue || null,
      insurance_rate: insuranceRate || null,
      suspended_taxes_rate: suspendedTaxesRate || null,
      suspended_taxes: suspendedTaxesValue || null,
      insurance_value: insuranceValue || null,
      icms_rate: null,
      icms_value: icmsValueSum || null,
      insurance_in_total: input.insuranceInTotal,
      total_value: totalValue,
    })
    .eq('id', quotationId)

  if (qError) return { error: 'Não foi possível salvar as alterações.' }

  // Substitui trechos/adicionais/certificações (mais simples e confiável que calcular um diff).
  // quotation_leg_additionals é apagado em cascata junto com quotation_legs.
  await supabase.from('quotation_legs').delete().eq('quotation_id', quotationId)
  await supabase.from('quotation_additionals').delete().eq('quotation_id', quotationId)
  await supabase.from('quotation_certifications').delete().eq('quotation_id', quotationId)

  const childError = await saveChildren(
    supabase,
    quotationId,
    legs,
    input.additionals,
    input.certificationIds
  )
  if (childError) return { error: childError }

  revalidatePath('/cotacoes')
  redirect('/cotacoes')
}

export async function deleteQuotation(quotationId: string): Promise<{ error?: string }> {
  await requireRole(['ADMIN', 'COMMERCIAL'])
  const supabase = await createClient()

  const { error } = await supabase.from('quotations').delete().eq('id', quotationId)
  if (error) return { error: 'Não foi possível excluir a cotação.' }

  revalidatePath('/cotacoes')
  redirect('/cotacoes')
}
