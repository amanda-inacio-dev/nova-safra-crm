import { grossUpWithIcms, normalizeName } from './estimate'

/** Forma mínima de uma seleção de adicional, usada só para montar o resumo do total. */
export type SummaryAdditional = {
  additionalId?: string | null
  customName?: string | null
  subtypeId?: string | null
  percent?: number | null
  value?: number | null
  includeInTotal?: boolean
}

/** Forma mínima do catálogo de adicionais, só para resolver nomes de exibição. */
export type AdditionalNameLookup = {
  id: string
  name: string
  subtypes: { id: string; name: string }[]
}

export type TotalLine = { key: string; label: string; value: number }

/** Chave estável de uma seleção — usada tanto para achar seu nome quanto seu flag "incluir no total". */
export function keyForSelection(sel: SummaryAdditional): string {
  if (sel.percent != null) return 'icms'
  if (sel.subtypeId && sel.additionalId) return `sub:${sel.additionalId}:${sel.subtypeId}`
  if (sel.additionalId) return `add:${sel.additionalId}`
  return `manual:${sel.customName ?? ''}`
}

/** Dentro do mesmo adicional (ex.: cada margem esquerda), Frete sempre antes do Pedágio —
 *  independente da ordem em que foram gravados no banco. Outros subtipos não são afetados. */
const SUBTYPE_ORDER_PRIORITY: Record<string, number> = { frete: 0, pedagio: 1 }

function subtypeNameOf(sel: SummaryAdditional, additionals: AdditionalNameLookup[]): string {
  if (!sel.subtypeId || !sel.additionalId) return ''
  const add = additionals.find((a) => a.id === sel.additionalId)
  return add?.subtypes.find((s) => s.id === sel.subtypeId)?.name ?? ''
}

/** Ordena preservando a ordem de primeira aparição de cada adicional (grupo), mas
 *  garantindo Frete antes de Pedágio dentro do mesmo grupo. */
function orderSelections(
  selections: SummaryAdditional[],
  additionals: AdditionalNameLookup[]
): SummaryAdditional[] {
  const groupKeyOf = (sel: SummaryAdditional) =>
    sel.additionalId ?? `manual:${sel.customName ?? ''}`
  const groupOrder: string[] = []
  for (const sel of selections) {
    const gk = groupKeyOf(sel)
    if (!groupOrder.includes(gk)) groupOrder.push(gk)
  }
  return [...selections].sort((a, b) => {
    const groupDiff = groupOrder.indexOf(groupKeyOf(a)) - groupOrder.indexOf(groupKeyOf(b))
    if (groupDiff !== 0) return groupDiff
    const pa = SUBTYPE_ORDER_PRIORITY[normalizeName(subtypeNameOf(a, additionals))] ?? 50
    const pb = SUBTYPE_ORDER_PRIORITY[normalizeName(subtypeNameOf(b, additionals))] ?? 50
    return pa - pb
  })
}

