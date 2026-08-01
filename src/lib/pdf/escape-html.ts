/**
 * Escapa texto para uso seguro dentro de HTML (conteúdo ou atributos com aspas duplas).
 * Necessário porque o template do PDF monta HTML por concatenação de strings (não pode
 * usar JSX/react-dom aqui — ver template.ts) e o texto vem de campos digitados pelo
 * usuário (produto, observações, nomes de cliente/adicional manual etc.).
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
