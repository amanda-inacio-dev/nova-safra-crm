/** Entrada de adicional que carrega valor (VALUE ou um subtipo de SUBTYPES). */
export type ValuedSelection = { value?: number | null }

/** Entrada de adicional que pode ser percentual (ex.: ICMS). */
export type PercentSelection = { value?: number | null; percent?: number | null }

/** Soma os valores dos adicionais selecionados (observações não contam). */
export function calculateAdditionalsTotal(selections: ValuedSelection[]): number {
  return selections.reduce((sum, s) => sum + (Number(s.value) || 0), 0)
}

/** Soma apenas os adicionais de valor fixo (ignora percentuais e observações).
 *  É a base sobre a qual os percentuais (ICMS) são calculados. */
export function calculateFixedAdditionalsTotal(selections: PercentSelection[]): number {
  return selections
    .filter((s) => s.percent == null)
    .reduce((sum, s) => sum + (Number(s.value) || 0), 0)
}

/** Calcula o valor de um adicional percentual sobre uma base, em reais (2 casas).
 *  Ex.: percent = 12, base = 1000 -> 120. */
export function calculatePercentValue(percent: number | null | undefined, base: number): number {
  const p = Number(percent) || 0
  return Math.round(base * p) / 100
}

/** Soma o valor de todos os adicionais percentuais aplicados sobre a base. */
export function calculatePercentAdditionalsTotal(
  selections: PercentSelection[],
  base: number
): number {
  return selections
    .filter((s) => s.percent != null)
    .reduce((sum, s) => sum + calculatePercentValue(s.percent, base), 0)
}

/** Total dos adicionais = valores fixos + percentuais (ICMS) aplicados sobre
 *  (trechos + valores fixos). */
export function calculateAdditionalsWithPercent(
  selections: PercentSelection[],
  legsTotal: number
): number {
  const fixed = calculateFixedAdditionalsTotal(selections)
  const percent = calculatePercentAdditionalsTotal(selections, legsTotal + fixed)
  return fixed + percent
}

/** Soma os valores dos trechos. */
export function calculateLegsTotal(legs: ValuedSelection[]): number {
  return legs.reduce((sum, l) => sum + (Number(l.value) || 0), 0)
}

/** Total geral = trechos + adicionais. */
export function calculateGrandTotal(legsTotal: number, additionalsTotal: number): number {
  return legsTotal + additionalsTotal
}
