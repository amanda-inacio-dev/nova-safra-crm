import { describe, it, expect } from 'vitest'
import { escapeHtml } from './escape-html'

describe('escapeHtml', () => {
  it('escapa os 5 caracteres perigosos em HTML', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    )
  })

  it('escapa & antes dos demais, sem escapar duas vezes', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B')
  })

  it('escapa aspas simples (protege atributos com aspas simples)', () => {
    expect(escapeHtml("O'Brien")).toBe('O&#39;Brien')
  })

  it('texto sem caracteres especiais fica inalterado', () => {
    expect(escapeHtml('Peças e componentes')).toBe('Peças e componentes')
  })

  it('string vazia retorna vazia', () => {
    expect(escapeHtml('')).toBe('')
  })
})
