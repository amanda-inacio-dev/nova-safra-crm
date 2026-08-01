import { normalizeName } from './estimate'

/**
 * Filtros da lista mestra de cotações (issue #13).
 *
 * Cada filtro aceita VÁRIAS opções ao mesmo tempo (caixas de seleção): dá pra
 * pedir "Café e Indústria" ou dois remetentes de uma vez. Na URL isso vira o
 * mesmo parâmetro repetido (`?segmento=CAFE&segmento=INDUSTRIA`).
 *
 * Os filtros de igualdade vão pro banco. A busca por palavra-chave e o filtro
 * de status são aplicados em memória: a busca varre origem/destino (que moram
 * em `quotation_legs`) e o status exibido depende do histórico da cotação, não
 * só da coluna `status`.
 */

export type QuotationListFilters = {
  /** Busca por palavra-chave. */
  q: string
  clientIds: string[]
  /** Estados COMO O USUÁRIO VÊ (ver QuotationDisplayStatus). */
  statuses: string[]
  operationTypes: string[]
  vehicleTypes: string[]
  segments: string[]
  ownerIds: string[]
  /** "yyyy-mm-dd" (vazio = sem limite). */
  from: string
  to: string
}

export const EMPTY_FILTERS: QuotationListFilters = {
  q: '',
  clientIds: [],
  statuses: [],
  operationTypes: [],
  vehicleTypes: [],
  segments: [],
  ownerIds: [],
  from: '',
  to: '',
}

type RawSearchParams = Record<string, string | string[] | undefined>

function one(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return (value[0] ?? '').trim()
  return (value ?? '').trim()
}

/** Um parâmetro repetido na URL chega como array; um só, como string. */
function many(value: string | string[] | undefined): string[] {
  if (value === undefined) return []
  const list = Array.isArray(value) ? value : [value]
  return list.map((v) => v.trim()).filter(Boolean)
}

/** Lê os filtros da querystring (tudo opcional; ausente = sem filtro). */
export function parseListFilters(searchParams: RawSearchParams): QuotationListFilters {
  return {
    q: one(searchParams.q),
    clientIds: many(searchParams.cliente),
    statuses: many(searchParams.status),
    operationTypes: many(searchParams.operacao),
    vehicleTypes: many(searchParams.veiculo),
    segments: many(searchParams.segmento),
    ownerIds: many(searchParams.responsavel),
    from: one(searchParams.de),
    to: one(searchParams.ate),
  }
}

/** Algum filtro está ativo? (controla o botão "Limpar filtros"). */
export function hasActiveFilters(filters: QuotationListFilters): boolean {
  return Object.values(filters).some((value) =>
    Array.isArray(value) ? value.length > 0 : value !== ''
  )
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
