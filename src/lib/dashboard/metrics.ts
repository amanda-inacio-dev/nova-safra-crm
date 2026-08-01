import type { QuotationStatus } from '@/types'

/**
 * Indicadores e agregações do Dashboard (issue #13).
 *
 * Tudo aqui é função pura sobre as linhas já carregadas do banco — a página
 * só busca os dados (respeitando a RLS de cada perfil) e delega o cálculo.
 */

export type PeriodPreset = 'MES' | 'TRIMESTRE' | 'ANO' | 'PERSONALIZADO'

export const PERIOD_LABEL: Record<PeriodPreset, string> = {
  MES: 'Último mês',
  TRIMESTRE: 'Último trimestre',
  ANO: 'Último ano',
  PERSONALIZADO: 'Período personalizado',
}

export type Period = {
  preset: PeriodPreset
  /** Início do intervalo (00:00:00 no fuso local). */
  from: Date
  /** Fim do intervalo (23:59:59.999 no fuso local). */
  to: Date
  /** Valores de volta pros inputs `type="date"` do filtro. */
  fromInput: string
  toInput: string
}

/**
 * Converte "yyyy-mm-dd" numa data LOCAL (não UTC).
 *
 * `new Date('2026-07-31')` seria meia-noite UTC — no Brasil (UTC-3) isso cai
 * no dia 30 às 21h, jogando cotações do dia certo pra fora do filtro.
 */
export function parseLocalDate(value: string, endOfDay = false): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!m) return null
  const [, y, mo, d] = m
  const date = endOfDay
    ? new Date(Number(y), Number(mo) - 1, Number(d), 23, 59, 59, 999)
    : new Date(Number(y), Number(mo) - 1, Number(d), 0, 0, 0, 0)
  if (Number.isNaN(date.getTime())) return null
  return date
}

