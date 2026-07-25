import { describe, it, expect } from 'vitest'
import { normalizeName, round2, calculateInsurance, grossUpWithIcms } from './estimate'

describe('normalizeName', () => {
  it('remove acentos e normaliza caixa/espaços', () => {
    expect(normalizeName('  Valor para efeito do contêiner ')).toBe(
      'valor para efeito do conteiner'
    )
    expect(normalizeName('ICMS')).toBe('icms')
  })
})

describe('round2', () => {
  it('arredonda para centavos', () => {
    expect(round2(120.005)).toBe(120.01)
    expect(round2(1363.6363636)).toBe(1363.64)
  })
})

describe('calculateInsurance', () => {
  it('(mercadoria + contêiner + suspensos) × taxa%', () => {
    // (100000 + 5000 + 0) * 0.10% = 105
    expect(
      calculateInsurance({
        merchandiseValue: 100000,
        containerBase: 5000,
        suspendedTaxes: 0,
        ratePercent: 0.1,
      })
    ).toBe(105)
  })

  it('inclui impostos suspensos quando informados (DTA)', () => {
    // (100000 + 0 + 20000) * 0.15% = 180
    expect(
      calculateInsurance({
        merchandiseValue: 100000,
        containerBase: 0,
        suspendedTaxes: 20000,
        ratePercent: 0.15,
      })
    ).toBe(180)
  })

  it('retorna 0 sem taxa', () => {
    expect(
      calculateInsurance({
        merchandiseValue: 100000,
        containerBase: 5000,
        suspendedTaxes: 0,
        ratePercent: 0,
      })
    ).toBe(0)
  })
})

describe('grossUpWithIcms', () => {
  it('calcula total e ICMS por dentro (exemplo 12%)', () => {
    const { total, icmsValue } = grossUpWithIcms(10000, 12)
    expect(total).toBe(11363.64)
    expect(icmsValue).toBe(1363.64)
  })

  it('funciona para outras alíquotas (7% e 18%)', () => {
    expect(grossUpWithIcms(10000, 7).total).toBe(10752.69)
    expect(grossUpWithIcms(10000, 18).total).toBe(12195.12)
  })

  it('sem alíquota retorna a própria soma e ICMS 0', () => {
    expect(grossUpWithIcms(10000, 0)).toEqual({ total: 10000, icmsValue: 0 })
  })

  it('ignora alíquota inválida (>= 100%)', () => {
    expect(grossUpWithIcms(10000, 100)).toEqual({ total: 10000, icmsValue: 0 })
  })
})
