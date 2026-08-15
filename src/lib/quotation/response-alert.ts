import type { QuotationStatus } from '@/types'

export type ResponseAlertInput = {
  status: QuotationStatus
  alertEnabled: boolean
  alertDays: number | null
  /** Quando a cotação foi enviada (ou reenviada) ao cliente pela última vez. */
  sentToClientAt: string | null
  /** Quando o alerta já foi disparado para essa cotação (se já foi). */
  alertSentAt: string | null
  /** Se o cliente comentou depois do último envio — comentário conta como
   *  resposta mesmo sem aprovar/reprovar (issue #16). */
  hasClientCommentSinceSent: boolean
  now: Date
}

/** Decide se uma cotação está elegível pro alerta de "sem retorno do
 *  cliente" — função pura, usada tanto pela rota de cron quanto pelos
 *  testes (o projeto não tem infraestrutura de mock de banco). */
export function isEligibleForResponseAlert(input: ResponseAlertInput): boolean {
  if (input.status !== 'AGUARDANDO_CLIENTE') return false
  if (!input.alertEnabled) return false
  if (input.alertSentAt) return false
  if (!input.alertDays || input.alertDays <= 0) return false
  if (!input.sentToClientAt) return false
  if (input.hasClientCommentSinceSent) return false

  const sentAt = new Date(input.sentToClientAt)
  const deadline = new Date(sentAt.getTime() + input.alertDays * 24 * 60 * 60 * 1000)
  return input.now >= deadline
}
