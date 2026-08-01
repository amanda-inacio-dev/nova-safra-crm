import { createClient } from '@/lib/supabase/server'
import { OPERATION_LABELS } from '@/lib/quotation/operation'
import {
  SEGMENT_LABEL,
  VEHICLE_LABEL,
  VALUE_TYPE_LABEL,
  OPERATION_TYPE_LABEL,
} from '@/lib/quotation/labels'
import {
  calculateInsurance,
  suspendedTaxesAmount,
  CONTAINER_INSURANCE_NAME,
} from '@/lib/quotation/estimate'
import {
  summarizeQuotationGrandTotal,
  keyForSelection,
  type AdditionalNameLookup,
  type SummaryAdditional,
  type LegChargeInput,
  type TotalLine,
} from '@/lib/quotation/summary'

/** Detalhe da operação: DTA usa um código traduzível; os demais subtipos guardam texto livre. */
function operationDetailLabel(subtype: string | null, detail: string | null): string | null {
  if (!detail) return null
  if (subtype === 'DTA' || subtype === 'DTA_DI') return OPERATION_LABELS[detail] ?? detail
  return detail
}

export type QuotationPdfLegSummary = {
  origin: string
  destination: string
  legGroup: 'DTA' | 'DI' | null
  /** Linhas que compõem a base deste trecho (Frete, Pedágio, margens marcadas, Seguro). */
  lines: TotalLine[]
  base: number
  icmsRatePercent: number
  icmsValue: number
  /** Base + ICMS — o total deste trecho. */
  total: number
}
export type QuotationPdfCertification = { name: string; imageUrl: string }
export type QuotationPdfAdditionalLine = {
  label: string
  observation: string | null
  value: number | null
  includeInTotal: boolean
}

export type QuotationPdfData = {
  id: string
  code: string
  version: number
  companyName: string
  companyLogoUrl: string | null
  clientName: string
  clientLogoUrl: string | null
  sender: string | null
  recipient: string | null
  segment: string | null
  product: string | null
  processReference: string | null
  vehicleType: string
  valueType: string
  operationType: string
  operationSubtypeLabel: string | null
  operationDetailLabel: string | null
  emptyContainerPortName: string | null
  validity: string | null
  createdAt: string
  /** Um bloco por trecho — cada um já com sua própria base e ICMS aplicados. */
  legs: QuotationPdfLegSummary[]
  /** Soma dos totais de cada trecho (cada um já com o próprio ICMS). */
  legsTotal: number
  /** Adicionais gerais marcados para entrar no total (sem ICMS — não pertencem a um trecho). */
  generalIncludedLines: TotalLine[]
  generalSum: number
  /** legsTotal + generalSum. */
  grandTotal: number
  /** Adicionais gerais (todos os selecionados) + os de trecho com valor/observação.
   *  O template mostra os que não somam no total ("Observações e adicionais"). */
  additionalLines: QuotationPdfAdditionalLine[]
  certifications: QuotationPdfCertification[]
  merchandiseValue: number
  insuranceRate: number
  isDTA: boolean
  suspendedTaxesRate: number
  suspendedTaxesValue: number
  insuranceValue: number
}

type QuotationRow = {
  id: string
  code: string | null
  version: number
  sender: string | null
  recipient: string | null
  segment: string | null
  product: string | null
  process_reference: string | null
  validity: string | null
  created_at: string
  merchandise_value: number | null
  insurance_rate: number | null
  suspended_taxes_rate: number | null
  insurance_in_total: boolean
  vehicle_type: string | null
  value_type: string | null
  operation_type: string | null
  operation_subtype: string | null
  operation_detail: string | null
  client: { name: string; logo_url: string | null } | null
  empty_container_port: { name: string } | null
}

type LegRow = {
  id: string
  origin: string | null
  destination: string | null
  value: number
  toll_value: number
  icms_rate: number | null
  leg_group: 'DTA' | 'DI' | null
  freight_in_total: boolean
  toll_in_total: boolean
}

type LegAdditionalRow = {
  leg_id: string
  additional_id: string | null
  subtype_id: string | null
  value: number | null
  observation: string | null
  include_in_total: boolean
  additional: { name: string } | null
}

type AdditionalRow = {
  additional_id: string | null
  custom_name: string | null
  subtype_id: string | null
  percent: number | null
  value: number | null
  observation: string | null
  include_in_total: boolean
  additional: { name: string } | null
}

type CertificationRow = {
  certification: { name: string; image_url: string | null } | null
}

