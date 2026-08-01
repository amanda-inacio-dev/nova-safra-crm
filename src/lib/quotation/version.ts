/** Remove um sufixo de versão existente (-v2, -v3...) do código, se houver. */
export function stripVersionSuffix(code: string): string {
  return code.replace(/-v\d+$/i, '')
}

/** Código de uma versão específica: v1 fica sem sufixo, v2+ ganha "-vN".
 *  Deriva sempre da base (funciona mesmo passando o código de uma versão já sufixada). */
export function versionedCode(code: string, version: number): string {
  const base = stripVersionSuffix(code)
  return version <= 1 ? base : `${base}-v${version}`
}

/** Próximo número de versão da família — maior versão existente + 1. */
export function nextVersionNumber(existingVersions: number[]): number {
  return existingVersions.length === 0 ? 1 : Math.max(...existingVersions) + 1
}

/** Toda versão de uma cotação aponta o `parent_id` para a v1 (a raiz da família) —
 *  simplifica achar "todas as versões" (id = raiz OU parent_id = raiz), sem CTE recursiva. */
export function rootQuotationId(previous: { id: string; parent_id: string | null }): string {
  return previous.parent_id ?? previous.id
}

export type VersionedRow = {
  id: string
  parent_id: string | null
  version: number
  created_at: string
}

/** v2 é "mais nova" que v1; empate no número desempata pela data. */
function isNewer(candidate: VersionedRow, current: VersionedRow): boolean {
  if (candidate.version !== current.version) return candidate.version > current.version
  return candidate.created_at > current.created_at
}

/**
 * Colapsa famílias de versões: **uma cotação com várias versões é UMA cotação**.
 *
 * Cada família aparece uma vez só, representada pela versão MAIS RECENTE (é o
 * estado atual dela), mas carregando a data da PRIMEIRA versão — foi quando a
 * cotação nasceu, e uma revisão feita em julho não deve "mover" pra julho uma
 * cotação gerada em junho.
 *
 * A ordem de entrada é preservada (a lista já vem ordenada por data).
 *
 * Observação: o colapso roda sobre as linhas que sobraram dos filtros. Se um
 * filtro esconder a v2, a família passa a ser representada pela v1 visível —
 * é o comportamento esperado de "me mostre as cotações que casam com isto".
 */
export function collapseVersions<T extends VersionedRow>(rows: T[]): T[] {
  const families = new Map<string, { latest: T; oldest: T; order: number }>()

  rows.forEach((row, index) => {
    const root = rootQuotationId(row)
    const family = families.get(root)
    if (!family) {
      families.set(root, { latest: row, oldest: row, order: index })
      return
    }
    if (isNewer(row, family.latest)) family.latest = row
    if (isNewer(family.oldest, row)) family.oldest = row
  })

  return [...families.values()]
    .sort((a, b) => a.order - b.order)
    .map(({ latest, oldest }) =>
      latest === oldest ? latest : { ...latest, created_at: oldest.created_at }
    )
}

/** Campos "de negócio" copiados para a nova versão — status/pdf/token são
 *  sempre reiniciados (cada versão passa pelo fluxo completo do zero). */
export type InheritableQuotationFields = {
  client_id: string
  sender: string | null
  recipient: string | null
  segment: string | null
  product: string | null
  process_reference: string | null
  validity: string | null
  merchandise_value: number | null
  vehicle_type: string | null
  value_type: string | null
  operation_type: string | null
  operation_subtype: string | null
  operation_detail: string | null
  empty_container_port_id: string | null
  insurance_rate: number | null
  suspended_taxes_rate: number | null
  insurance_in_total: boolean
  total_value: number
}

export type NewVersionQuotationInsert = InheritableQuotationFields & {
  code: string
  version: number
  parent_id: string
  created_by: string
  status: 'RASCUNHO'
  pdf_url: null
  client_token: null
}

/** Monta a linha da nova versão: herda os campos de negócio da anterior, mas
 *  sempre reinicia status/PDF/token — cada versão tem seu próprio ciclo. */
export function buildNewVersionInsert(params: {
  inherited: InheritableQuotationFields
  previousCode: string
  newVersion: number
  rootId: string
  createdBy: string
}): NewVersionQuotationInsert {
  return {
    ...params.inherited,
    code: versionedCode(params.previousCode, params.newVersion),
    version: params.newVersion,
    parent_id: params.rootId,
    created_by: params.createdBy,
    status: 'RASCUNHO',
    pdf_url: null,
    client_token: null,
  }
}
