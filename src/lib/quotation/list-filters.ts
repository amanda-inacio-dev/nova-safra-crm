import { normalizeName } from './estimate'

/**
 * Filtros da lista mestra de cotações (issue #13).
 *
 * Os filtros de igualdade (cliente, status, operação, veículo, segmento,
 * responsável, período) vão pro banco. A busca por palavra-chave é aplicada em
 * memória sobre o resultado, porque ela precisa varrer origem/destino, que
 * moram em `quotation_legs` (tabela filha — o PostgREST não filtra o pai por
 * texto do filho sem uma view dedicada).
 */

export type QuotationListFilters = {
  /** Busca por palavra-chave. */
  q: string
  clientId: string
  status: string
  operationType: string
  vehicleType: string
  segment: string
  ownerId: string
  /** "yyyy-mm-dd" (vazio = sem limite). */
  from: string
  to: string
}

export const EMPTY_FILTERS: QuotationListFilters = {
  q: '',
  clientId: '',
  status: '',
  operationType: '',
  vehicleType: '',
  segment: '',
  ownerId: '',
  from: '',
  to: '',
}

type RawSearchParams = Record<string, string | string[] | undefined>

function one(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return (value[0] ?? '').trim()
  return (value ?? '').trim()
}

/** Lê os filtros da querystring (tudo opcional; ausente = sem filtro). */
export function parseListFilters(searchParams: RawSearchParams): QuotationListFilters {
  return {
    q: one(searchParams.q),
    clientId: one(searchParams.cliente),
    status: one(searchParams.status),
    operationType: one(searchParams.operacao),
    vehicleType: one(searchParams.veiculo),
    segment: one(searchParams.segmento),
    ownerId: one(searchParams.responsavel),
    from: one(searchParams.de),
    to: one(searchParams.ate),
  }
}

/** Algum filtro está ativo? (controla o botão "Limpar filtros"). */
export function hasActiveFilters(filters: QuotationListFilters): boolean {
  return Object.values(filters).some((value) => value !== '')
}

export type SearchableQuotation = {
  code: string | null
  clientName: string | null
  ownerName: string | null
  origin: string | null
  destination: string | null
  sender: string | null
  recipient: string | null
  product: string | null
}

/**
 * Casa a busca por palavra-chave contra os campos textuais da cotação.
 * Sem acento e sem caixa — "sao paulo" acha "São Paulo".
 * Todos os termos digitados precisam aparecer (busca "E", não "OU").
 */
export function matchesKeyword(row: SearchableQuotation, term: string): boolean {
  const words = normalizeName(term).split(/\s+/).filter(Boolean)
  if (words.length === 0) return true

  const haystack = normalizeName(
    [
      row.code,
      row.clientName,
      row.ownerName,
      row.origin,
      row.destination,
      row.sender,
      row.recipient,
      row.product,
    ]
      .filter(Boolean)
      .join(' ')
  )

  return words.every((word) => haystack.includes(word))
}
