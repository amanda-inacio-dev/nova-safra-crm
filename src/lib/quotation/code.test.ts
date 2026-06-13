import { describe, it, expect } from 'vitest'
import { formatQuotationCode } from './code'

describe('formatQuotationCode', () => {
  it('formata importação com zero-padding de 4 dígitos', () => {
    expect(formatQuotationCode('IMPORTACAO', 23)).toBe('NS_IMP_0023')
    expect(formatQuotationCode('IMPORTACAO', 1)).toBe('NS_IMP_0001')
  })

  it('formata exportação', () => {
    expect(formatQuotationCode('EXPORTACAO', 47)).toBe('NS_EXP_0047')
  })

  it('mantém números com mais de 4 dígitos', () => {
    expect(formatQuotationCode('IMPORTACAO', 12345)).toBe('NS_IMP_12345')
  })
})
