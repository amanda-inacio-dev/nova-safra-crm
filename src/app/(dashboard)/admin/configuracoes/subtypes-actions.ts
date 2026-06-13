'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import type { ConfigActionState } from './additionals-actions'

export async function createSubtype(
  _prev: ConfigActionState,
  formData: FormData
): Promise<ConfigActionState> {
  await requireRole(['ADMIN'])

  const additionalId = String(formData.get('additional_id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  if (!additionalId) return { error: 'Adicional inválido.' }
  if (!name) return { error: 'Informe o nome do subtipo.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('additional_subtypes')
    .insert({ additional_id: additionalId, name })
  if (error) return { error: 'Não foi possível criar o subtipo.' }

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

export async function updateSubtype(
  _prev: ConfigActionState,
  formData: FormData
): Promise<ConfigActionState> {
  await requireRole(['ADMIN'])

  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  if (!id) return { error: 'Registro inválido.' }
  if (!name) return { error: 'Informe o nome do subtipo.' }

  const supabase = await createClient()
  const { error } = await supabase.from('additional_subtypes').update({ name }).eq('id', id)
  if (error) return { error: 'Não foi possível salvar.' }

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

export async function toggleSubtype(formData: FormData): Promise<void> {
  await requireRole(['ADMIN'])
  const id = String(formData.get('id') ?? '')
  const active = String(formData.get('active') ?? '') === 'true'
  if (!id) return

  const supabase = await createClient()
  await supabase.from('additional_subtypes').update({ active }).eq('id', id)
  revalidatePath('/admin/configuracoes')
}
