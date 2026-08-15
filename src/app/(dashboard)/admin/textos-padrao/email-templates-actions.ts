'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { uploadImage } from '@/lib/storage/upload-image'
import type { EmailTemplateKey } from '@/types'
import type { ConfigActionState } from '../configuracoes/additionals-actions'

const VALID_KEYS: EmailTemplateKey[] = [
  'client_followup_request',
  'prospection_industria',
  'prospection_cafe',
  'birthday_message',
]

export async function updateEmailTemplate(
  _prev: ConfigActionState,
  formData: FormData
): Promise<ConfigActionState> {
  await requireRole(['ADMIN'])

  const key = String(formData.get('key') ?? '')
  if (!VALID_KEYS.includes(key as EmailTemplateKey)) return { error: 'Template inválido.' }

  const subject = String(formData.get('subject') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  if (!subject) return { error: 'Informe o assunto do e-mail.' }
  if (!body) return { error: 'Informe o texto do e-mail.' }

  const update: Record<string, unknown> = { subject, body, updated_at: new Date().toISOString() }
  const image = formData.get('image')
  if (image instanceof File && image.size > 0) {
    const result = await uploadImage('certifications', image, 'email-templates/')
    if (result.error) return { error: result.error }
    update.image_url = result.url
  }

  const supabase = await createClient()
  const { error } = await supabase.from('email_templates').update(update).eq('key', key)
  if (error) return { error: 'Não foi possível salvar o template.' }

  revalidatePath('/admin/textos-padrao')
  return { ok: true }
}
