import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { parseLocalDate } from '@/lib/dashboard/metrics'
import { matchesKeyword, type QuotationListFilters } from '@/lib/quotation/list-filters'
import { collapseVersions } from '@/lib/quotation/version'
import { displayStatusKey } from '@/lib/quotation/status-label'
import type { QuotationStatus, QuotationEventType } from '@/types'

/**
 * Carrega a lista mestra de cotações (issue #13) — usada tanto em /cotacoes
 * quanto no histórico por cliente.
 *
 * A visibilidade por perfil NÃO é replicada aqui: quem decide o que cada um
 * enxerga é a RLS (Operação só vê ENCAMINHADA/CONCLUIDA e as que ela mesma
 * mandou revisar — migrations 0020/0025). Duplicar a regra em código foi
 * exatamente o que causou um bug de rótulo antes.
 */

const SELECT = `
  id, code, status, operation_type, vehicle_type, segment,
  sender, recipient, product, created_at, client_id, parent_id, version,
  client:clients(name),
  owner:users!quotations_created_by_fkey(id, name),
  legs:quotation_legs(origin, destination, leg_order)
`

type RawRow = {
  id: string
  code: string | null
  status: QuotationStatus
  operation_type: string | null
  vehicle_type: string | null
  segment: string | null
  sender: string | null
  recipient: string | null
  product: string | null
  created_at: string
  client_id: string
  parent_id: string | null
  version: number
  client: { name: string } | null
  owner: { id: string; name: string } | null
  legs: { origin: string | null; destination: string | null; leg_order: number }[] | null
}

export type QuotationListRow = {
  id: string
  code: string | null
  status: QuotationStatus
  operationType: string | null
  vehicleType: string | null
  segment: string | null
  /** Data da 1ª versão — é quando a cotação foi gerada. */
  createdAt: string
  /** Versão exibida (a mais recente da família). */
  version: number
  clientName: string | null
  ownerName: string | null
  /** Origem do primeiro trecho e destino do último — o resumo da rota. */
  origin: string | null
  destination: string | null
  /** Rota completa (todos os trechos), pro tooltip quando há mais de um. */
  route: string | null
  /** Passou por um ciclo de revisão da Operação (muda o rótulo do status). */
  hasBeenRevised: boolean
  /** Último comentário do cliente, só enquanto ainda aguarda a decisão dele. */
  latestComment: string | null
}

/** Origem do 1º trecho / destino do último, em ordem de `leg_order`. */
function routeOf(legs: RawRow['legs']) {
  const ordered = [...(legs ?? [])].sort((a, b) => a.leg_order - b.leg_order)
  if (ordered.length === 0) return { origin: null, destination: null, route: null }
  return {
    origin: ordered[0].origin,
    destination: ordered[ordered.length - 1].destination,
    route:
      ordered.length > 1
        ? ordered.map((l) => `${l.origin ?? '—'} → ${l.destination ?? '—'}`).join(' · ')
        : null,
  }
}

