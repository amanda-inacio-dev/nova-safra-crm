import { describe, it, expect } from 'vitest'
import { textToEmailHtml } from './text-to-html'

describe('textToEmailHtml', () => {
  it('preserva as quebras de linha com <br>', () => {
    expect(textToEmailHtml('Boa tarde,\nSegue a cotação.')).toBe('Boa tarde,<br />Segue a cotação.')
  })

  it('remove o espaço em branco das pontas — a causa do "Boa tarde" desconfigurado', () => {
    expect(textToEmailHtml('\n      Boa tarde\n    ')).toBe('Boa tarde')
  })

  it('trata quebra de linha do Windows (CRLF)', () => {
    expect(textToEmailHtml('linha 1\r\nlinha 2')).toBe('linha 1<br />linha 2')
  })

  it('escapa HTML digitado pelo usuário', () => {
    expect(textToEmailHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    )
  })

  it('mantém linhas em branco entre parágrafos', () => {
    expect(textToEmailHtml('Olá\n\nTudo bem?')).toBe('Olá<br /><br />Tudo bem?')
  })

  it('texto vazio vira string vazia', () => {
    expect(textToEmailHtml('   ')).toBe('')
  })
})
