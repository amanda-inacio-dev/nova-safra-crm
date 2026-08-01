import { describe, it, expect } from 'vitest'
import { clientEmailOptions, isValidEmail } from './client-emails'

describe('isValidEmail', () => {
  it('aceita e-mail comum', () => {
    expect(isValidEmail('ana@empresa.com.br')).toBe(true)
  })

  it('recusa texto sem @ ou sem domínio', () => {
    expect(isValidEmail('ana')).toBe(false)
    expect(isValidEmail('ana@empresa')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})

describe('clientEmailOptions', () => {
  const client = { name: 'Cooperativa CASUL', contact_name: 'João', email: 'joao@casul.com' }

  it('o contato principal vem primeiro', () => {
    const options = clientEmailOptions(client, [{ name: 'Maria', email: 'maria@casul.com' }])
    expect(options.map((o) => o.email)).toEqual(['joao@casul.com', 'maria@casul.com'])
    expect(options[0].primary).toBe(true)
    expect(options[1].primary).toBe(false)
  })

  it('identifica cada contato com nome e área', () => {
    const options = clientEmailOptions(client, [
      { name: 'Maria', email: 'maria@casul.com', role: 'Logística' },
    ])
    expect(options[0].label).toBe('João')
    expect(options[1].label).toBe('Maria — Logística')
  })

  it('usa a razão social quando não há nome de contato', () => {
    const options = clientEmailOptions(
      { name: 'Cooperativa CASUL', contact_name: null, email: 'contato@casul.com' },
      []
    )
    expect(options[0].label).toBe('Cooperativa CASUL')
  })

  it('não repete o mesmo e-mail, mesmo com caixa diferente', () => {
    const options = clientEmailOptions(client, [
      { name: 'João (pessoal)', email: 'JOAO@casul.com' },
      { name: 'Maria', email: 'maria@casul.com' },
    ])
    expect(options).toHaveLength(2)
    expect(options.map((o) => o.email)).toEqual(['joao@casul.com', 'maria@casul.com'])
  })

  it('ignora contato sem e-mail ou com e-mail inválido', () => {
    const options = clientEmailOptions(client, [
      { name: 'Sem e-mail', email: null },
      { name: 'Errado', email: 'nao-e-email' },
      { name: 'Espaço', email: '   ' },
    ])
    expect(options).toHaveLength(1)
  })

  it('cliente sem e-mail principal devolve só os contatos', () => {
    const options = clientEmailOptions({ name: 'X', contact_name: null, email: null }, [
      { name: 'Maria', email: 'maria@casul.com' },
    ])
    expect(options).toHaveLength(1)
    expect(options[0].primary).toBe(false)
  })

  it('sem nenhum e-mail, devolve lista vazia', () => {
    expect(clientEmailOptions({ name: 'X', email: null }, [])).toEqual([])
  })
})
