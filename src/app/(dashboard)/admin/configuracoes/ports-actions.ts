'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import type { ConfigActionState } from './additionals-actions'

export async function createPort(
  _prev: ConfigActionState,
  formData: FormData
): Promise<ConfigActionState> {
  await requireRole(['ADMIN'])

  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { error: 'Informe o nome do porto/pátio.' }

  const supabase = await createClient()
  const { error } = await supabase.from('ports').insert({ name })
  if (error) return { error: 'Não foi possível criar o porto/pátio.' }

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

export async function updatePort(
  _prev: ConfigActionState,
  formData: FormData
): Promise<ConfigActionState> {
  await requireRole(['ADMIN'])

  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  if (!id) return { error: 'Registro inválido.' }
  if (!name) return { error: 'Informe o nome do porto/pátio.' }

  const supabase = await createClient()
  const { error } = await supabase.from('ports').update({ name }).eq('id', id)
  if (error) return { error: 'Não foi possível salvar.' }

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

export async function togglePort(formData: FormData): Promise<void> {
  await requireRole(['ADMIN'])
  const id = String(formData.get('id') ?? '')
  const active = String(formData.get('active') ?? '') === 'true'
  if (!id) return

  const supabase = await createClient()
  await supabase.from('ports').update({ active }).eq('id', id)
  revalidatePath('/admin/configuracoes')
}
