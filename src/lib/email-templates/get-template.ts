import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import type { EmailTemplateKey } from '@/types'
import { DEFAULT_TEMPLATES, resolveEmailTemplate, type EmailTemplate } from './resolve-template'

export type { EmailTemplate }

/** Busca o template configurável de uma finalidade (ex.: solicitar retorno,
 *  prospecção por segmento, mensagem de aniversário). Cai no texto de
 *  fábrica se a linha não existir ou os campos estiverem vazios. */
export async function getEmailTemplate(key: EmailTemplateKey): Promise<EmailTemplate> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('email_templates')
    .select('subject, body, image_url')
    .eq('key', key)
    .maybeSingle()

  return resolveEmailTemplate(data, DEFAULT_TEMPLATES[key])
}
