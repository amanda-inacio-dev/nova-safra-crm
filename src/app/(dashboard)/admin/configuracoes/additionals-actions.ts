'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'

export type ConfigActionState = {
  error?: string
  ok?: boolean
}

function parseValue(raw: FormDataEntryValue | null): number | null {
  const n = Number(
    String(raw ?? '')
      .replace(',', '.')
      .trim()
  )
  if (Number.isNaN(n) || n < 0) return null
  return n
}

export async function createAdditional(
  _prev: ConfigActionState,
  formData: FormData
): Promise<ConfigActionState> {
  await requireRole(['ADMIN'])

  const name = String(formData.get('name') ?? '').trim()
  const value = parseValue(formData.get('value'))
  if (!name) return { error: 'Informe o nome do adicional.' }
  if (value === null) return { error: 'Valor inválido.' }

  const supabase = await createClient()
  const { error } = await supabase.from('additionals').insert({ name, value })
  if (error) return { error: 'Não foi possível criar o adicional.' }

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

export async function updateAdditional(
  _prev: ConfigActionState,
  formData: FormData
): Promise<ConfigActionState> {
  await requireRole(['ADMIN'])

  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const value = parseValue(formData.get('value'))
  if (!id) return { error: 'Registro inválido.' }
  if (!name) return { error: 'Informe o nome do adicional.' }
  if (value === null) return { error: 'Valor inválido.' }

  const supabase = await createClient()
  const { error } = await supabase.from('additionals').update({ name, value }).eq('id', id)
  if (error) return { error: 'Não foi possível salvar.' }

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

export async function toggleAdditional(formData: FormData): Promise<void> {
  await requireRole(['ADMIN'])
  const id = String(formData.get('id') ?? '')
  const active = String(formData.get('active') ?? '') === 'true'
  if (!id) return

  const supabase = await createClient()
  await supabase.from('additionals').update({ active }).eq('id', id)
  revalidatePath('/admin/configuracoes')
}
