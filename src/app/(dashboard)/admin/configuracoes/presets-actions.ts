'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import type { ConfigActionState } from './additionals-actions'

/**
 * Textos padrão de observação de um adicional (migration 0030).
 * Ex.: "15 dias" no Limite de permanência — no formulário da cotação a pessoa
 * clica no texto pronto em vez de digitar, e pode alterar depois.
 */

export async function createPreset(
  _prev: ConfigActionState,
  formData: FormData
): Promise<ConfigActionState> {
  await requireRole(['ADMIN'])

  const additionalId = String(formData.get('additional_id') ?? '')
  const text = String(formData.get('text') ?? '').trim()
  if (!additionalId) return { error: 'Adicional inválido.' }
  if (!text) return { error: 'Informe o texto padrão.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('additional_presets')
    .insert({ additional_id: additionalId, text })
  if (error) return { error: 'Não foi possível criar o texto padrão.' }

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

export async function updatePreset(
  _prev: ConfigActionState,
  formData: FormData
): Promise<ConfigActionState> {
  await requireRole(['ADMIN'])

  const id = String(formData.get('id') ?? '')
  const text = String(formData.get('text') ?? '').trim()
  if (!id) return { error: 'Registro inválido.' }
  if (!text) return { error: 'Informe o texto padrão.' }

  const supabase = await createClient()
  const { error } = await supabase.from('additional_presets').update({ text }).eq('id', id)
  if (error) return { error: 'Não foi possível salvar.' }

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

/** Exclui de vez (diferente dos subtipos, que só são desativados): um texto
 *  padrão não é referenciado por nenhuma cotação — o que fica salvo na cotação
 *  é o texto copiado, não um vínculo. */
export async function deletePreset(formData: FormData): Promise<void> {
  await requireRole(['ADMIN'])
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = await createClient()
  await supabase.from('additional_presets').delete().eq('id', id)
  revalidatePath('/admin/configuracoes')
}
