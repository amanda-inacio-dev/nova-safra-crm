'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'

export type ConfigActionState = {
  error?: string
  ok?: boolean
}

export type AdditionalInputType = 'VALUE' | 'SUBTYPES' | 'OBSERVATION' | 'PERCENT'

const INPUT_TYPES: AdditionalInputType[] = ['VALUE', 'SUBTYPES', 'OBSERVATION', 'PERCENT']

function parseInputType(raw: FormDataEntryValue | null): AdditionalInputType | null {
  const v = String(raw ?? '')
  return INPUT_TYPES.includes(v as AdditionalInputType) ? (v as AdditionalInputType) : null
}

export async function createAdditional(
  _prev: ConfigActionState,
  formData: FormData
): Promise<ConfigActionState> {
  await requireRole(['ADMIN'])

  const name = String(formData.get('name') ?? '').trim()
  const inputType = parseInputType(formData.get('input_type'))
  const hasUnitBasis = formData.get('has_unit_basis') === 'on'
  if (!name) return { error: 'Informe o nome do adicional.' }
  if (!inputType) return { error: 'Selecione um comportamento válido.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('additionals')
    .insert({ name, input_type: inputType, has_unit_basis: hasUnitBasis })
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
  const inputType = parseInputType(formData.get('input_type'))
  const hasUnitBasis = formData.get('has_unit_basis') === 'on'
  if (!id) return { error: 'Registro inválido.' }
  if (!name) return { error: 'Informe o nome do adicional.' }
  if (!inputType) return { error: 'Selecione um comportamento válido.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('additionals')
    .update({ name, input_type: inputType, has_unit_basis: hasUnitBasis })
    .eq('id', id)
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
