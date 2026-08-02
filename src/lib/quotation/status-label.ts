import type { QuotationStatus, QuotationEventType } from '@/types'

/**
 * Status COMO O USUÁRIO VÊ.
 *
 * O banco guarda 7 status, mas a tela mostra 10: alguns viram dois estados
 * diferentes dependendo do histórico da cotação (um comentário do cliente sem
 * decisão, um ciclo de revisão da Operação). Este arquivo é a única fonte
 * dessas regras — rótulo, cor e opções de filtro saem todos daqui, para nunca
 * dessincronizarem.
 */
export type QuotationDisplayStatus =
  | 'RASCUNHO'
  | 'PRONTA'
  | 'AGUARDANDO_CLIENTE'
  | 'COMENTADA'
  | 'APROVADA'
  | 'REVISAO_SOLICITADA'
  | 'REPROVADA'
  | 'ENCAMINHADA'
  | 'REVISAO_ENVIADA'
  | 'CONCLUIDA'

/** Rótulo padrão — o que o Comercial/Admin vê. */
export const STATUS_LABEL: Record<QuotationStatus, string> = {
  RASCUNHO: 'Rascunho',
  PRONTA: 'Pronta',
  AGUARDANDO_CLIENTE: 'Encaminhada ao cliente',
  APROVADA: 'Aprovada',
  REPROVADA: 'Recusada',
  ENCAMINHADA: 'Encaminhada para a operação',
  CONCLUIDA: 'Concluída',
}

const DISPLAY_LABEL: Record<QuotationDisplayStatus, string> = {
  RASCUNHO: STATUS_LABEL.RASCUNHO,
  PRONTA: STATUS_LABEL.PRONTA,
  AGUARDANDO_CLIENTE: STATUS_LABEL.AGUARDANDO_CLIENTE,
  COMENTADA: 'Comentada',
  APROVADA: STATUS_LABEL.APROVADA,
  REVISAO_SOLICITADA: 'Revisão solicitada',
  REPROVADA: STATUS_LABEL.REPROVADA,
  ENCAMINHADA: STATUS_LABEL.ENCAMINHADA,
  REVISAO_ENVIADA: 'Revisão enviada',
  CONCLUIDA: STATUS_LABEL.CONCLUIDA,
}

/**
 * A Operação enxerga o mesmo estado pela perspectiva dela:
 * o que pro Comercial é "encaminhada", pra ela é uma cotação "aberta".
 */
const DISPLAY_LABEL_OPERATION: Partial<Record<QuotationDisplayStatus, string>> = {
  ENCAMINHADA: 'Aberta',
  REVISAO_ENVIADA: 'Revisão realizada',
}

/**
 * Uma cor por estado — nenhuma se repete.
 *
 * Antes vários estados caíam em tons de azul parecidos (sky/indigo/blue/cyan) e
 * ficava difícil diferenciar de relance. Agora cada um tem um matiz próprio, e
 * os dois estados que precisam saltar aos olhos são preenchidos (fundo forte,
 * texto branco): APROVADA e CONCLUIDA.
 */
const DISPLAY_COLOR: Record<QuotationDisplayStatus, string> = {
  // Cinza: ainda não é nada.
  RASCUNHO: 'bg-slate-100 text-slate-600',
  // Azul-claro: pronta, mas parada.
  PRONTA: 'bg-sky-100 text-sky-800',
  // Roxo: está com o cliente.
  AGUARDANDO_CLIENTE: 'bg-violet-100 text-violet-800',
  // Âmbar: o cliente falou algo, mas não decidiu.
  COMENTADA: 'bg-amber-100 text-amber-800',
  // Verde-limão preenchido: a notícia boa do fluxo, salta aos olhos.
  APROVADA: 'bg-lime-400 text-lime-950',
  // Laranja: alguém precisa agir.
  REVISAO_SOLICITADA: 'bg-orange-100 text-orange-800',
  // Vermelho: negativo.
  REPROVADA: 'bg-red-100 text-red-800',
  // Azul: seguiu para a Operação.
  ENCAMINHADA: 'bg-blue-100 text-blue-800',
  // Turquesa: reenviada depois do ajuste (distinta do 1º envio).
  REVISAO_ENVIADA: 'bg-teal-100 text-teal-800',
  // Verde escuro preenchido: fim do processo.
  CONCLUIDA: 'bg-green-700 text-white',
}

/** Estados oferecidos no filtro da lista, na ordem do ciclo da cotação. */
export const STAFF_DISPLAY_STATUSES: QuotationDisplayStatus[] = [
  'RASCUNHO',
  'PRONTA',
  'AGUARDANDO_CLIENTE',
  'COMENTADA',
  'APROVADA',
  'REVISAO_SOLICITADA',
  'REPROVADA',
  'ENCAMINHADA',
  'REVISAO_ENVIADA',
  'CONCLUIDA',
]

/** A Operação só enxerga estes (RLS — migrations 0020/0025). */
export const OPERATION_DISPLAY_STATUSES: QuotationDisplayStatus[] = [
  'ENCAMINHADA',
  'REVISAO_ENVIADA',
  'REVISAO_SOLICITADA',
  'CONCLUIDA',
]

/** Já passou por pelo menos um ciclo de "Solicitar revisão" da Operação? */
export function hasRevisionEvent(events: { type: QuotationEventType }[]): boolean {
  return events.some((e) => e.type === 'REVISION_REQUESTED')
}

/**
 * Traduz (status do banco + histórico) no estado que o usuário enxerga.
 *
 * - Comentário do cliente só vira "Comentada" enquanto a cotação ainda aguarda
 *   a decisão dele — depois de aprovada, um comentário antigo não muda o estado.
 * - Um ciclo de revisão da Operação desdobra APROVADA em "Revisão solicitada"
 *   (esperando o Comercial ajustar) e ENCAMINHADA em "Revisão enviada".
 */
export function displayStatusKey(
  status: QuotationStatus,
  hasBeenRevised: boolean,
  hasPendingComment = false
): QuotationDisplayStatus {
  if (status === 'AGUARDANDO_CLIENTE' && hasPendingComment) return 'COMENTADA'
  if (status === 'APROVADA' && hasBeenRevised) return 'REVISAO_SOLICITADA'
  if (status === 'ENCAMINHADA' && hasBeenRevised) return 'REVISAO_ENVIADA'
  return status
}

/** Texto do estado, na perspectiva de quem está olhando. */
export function displayStatusLabel(key: QuotationDisplayStatus, forOperation: boolean): string {
  if (forOperation) return DISPLAY_LABEL_OPERATION[key] ?? DISPLAY_LABEL[key]
  return DISPLAY_LABEL[key]
}

/** Cor (classes Tailwind) do badge — sempre casada com o rótulo acima. */
export function displayStatusColor(key: QuotationDisplayStatus): string {
  return DISPLAY_COLOR[key]
}

/**
 * Atalhos para quem chama por (status, revisada, perfil): as telas que não
 * consultam os comentários continuam funcionando sem mudança.
 */
export function statusDisplayLabel(
  status: QuotationStatus,
  hasBeenRevised: boolean,
  forOperation: boolean
): string {
  return displayStatusLabel(displayStatusKey(status, hasBeenRevised), forOperation)
}

export function statusColorClass(
  status: QuotationStatus,
  hasBeenRevised: boolean,
  // A cor depende só do ESTADO, não de quem olha (Operação e Comercial usam a
  // mesma paleta). O parâmetro fica para a chamada ser idêntica à do rótulo —
  // quem mexer numa lembra da outra.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  forOperation: boolean
): string {
  return displayStatusColor(displayStatusKey(status, hasBeenRevised))
}
