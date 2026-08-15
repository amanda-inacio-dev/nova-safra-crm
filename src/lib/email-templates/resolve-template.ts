import type { EmailTemplateKey } from '@/types'

export type EmailTemplate = {
  subject: string
  body: string
  imageUrl: string | null
}

/** Texto de fábrica — usado quando a linha ainda não existe no banco (ex.:
 *  migration 0034 não aplicada ainda) ou quando o Admin nunca customizou. */
export const DEFAULT_TEMPLATES: Record<EmailTemplateKey, EmailTemplate> = {
  client_followup_request: {
    subject: 'Retomando o contato sobre sua cotação',
    body: 'Olá! Passando para saber se você teve a oportunidade de avaliar a cotação que enviamos. Ficamos à disposição para esclarecer qualquer dúvida ou ajustar o que for necessário.',
    imageUrl: null,
  },
  prospection_industria: {
    subject: 'Nova Safra Gestão Logística — Apresentação',
    body: 'Olá! Somos a Nova Safra Gestão Logística, transportadora especializada em frete de container e carga solta. Gostaríamos de apresentar nossos serviços e entender como podemos atender a sua operação.',
    imageUrl: null,
  },
  prospection_cafe: {
    subject: 'Nova Safra Gestão Logística — Apresentação',
    body: 'Olá! Somos a Nova Safra Gestão Logística, transportadora especializada em frete de café para exportação. Gostaríamos de apresentar nossos serviços e entender como podemos atender a sua operação.',
    imageUrl: null,
  },
  birthday_message: {
    subject: 'Feliz aniversário!',
    body: 'A equipe Nova Safra Gestão Logística deseja um feliz aniversário e um ano repleto de conquistas!',
    imageUrl: null,
  },
}

export type EmailTemplateRow = { subject: string; body: string; image_url: string | null } | null

/** Decide o template final a partir da linha do banco (se existir) e do
 *  texto de fábrica — função pura, sem tocar no Supabase, pra ser testável
 *  (o projeto não tem infraestrutura de mock de banco). */
export function resolveEmailTemplate(
  row: EmailTemplateRow,
  fallback: EmailTemplate
): EmailTemplate {
  if (!row) return fallback
  return {
    subject: row.subject.trim() || fallback.subject,
    body: row.body.trim() || fallback.body,
    imageUrl: row.image_url ?? fallback.imageUrl,
  }
}
