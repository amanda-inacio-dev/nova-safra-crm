import { describe, it, expect } from 'vitest'
import { toRaw, appendToRaw, shrinkByDeleteCount } from './currency-input'

describe('toRaw', () => {
  it('não trata o ponto decimal do valor canônico como separador de milhar', () => {
    // Bug relatado: "20000.26" virava 2.000.026 porque o ponto era removido.
    expect(toRaw('20000.26')).toBe('20000,26')
  })

  it('número inteiro não ganha vírgula', () => {
    expect(toRaw('20000')).toBe('20000')
  })

  it('vazio retorna vazio', () => {
    expect(toRaw('')).toBe('')
  })

  it('arredonda para 2 casas', () => {
    expect(toRaw('650.005')).toBe('650,01')
  })
})

describe('appendToRaw', () => {
  it('dígitos sem vírgula formam reais inteiros', () => {
    expect(appendToRaw('', '20000')).toBe('20000')
  })

  it('vírgula abre espaço para centavos', () => {
    expect(appendToRaw('650', ',26')).toBe('650,26')
  })

  it('limita a 2 casas decimais', () => {
    expect(appendToRaw('650,26', '9')).toBe('650,26')
  })

  it('ignora uma segunda vírgula', () => {
    expect(appendToRaw('650,2', ',6')).toBe('650,26')
  })

  it('ignora caracteres inválidos (letras, R$, espaço)', () => {
    expect(appendToRaw('', 'R$ 20a000')).toBe('20000')
  })

  it('ponto digitado vira vírgula decimal', () => {
    expect(appendToRaw('650', '.26')).toBe('650,26')
  })
})

describe('shrinkByDeleteCount', () => {
  it('remove exatamente um caractere do final por backspace', () => {
    expect(shrinkByDeleteCount('20000', 1)).toBe('2000')
  })

  it('remove um dígito de centavos por vez, não vários (bug do "encolher até caber")', () => {
    // "650,26" -> "650,2" -> "650," -> "650" -> "65": um backspace por vez.
    expect(shrinkByDeleteCount('650,26', 1)).toBe('650,2')
    expect(shrinkByDeleteCount('650,2', 1)).toBe('650,')
    expect(shrinkByDeleteCount('650,', 1)).toBe('650')
    expect(shrinkByDeleteCount('650', 1)).toBe('65')
  })

  it('esvazia o buffer quando tudo é apagado', () => {
    expect(shrinkByDeleteCount('20000', 5)).toBe('')
  })

  it('nunca fica negativo (mais apagado do que existe)', () => {
    expect(shrinkByDeleteCount('20', 10)).toBe('')
  })

  it('remove vários caracteres de uma vez (seleção + apagar)', () => {
    expect(shrinkByDeleteCount('650,26', 2)).toBe('650,')
  })
})
