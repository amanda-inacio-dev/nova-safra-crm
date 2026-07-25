import { describe, it, expect } from 'vitest'
import {
  calculateAdditionalsTotal,
  calculateFixedAdditionalsTotal,
  calculatePercentValue,
  calculatePercentAdditionalsTotal,
  calculateAdditionalsWithPercent,
  calculateLegsTotal,
  calculateGrandTotal,
} from './totals'

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

describe('calculateFixedAdditionalsTotal', () => {
  it('soma apenas os de valor fixo, ignorando percentuais', () => {
    expect(
      calculateFixedAdditionalsTotal([{ value: 150 }, { value: 300 }, { percent: 12 }, {}])
    ).toBe(450)
  })
})

describe('calculatePercentValue', () => {
  it('aplica a alíquota sobre a base (2 casas)', () => {
    expect(calculatePercentValue(12, 1000)).toBe(120)
    expect(calculatePercentValue(12, 1000.5)).toBe(120.06)
  })

  it('trata percentual nulo como zero', () => {
    expect(calculatePercentValue(null, 1000)).toBe(0)
  })
})

describe('calculatePercentAdditionalsTotal', () => {
  it('soma os percentuais aplicados sobre a base', () => {
    expect(
      calculatePercentAdditionalsTotal([{ percent: 12 }, { percent: 5 }, { value: 999 }], 1000)
    ).toBe(170)
  })
})

describe('calculateAdditionalsWithPercent', () => {
  it('percentual incide sobre trechos + adicionais de valor fixo', () => {
    // fixos = 500; base = 3500 (trechos) + 500 = 4000; ICMS 12% = 480; total = 980
    const sels = [{ value: 500 }, { percent: 12 }]
    expect(calculateAdditionalsWithPercent(sels, 3500)).toBe(980)
  })
})
