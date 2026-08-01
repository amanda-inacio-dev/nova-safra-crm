import { describe, it, expect } from 'vitest'
import {
  normalizeName,
  round2,
  suspendedTaxesAmount,
  insuranceMerchandiseValue,
  calculateInsurance,
  grossUpWithIcms,
} from './estimate'

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

describe('suspendedTaxesAmount', () => {
  it('mercadoria × alíquota%', () => {
    expect(suspendedTaxesAmount(100000, 20)).toBe(20000)
    expect(suspendedTaxesAmount(100000, 0)).toBe(0)
  })
})

describe('insuranceMerchandiseValue', () => {
  it('mercadoria + impostos suspensos (% da mercadoria)', () => {
    // 100000 + (100000 × 20%) = 120000
    expect(insuranceMerchandiseValue(100000, 20)).toBe(120000)
    // sem impostos suspensos = a própria mercadoria
    expect(insuranceMerchandiseValue(100000, 0)).toBe(100000)
  })
})

describe('calculateInsurance', () => {
  it('(mercadoria + contêiner) × taxa%, sem impostos suspensos', () => {
    // (100000 + 5000) * 0.10% = 105
    expect(
      calculateInsurance({
        merchandiseValue: 100000,
        suspendedTaxesRate: 0,
        containerBase: 5000,
        ratePercent: 0.1,
      })
    ).toBe(105)
  })

  it('impostos suspensos (%) elevam a mercadoria antes do cálculo (DTA)', () => {
    // mercadoria p/ seguro = 100000 + 20% = 120000; (120000 + 0) * 0.15% = 180
    expect(
      calculateInsurance({
        merchandiseValue: 100000,
        suspendedTaxesRate: 20,
        containerBase: 0,
        ratePercent: 0.15,
      })
    ).toBe(180)
  })

  it('retorna 0 sem taxa', () => {
    expect(
      calculateInsurance({
        merchandiseValue: 100000,
        suspendedTaxesRate: 20,
        containerBase: 5000,
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
