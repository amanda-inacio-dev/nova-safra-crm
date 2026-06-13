'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { uploadImage } from '@/lib/storage/upload-image'
import type { ConfigActionState } from './additionals-actions'

export async function updateSettings(
  _prev: ConfigActionState,
  formData: FormData
): Promise<ConfigActionState> {
  await requireRole(['ADMIN'])

  const companyName = String(formData.get('company_name') ?? '').trim()
  if (!companyName) return { error: 'Informe o nome da empresa.' }

  const update: Record<string, unknown> = { company_name: companyName }
  const logo = formData.get('logo')
  if (logo instanceof File && logo.size > 0) {
    const result = await uploadImage('certifications', logo, 'branding/')
    if (result.error) return { error: result.error }
    update.logo_url = result.url
  }

  const supabase = await createClient()
  const { error } = await supabase.from('app_settings').update(update).eq('id', 1)
  if (error) return { error: 'Não foi possível salvar as configurações.' }

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}
