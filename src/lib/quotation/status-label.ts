import type { QuotationStatus, QuotationEventType } from '@/types'

/** Rótulo padrão — o que o Comercial/Admin vê na maioria dos casos. */
export const STATUS_LABEL: Record<QuotationStatus, string> = {
  RASCUNHO: 'Rascunho',
  PRONTA: 'Pronta',
  AGUARDANDO_CLIENTE: 'Encaminhada ao cliente',
  APROVADA: 'Aprovada',
  REPROVADA: 'Recusada',
  ENCAMINHADA: 'Encaminhada para a operação',
  CONCLUIDA: 'Concluída',
}

/** Já passou por pelo menos um ciclo de "Solicitar revisão" da Operação? */
export function hasRevisionEvent(events: { type: QuotationEventType }[]): boolean {
  return events.some((e) => e.type === 'REVISION_REQUESTED')
}

/**
 * Rótulo mostrado pro usuário — não muda o valor real de `status` (isso
 * continua sendo ENCAMINHADA/APROVADA no banco), só como aparece na tela.
 * Cada perfil vê o status pela própria perspectiva do fluxo:
 *
 * Comercial:
 * - APROVADA (nunca revisada): "Aprovada"
 * - APROVADA por causa de revisão pedida pela Operação: "Revisão solicitada"
 * - ENCAMINHADA (1ª vez): "Encaminhada para a operação"
 * - ENCAMINHADA de novo, depois de ajustar uma revisão: "Revisão enviada"
 *
 * Operação:
 * - ENCAMINHADA (1ª vez que recebe): "Aberta"
 * - ENCAMINHADA de novo, depois de ter pedido revisão: "Revisão realizada"
 * - APROVADA depois dela mesma ter pedido revisão (aguardando o Comercial
 *   ajustar e reencaminhar — continua visível nesse meio-tempo): "Revisão solicitada"
 *
 * (Demais status — Rascunho, Pronta, Encaminhada ao cliente, Recusada,
 * Concluída — são iguais pros dois perfis.)
 */
export function statusDisplayLabel(
  status: QuotationStatus,
  hasBeenRevised: boolean,
  forOperation: boolean
): string {
  if (forOperation) {
    if (status === 'ENCAMINHADA') return hasBeenRevised ? 'Revisão realizada' : 'Aberta'
    if (status === 'APROVADA' && hasBeenRevised) return 'Revisão solicitada'
    return STATUS_LABEL[status]
  }

  if (status === 'APROVADA' && hasBeenRevised) return 'Revisão solicitada'
  if (status === 'ENCAMINHADA' && hasBeenRevised) return 'Revisão enviada'
  return STATUS_LABEL[status]
}

/** Cor padrão de cada status — mesma lógica de "Rascunho ainda não é nada,
 *  Aprovada é positivo, Recusada é negativo, Concluída é o fim feliz" etc. */
const STATUS_COLOR: Record<QuotationStatus, string> = {
  RASCUNHO: 'bg-slate-100 text-slate-600',
  PRONTA: 'bg-sky-50 text-sky-700',
  AGUARDANDO_CLIENTE: 'bg-indigo-50 text-indigo-700',
  APROVADA: 'bg-emerald-50 text-emerald-700',
  REPROVADA: 'bg-red-50 text-red-700',
  ENCAMINHADA: 'bg-blue-50 text-blue-700',
  CONCLUIDA: 'bg-green-100 text-green-700',
}

/**
 * Cor (classes Tailwind) pro badge de status — segue a mesma ramificação de
 * `statusDisplayLabel`, pra cor e texto nunca ficarem descombinados:
 * - "Revisão solicitada" (esperando alguém agir): laranja, chama atenção.
 * - "Revisão enviada"/"Revisão realizada" (já reenviada, seguindo o fluxo
 *   normal de novo): ciano, distingue do 1º envio (azul) sem parecer verde.
 */
export function statusColorClass(
  status: QuotationStatus,
  hasBeenRevised: boolean,
  forOperation: boolean
): string {
  if (forOperation) {
    if (status === 'ENCAMINHADA')
      return hasBeenRevised ? 'bg-cyan-50 text-cyan-700' : STATUS_COLOR.ENCAMINHADA
    if (status === 'APROVADA' && hasBeenRevised) return 'bg-orange-50 text-orange-700'
    return STATUS_COLOR[status]
  }

  if (status === 'APROVADA' && hasBeenRevised) return 'bg-orange-50 text-orange-700'
  if (status === 'ENCAMINHADA' && hasBeenRevised) return 'bg-cyan-50 text-cyan-700'
  return STATUS_COLOR[status]
}