export async function loadQuotationList(
  filters: QuotationListFilters,
  options: { clientId?: string } = {}
): Promise<QuotationListRow[]> {
  const supabase = await createClient()

  let query = supabase.from('quotations').select(SELECT).order('created_at', { ascending: false })

  // Filtros de igualdade vão pro banco (`in` = qualquer uma das opções marcadas).
  // O de status fica de fora de propósito: o status EXIBIDO depende do histórico
  // (Comentada / Revisão solicitada / Revisão enviada), então é aplicado depois.
  if (options.clientId) query = query.eq('client_id', options.clientId)
  else if (filters.clientIds.length) query = query.in('client_id', filters.clientIds)
  if (filters.operationTypes.length) query = query.in('operation_type', filters.operationTypes)
  if (filters.vehicleTypes.length) query = query.in('vehicle_type', filters.vehicleTypes)
  if (filters.segments.length) query = query.in('segment', filters.segments)
  if (filters.ownerIds.length) query = query.in('created_by', filters.ownerIds)

  const from = parseLocalDate(filters.from)
  if (from) query = query.gte('created_at', from.toISOString())
  const to = parseLocalDate(filters.to, true)
  if (to) query = query.lte('created_at', to.toISOString())

  const { data } = await query

  // Uma cotação com várias versões é UMA cotação: a lista mostra só a versão
  // mais recente de cada família (as anteriores continuam acessíveis pelo
  // "Histórico de versões" dentro da cotação).
  const raw = collapseVersions((data ?? []) as unknown as RawRow[])

  // Busca por palavra-chave em memória: ela varre origem/destino, que moram
  // na tabela filha `quotation_legs` (o PostgREST não filtra o pai por isso).
  const withRoute = raw.map((row) => ({ row, ...routeOf(row.legs) }))
  const filtered = filters.q
    ? withRoute.filter((item) =>
        matchesKeyword(
          {
            code: item.row.code,
            clientName: item.row.client?.name ?? null,
            ownerName: item.row.owner?.name ?? null,
            origin: item.origin,
            destination: item.destination,
            sender: item.row.sender,
            recipient: item.row.recipient,
            product: item.row.product,
          },
          filters.q
        )
      )
    : withRoute

  // O rótulo do status depende do histórico, não só do valor bruto (ver
  // status-label.ts). Só as cotações nesses 3 status têm variação possível.
  const relevantIds = filtered
    .filter(
      ({ row }) =>
        row.status === 'AGUARDANDO_CLIENTE' ||
        row.status === 'ENCAMINHADA' ||
        row.status === 'APROVADA'
    )
    .map(({ row }) => row.id)

  const latestCommentByQuotation = new Map<string, string>()
  const revisedIds = new Set<string>()
  if (relevantIds.length > 0) {
    const { data: events } = await supabase
      .from('quotation_events')
      .select('quotation_id, type, client_comment, created_at')
      .in('quotation_id', relevantIds)
      .order('created_at', { ascending: false })

    for (const event of (events ?? []) as {
      quotation_id: string
      type: QuotationEventType
      client_comment: string | null
    }[]) {
      if (
        event.type === 'COMMENTED' &&
        event.client_comment &&
        !latestCommentByQuotation.has(event.quotation_id)
      ) {
        latestCommentByQuotation.set(event.quotation_id, event.client_comment)
      }
      if (event.type === 'REVISION_REQUESTED') revisedIds.add(event.quotation_id)
    }
  }

  const rows = filtered.map(({ row, origin, destination, route }) => ({
    id: row.id,
    code: row.code,
    status: row.status,
    operationType: row.operation_type,
    vehicleType: row.vehicle_type,
    segment: row.segment,
    createdAt: row.created_at,
    version: row.version,
    clientName: row.client?.name ?? null,
    ownerName: row.owner?.name ?? null,
    origin,
    destination,
    route,
    hasBeenRevised: revisedIds.has(row.id),
    // "Comentada" só vale enquanto a cotação ainda espera a decisão do cliente
    // — senão um comentário antigo ficaria aparecendo depois de aprovada.
    latestComment:
      row.status === 'AGUARDANDO_CLIENTE' ? (latestCommentByQuotation.get(row.id) ?? null) : null,
  }))

  // O filtro de status usa o estado EXIBIDO (Comentada, Revisão solicitada…),
  // que só existe depois de cruzar a cotação com o histórico dela — por isso
  // vem aqui no fim, e não na consulta ao banco.
  if (filters.statuses.length === 0) return rows
  return rows.filter((row) =>
    filters.statuses.includes(
      displayStatusKey(row.status, row.hasBeenRevised, Boolean(row.latestComment))
    )
  )
}

export type FilterOption = { id: string; name: string }

/** Opções dos filtros (clientes e responsáveis cadastrados). */
export async function loadFilterOptions(): Promise<{
  clients: FilterOption[]
  owners: FilterOption[]
}> {
  const supabase = await createClient()

  const [clientsResult, ownersResult] = await Promise.all([
    supabase.from('clients').select('id, name').order('name'),
    // Responsável = quem cria cotação (Admin/Comercial). Se a migration 0026
    // ainda não foi aplicada, a RLS devolve só o próprio usuário — a tela não
    // quebra, o filtro só fica com menos opções.
    supabase
      .from('users')
      .select('id, name, email, role, active')
      .in('role', ['ADMIN', 'COMMERCIAL'])
      .eq('active', true)
      .order('name'),
  ])

  const owners = ((ownersResult.data ?? []) as { id: string; name: string; email: string }[]).map(
    (u) => ({ id: u.id, name: u.name || u.email })
  )

  return { clients: (clientsResult.data ?? []) as FilterOption[], owners }
}
