'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { formatQuotationCode } from '@/lib/quotation/code'
import { validateOperation } from '@/lib/quotation/operation'
import {
  calculateAdditionalsTotal,
  calculateLegsTotal,
  calculateGrandTotal,
} from '@/lib/quotation/totals'
import type { OperationType, Segment, VehicleType, ValueType } from '@/types'

export type QuotationLegInput = {
  origin: string
  destination: string
  value: number
}

export type QuotationAdditionalInput = {
  additionalId: string
  subtypeId?: string | null
  value?: number | null
  observation?: string | null
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

  const supabase = await createClient()

  // Número sequencial atômico + código
  const { data: seq, error: seqError } = await supabase.rpc('next_quotation_number', {
    op_type: input.operationType,
  })
  if (seqError || typeof seq !== 'number') {
    return { error: 'Não foi possível gerar o código da cotação.' }
  }
  const code = formatQuotationCode(input.operationType, seq)

  const additionalsTotal = calculateAdditionalsTotal(input.additionals)
  const legsTotal = calculateLegsTotal(legs)
  const totalValue = calculateGrandTotal(legsTotal, additionalsTotal)

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
  if (input.additionals.length > 0) {
    const addRows = input.additionals.map((a) => ({
      quotation_id: quotationId,
      additional_id: a.additionalId,
      subtype_id: a.subtypeId ?? null,
      value: a.value ?? null,
      observation: a.observation ?? null,
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
