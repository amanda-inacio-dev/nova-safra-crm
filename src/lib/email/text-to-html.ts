import { escapeHtml } from '@/lib/pdf/escape-html'

/**
 * Converte um texto livre digitado pelo usuário (mensagem ao cliente,
 * observação da Operação) em HTML seguro para e-mail.
 *
 * Duas armadilhas que essa função resolve:
 *
 * 1. **Espaço em branco do próprio código.** Os blocos eram montados assim:
 *
 *        <td style="white-space:pre-wrap;">
 *          ${texto}
 *        </td>
 *
 *    Com `white-space: pre-wrap`, a quebra de linha e a indentação do arquivo
 *    viram parte da mensagem — era por isso que um "Boa tarde" saía empurrado
 *    para a direita e com uma linha em branco na frente.
 *
 * 2. **`pre-wrap` não é confiável em e-mail.** Outlook e alguns webmails
 *    ignoram esse estilo, e aí as quebras de linha do usuário sumiriam de vez.
 *    `<br />` funciona em todos.
 */
export function textToEmailHtml(text: string): string {
  return escapeHtml(text.trim()).replace(/\r?\n/g, '<br />')
}