/** Formata uma data como "yyyy-mm-dd" no fuso local (para inputs `type="date"`). */
export function toDateInput(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

/** Recua `months` meses mantendo o dia (31/03 - 1 mês = 28 ou 29/02). */
function subtractMonths(date: Date, months: number): Date {
  const day = date.getDate()
  const shifted = new Date(date.getFullYear(), date.getMonth() - months, 1)
  const lastDay = new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate()
  shifted.setDate(Math.min(day, lastDay))
  return shifted
}

const MONTHS_BY_PRESET: Record<Exclude<PeriodPreset, 'PERSONALIZADO'>, number> = {
  MES: 1,
  TRIMESTRE: 3,
  ANO: 12,
}

/**
 * Resolve o filtro de período vindo da URL.
 *
 * Presets são móveis (contados a partir de hoje pra trás). "Personalizado"
 * exige as duas datas; se vier incompleto ou inválido, cai no padrão de 1 ano
 * em vez de quebrar a página.
 */
export function resolvePeriod(
  input: { preset?: string; from?: string; to?: string },
  now: Date = new Date()
): Period {
  const preset = (input.preset ?? '').toUpperCase() as PeriodPreset

  if (preset === 'PERSONALIZADO') {
    const from = parseLocalDate(input.from ?? '')
    const to = parseLocalDate(input.to ?? '', true)
    if (from && to && from <= to) {
      return {
        preset,
        from,
        to,
        fromInput: toDateInput(from),
        toInput: toDateInput(to),
      }
    }
  }

  const months = MONTHS_BY_PRESET[preset as Exclude<PeriodPreset, 'PERSONALIZADO'>] ?? 12
  const resolved: PeriodPreset =
    preset === 'MES' || preset === 'TRIMESTRE' || preset === 'ANO' ? preset : 'ANO'
  const from = startOfDay(subtractMonths(now, months))
  const to = endOfDay(now)

  return { preset: resolved, from, to, fromInput: toDateInput(from), toInput: toDateInput(to) }
}

export type MetricsRow = { status: QuotationStatus; created_at: string }

export type QuotationMetrics = {
  /** Todas as cotações geradas no período (que o perfil enxerga). */
  total: number
  /** Ainda sem resposta do cliente: Rascunho, Pronta, Encaminhada ao cliente. */
  open: number
  /** Aprovadas pelo cliente — inclui as que já avançaram (Encaminhada/Concluída). */
  approved: number
  rejected: number
  concluded: number
  /** Em poder da Operação agora. */
  forwarded: number
  /** Já foram enviadas ao cliente — tudo menos Rascunho e Pronta. */
  sent: number
  /** Enviadas ao cliente e ainda sem resposta dele. */
  pendingClient: number
  /** O cliente já respondeu: aprovadas + recusadas. */
  decided: number
  /** aprovadas ÷ respondidas × 100 — null quando ninguém respondeu ainda. */
  approvalRate: number | null
  /**
   * aprovadas ÷ ENVIADAS × 100 — a taxa "honesta": as que o cliente ainda não
   * respondeu entram no denominador. 5 aprovadas de 6 enviadas = 83,3%, não 100%.
   */
  approvalRateOnSent: number | null
  /** concluídas ÷ aprovadas × 100 — usado na visão da Operação. */
  conclusionRate: number | null
  /**
   * Contagem crua por status, pra quando um perfil precisa de um recorte que
   * os agregados acima não dão. Ex.: pra Operação, `byStatus.APROVADA` são as
   * cotações que ela devolveu pro Comercial revisar — a RLS (migration 0025) só
   * mostra APROVADA pra ela quando existe um pedido de revisão dela mesma.
   */
  byStatus: Record<QuotationStatus, number>
}

const ALL_STATUSES: QuotationStatus[] = [
  'RASCUNHO',
  'PRONTA',
  'AGUARDANDO_CLIENTE',
  'APROVADA',
  'REPROVADA',
  'ENCAMINHADA',
  'CONCLUIDA',
]

/**
 * Uma cotação aprovada que já foi encaminhada ou concluída continua sendo uma
 * aprovação — por isso "Aprovadas" soma os três status, e não só APROVADA.
 *
 * São duas taxas de aprovação, de propósito:
 * - sobre RESPONDIDAS: mede a qualidade da proposta (ignora quem não respondeu);
 * - sobre ENVIADAS: mede o resultado real da carteira (quem não respondeu ainda
 *   não virou negócio, então puxa a taxa pra baixo).
 * Rascunho e Pronta não entram em nenhuma das duas: nunca chegaram ao cliente.
 */
export function summarizeQuotations(rows: MetricsRow[]): QuotationMetrics {
  let open = 0
  let approved = 0
  let rejected = 0
  let concluded = 0
  let forwarded = 0
  let pendingClient = 0

  const byStatus = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<
    QuotationStatus,
    number
  >

  for (const row of rows) {
    if (row.status in byStatus) byStatus[row.status] += 1

    switch (row.status) {
      case 'RASCUNHO':
      case 'PRONTA':
        open += 1
        break
      case 'AGUARDANDO_CLIENTE':
        open += 1
        pendingClient += 1
        break
      case 'APROVADA':
        approved += 1
        break
      case 'ENCAMINHADA':
        approved += 1
        forwarded += 1
        break
      case 'CONCLUIDA':
        approved += 1
        concluded += 1
        break
      case 'REPROVADA':
        rejected += 1
        break
    }
  }

  const decided = approved + rejected
  const sent = decided + pendingClient

  return {
    total: rows.length,
    open,
    approved,
    rejected,
    concluded,
    forwarded,
    sent,
    pendingClient,
    decided,
    approvalRate: decided > 0 ? (approved / decided) * 100 : null,
    approvalRateOnSent: sent > 0 ? (approved / sent) * 100 : null,
    conclusionRate: approved > 0 ? (concluded / approved) * 100 : null,
    byStatus,
  }
}

const MONTH_ABBR = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

export type MonthlyBucket = {
  /** "2026-07" — chave estável, independente de locale. */
  key: string
  /** "jul/26" — o que aparece embaixo da barra. */
  label: string
  count: number
}

/**
 * Cotações por mês dentro do período, incluindo os meses vazios — senão o
 * gráfico "pula" meses sem cotação e dá a impressão de continuidade.
 */
export function monthlyCounts(rows: MetricsRow[], from: Date, to: Date): MonthlyBucket[] {
  const buckets = new Map<string, MonthlyBucket>()

  const cursor = new Date(from.getFullYear(), from.getMonth(), 1)
  const last = new Date(to.getFullYear(), to.getMonth(), 1)
  while (cursor <= last) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
    buckets.set(key, {
      key,
      label: `${MONTH_ABBR[cursor.getMonth()]}/${String(cursor.getFullYear()).slice(-2)}`,
      count: 0,
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  for (const row of rows) {
    const date = new Date(row.created_at)
    if (Number.isNaN(date.getTime())) continue
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const bucket = buckets.get(key)
    if (bucket) bucket.count += 1
  }

  return [...buckets.values()]
}

/** "12,5%" — null vira "—". */
export function formatPercent(value: number | null): string {
  if (value === null) return '—'
  return `${value.toFixed(1).replace('.', ',')}%`
}
