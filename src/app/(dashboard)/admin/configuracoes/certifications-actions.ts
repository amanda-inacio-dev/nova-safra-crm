'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { uploadImage } from '@/lib/storage/upload-image'
import type { ConfigActionState } from './additionals-actions'

export async function createCertification(
  _prev: ConfigActionState,
  formData: FormData
): Promise<ConfigActionState> {
  await requireRole(['ADMIN'])

  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { error: 'Informe o nome da certificação.' }

  let imageUrl: string | null = null
  const image = formData.get('image')
  if (image instanceof File && image.size > 0) {
    const result = await uploadImage('certifications', image)
    if (result.error) return { error: result.error }
    imageUrl = result.url ?? null
  }

  const supabase = await createClient()
  const { error } = await supabase.from('certifications').insert({ name, image_url: imageUrl })
  if (error) return { error: 'Não foi possível criar a certificação.' }

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

export async function updateCertification(
  _prev: ConfigActionState,
  formData: FormData
): Promise<ConfigActionState> {
  await requireRole(['ADMIN'])

  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  if (!id) return { error: 'Registro inválido.' }
  if (!name) return { error: 'Informe o nome da certificação.' }

  const update: Record<string, unknown> = { name }
  const image = formData.get('image')
  if (image instanceof File && image.size > 0) {
    const result = await uploadImage('certifications', image)
    if (result.error) return { error: result.error }
    update.image_url = result.url
  }

  const supabase = await createClient()
  const { error } = await supabase.from('certifications').update(update).eq('id', id)
  if (error) return { error: 'Não foi possível salvar.' }

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

export async function toggleCertification(formData: FormData): Promise<void> {
  await requireRole(['ADMIN'])
  const id = String(formData.get('id') ?? '')
  const active = String(formData.get('active') ?? '') === 'true'
  if (!id) return

  const supabase = await createClient()
  await supabase.from('certifications').update({ active }).eq('id', id)
  revalidatePath('/admin/configuracoes')
}
