/** Entrada de adicional que carrega valor (VALUE ou um subtipo de SUBTYPES). */
export type ValuedSelection = { value?: number | null }

/** Soma os valores dos adicionais selecionados (observações não contam). */
export function calculateAdditionalsTotal(selections: ValuedSelection[]): number {
  return selections.reduce((sum, s) => sum + (Number(s.value) || 0), 0)
}

/** Soma os valores dos trechos. */
export function calculateLegsTotal(legs: ValuedSelection[]): number {
  return legs.reduce((sum, l) => sum + (Number(l.value) || 0), 0)
}

/** Total geral = trechos + adicionais. */
export function calculateGrandTotal(legsTotal: number, additionalsTotal: number): number {
  return legsTotal + additionalsTotal
}