/** Uma linha por valor de adicional (cada subtipo marcado vira sua própria linha). Ignora ICMS/percentuais. */
export function buildAdditionalLines(
  selections: SummaryAdditional[],
  additionals: AdditionalNameLookup[]
): TotalLine[] {
  const result: TotalLine[] = []
  for (const sel of orderSelections(selections, additionals)) {
    if (sel.percent != null) continue
    const value = Number(sel.value) || 0
    if (value === 0) continue
    if (sel.subtypeId && sel.additionalId) {
      const add = additionals.find((a) => a.id === sel.additionalId)
      const subName = add?.subtypes.find((s) => s.id === sel.subtypeId)?.name ?? 'Item'
      result.push({
        key: keyForSelection(sel),
        label: add ? `${add.name} · ${subName}` : subName,
        value,
      })
    } else if (sel.additionalId) {
      const label = additionals.find((a) => a.id === sel.additionalId)?.name ?? 'Adicional'
      result.push({ key: keyForSelection(sel), label, value })
    } else if (sel.customName) {
      result.push({ key: keyForSelection(sel), label: sel.customName, value })
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// Cálculo por trecho — Frete, Pedágio, margens esquerda e ICMS são POR TRECHO;
// cada trecho aplica sua PRÓPRIA alíquota de ICMS só sobre a soma dele mesmo.
// O Seguro (valor único, calculado uma vez para a cotação) é somado INTEIRO em
// cada trecho (não é dividido entre eles) — confirmado com a usuária.
// ---------------------------------------------------------------------------

export type LegChargeInput = {
  freightValue: number
  freightIncluded: boolean
  tollValue: number
  tollIncluded: boolean
  /** Seleções de margem esquerda (Retirada/Entrega/Retirada e entrega) deste trecho. */
  additionalSelections: SummaryAdditional[]
  additionals: AdditionalNameLookup[]
  /** Valor do seguro da cotação (o mesmo valor entra em todos os trechos). */
  insuranceValue: number
  insuranceIncluded: boolean
  /** Alíquota de ICMS deste trecho (%). */
  icmsRatePercent: number
}

export type LegChargeSummary = {
  /** Linhas que entram na base deste trecho (antes do ICMS). */
  lines: TotalLine[]
  /** Têm valor lançado neste trecho, mas foram desmarcadas (não entram na base). */
  excludedLines: TotalLine[]
  /** Soma das linhas incluídas, antes do ICMS. */
  base: number
  icmsRatePercent: number
  icmsValue: number
  /** Base + ICMS (o total deste trecho, "por dentro"). */
  total: number
}

/** Resume os lançamentos de UM trecho e aplica a alíquota de ICMS dele sobre a base. */
export function summarizeLegCharges(input: LegChargeInput): LegChargeSummary {
  const lines: TotalLine[] = []
  const excludedLines: TotalLine[] = []

  if (input.freightValue !== 0) {
    const line: TotalLine = { key: 'leg-freight', label: 'Frete', value: input.freightValue }
    ;(input.freightIncluded ? lines : excludedLines).push(line)
  }
  if (input.tollValue !== 0) {
    const line: TotalLine = { key: 'leg-toll', label: 'Pedágio', value: input.tollValue }
    ;(input.tollIncluded ? lines : excludedLines).push(line)
  }

  const additionalLines = buildAdditionalLines(input.additionalSelections, input.additionals)
  for (const line of additionalLines) {
    const sel = input.additionalSelections.find((s) => keyForSelection(s) === line.key)
    const included = sel?.includeInTotal ?? true
    ;(included ? lines : excludedLines).push(line)
  }

  if (input.insuranceValue > 0) {
    const line: TotalLine = { key: 'leg-insurance', label: 'Seguro', value: input.insuranceValue }
    ;(input.insuranceIncluded ? lines : excludedLines).push(line)
  }

  const base = lines.reduce((s, l) => s + l.value, 0)
  const { total, icmsValue } = grossUpWithIcms(base, input.icmsRatePercent)

  return { lines, excludedLines, base, icmsRatePercent: input.icmsRatePercent, icmsValue, total }
}

export type QuotationGrandTotal = {
  legSummaries: LegChargeSummary[]
  /** Soma dos totais de cada trecho (cada um já com o próprio ICMS aplicado). */
  legsTotal: number
  /** Adicionais gerais da cotação (não ligados a um trecho) que foram marcados. */
  generalIncludedLines: TotalLine[]
  /** Adicionais gerais com valor lançado, mas desmarcados — só aparecem como referência. */
  generalExcludedLines: TotalLine[]
  /** Soma dos adicionais gerais marcados (sem ICMS — não pertencem a nenhum trecho). */
  generalSum: number
  /** legsTotal + generalSum. */
  grandTotal: number
}

/**
 * Combina os trechos (cada um já com seu próprio ICMS) com os adicionais gerais da
 * cotação (Estadia, Handling etc. — sem ICMS adicional, pois não pertencem a um
 * trecho específico). Adicionais gerais desmarcados não entram na soma, só aparecem
 * como referência em "Adicionais, se aplicáveis".
 */
export function summarizeQuotationGrandTotal(params: {
  legs: LegChargeInput[]
  generalSelections: SummaryAdditional[]
  generalAdditionals: AdditionalNameLookup[]
  generalIncludeMap: Record<string, boolean>
}): QuotationGrandTotal {
  const legSummaries = params.legs.map(summarizeLegCharges)
  const legsTotal = legSummaries.reduce((s, l) => s + l.total, 0)

  const included = (key: string) => params.generalIncludeMap[key] ?? true
  const generalLines = buildAdditionalLines(params.generalSelections, params.generalAdditionals)
  const generalIncludedLines = generalLines.filter((l) => included(l.key))
  const generalExcludedLines = generalLines.filter((l) => !included(l.key))
  const generalSum = generalIncludedLines.reduce((s, l) => s + l.value, 0)

  return {
    legSummaries,
    legsTotal,
    generalIncludedLines,
    generalExcludedLines,
    generalSum,
    grandTotal: legsTotal + generalSum,
  }
}
