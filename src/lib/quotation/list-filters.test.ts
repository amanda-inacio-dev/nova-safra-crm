import { describe, it, expect } from 'vitest'
import {
  parseListFilters,
  hasActiveFilters,
  matchesKeyword,
  EMPTY_FILTERS,
  type SearchableQuotation,
} from './list-filters'

const base: SearchableQuotation = {
  code: 'NS_IMP_0023',
  clientName: 'Cooperativa CASUL',
  ownerName: 'Maria Silva',
  origin: 'Santos - SP',
  destination: 'São Paulo - SP',
  sender: 'Exportadora Café Ltda',
  recipient: 'Armazém Central',
  product: 'Café verde',
}

describe('parseListFilters', () => {
  it('lê os filtros da querystring', () => {
    const filters = parseListFilters({
      q: ' santos ',
      cliente: 'abc-123',
      status: 'APROVADA',
      operacao: 'IMPORTACAO',
      veiculo: 'RODOTREM',
      segmento: 'CAFE',
      responsavel: 'user-1',
      de: '2026-01-01',
      ate: '2026-03-31',
    })
    expect(filters).toEqual({
      q: 'santos',
      clientId: 'abc-123',
      status: 'APROVADA',
      operationType: 'IMPORTACAO',
      vehicleType: 'RODOTREM',
      segment: 'CAFE',
      ownerId: 'user-1',
      from: '2026-01-01',
      to: '2026-03-31',
    })
  })

  it('sem querystring, nenhum filtro ativo', () => {
    expect(parseListFilters({})).toEqual(EMPTY_FILTERS)
    expect(hasActiveFilters(parseListFilters({}))).toBe(false)
  })

  it('usa o primeiro valor quando o parâmetro vem repetido', () => {
    expect(parseListFilters({ status: ['APROVADA', 'REPROVADA'] }).status).toBe('APROVADA')
  })

  it('hasActiveFilters true com qualquer campo preenchido', () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, q: 'casul' })).toBe(true)
  })
})

describe('matchesKeyword', () => {
  it('termo vazio não filtra nada', () => {
    expect(matchesKeyword(base, '')).toBe(true)
    expect(matchesKeyword(base, '   ')).toBe(true)
  })

  it('acha pelo código, cliente, responsável, origem e destino', () => {
    expect(matchesKeyword(base, 'NS_IMP_0023')).toBe(true)
    expect(matchesKeyword(base, 'casul')).toBe(true)
    expect(matchesKeyword(base, 'maria')).toBe(true)
    expect(matchesKeyword(base, 'santos')).toBe(true)
    expect(matchesKeyword(base, 'paulo')).toBe(true)
  })

  it('ignora acento e caixa', () => {
    expect(matchesKeyword(base, 'SAO PAULO')).toBe(true)
    expect(matchesKeyword(base, 'armazem')).toBe(true)
    expect(matchesKeyword(base, 'café')).toBe(true)
  })

  it('exige todos os termos digitados (E, não OU)', () => {
    expect(matchesKeyword(base, 'casul santos')).toBe(true)
    expect(matchesKeyword(base, 'casul curitiba')).toBe(false)
  })

  it('não casa o que não existe na cotação', () => {
    expect(matchesKeyword(base, 'rio de janeiro')).toBe(false)
  })

  it('lida com campos nulos', () => {
    const vazia: SearchableQuotation = {
      code: null,
      clientName: null,
      ownerName: null,
      origin: null,
      destination: null,
      sender: null,
      recipient: null,
      product: null,
    }
    expect(matchesKeyword(vazia, 'qualquer')).toBe(false)
    expect(matchesKeyword(vazia, '')).toBe(true)
  })
})
