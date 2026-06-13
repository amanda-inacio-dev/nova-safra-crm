import { describe, it, expect } from 'vitest'
import { calculateAdditionalsTotal, calculateLegsTotal, calculateGrandTotal } from './totals'

describe('calculateAdditionalsTotal', () => {
  it('soma os valores e ignora nulos/observações', () => {
    expect(calculateAdditionalsTotal([{ value: 150 }, { value: 300 }, { value: null }, {}])).toBe(
      450
    )
  })

  it('retorna 0 para lista vazia', () => {
    expect(calculateAdditionalsTotal([])).toBe(0)
  })
})

describe('calculateLegsTotal', () => {
  it('soma os valores dos trechos', () => {
    expect(calculateLegsTotal([{ value: 1000 }, { value: 2500.5 }])).toBe(3500.5)
  })
})

describe('calculateGrandTotal', () => {
  it('soma trechos + adicionais', () => {
    expect(calculateGrandTotal(3500, 450)).toBe(3950)
  })
})