/** Carrega e monta todos os dados de uma cotação, já resolvidos para exibição no PDF. */
export async function getQuotationPdfData(quotationId: string): Promise<QuotationPdfData | null> {
  const supabase = await createClient()

  const [quotationRes, legsRes, addRes, certRes, settingsRes] = await Promise.all([
    supabase
      .from('quotations')
      .select(
        `id, code, version, sender, recipient, segment, product, process_reference, validity, created_at,
         merchandise_value, insurance_rate, suspended_taxes_rate, insurance_in_total,
         vehicle_type, value_type, operation_type, operation_subtype, operation_detail,
         client:clients(name, logo_url),
         empty_container_port:ports(name)`
      )
      .eq('id', quotationId)
      .single(),
    supabase
      .from('quotation_legs')
      .select(
        'id, origin, destination, value, toll_value, icms_rate, leg_group, freight_in_total, toll_in_total'
      )
      .eq('quotation_id', quotationId)
      .order('leg_order'),
    supabase
      .from('quotation_additionals')
      .select(
        'additional_id, custom_name, subtype_id, percent, value, observation, include_in_total, additional:additionals(name)'
      )
      .eq('quotation_id', quotationId),
    supabase
      .from('quotation_certifications')
      .select('certification:certifications(name, image_url)')
      .eq('quotation_id', quotationId),
    supabase.from('app_settings').select('company_name, logo_url').eq('id', 1).single(),
  ])

  const q = quotationRes.data as unknown as QuotationRow | null
  if (!q) return null

  const legRows = (legsRes.data ?? []) as LegRow[]
  const legIds = legRows.map((l) => l.id)
  const { data: legAddData } =
    legIds.length > 0
      ? await supabase
          .from('quotation_leg_additionals')
          .select(
            'leg_id, additional_id, subtype_id, value, observation, include_in_total, additional:additionals(name)'
          )
          .in('leg_id', legIds)
      : { data: [] as LegAdditionalRow[] }
  const legAddRows = (legAddData ?? []) as unknown as LegAdditionalRow[]

  const addRows = (addRes.data ?? []) as unknown as AdditionalRow[]

  // Nomes dos subtipos (para discriminar "Adicional · Subtipo" no PDF) — gerais + por trecho.
  const subtypeIds = [...addRows, ...legAddRows]
    .map((r) => r.subtype_id)
    .filter((id): id is string => Boolean(id))
  const subtypeNames = new Map<string, string>()
  if (subtypeIds.length > 0) {
    const { data: subtypeRows } = await supabase
      .from('additional_subtypes')
      .select('id, name')
      .in('id', subtypeIds)
    for (const s of (subtypeRows ?? []) as { id: string; name: string }[]) {
      subtypeNames.set(s.id, s.name)
    }
  }

  // Catálogo de nomes (id -> nome/subtipos), compartilhado entre adicionais gerais e por trecho.
  const additionalsLookup: AdditionalNameLookup[] = [...addRows, ...legAddRows]
    .filter((r) => r.additional_id)
    .reduce<AdditionalNameLookup[]>((acc, r) => {
      const id = r.additional_id as string
      let entry = acc.find((a) => a.id === id)
      if (!entry) {
        entry = { id, name: r.additional?.name ?? 'Adicional', subtypes: [] }
        acc.push(entry)
      }
      if (r.subtype_id && !entry.subtypes.some((s) => s.id === r.subtype_id)) {
        entry.subtypes.push({ id: r.subtype_id, name: subtypeNames.get(r.subtype_id) ?? 'Item' })
      }
      return acc
    }, [])

  const containerAdd = additionalsLookup.find(
    (a) => a.name.trim().toLowerCase() === CONTAINER_INSURANCE_NAME.trim().toLowerCase()
  )
  const containerBase = addRows
    .filter((r) => r.additional_id === containerAdd?.id)
    .reduce((s, r) => s + (Number(r.value) || 0), 0)

  const isDTA =
    q.operation_type === 'IMPORTACAO' &&
    (q.operation_subtype === 'DTA' || q.operation_subtype === 'DTA_DI')
  const merchandiseValue = Number(q.merchandise_value) || 0
  const insuranceRate = Number(q.insurance_rate) || 0
  const suspendedTaxesRate = isDTA ? Number(q.suspended_taxes_rate) || 0 : 0
  const suspendedTaxesValue = suspendedTaxesAmount(merchandiseValue, suspendedTaxesRate)
  const insuranceValue = calculateInsurance({
    merchandiseValue,
    suspendedTaxesRate,
    containerBase,
    ratePercent: insuranceRate,
  })

  // Cada trecho aplica sua própria alíquota de ICMS sobre a soma dele mesmo (Frete + Pedágio +
  // margens marcadas + Seguro cheio). O total geral soma todos os trechos + adicionais gerais.
  const legChargeInputs: LegChargeInput[] = legRows.map((l) => ({
    freightValue: Number(l.value) || 0,
    freightIncluded: l.freight_in_total,
    tollValue: Number(l.toll_value) || 0,
    tollIncluded: l.toll_in_total,
    additionalSelections: legAddRows
      .filter((r) => r.leg_id === l.id)
      .map(
        (r): SummaryAdditional => ({
          additionalId: r.additional_id,
          subtypeId: r.subtype_id,
          value: r.value,
          includeInTotal: r.include_in_total,
        })
      ),
    additionals: additionalsLookup,
    insuranceValue,
    insuranceIncluded: q.insurance_in_total,
    icmsRatePercent: Number(l.icms_rate) || 0,
  }))

  const generalSelections: SummaryAdditional[] = addRows.map((r) => ({
    additionalId: r.additional_id,
    customName: r.custom_name,
    subtypeId: r.subtype_id,
    percent: r.percent,
    value: r.value,
    includeInTotal: r.include_in_total,
  }))
  const generalIncludeMap = Object.fromEntries(
    generalSelections.map((s) => [keyForSelection(s), s.includeInTotal ?? true])
  )

  const grand = summarizeQuotationGrandTotal({
    legs: legChargeInputs,
    generalSelections,
    generalAdditionals: additionalsLookup,
    generalIncludeMap,
  })

  const legs: QuotationPdfLegSummary[] = legRows.map((l, i) => ({
    origin: l.origin ?? '',
    destination: l.destination ?? '',
    legGroup: l.leg_group,
    lines: grand.legSummaries[i].lines,
    base: grand.legSummaries[i].base,
    icmsRatePercent: grand.legSummaries[i].icmsRatePercent,
    icmsValue: grand.legSummaries[i].icmsValue,
    total: grand.legSummaries[i].total,
  }))

  // Linhas para "Observações e adicionais (se aplicáveis)": gerais + por trecho.
  // TODO adicional geral selecionado entra aqui, inclusive os que não têm valor
  // nenhum (Escolta, Prazo/Forma de pagamento…) e mesmo sem observação escrita —
  // se a pessoa marcou na cotação, o cliente precisa ver. Só os do tipo percentual
  // (ICMS) ficam de fora: eles pertencem ao cálculo de cada trecho.
  const generalAdditionalLines: QuotationPdfAdditionalLine[] = addRows
    .filter((r) => r.percent == null)
    .map((r) => ({
      label: r.custom_name
        ? r.custom_name
        : r.subtype_id
          ? `${r.additional?.name ?? 'Adicional'} · ${subtypeNames.get(r.subtype_id) ?? 'Item'}`
          : (r.additional?.name ?? 'Adicional'),
      observation: r.observation,
      value: r.value != null ? Number(r.value) : null,
      includeInTotal: r.include_in_total ?? true,
    }))
  const legAdditionalLines: QuotationPdfAdditionalLine[] = legAddRows
    .filter((r) => (Number(r.value) || 0) !== 0 || r.observation)
    .map((r) => {
      const legIndex = legRows.findIndex((l) => l.id === r.leg_id)
      const subLabel = r.subtype_id
        ? `${r.additional?.name ?? 'Adicional'} · ${subtypeNames.get(r.subtype_id) ?? 'Item'}`
        : (r.additional?.name ?? 'Adicional')
      return {
        label: `Trecho ${legIndex + 1}: ${subLabel}`,
        observation: r.observation,
        value: r.value != null ? Number(r.value) : null,
        includeInTotal: r.include_in_total ?? true,
      }
    })
  const additionalLines = [...legAdditionalLines, ...generalAdditionalLines]

  const certRows = (certRes.data ?? []) as unknown as CertificationRow[]
  const certifications: QuotationPdfCertification[] = certRows
    .map((c) => c.certification)
    .filter((c): c is { name: string; image_url: string } => Boolean(c?.image_url))
    .map((c) => ({ name: c.name, imageUrl: c.image_url }))

  const settings = settingsRes.data as {
    company_name: string | null
    logo_url: string | null
  } | null

  return {
    id: q.id,
    code: q.code ?? '',
    version: q.version,
    companyName: settings?.company_name ?? 'Nova Safra Gestão Logística',
    companyLogoUrl: settings?.logo_url ?? null,
    clientName: q.client?.name ?? '',
    clientLogoUrl: q.client?.logo_url ?? null,
    sender: q.sender,
    recipient: q.recipient,
    segment: q.segment ? (SEGMENT_LABEL[q.segment] ?? q.segment) : null,
    product: q.product,
    processReference: q.process_reference,
    vehicleType: q.vehicle_type ? (VEHICLE_LABEL[q.vehicle_type] ?? q.vehicle_type) : '',
    valueType: q.value_type ? (VALUE_TYPE_LABEL[q.value_type] ?? q.value_type) : '',
    operationType: q.operation_type
      ? (OPERATION_TYPE_LABEL[q.operation_type] ?? q.operation_type)
      : '',
    operationSubtypeLabel: q.operation_subtype
      ? (OPERATION_LABELS[q.operation_subtype] ?? q.operation_subtype)
      : null,
    operationDetailLabel: operationDetailLabel(q.operation_subtype, q.operation_detail),
    emptyContainerPortName: q.empty_container_port?.name ?? null,
    validity: q.validity,
    createdAt: q.created_at,
    legs,
    legsTotal: grand.legsTotal,
    generalIncludedLines: grand.generalIncludedLines,
    generalSum: grand.generalSum,
    grandTotal: grand.grandTotal,
    additionalLines,
    certifications,
    merchandiseValue,
    insuranceRate,
    isDTA,
    suspendedTaxesRate,
    suspendedTaxesValue,
    insuranceValue,
  }
}
